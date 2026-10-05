# VFX batch 6–12

Six supplied sheets are mapped in attachment order to fire, hit-spark, heal,
levelup, sink and rage. Shield is excluded: there is no shield animation file
or rendering path in the current repository. The shield item and its stats,
icon and sound remain available.

Built-in imagegen background extraction prompt: Preserve all eight frames in
4x2 reading order, colors, relative sizes and registration. Remove background,
grid lines and labels; use true alpha. For sink, remove green gutters and square
teal sea tiles while retaining circular foam, vortex and debris.

Final assets: public/assets/vfx-{fire,hit-spark,heal,levelup,sink,rage}-v1.webp.
Each is an 8x1 strip of 192px cells. Uniform cell crops remove divider remnants;
frames retain common scale and position. Luminous effects use screen blending;
the whirlpool uses normal alpha and the sea-plane projection beneath wrecks.

Fire and rage interpolate neighboring frames and loop. Hit, levelup and sink
play once. Repair plays while healing is permitted (stationary, or VIP).
Build validation: npm run build. No browser gameplay validation available.
