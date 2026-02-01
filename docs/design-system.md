# Design System 5: "Ethereal Scroll" (云卷仙境)

## 1. Visual Identity & Mood

* **Keywords:** Ethereal, Oriental Fantasy (Xianxia), Warm, Fluid, Calligraphic, "Guochao" (National Trend).
* **Concept:** A fusion of traditional ink-wash painting aesthetics with modern soft-clay 3D rendering. The UI should feel like a living, breathing scroll unfolding in a mystical realm.
* **Atmosphere:** Serene yet grand, illuminated by soft lantern light and magical glows.

## 2. Color Palette (色彩体系)

### Primary Colors

* **Scroll Paper (Base):** `#F3E9D9` (Warm creamy beige, mimicking rice paper)
* **Mist White (Secondary Background):** `#F8F4F0` (Lighter, for depth/clouds)
* **Persimmon Orange (Primary Accent):** `#FF7F41` (Vibrant orange from the autumn trees/lanterns. Used for CTAs, highlights)

### Secondary Colors

* **Mountain Teal:** `#6B8E8E` (Muted blue-green from the distant peaks. Used for secondary actions, illustrations)
* **Ink Black:** `#2C241B` (Deep brownish-black. Used for primary text, strong borders)
* **Gilded Gold:** `#E6C386` (Soft gold. Used for decorative borders, halos)

### Gradients

* **Sunset Glow:** Linear gradient from `#FF7F41` to `#FFB07C` (Warmth)
* **Morning Mist:** Linear gradient from `#F3E9D9` to `#FFFFFF` (Fade to transparency)

## 3. Typography (排版)

### Fonts

* **Headings:** Calligraphic or Traditional Serif style (e.g., *Ma Shan Zheng*, *Noto Serif SC*, *ZCOOL XiaoWei*). Needs to feel like brush strokes.
* **Body:** Clean, legible Serif or Humanist Sans-serif (e.g., *Noto Sans SC*, *LXGW WenKai*).

### Styles

* **Hero Text:** Vertical layout support (where appropriate) to mimic scrolls.
* **Emphasis:** Use Ink Black for contrast, or Persimmon Orange for magical emphasis.

## 4. UI Elements & Components

### Containers & Cards (The "Scroll" Metaphor)

* **Shape:** Rounded corners, but potentially with asymmetrical curvature to mimic unfurling paper.
* **Material:** Semi-opaque beige backgrounds with a subtle paper texture overlay.
* **Border:** Thin, ink-like borders (1px solid `#2C241B` opacity 0.3) or soft gold rims.
* **Shadow:** Deep, diffused shadows (`0 10px 30px -10px rgba(44, 36, 27, 0.2)`) to create a floating effect.

### Buttons

* **Primary:** Persimmon Orange background with soft rounded edges. Subtle inner glow.
* **Secondary:** Ghost button with Ink Black or Mountain Teal outline.
* **Text:** White or very light cream on primary buttons.

### Imagery & Icons

* **Icons:** Line-art style resembling brush strokes.
* **Decorations:**
  * Floating cloud motifs (PNGs with transparency).
  * Falling ginkgo leaves (particles).
  * Ink splatter accents.
* **Masking:** Images masked with "brush stroke" shapes instead of perfect rectangles/circles.

## 5. Layout & Spacing

* **Flow:** Fluid and organic. Avoid rigid grids. Use overlapping elements to create depth (z-index layering).
* **Whitespace:** Generous "Liu Bai" (Leaving White) – the traditional art of negative space.
* **Motion:** Slow, floating animations (y-axis bobbing). Elements should fade in like ink diffusing on paper.

## 6. CSS / Tailwind Configuration Hints

```javascript
// tailwind.config.js extension ideas
theme: {
  extend: {
    colors: {
      'scroll-paper': '#F3E9D9',
      'mist-white': '#F8F4F0',
      'persimmon': '#FF7F41',
      'mountain-teal': '#6B8E8E',
      'ink-black': '#2C241B',
      'gilded-gold': '#E6C386',
    },
    fontFamily: {
      serif: ['"Noto Serif SC"', 'serif'],
      calligraphy: ['"Ma Shan Zheng"', 'cursive'],
    },
    backgroundImage: {
      'paper-texture': "url('/assets/textures/rice-paper.png')",
    }
  }
}
```
