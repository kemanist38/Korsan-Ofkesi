# Shared fleet island

The approved vivid tropical design uses `public/assets/fleet-island-v4.webp` (1678 × 937 RGBA WebP).
Its 1500 × 838 layout is drawn at `FLEET_SCALE = .8` (1200 × 670.4 world units).
The lagoon and surrounding water are transparent so the game's sea remains visible.
Theme tinting is cached once per sea in `src/sprites.ts`.

- Two crescent ramparts, open east/west gates and a central headquarters.
- Sixteen empty square foundations: six upper, six lower and four central. `FLEET.towers`
  records their new base positions while retaining the saved slot order.
- `public/assets/fleet-tower-v6.webp` is the separate slender square cannon tower, drawn
  at 65 × 158 world units with anchor (.5, .987). All sixteen sites use the same art.
  Destroyed/unbuilt towers leave their foundation visible; no towers are baked into the island.
- Picking bounds and cannon muzzle offsets live in `src/towerGeometry.ts`; label height and
  central building occlusion regions live in `src/sprites.ts`.
- `node tools/asset-studio/fleet-raster-mask.mjs` rebuilds `src/fleetMask.ts` from island alpha
  (0 land, 1 sea, 2 lagoon). The generator expects the asset-studio Playwright dependency
  and a browser at `CHROMIUM_PATH` or `/opt/pw-browsers/chromium`.
- Checks: `npm run build` and `node --test tests/fleet-towers.test.mjs tests/fleet-navigation.test.mjs tests/seven-seas.test.mjs`.
