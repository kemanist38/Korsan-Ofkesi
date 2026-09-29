# Sea bosses

One boss ship per sea; both maps of a sea share it (names in src/campaign.ts BOSS_NAMES).
Sprites: public/assets/boss-t{1..8}-v1.webp, 8×2 256px cells, 16 facing slots
(slot k uses view round(k/2) of N, NE, E, SE, S, SW, W, NW), drawn by drawNpcShip at span 260.
Portraits: public/assets/boss-portraits-v2.webp, 8×2 128px cells, cell i = MAP_KEYS[i].

Tiers 1–4 come from full 8-direction sheets (fixes: İnci Kraliçesi SE mirrored
from SW and label digits removed; Kadim Azur sheet unlabelled, directions by
figurehead, SE mirrored from SW; Gece Dehşet sheet unlabelled, NE mirrored from NW).
Tiers 5–8 only had one view (facing SW) in the overview sheet: left-facing slots
use it, right-facing slots use its mirror. Replace with 8-direction sheets later.
