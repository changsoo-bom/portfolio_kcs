# Auros — Style Reference

> Abyssal terminal with bioluminescent data orbs

**Theme:** dark

이 프로젝트의 디자인 방향 레퍼런스. 토큰 값의 원본은 여기이고, 실제 적용은 `src/app/globals.css`의 `@theme inline`에 넣는다.
작성 규칙(클래스 순서, `tailwind.config.js` 미사용 등)은 [`.claude/rules/styling.md`](../.claude/rules/styling.md)를 따른다.

## ⚠️ 적용 전 확인할 것

| 항목 | 레퍼런스 | 이 프로젝트 | 처리 |
|---|---|---|---|
| 폰트 | **Matter** (유료) | Geist / Geist Mono | `next/font/google`의 **Inter** 또는 **DM Sans**로 대체 — 레퍼런스가 명시한 substitute |
| 다크모드 | **다크 전용** | `prefers-color-scheme` 기반 | 이 팔레트엔 라이트 대응이 없다. **다크 고정으로 갈지** 결정 필요 |
| 그라디언트 | Aurora / Bioluminescent | — | CTA 버튼 1개에만. 배경·텍스트 금지(아래 Don't) |

---

Auros operates as an abyssal fintech terminal: near-black teal canvas with bioluminescent data orbs and teal-to-pink light gradients that suggest depth, liquidity, and flow. The interface is sparse and cinematic, relying on a single custom display face (Matter) at medium weight with aggressive negative tracking to create scale without shouting. Color is rationed — achromatic whites and silvers carry almost all content, while the chromatic palette is reserved for atmospheric gradients, card surface differentiation, and one signature pill button that morphs from teal-cyan to lavender-pink. Cards float on subtle teal-tinted surface lifts (16px radius, no shadows) rather than using elevation, so the hierarchy reads as depth-of-water rather than shadow-on-paper. Components feel engineered and instrument-like: uppercase tracked labels, thin geometric arrow icons, large numerical stats in pale pink.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Liquid Abyss | `#012624` | `--color-liquid-abyss` | Primary canvas — page background, header, hero, and the dominant dark-teal field. Establishes the deep-water atmosphere |
| Liquid Deep | `#011d1c` | `--color-liquid-deep` | Recessed surface level — footer background and deeper card panels. Reads as a half-step darker than the canvas, creating a subtle depth gradient downward |
| Liquid Kelp | `#003734` | `--color-liquid-kelp` | Raised card surface and primary button fill — the lifted surface that sits one step above the abyss. Used for feature cards, content panels, and the gradient button's origin point |
| Liquid Mist | `#edfffe` | `--color-liquid-mist` | Cool-tinted off-white for emphasized body text, section labels, and warm-light typographic moments. Carries a barely-perceptible cyan whisper that ties body text to the teal atmosphere |
| Platinum | `#ffffff` | `--color-platinum` | Pure white for headings, nav items, icon strokes, and high-contrast text. The dominant text color across all heading levels and the primary nav |
| Silver Mist | `#bbc7c6` | `--color-silver-mist` | Secondary body text, muted descriptions, and link color in resting state. Carries a faint green undertone that harmonizes with the teal canvas |
| Ash | `#f2f2f2` | `--color-ash` | Tertiary text for pull-quotes and testimonial copy. A neutral cool-gray fallback when Silver Mist's teal undertone is too colored |
| Slate Deep | `#707777` | `--color-slate-deep` | Subtle surface tint for inactive or low-emphasis backgrounds. Sits between canvas and card for very low-elevation differentiation |
| Lavender Phosphor | `#fde9ff` | `--color-lavender-phosphor` | Highlight color for large statistics, counter numbers, and emphasis figures. The pink end of the signature gradient — used sparingly as luminous punctuation on dark surfaces |
| Bioluminescent Gradient | `linear-gradient(90deg, rgb(0, 130, 124) 0%, rgb(203, 255, 252) 100%)` | `--gradient-bioluminescent` | Signature button and UI gradient — linear sweep from teal-cyan through pale aqua into lavender-pink. The brand's signature chromatic gesture |
| Aurora Gradient | `linear-gradient(90deg, rgb(203, 255, 252) 0%, rgb(237, 255, 254) 26.25%, rgb(255, 253, 250) 47.57%, rgb(250, 209, 255) 88.96%)` | `--gradient-aurora` | Supporting palette color for small decorative accents when the core palette needs contrast |

## Tokens — Typography

### Matter — Primary display and body face

`--font-matter`

Weight 500 for all headings (H1–H3) and oversized kinetic text (86–295px). Weight 400 for body and UI copy. Characterized by aggressive negative tracking on large sizes (-0.04em at 61px, -0.046em at 86px) and wide positive tracking on uppercase labels (0.08em at 20px, 0.12em at 12px, 0.15em at 10px). The medium-weight-only heading strategy is distinctive — no bold, no light — giving the type a uniform mechanical confidence.

- **Substitute:** Inter, DM Sans, or Satoshi for close geometric-grotesk match
- **Weights:** 400, 500
- **Sizes:** 10, 12, 13, 14, 16, 20, 24, 36, 61, 86, 96, 295px
- **Line height:** 1.0, 1.3, 1.4, 1.5
- **Letter spacing:** -0.046em at 86px, -0.04em at 61px, -0.02em at 24px, 0.08em uppercase at 20px, 0.12em uppercase at 12px, 0.15em uppercase at 10px

### Arial — Secondary fallback for interactive UI elements

`--font-arial`

Nav, buttons, hero micro-copy, footer. Only appears at 14px — a safe generic fallback where Matter isn't loaded, covering form labels, button text, and small utility copy.

- **Substitute:** system-ui, -apple-system, sans-serif
- **Weights:** 400
- **Sizes:** 14px
- **Line height:** 1.43

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 10px | 1.4 | 1.5px | `--text-caption` |
| body | 16px | 1.4 | — | `--text-body` |
| subheading | 24px | 1.3 | -0.48px | `--text-subheading` |
| heading | 36px | 1 | — | `--text-heading` |
| heading-lg | 61px | 1 | -2.44px | `--text-heading-lg` |
| display | 96px | 1 | -3.84px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** spacious

### Spacing Scale

`12` `16` `20` `24` `28` `32` `36` `40` `48` `64` `80` `120` `140` `160` `164` (px) — 토큰명 `--spacing-{값}`

### Border Radius

| Element | Value |
|---------|-------|
| cards | 16px |
| small | 6px |
| buttons | 6px |

### Layout

- **Page max-width:** 1440px
- **Section gap:** 68px
- **Card padding:** 36–48px
- **Element gap:** 20px

## Components

### Gradient Pill Button — Primary CTA
Filled button with the aurora gradient background (cyan → white → pink). 6px border-radius, 32px vertical padding, 22px horizontal padding. Text in dark color (`#222222`) at 14px Arial, uppercase. Used for the most important action on each section. The gradient direction is horizontal, creating a sunrise effect.

### Ghost Navigation Link — Nav item
Transparent background, no border, uppercase text at 12px Matter weight 400 with 0.12em letter-spacing. White in active state, silver (`#bbc7c6`) for inactive. No padding — sits inline with tight 16px column-gap between items.

### Surface Card — Content container
Card with `#003734` (Liquid Kelp) background, 16px border-radius, 36px padding all sides. No shadow, no border. Headings at 36px Matter 500 white, body at 16px Matter 400 silver.

### Recessed Card — Deep content panel
Card with `#011d1c` (Liquid Deep) background, 16px border-radius, 120px vertical padding. Creates a sunken well effect — the deepest UI surface, used for footer-adjacent content blocks and CTA panels with maximum breathing room.

### Feature Row Card — Service listing
Transparent background card with 16px radius and 48px vertical / 36px horizontal padding. Contains a heading, body description, and a small square arrow icon button (32×32, 6px radius, dark teal fill with white arrow).

### Arrow Icon Button — Inline link trigger
32×32 square button, 6px border-radius, semi-transparent dark teal fill (`rgba(3, 81, 75, 0.5)`). Contains a white diagonal arrow (↗) icon. Always positioned to the right of a card title as a 'go to' trigger.

### Uppercase Section Label — Eyebrow / kicker
12px or 20px Matter weight 500, uppercase, letter-spacing 0.08–0.12em, silver (`#bbc7c6`) or mist (`#edfffe`). Appears above section headings as a categorical label. Wide tracking is signature — it reads as technical instrumentation labeling.

### Hero Headline — Page-level title
61–96px Matter weight 500, line-height 1.0, letter-spacing -0.04em, white. Fluid sizing via `clamp(2.5rem, ..., 3.8rem)` for H1 and `clamp(2.1rem, ..., 3rem)` for H2. Tight tracking compensates for the geometric letterforms at scale.

### Oversized Kinetic Text — Section-spanning display
86–295px Matter weight 500 at line-height 1.0, letter-spacing -0.046em. Used for massive section markers. The extreme size creates a kinetic, almost physical presence — text as environmental element.

### Statistic Counter — Metric display
Large number in lavender-phosphor pink (`#fde9ff`) with label below in mist (`#edfffe`) or silver at 13px uppercase tracked. The pink-on-teal combination is the signature emphasis treatment.

### Navigation Bar — Site header
Full-width header, transparent background, ~80px height. Logo left, nav links centered, CTA button right. 6px radius on the CTA. Items separated by 16–24px gaps.

### Geometric Molecule Illustration — Decorative graphic
Flat geometric pattern of circles and connector shapes in silver/white, positioned as right-column decoration. No fill complexity — just white circles and thin connector lines forming an abstract molecular/network diagram.

### Particle Sphere Visual — Hero animation
3D particle sphere rendered in teal-cyan and white dots, rotating in the hero or section transition. The particles pick up the canvas teal and the accent pink, creating a bioluminescent data orb effect. The defining brand visual.

## Do's and Don'ts

### Do
- Use only the teal-green surface stack (`#011d1c` → `#012624` → `#003734`) for background differentiation — never introduce gray, black, or blue surfaces
- Reserve the aurora gradient exclusively for primary CTAs and signature accent moments — never as a background fill or decoration
- Set all headings at weight 500 — no bold, no light, no other weights at display sizes
- Apply uppercase tracking (0.08–0.15em) to all section labels, kickers, and eyebrow text at 10–20px
- Use lavender-phosphor pink (`#fde9ff`) only for large statistics and emphasis figures — never for body text or UI controls
- Keep card radii at 16px and small element radii at 6px — these two values are the complete shape vocabulary
- Use line-height 1.0 for all display text above 36px and 1.4 for all body text — the contrast defines the typographic rhythm

### Don't
- Do not use drop shadows or box-shadows for elevation — differentiation comes from surface color shifts in the teal stack
- Do not introduce bold (600+) or light (300−) weights at display sizes
- Do not use white (`#ffffff`) for body text — reserve pure white for headings and nav, use silver (`#bbc7c6`) or mist (`#edfffe`)
- Do not apply the aurora gradient to text, borders, or backgrounds larger than a single button — it loses luminosity at scale
- Do not use rounded corners above 16px — buttons are 6px, cards are 16px
- Do not place light text on light-pink (`#fde9ff`) — the pink is a background for dark text, not a text color on dark surfaces
- Do not use any color outside the Liquid teal scale, silver neutrals, and lavender-phosphor accent

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Liquid Abyss | `#012624` | Page canvas — the dominant background field |
| 1 | Liquid Deep | `#011d1c` | Recessed surface — footer and very deep panels |
| 2 | Liquid Kelp | `#003734` | Raised card surface — content cards, feature panels |
| 3 | Slate Deep | `#707777` | Low-emphasis surface tint for inactive states |

## Elevation

The design deliberately avoids drop shadows. Depth is communicated through a teal-tinted surface stack (abyss → deep → kelp) where each level is a darker or lighter step in the same green hue. This creates the sensation of objects floating at different depths in water rather than being raised off paper.

## Imagery

Imagery is minimal and atmospheric. The hero features a 3D particle sphere — thousands of small teal-cyan and white dots forming a rotating orb. Section decorations include flat geometric molecular diagrams (white circles and thin connector lines on the dark canvas). No photography, no lifestyle imagery, no people — the visual language is pure data-graphics and abstract forms.

## Layout

Full-bleed dark canvas with max-width 1440px content. Hero is a centered text stack (eyebrow → headline → subtext → CTA) occupying the full viewport height, with the particle sphere as a background element. Sections are full-width bands separated by generous 68px+ vertical gaps, alternating between canvas and slightly recessed surfaces. Content is centered in narrow columns (max ~600px) for readability rather than stretching edge-to-edge. The footer is a recessed well (`#011d1c`) with 120px vertical padding. Navigation is a thin transparent bar with items spaced at 16–24px gaps.

## Agent Prompt Guide

**Quick Color Reference**
- Text (primary): `#ffffff`
- Text (body/secondary): `#bbc7c6`
- Text (emphasis/mist): `#edfffe`
- Background (canvas): `#012624`
- Border: `#707777` or `rgba(255,255,255,0.1)`
- Accent (stats/highlights): `#fde9ff`
- Primary action: `#003734` (filled action)

**Example Component Prompts**

1. **Primary Action Button:** `#003734` background, `#ffffff` text, compact pill padding.
2. **Feature card:** Background `#003734`, 16px radius, 36px padding. Heading at 36px weight 500 `#ffffff`, line-height 1.0. Body at 16px weight 400 `#bbc7c6`. Arrow icon button (32×32, 6px radius, `rgba(3,81,75,0.5)` fill) top-right with white ↗ icon.
3. **Statistics block:** Three columns. Large number at 86px weight 500 `#fde9ff`, line-height 1.0, letter-spacing -3.96px. Label below at 13px weight 400, uppercase, 0.055em letter-spacing, `#edfffe`.

## Similar Brands

- **Wintermute** — Same dark teal-black crypto-native palette with white text, generous spacing, minimal decoration
- **Jump Crypto** — Dark mode institutional aesthetic with uppercase tracked labels, medium-weight display type, single restrained accent
- **Galaxy Digital** — Deep dark canvas with luminous accent moments, spacious section rhythm, scale through type rather than imagery
- **Flowdesk** — Dark teal-dominant palette with gradient accent buttons, geometric decorative elements, medium-weight geometric type

## Quick Start — Tailwind v4

`src/app/globals.css`의 `@theme inline`에 넣는다. `tailwind.config.js`는 만들지 않는다.

```css
@theme {
  /* Colors */
  --color-liquid-abyss: #012624;
  --color-liquid-deep: #011d1c;
  --color-liquid-kelp: #003734;
  --color-liquid-mist: #edfffe;
  --color-platinum: #ffffff;
  --color-silver-mist: #bbc7c6;
  --color-ash: #f2f2f2;
  --color-slate-deep: #707777;
  --color-lavender-phosphor: #fde9ff;

  /* Typography */
  --font-matter: 'Matter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-arial: 'Arial', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 10px;
  --leading-caption: 1.4;
  --tracking-caption: 1.5px;
  --text-body: 16px;
  --leading-body: 1.4;
  --text-subheading: 24px;
  --leading-subheading: 1.3;
  --tracking-subheading: -0.48px;
  --text-heading: 36px;
  --leading-heading: 1;
  --text-heading-lg: 61px;
  --leading-heading-lg: 1;
  --tracking-heading-lg: -2.44px;
  --text-display: 96px;
  --leading-display: 1;
  --tracking-display: -3.84px;

  /* Spacing */
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;
  --spacing-140: 140px;
  --spacing-160: 160px;
  --spacing-164: 164px;

  /* Border Radius */
  --radius-md: 6px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
}
```

### Gradients

`@theme`의 `--color-*`는 단색만 받는다. 그라디언트는 일반 CSS 변수로 따로 둔다.

```css
:root {
  --gradient-bioluminescent: linear-gradient(90deg, rgb(0, 130, 124) 0%, rgb(203, 255, 252) 100%);
  --gradient-aurora: linear-gradient(
    90deg,
    rgb(203, 255, 252) 0%,
    rgb(237, 255, 254) 26.25%,
    rgb(255, 253, 250) 47.57%,
    rgb(250, 209, 255) 88.96%
  );
}
```
