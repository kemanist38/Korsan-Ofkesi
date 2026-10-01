# Shared fleet island

All seas use one supplied fleet island: `public/assets/fleet-island-v3.webp` (2000 × 1117 RGBA WebP),
drawn at 1500 × 838 world units centred on the map's fleet point. Each sea gets a light colour tint
in code (`FLEET_TINT` in `src/sprites.ts`), applied once per theme when the image loads.

- Layout: two crescent ramparts, wide gates in the east and west, a central island with the keep.
  The grey blockout used to generate it is `fleet-layout.js` (`renderFleetLayout()` in the studio).
- 16 empty round tower foundations: 6 on the upper rampart, 6 on the lower, 4 on the central island.
  Their base centres are `FLEET.towers` in `src/campaign.ts` (slot order is kept for saved guilds).
- Tower: `public/assets/fleet-tower-v5.webp` (600 × 1006), drawn at 115.6 × 193.9 world units with its
  anchor on the foundation's base centre, so a built tower covers its foundation.
- Navigation mask: `node tools/asset-studio/fleet-raster-mask.mjs` rebuilds `src/fleetMask.ts`
  (0 land, 1 sea, 2 lagoon) from the island alpha.
