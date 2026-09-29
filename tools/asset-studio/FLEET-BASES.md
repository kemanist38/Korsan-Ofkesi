# Themed fleet bases

Seven supplied fleet-island designs, one per map pair, replace the shared base image.
Runtime sprites are 1024 × 1024 RGBA WebP, drawn at 1000 world units without trimming or re-centering.

| Maps | Theme / filename suffix |
| --- | --- |
| 2/1, 2/2 | coral |
| 3/1, 3/2 | verdant |
| 4/1, 4/2 | misty |
| 5/1, 5/2 | ice |
| 6/1, 6/2 | storm |
| 7/1, 7/2 | abyss |
| 8/1, 8/2 | lava |

Files: `public/assets/fleet-base-{theme}-v2.webp`.
`THEMES[tier].fleet` selects the artwork and its navigation mask. Bases are active from tier 2; tier 1 has none.

The built-in image editor removed baked black/checkerboard/navy backgrounds, including the lagoon and entrance, while preserving the layout, eight empty foundations, castle and pier. The PNG alpha was preserved while encoding to WebP. Existing tower slot ordering and independent tower art remain in use.

Extraction prompt: Remove only backdrop outside the land and inside the lagoon/south channel. Preserve framing, camera, scale, island geometry, eight empty foundations and material details. Keep dark stone and pale snow opaque, retain thin shoreline foam, and leave lagoon connected to the transparent sea. No added objects or towers.

After replacing an image, run `python tools/asset-studio/fleet-raster-mask.py` to regenerate `src/fleetMask.ts`. Each theme has its own 125 × 125 navigation grid with 8-unit cells and shoreline clearance. The generator asserts the lagoon connects to open water. Runtime pathfinding selects both navigation and clearance grids by current theme.
