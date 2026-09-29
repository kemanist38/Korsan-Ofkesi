# Pearl sea NPCs and monsters (2/1 and 2/2)

Both maps have Sedef Kayığı, Mercan Kesici, İnci Kraliçe Kalyonu,
Pembe Resif Yengeci and Partayan İnci Ejderi.

Original tier-2 IDs, stats, collision radii, rewards and quest targets are
retained. Mercan Kesici retains the original stats of its map slot.
Each map has three ships (one of each design) and two monsters.
Missing ship types are restored on respawn.

Assets: public/assets/pearl-{boat,cutter,galleon,crab,dragon,portraits}-v1.webp.
Ship sheets: 8×2 at 256px, eight source directions repeated into 16 slots.
Monster sheets: 4×2 at 256px in N/NE/E/SE/S/SW/W/NW order.
Portraits: five 256px cells. Existing coast art remains unchanged.
Bosses and later seas remain paused pending new assets.

Preparation: built-in imagegen edits of each supplied sheet.
Prompt: preserve character design/style/colors, remove baked checkerboard,
labels/grid/compass to transparent alpha, keep eight separated full silhouettes.
Correct duplicated northwest galleon/dragon views and crab facing directions.
Pack extracted poses into game atlases, retaining generated alpha.

Validation: build, unchanged-stat/quest checks, population and respawn checks,
WebP alpha and cell padding inspection, visual inspection at game scale.
