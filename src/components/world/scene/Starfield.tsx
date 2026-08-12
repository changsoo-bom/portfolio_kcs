"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
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
  twinkle: 1,
  repelRadius: 5,
  repelStrength: 0.35,
  /**
   * 커서에 따른 카메라 오프셋. 원본 스펙은 0.6 인데 지도를 드래그할 때
   * 배경까지 크게 흔들려 어지러워서 낮췄다.
   */
  parallax: 0.25,
} as const;

const COUNT = 4200;
const DEPTH = 30;

/**
 * 정지 화면이라 시간이 흐르지 않는다. 그래도 0 으로 두면 반짝임 위상과
 * 코너 플레임 무늬가 대칭적으로 밋밋해져서, 보기 좋은 한 순간을 골라 고정한다.
 */
const FROZEN_TIME = 1.2;

function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}

const VERTEX_SHADER = /* glsl */ `
uniform float uTime; uniform float uSize; uniform float uDrift; uniform float uDepth; uniform float uTwinkle;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
attribute float aScale; attribute float aPhase; attribute float aPalette; attribute float aBright;
varying vec3 vColor; varying float vTwinkle;
void main() {
  vec3 pos = position;
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

const FRAGMENT_SHADER = /* glsl */ `
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

const FINAL_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`;

/**
 * 원본 스펙의 torusTexture · haloTexture 를 뺐다.
 * torus 레이어에는 올라간 객체가 없고 halo 는 끝까지 값이 대입되지 않아
 * 두 샘플이 항상 검정이었다 — 더하나 마나 결과가 같다.
 */
const FINAL_FRAGMENT_SHADER = /* glsl */ `
uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture;
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
  gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz, 1.);
}
`;

/** 이보다 작게 움직였으면 다시 그리지 않는다. */
const SETTLE_EPSILON = 1e-4;

/**
 * 별하늘 배경.
 *
 * **별은 흐르지도 돌지도 반짝이지도 않는다** — 시간이 고정되어 있다.
 * 움직이는 것은 커서 반응뿐이다: 근처 별이 밀려나고 카메라가 살짝 따라간다.
 *
 * 모든 값이 수렴하면 렌더를 멈춘다. 마우스를 놓아두면 GPU 를 지도에 온전히 넘긴다.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // WebGL1Renderer 를 쓰면 안 된다 — r143 에서 그건 WebGLRenderer 에 플래그만 세워
    // WebGL1 경로를 강제하는 폐기 예정 클래스이고, 포스트프로세싱 렌더타깃 업로드에서
    // "texImage2D: Overload resolution failed" 로 터진다. MapLibre 도 WebGL2 를 쓴다.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // 지도가 이미 GPU 를 쓰고 있어서 3배 화면까지 따라가지 않는다
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    );
    camera.position.set(0, 0, 5);
    scene.add(camera);

    // ── 지오메트리
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
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        // uTime 과 uDrift 는 고정 — 반짝임도 흐름도 갱신하지 않는다.
        // 매 프레임 바뀌는 건 uCursor 와 uActivity 뿐이다.
        uTime: { value: FROZEN_TIME },
        uSize: { value: CONFIG.pointSize },
        uOpacity: { value: CONFIG.opacity },
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

    scene.add(new THREE.Points(geometry, material));

    // ── 포스트프로세싱
    // 스펙의 torusComposer 는 빈 레이어를 그려서 뺐고, 레이어 전환도 함께 제거했다.
    // 씬에 별 하나뿐이라 무엇을 블룸할지 고를 필요가 없다.
    const renderScene = new RenderPass(scene, camera);
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(new UnrealBloomPass(resolution, 0.4, 0.55, 0));
    bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

    const finalPass = new ShaderPass({
      uniforms: {
        iTime: { value: FROZEN_TIME },
        tDiffuse: { value: null },
        // 여기서 렌더타깃 텍스처를 넣으면 안 된다 — 아래 주석 참고
        bloomTexture: { value: null },
        uBg: { value: hexToVec3(CONFIG.bgColor) },
        uFlameA: { value: hexToVec3(CONFIG.flameColor) },
        uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
        uFlameAmt: { value: CONFIG.flameAmt },
      },
      vertexShader: FINAL_VERTEX_SHADER,
      fragmentShader: FINAL_FRAGMENT_SHADER,
    });

    /**
     * 블룸 결과는 **ShaderPass 를 만든 뒤에** 연결해야 한다.
     *
     * ShaderPass 생성자는 넘겨받은 uniforms 를 UniformsUtils.clone() 하는데,
     * r143 의 cloneUniforms 에는 렌더타깃 텍스처 예외가 없어서 `property.clone()` 으로
     * 그냥 복제해버린다. 복제본은 isRenderTargetTexture 플래그를 잃어 일반 텍스처로
     * 취급되고, 그 image 는 { width, height, depth } 라는 평범한 객체라
     * texSubImage2D 에 넘어가는 순간 "Overload resolution failed" 로 터진다.
     */
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    const composers = [bloomComposer, finalComposer];

    const draw = () => {
      for (const composer of composers) composer.render();
    };

    /**
     * r143 EffectComposer 는 렌더타깃 크기를 `width * pixelRatio` 로 계산하면서
     * **반올림을 하지 않는다.** 윈도우 디스플레이 배율 125% 면 devicePixelRatio 가
     * 1.25 라서 1537 * 1.25 = 1921.25 같은 소수 크기가 나오고,
     * texImage2D / texSubImage2D 가 "Overload resolution failed" 로 터진다.
     *
     * 그래서 컴포저에는 배율을 넘기지 않고 **정수로 반올림한 픽셀 크기**를 직접 준다.
     * 렌더러 쪽 배율은 그대로 두어 선명도는 유지된다.
     */
    const resizeComposers = (width: number, height: number, ratio: number) => {
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);
      for (const composer of composers) {
        composer.setPixelRatio(1);
        composer.setSize(pixelWidth, pixelHeight);
      }
    };

    resizeComposers(window.innerWidth, window.innerHeight, pixelRatio);
    draw();

    // ── 커서 반응
    const pointer = {
      ndc: new THREE.Vector2(),
      smooth: new THREE.Vector2(),
      world: new THREE.Vector3(),
      activity: 0,
      active: false,
      lastMove: 0,
    };
    const target = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    const previousWorld = new THREE.Vector3();
    let frame = 0;

    const onMouseMove = (event: MouseEvent) => {
      pointer.ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ndc.y = -((event.clientY / window.innerHeight) * 2 - 1);
      pointer.active = true;
      pointer.lastMove = performance.now();
    };
    const onMouseOut = () => {
      pointer.active = false;
    };

    /** 이번 프레임에 실제로 움직인 양을 돌려준다. 0 에 가까우면 그리지 않는다. */
    const update = () => {
      let change = 0;

      const nextX =
        pointer.smooth.x + (pointer.ndc.x - pointer.smooth.x) * 0.06;
      const nextY =
        pointer.smooth.y + (pointer.ndc.y - pointer.smooth.y) * 0.06;
      change += Math.abs(nextX - pointer.smooth.x);
      change += Math.abs(nextY - pointer.smooth.y);
      pointer.smooth.set(nextX, nextY);

      // 커서 NDC 를 z=0 평면과 교차시켜 월드 좌표를 얻는다
      target.set(0, 0, 0);
      if (pointer.active) {
        rayDir
          .set(pointer.ndc.x, pointer.ndc.y, 0.5)
          .unproject(camera)
          .sub(camera.position)
          .normalize();
        if (Math.abs(rayDir.z) > 1e-4) {
          const t = -camera.position.z / rayDir.z;
          if (t > 0 && Number.isFinite(t)) {
            target.copy(camera.position).addScaledVector(rayDir, t);
          }
        }
      }
      previousWorld.copy(pointer.world);
      pointer.world.lerp(target, 0.12);
      change += previousWorld.distanceTo(pointer.world);

      const idle = (performance.now() - pointer.lastMove) / 1000;
      const want = pointer.active && idle < 3 ? 1 : 0;
      const nextActivity = pointer.activity + (want - pointer.activity) * 0.06;
      change += Math.abs(nextActivity - pointer.activity);
      pointer.activity = nextActivity;

      material.uniforms.uCursor.value.copy(pointer.world);
      material.uniforms.uActivity.value = pointer.activity;

      const px = pointer.smooth.x * CONFIG.parallax;
      const py = pointer.smooth.y * CONFIG.parallax;
      camera.position.set(px, py, 5);
      camera.lookAt(px, py, -10);

      return change;
    };

    const loop = () => {
      if (update() > SETTLE_EPSILON) draw();
      frame = requestAnimationFrame(loop);
    };

    if (!reduceMotion) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseout", onMouseOut);
      frame = requestAnimationFrame(loop);
    }

    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      resizeComposers(width, height, ratio);
      draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("resize", onResize);
      // r143 의 EffectComposer 에는 dispose() 가 없다 — 렌더타깃을 직접 정리한다
      for (const composer of composers) {
        composer.renderTarget1.dispose();
        composer.renderTarget2.dispose();
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // pointer-events-none 이 핵심 — 없으면 지도 드래그·클릭을 이 캔버스가 가로챈다
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
