# Mystic player marker

Asset: `public/assets/player-mystic-ring-v1.webp` (transparent raster).
Renderer: `src/player-marker.ts`.

Generated with built-in imagegen, using the supplied purple ritual-circle reference:
“Only the magic circle, no ship, ocean or caption. True transparent background.
Top-down circular seal; fine lavender concentric rings, arcane glyphs,
interlocking ritual triangles and diamond sigils. Restrained violet glow and
subtle turquoise spectral wisps. Mostly transparent center. Readable at 200 px.”

Packaged at 640 px maximum dimension, WebP quality 90. Runtime draws it at
224 × 112 world pixels, slowly rotates in the sea plane, and gently pulses
opacity. Eight bounded rising embers are drawn beneath the player hull.
Target markers and gameplay are unchanged. No per-frame image allocation.

Validation: TypeScript and Vite production build passed. Browser gameplay
preview unavailable in the execution environment.
