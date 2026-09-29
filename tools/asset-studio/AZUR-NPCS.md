# Azurya NPCs and monsters (3/1 and 3/2)

Both maps contain one each of Yeşim Sürüklenen, Kristal Yelkenli,
Kadim Azur Gardiyanı, Kristal Kabuklu Yengeç and Kadim Orman Leviathanı.
Original tier-3 IDs, stats, radii, quest targets and rewards are retained.
Kristal Yelkenli retains the stats of its original slot on each map.
Missing NPC types are restored on respawn.

Assets: public/assets/azur-{boat,sail,guardian,crab,leviathan,portraits}-v1.webp.
Ships: 8×2 256px cells; eight source views repeated into 16 facing slots.
Monsters: 4×2 256px cells; N, NE, E, SE, S, SW, W, NW.
Portraits: five cells. Tier-1/tier-2 assets remain unchanged.
Bosses and later map populations remain paused awaiting new artwork.

Built-in imagegen prompt: preserve supplied design, colors and painterly
detail; remove checkerboard, labels and grid to transparent alpha, complete
isolated silhouettes in original 3/2/3 layout.
Correct repeated boat southeast, sail/guardian northwest and crab directions.
Pack generated alpha images into game WebP atlases.

Validation: TypeScript/Vite build; stats, quest IDs/rewards, three-ship and
two-monster populations, respawn; alpha/cell boundaries and visual inspection.
