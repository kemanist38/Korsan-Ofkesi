# Hayalet NPCs and monsters (4/1 and 4/2)

Both maps contain one each of Solgun Ruh, Lanetli Yelken, Gece Dehşeti
Fırkateyni, Kemik Balığı and Ruh Yiyen Kraken (same population rule as tiers 1–3).
Original tier-4 IDs, stats, radii, quest targets and rewards are retained.

Assets: public/assets/haunt-{boat,sail,frigate,fish,kraken,portraits}-v1.webp.
Ships: 8×2 256px cells; eight source views repeated into 16 facing slots
(slot k uses view round(k/2) of N, NE, E, SE, S, SW, W, NW).
Monsters: 4×2 256px cells; N, NE, E, SE, S, SW, W, NW.
Portraits: five cells (boat, sail, frigate, fish, kraken).

Source sheets were 3×3 grids with painted checkerboard, labels and grid lines.
Background removed by flood fill from each cell edge against the cell's border
palette; labels dropped as small components; each view fitted into a 218×204 box.
Mislabelled views replaced by mirrors: Solgun Ruh NE = mirrored NW,
Gece Dehşeti SE = mirrored SW and NW = mirrored NE.
