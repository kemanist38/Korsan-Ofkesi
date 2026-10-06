# Leveling balance, 2026-10-06

Run `node tools/check-quest-balance.cjs` and `node tools/simulate-leveling.cjs`.

All 64 quests require 20 targets. Each quest has its own 8-hour cooldown after
completion or cancellation. The fourth quest is now 20 sparkles, not chests.
Different available quests can still be completed during another quest's cooldown.
Existing 2-hour deadlines are extended from their original completion time once.

NPC HP and XP use separate tables. Medium NPCs have identical stats on both maps.
Gold uses the previous HP scale rather than the new HP values. Quest combat XP is
an extra 50% of the target kill rewards. Bosses use the large NPC as the trigger,
10 times its HP and 20 times its XP; their XP does not automatically grow with HP.

## Offline simulation results

| Scenario | Active hours to level 8 | Equivalent 10-hour days |
|---|---:|---:|
| Progressive equipment, iron ammo, all available quests | 140.77 | 14.08 |
| Same equipment with VIP | 131.58 | 13.16 |
| Same equipment, 50% more travel time | 151.62 | 15.16 |
| Fully equipped from start, unlimited explosive ammo, VIP, optimized targets | 30.58 | 3.06 |

Normal stage totals (hours): 3.99, 12.69, 26.40, 46.34, 72.69, 104.50, 140.77.
TP thresholds: 74,000; 242,000; 753,000; 2,054,000; 4,363,000; 6,161,000; 10,542,000.

The model loads actual campaign, cannon, ammo and elite tables. It includes travel,
salvo intervals, incoming damage/repair estimates, boss kills, accessible lower-map
quests, 8-hour wall-clock cooldowns, 10 active hours/day and Sunday XP bonuses.
It assumes the explicitly listed equipment purchases are available at each level;
it does not simulate saving gold/pearls for those purchases. Purchases and premium
ammo budgets need live telemetry before a production timing guarantee is possible.

Other limits: no actual browser/multiplayer playthrough, no PvP interruptions or
spawn competition, approximate retreat and boss combat, no splash farming or
party assistance, no siege/treasure XP. The fast test uses optimized single-target
farming and is not a proof of the fastest possible strategy. No artificial XP cap
or minimum account age was introduced. Two weeks is a baseline target, not a
universal minimum. Test mode remains enabled for the owner's map testing and is
deliberately not used for the normal progression simulation. Existing player levels
and test accounts are not reset.
