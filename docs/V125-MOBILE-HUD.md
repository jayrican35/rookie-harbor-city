# ROOKIE Harbor City V125 — Modern Mobile Campaign HUD

Branch feature/v125-modern-campaign-mobile-hud, based on verified V124 a77bf0835bfed696025d3760aa150990433a7a2a.

## Canonical systems audited
- Connected-world input and camera: published-game-capture/v115-campus.js and its single campus.stick, direction(), simulate(), and existing collider.
- Shared Jay animation and sprint: ROOKIE_JAY in v117-jay.js; unchanged. New right-thumb Run is a held signal that uses existing speed target values.
- Original canonical marina HUD: v116-marina-hud.js. Reused portrait, minimap, case, map, gear and team callbacks; no duplicate HUD renderer.
- Original mission interactions: v115-campus.js campus.near plus existing v116 NPC dialogue click handler. No invented interactions.
- Original game/vehicle interface: game.js and controls.css unchanged. Continuous-city vehicle driving not yet implemented.

## Production changes
1. v115-campus.js: thumb-origin dynamic joystick in the existing lower-left pad, deadzone 0.13 and normalized diagonal, neutral reset on pointer cancel/release/blur, hold-to-run through existing Jay speed and contextual existing Action label.
2. v116-marina-hud.js: single expandable menu with original Case File, Map, Gear and Team handlers, native Settings handoff via btnMenu, Main Game exit via existing campus.close().
3. v125-mobile-hud.css: navy/gold compact profile/minimap, hidden debug zoom and Return control except QA, safe-area portrait/landscape layout, floating analog base and right-thumb Action and Run.
4. tools/build_v125_preview.py: builds isolated playable connected game from V124 and loads one stylesheet.
5. qa/check-v125-mobile-hud.cjs and qa/capture-v125-mobile-hud.cjs: regression and live mobile-sized gameplay tests.

## Protection
Original game.js, controls.css, outbreak.css, vehicle controls, save files, assets, v116 marina game simulation and Zombie Outbreak code/settings/maps/controls are unchanged.

## Quality and honest limitations
The connected city has no authoritative HP and stamina model, so no fabricated numbers are shown. The original campaign retains its independent health/controls. The existing V115 interaction handler reports geometry and preexisting NPC dialogue where complete campaign missions have not yet been integrated. Connected-city vehicle driving is not implemented, therefore no invented driving HUD. Browser-size QA is not equivalent to testing on physical Android and iPhone devices.