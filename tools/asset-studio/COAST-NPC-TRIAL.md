# Coast NPC / monster art trial

Limited to maps 1/1 and 1/2. Other seas, bosses and player ships retain their assets.
Old assets are retained until the trial is approved.

| Map | Light NPC | Heavy NPC | Monster |
| --- | --- | --- | --- |
| 1/1 | Kıyı Sandalı | Tüccar Yelkenlisi | Zümrüt Kaplumbağa |
| 1/2 | Tüccar Yelkenlisi | Kraliyet Firkateyni | Dev Mavi Yılan |

Existing entity IDs, HP, damage, speed, reload, rewards, spawn counts, collision radii and quest targets remain unchanged.
Merchant uses the original light/heavy stats of its respective map slot.

Assets: public/assets/trial-coast-{boat,merchant,frigate,turtle,serpent,portraits}-v1.webp.
Ship sheets: 8 columns × 2 rows of 256px frames, compatible with existing 16-direction renderer.
Eight supplied views are repeated into the nearest 16-direction slots; no extra poses are invented for intermediate angles.
Monster sheets: 4 × 2 of 256px, clockwise N, NE, E, SE, S, SW, W, NW.
Directional monster frames are not animation frames: idle faces south, aggro faces player, existing bob remains.
Target portraits use a separate five-cell strip; original portraits remain for other seas.

## Art preparation
Built-in imagegen editing, followed by deterministic cropping/resizing/WebP atlas packing.
Prompt applied separately to each uploaded sheet: preserve all eight drawings, remove baked checkerboard, labels, grid lines and compass; transparent alpha, isolated complete silhouettes, original positions and design.
Additional targeted edits: merchant bottom-right view corrected to northwest; turtle bottom-center view corrected to south.
Direction lookup follows visible bow/head rather than incorrect source labels.

## Checks
TypeScript/Vite build; campaign comparison against parent for all numeric properties and IDs, all map and boss definitions; alpha, sprite cell bounds and render source-index checks.
