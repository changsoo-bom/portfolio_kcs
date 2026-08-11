"use client";

import { useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";

const CONFIG = {
  bgColor: "#0a0a24",
  flameColor: "#aee9ff",
  flameColor2: "#c79bff",
  flameAmt: 0.2,
  colorA: "#aef6cf",
  colorB: "#5fe6a0",
  colorC: "#eafff2",
  opacity: 2,
  pointSize: 50,
  brightness: 1.85,
  drift: 2.35,
  twinkle: 1,
  spin: 0.03,
  repelRadius: 5,
  repelStrength: 0.35,
  scrollPush: 8,
  scrollDrift: 6,
  scrollSpin: 0.1,
  parallax: 0.6,
} as const;

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };

const COUNT = 4200;
const DEPTH = 30;

function hexToVec3(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

const VERT = /* glsl */ `
uniform float uTime; uniform float uSize; uniform float uDrift; uniform float uDepth; uniform float uTwinkle;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
attribute float aScale; attribute float aPhase; attribute float aPalette; attribute float aBright;
varying vec3 vColor; varying float vTwinkle;
void main() {
  vec3 pos = position;
  // Endless drift toward +Z with mod-wrap.
  pos.z = mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5);

  float tw = sin(uTime * 1.6 + aPhase * 6.2831);
  vTwinkle = (1.0 - uTwinkle) + uTwinkle * (0.55 + 0.45 * tw);

  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);

  vec3 toParticle = modelPosition.xyz - uCursor;
  float dist = length(toParticle);
  float falloff = smoothstep(uRepelRadius, 0.0, dist);
  modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uSize * aScale;
  gl_PointSize *= (1.0 / -viewPosition.z);

  vec3 base = aPalette < 0.5 ? uColorA : (aPalette < 1.5 ? uColorB : uColorC);
  vColor = base * aBright;
}
`;

const FRAG = /* glsl */ `
uniform float uOpacity; uniform float uBrightness;
varying vec3 vColor; varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float strength = pow(1.0 - d * 2.0, 4.0);
  vec3 color = mix(vec3(0.0), vColor, strength);
  gl_FragColor = vec4(color * uBrightness, strength * uOpacity * vTwinkle);
}
`;

const FINAL_VERT = /* glsl */ `
varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const FINAL_FRAG = /* glsl */ `
uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
varying vec2 vUv;
vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
  pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
  pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
  pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
  return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
void main(){
  vec2 uv = 2.*vUv - 1.;
  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
  vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
  flame *= smoothstep(0.25, 1., abs(uv.y));
  float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
  vec3 bg = uBg * (1.0 - 0.4 * length(uv));
  vec3 halo = texture2D(haloTexture, vUv).xyz;
  gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
}
`;

/**
 * 히어로 뒤에 깔리는 스타필드.
 *
 * 스크롤 진행률은 문서 전체가 아니라 **히어로 한 화면** 기준이다. 원본 스펙은
 * 300vh짜리 스크롤 호스트를 전제하는데, 이 사이트는 본문이 8화면이라
 * 문서 전체로 정규화하면 히어로를 지나는 동안 0.13밖에 안 움직인다.
 *
 * 히어로를 벗어나면 렌더 루프를 멈춘다 — 화면 밖에서 4200개 파티클을
 * 계속 그릴 이유가 없다.
 */
export function Starfield() {
  const ref = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 0, 15);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    );
    camera.position.set(0, 0, 5);
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(camera);

    // ── geometry ──────────────────────────────────────────────
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const palette = new Float32Array(COUNT);
    const bright = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 24;
      positions[i3 + 1] = (Math.random() - 0.5) * 16;
      positions[i3 + 2] = (Math.random() - 0.5) * DEPTH;
      palette[i] = Math.floor(Math.random() * 3);
      bright[i] = 0.7 + Math.random() * 0.6;
      scales[i] = 0.5 + Math.pow(Math.random(), 1.4) * 2.5;
      phases[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.setAttribute(
      "aPalette",
      new THREE.Float32BufferAttribute(palette, 1),
    );
    geometry.setAttribute(
      "aBright",
      new THREE.Float32BufferAttribute(bright, 1),
    );

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.pointSize },
        uOpacity: { value: 0 },
        uDrift: { value: 0 },
        uDepth: { value: DEPTH },
        uTwinkle: { value: CONFIG.twinkle },
        uCursor: { value: new THREE.Vector3() },
        uRepelRadius: { value: CONFIG.repelRadius },
        uRepelStrength: { value: CONFIG.repelStrength },
        uActivity: { value: 0 },
        uColorA: { value: hexToVec3(CONFIG.colorA) },
        uColorB: { value: hexToVec3(CONFIG.colorB) },
        uColorC: { value: hexToVec3(CONFIG.colorC) },
        uBrightness: { value: CONFIG.brightness },
      },
    });

    const points = new THREE.Points(geometry, material);
    points.layers.enable(LAYERS.ENTIRE_SCENE);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // ── composers ─────────────────────────────────────────────
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const renderScene = new RenderPass(scene, camera);

    const torusComposer = new EffectComposer(renderer);
    torusComposer.renderToScreen = false;
    torusComposer.addPass(renderScene);
    torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
    torusComposer.addPass(new UnrealBloomPass(size, 0.22, 0.2, 0));
    torusComposer.addPass(new ShaderPass(CopyShader));

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(new UnrealBloomPass(size, 0.4, 0.55, 0));
    bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

    // haloTexture는 스펙에 생성 소스가 없다 — 1×1 검정으로 채워 샘플링만 성립시킨다
    const blackPixel = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 255]),
      1,
      1,
    );
    blackPixel.needsUpdate = true;

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        vertexShader: FINAL_VERT,
        fragmentShader: FINAL_FRAG,
        uniforms: {
          iTime: { value: 0 },
          tDiffuse: { value: null },
          torusTexture: { value: torusComposer.renderTarget1.texture },
          bloomTexture: { value: bloomComposer.renderTarget1.texture },
          haloTexture: { value: blackPixel },
          uBg: { value: hexToVec3(CONFIG.bgColor) },
          uFlameA: { value: hexToVec3(CONFIG.flameColor) },
          uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
          uFlameAmt: { value: CONFIG.flameAmt },
        },
      }),
      "tDiffuse",
    );

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    // ── interaction ───────────────────────────────────────────
    const POINTER = {
      ndc: new THREE.Vector2(),
      world: new THREE.Vector3(),
      activity: 0,
      active: false,
      lastMove: 0,
    };
    const mouseSmooth = { x: 0, y: 0 };
    let scrollTarget = 0;
    let scrollSmooth = 0;
    let scrollCurrent = 0;

    const onMouseMove = (e: MouseEvent) => {
      POINTER.ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      POINTER.ndc.y = -((e.clientY / window.innerHeight) * 2 - 1);
      POINTER.active = true;
      POINTER.lastMove = performance.now();
    };
    const onMouseOut = () => {
      POINTER.active = false;
    };

    // 히어로 한 화면을 다 내려오면 1이 된다
    const readScroll = () => {
      scrollTarget = Math.min(
        1,
        Math.max(0, window.scrollY / window.innerHeight),
      );
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      for (const c of [torusComposer, bloomComposer, finalComposer]) {
        c.setPixelRatio(window.devicePixelRatio);
        c.setSize(w, h);
      }
      readScroll();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", onResize);
    readScroll();

    const rayDir = new THREE.Vector3();
    const target = new THREE.Vector3();

    const updatePointer = () => {
      if (POINTER.active) {
        rayDir
          .set(POINTER.ndc.x, POINTER.ndc.y, 0.5)
          .unproject(camera)
          .sub(camera.position)
          .normalize();

        const t = -camera.position.z / rayDir.z;
        if (Math.abs(rayDir.z) > 1e-4 && t > 0 && Number.isFinite(t)) {
          target.copy(camera.position).addScaledVector(rayDir, t);
        } else {
          target.set(0, 0, 0);
        }
      } else {
        target.set(0, 0, 0);
      }
      POINTER.world.lerp(target, 0.12);

      const idle = (performance.now() - POINTER.lastMove) / 1000;
      const want = POINTER.active && idle < 3 ? 1 : 0;
      POINTER.activity += (want - POINTER.activity) * 0.06;

      material.uniforms.uCursor.value.copy(POINTER.world);
      material.uniforms.uActivity.value = POINTER.activity;
    };

    // ── loop ──────────────────────────────────────────────────
    const appearStart = performance.now();
    let t0 = performance.now() / 1000;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      // 히어로를 완전히 벗어나면 그릴 이유가 없다
      if (window.scrollY > window.innerHeight * 1.2) return;

      const now = performance.now();
      finalPass.uniforms.iTime.value = now / 1000;

      scrollSmooth += (scrollTarget - scrollSmooth) * 0.1;
      scrollCurrent += (scrollSmooth - scrollCurrent) * 0.06;
      mouseSmooth.x += (POINTER.ndc.x - mouseSmooth.x) * 0.06;
      mouseSmooth.y += (POINTER.ndc.y - mouseSmooth.y) * 0.06;
      updatePointer();

      const t = now / 1000;
      const dt = Math.min(0.05, t - t0);
      t0 = t;

      const scroll = scrollCurrent;
      material.uniforms.uTime.value = t;
      material.uniforms.uDrift.value +=
        dt * (CONFIG.drift + scroll * CONFIG.scrollDrift);

      const px = mouseSmooth.x * CONFIG.parallax;
      const py = mouseSmooth.y * CONFIG.parallax;
      camera.position.set(px, py, 5 - scroll * CONFIG.scrollPush);
      camera.lookAt(px, py, -10);

      const fade = Math.min(1, Math.max(0, (now - appearStart - 300) / 1400));
      material.uniforms.uOpacity.value = fade * CONFIG.opacity;

      group.rotation.z += dt * (CONFIG.spin + scroll * CONFIG.scrollSpin);

      camera.layers.set(LAYERS.TORUS_SCENE);
      torusComposer.render();
      camera.layers.set(LAYERS.BLOOM_SCENE);
      bloomComposer.render();
      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", onResize);

      geometry.dispose();
      material.dispose();
      blackPixel.dispose();
      // r143 EffectComposer에는 dispose가 없다 — 렌더 타깃을 직접 놓아준다.
      // 나머지 GPU 리소스는 renderer.dispose()가 컨텍스트째 정리한다
      for (const c of [torusComposer, bloomComposer, finalComposer]) {
        c.renderTarget1.dispose();
      }
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 w-screen h-dvh"
    />
  );
}
