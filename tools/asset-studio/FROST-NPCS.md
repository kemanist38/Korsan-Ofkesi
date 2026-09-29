# Frost NPCs and monsters (5/1 and 5/2)

Both maps contain one each of Buz Kırıcı Sandal, Donuk Yelkenli, Kış Zıpkını
Kalyonu, Buzul Yengeci and Dev Donmuş Mors (same population rule as tiers 1–4).
Original tier-5 IDs, stats, radii, quest targets and rewards are retained.

Assets: public/assets/frost-{boat,sail,galleon,crab,walrus,portraits}-v1.webp.
Ships: 8×2 256px cells; eight source views repeated into 16 facing slots
(slot k uses view round(k/2) of N, NE, E, SE, S, SW, W, NW).
Monsters: 4×2 256px cells; N, NE, E, SE, S, SW, W, NW.
Portraits: five cells (boat, sail, galleon, crab, walrus).

Source sheets were 3×3 grids with painted checkerboard, labels and grid lines.
Background removed by flood fill from each cell edge against the cell's border
palette; labels dropped as small components; each view fitted into a 218×204 box.
Mislabelled views replaced by mirrors: Sandal SE = mirrored SW; Yelkenli E/W
swapped, SE = mirrored SW, NW = mirrored NE; Kalyon E = mirrored W, SE = mirrored
SW, NW = mirrored NE; Yengeç W = mirrored E, SE = mirrored SW, NW = mirrored NE;
Mors NW = mirrored NE.
