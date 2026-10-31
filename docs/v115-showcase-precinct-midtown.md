# V115 — Precinct 9 → Midtown Visual Quality Benchmark

This branch is a **preview-only art pass** built on the existing connected-city prototype. It is not the final art for Harbor City, and it does not replace the classic campaign engine.

## Visual work implemented
- New 96×96 deterministic materials: asphalt gravel, sandstone sidewalk tile and landscaped grass. No frame-to-frame random noise.
- Linked street visual treatment: lane materials, curb edging and high-contrast pedestrian crossings from the Precinct frontage toward Midtown.
- Full-size Precinct 9 roof pass: roof seams, utility vents, skylights, secondary garage and lit entrance canopy, respecting the existing roof cutaway opacity.
- Grounds: path pavers, planters, layered trees, shade, benches, trash bins, lamps and visitor parking marking.
- Midtown approach: street sign and image-preferred building renderer; when original WebP sprite fails, a detailed facade and striped awning is used only for Midtown storefronts.
- Atmospheric polish: subtle warm lamppost pools and soft shadows, with no darkening of the tactical modes.
- Mobile polish: clearer showpiece identification, readable HUD, and a progressive level-of-detail system so micro-details are not drawn at citywide zoom.

## Limits / not yet implemented
- Work is **visual only**. No NPC AI, patrol-car driving, case interactions, saves, collisions, live multiplayer, or large-scale district geometry are changed.
- Original game art is reused where available; this showcase establishes a benchmark and requires art-direction review on a real phone before a larger tileset pass.
- No change to any Zombie Outbreak / Academy / tactical content, maps, controls, weapon balancing, art, audio or code.

## Preview and comparison
- Existing: `/preview/v115/`
- Showcase: `/preview/v115-showcase/` (after Pages deployment)
- Launch via MAP → EXPLORE CONNECTED HARBOR CITY. Use the on-screen joystick and ALL for the overview.
- Both previews keep their saves in isolated namespaces. Home-screen regular game remains at `/` unchanged.

## QA
- `node qa/check-v115-showcase.cjs`
- Existing `check-v115-campus.cjs`, `check-v115-connected-city.cjs`, `check-v115-road-layout.cjs` still pass.
- Chromium headless phone-size screenshot test covers precinct entry, roof, road approach, Midtown and whole-city overview with zero JS exceptions.
- Branch diff MUST NOT include `game.js`, `outbreak.css` or any Zombie Outbreak content.
- Do not merge or deploy as the normal game until phone playtesting and user approval.