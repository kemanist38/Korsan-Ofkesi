# Map-specific island artwork

Eight user-supplied six-island sheets replace the old shared two-variant atlas.
Each runtime WebP is 1536 × 1024, a 3 × 2 grid of 512px cells with alpha transparency.
Read variants left-to-right, then top-to-bottom. Runtime paths are selected in `src/sprites.ts`.

| Maps | Theme | Asset in public/assets |
| --- | --- | --- |
| 1/1, 1/2 | haven | islands-haven-v2.webp |
| 2/1, 2/2 | coral | islands-coral-v2.webp |
| 3/1, 3/2 | verdant | islands-verdant-v2.webp |
| 4/1, 4/2 | misty | islands-misty-v2.webp |
| 5/1, 5/2 | ice | islands-ice-v2.webp |
| 6/1, 6/2 | storm | islands-storm-v2.webp |
| 7/1, 7/2 | abyss | islands-abyss-v2.webp |
| 8/1, 8/2 | lava | islands-lava-v2.webp |

The source JPGs contained baked checkerboards and divider lines. The built-in image editing tool extracted the six islands onto real alpha, preserving their order and theme. Sprites were then packed into equal cells with transparent padding and encoded as WebP.

Extraction prompt: Remove baked checkerboard, divider lines and backdrop; preserve the six supplied islands, ordering, materials and camera. Retain thin shoreline foam, remove background inside coves and arches, and output real alpha in a 3 × 2 layout without text or added objects.

`islandLayout` uses a map-key seed for stable, different placements per map. Each map contains 8–11 islands, includes every variant before repeating, and preserves spacing between islands, map edges, spawn and active fleet bases. Sprites are not mirrored, keeping light direction consistent.

The existing fleet island and tower artwork is unchanged.
