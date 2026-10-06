# Elite economy — 2026-10-06

Run `node tools/simulate-economy.cjs`. Optional sensitivity runs: `--fast-route`,
`--slow-route`, `--all-leech`. This is an offline encounter model, not observed
player telemetry or a full economy/playthrough simulation.

## Implemented rules

- Every consumed elite cannonball awards 0.10 EP. Iron/chain award none.
- Monday's +50% EP event remains. No calendar unlock or daily EP cap.
- Elite thresholds scale uniformly by 0.72; elite 15 requires 3,600,000 EP.
- Existing saved EP also scales once by 0.72 to preserve earned levels and
  relative progress. Existing cannons, equipment, upgrades and wallet balances stay intact.
- Elite ammo costs 1/2/3/4/5 pearls per **300** grape/fire/breaker/explosive/leech
  rounds respectively. Chain remains 10 gold per 100 rounds.
- Elite entry: 2,500 pearls. Long/rapid/heavy cannons: 15/30/50 pearls each.
- Upgrade prices use the existing rank formula with a 26x base-price multiplier.
- Epic gear costs 2,500 / 3,500 / 3,000 / 3,000 pearls. Rare gear costs
  600 / 800 / 720 / 800. Common gear and crew gold costs stay unchanged.
- Pearl-pack TL prices and consumable unit prices stay unchanged. Payment integration
  is still not implemented; test mode remains enabled.

## Why ammunition demand is encounter-based

The model uses live campaign target HP, cannon/ammo damage and reload, cumulative
elite bonuses, fire DOT, enemy retaliation, repair, leech healing, travel and
collection actions. Overkill still consumes a full salvo, as in the game.
It starts with 50 cast cannons, assumes 100 at hour 4, and 315 heavy at hour 12.
Captain/map milestones follow the previous leveling reference; purchases are
assumed affordable, not derived from an economy simulation. Gear/upgrades progress
over time. Four in five actions are encounters; the fifth is a 20-sparkle route.
Some encounters represent PvP or boss attempts. Map/collision geometry, PvP tactics,
crew loadouts, rage, splash damage, supplies earned in-game and market order
rounding can change the result. Enemy defeat/repair timing is approximate.

Assumed navigation distance is 800–1,700 units with a 1.3 route factor. After-fight
overhead is six seconds. Ten active hours per day, starting Tuesday, determines
Monday bonuses. Speed-potion budget assumes 25% uptime, plus five mines/hour.
The route model does not shorten travel for these optional speed potions; their
budget is separate and actual use can shorten the time estimate.

| Scenario | Active hours | Elite rounds | Gross pearl need | Cheapest pack combination TL |
|---|---:|---:|---:|---:|
| Mixed encounters/ammunition | 207.63 | 33,585,770 | 455,873 | 6,619.95 |
| 30% shorter routes | 203.43 | 34,005,655 | 458,681 | 6,669.94 |
| Only leech ammunition | 210.54 | 33,368,080 | 695,484 | 9,999.95 |

Reference pearl budget: setup 79,944; ammo 317,342; optional supplies 58,587.
Setup buys elite entry, 315 heavy cannons, all upgrades and four epic pieces.
Each category bought separately may cost more than the combined optimum because
pearl packs are indivisible. Free pearl income, existing inventory, VIP and gold
costs are excluded from TL totals. No claim is made that a player must pay these
amounts or that this is a spending cap. Continued PvP spending is open-ended.

Without Monday bonuses, 3.6m EP at 0.1 EP/ball requires 36m rounds. With events the
reference uses 33.6m; no 120m-ammunition quota is introduced. 208 hours is a
reference pace, not a guaranteed minimum. More efficient combat or fewer
noncombat actions can accelerate progression. Validate against live telemetry
before treating three weeks or the budget as guaranteed for all players.
