# Approved coast NPC and monster assets

Both 1/1 and 1/2 now spawn one of each of the three approved ships
(Kıyı Sandalı, Tüccar Yelkenlisi, Kraliyet Firkateyni) and both approved monsters
(Zümrüt Kaplumbağa, Dev Mavi Yılan). Respawn fills missing ship types first.

Existing IDs, combat stats and quest target IDs are retained. Merchant retains
the stats of its previous slot on each map. Both monster definitions are shared
between the two maps.

66 legacy NPC, monster and boss WebP sheets/portrait atlases were deleted after
user approval. New approved coast sheets remain. Player/elite ships, crew,
captain art, island/tower art and audio remain unchanged.

Other seas retain stat definitions but have empty sprite fields. Spawn and
preload skip absent art, avoiding invisible targets and broken image requests.
Boss art and spawn are also paused; saved boss progress is retained.
NPC/monster procedural fallback drawings have been removed.

New map sets can be enabled by assigning sprite paths to existing definitions,
adding IDs to the map's npcs/monsters arrays, and supplying matching portraits.

Coast asset format:
- Ships: 8 × 2 frames, 256px, eight directions repeated into 16 slots.
- Monsters: 4 × 2 frames, 256px; N, NE, E, SE, S, SW, W, NW.
- Portraits: five 256px cells.
- Files: public/assets/trial-coast-{boat,merchant,frigate,turtle,serpent,portraits}-v1.webp.

Original preparation used built-in imagegen: preserve supplied designs,
remove checkerboard/text/grid/compass to transparent alpha; correct merchant
northwest and turtle south views. Atlas packing retained that alpha.

Validated with TypeScript/Vite build, preserved numeric-stat comparisons,
map population/respawn checks and remaining asset path checks.
