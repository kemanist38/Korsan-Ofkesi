# Lightweight effects revision

Only repair (vfx-heal-v1.webp), rage (vfx-rage-v1.webp) and the existing speed effect remain from the optional effect set.
Deleted: fire, hit-spark, levelup, sink sheets and the painted explosion/splash/smoke/debris atlas vfx-anim-v1.webp.
Their runtime loaders and calls were removed. Impact/death burst particle creation and wreck bubbles were removed.

Reference: supplied WhatsApp clip, especially 34–38 seconds. A defeated target disappears without a large explosion or vortex.
NPCs, monsters and rival captains now use the same 1.1-second fade and slight downward drift.
A pose is captured once on death, not redrawn/reallocated each frame. Up to 24 visible wrecks are retained;
offscreen deaths allocate none, expired wrecks are released, and map changes clear the list.
Rewards, HP, burn damage, respawn rules and shield gameplay are preserved.

Validated with production build and a focused lifecycle check. Browser gameplay and many-player load testing were not available.
