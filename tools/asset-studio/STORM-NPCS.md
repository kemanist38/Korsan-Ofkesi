# Storm NPCs and monsters (6/1 and 6/2)

Both maps contain one each of Rüzgar Gülü, Yağmur Yaran, Şimşek Lordu,
Elektrik Yılanı and Fırtına Ejderi (same population rule as tiers 1–5).
Original tier-6 IDs, stats, radii, quest targets and rewards are retained.

Assets: public/assets/storm-{boat,sail,galleon,eel,dragon,portraits}-v1.webp.
Ships: 8×2 256px cells; eight source views repeated into 16 facing slots
(slot k uses view round(k/2) of N, NE, E, SE, S, SW, W, NW).
Monsters: 4×2 256px cells; N, NE, E, SE, S, SW, W, NW.
Portraits: five cells (boat, sail, galleon, eel, dragon).

Source sheets were 3×3 grids with painted checkerboard, labels and grid lines.
Background removed by flood fill from each cell edge against the cell's border
palette; labels dropped as small components; each view fitted into a 218×204 box.
Mislabelled views replaced by mirrors: Rüzgar Gülü W = mirrored E; Şimşek
Lordu SE = mirrored SW, NW = mirrored NE; Elektrik Yılanı NW = mirrored NE.
Fırtına Ejderi sheet uses NW,N,NE / W,-,E / SW,S,SE layout.
