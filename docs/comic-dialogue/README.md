# Comic dialogue — local implementation and test report

Implemented November 4, 2026, in the connected civilian preview and its embedded campaign. The canonical `game.js`, existing character artwork, missions, vehicle systems and Zombie Outbreak source remain unchanged. No version number was changed. Nothing was pushed, deployed, merged remotely or submitted as a PR.

## Implementation

The presentation reuses `H.speech` and the original `showLines`, `showChoices`, typewriter, pagination, focus, keyboard/tap handlers and story callbacks. The existing campus paint loop supplies its actual camera and speaker coordinates. The native speech renderer remains responsible for measurement and placement; there is no second conversation engine, animation clock or save writer.

Eight cached SVG silhouettes provide normal, excited, angry, whisper, thought, surprise, confusion and laughter styles. Cream balloons have thick outlines, curved tails or thought circles, offset shadows, short appearance/dismissal animations and a reduced-motion override. Lettering stays in screen pixels during zoom. Native choices remain accessible buttons. Connected HUD and face rectangles feed the original placement scorer. Indoor station and marina speakers respect existing roof visibility.

Connected civilians now use the native dialogue controls instead of the old single-line output. Unsupported non-character inspection messages retain that output. Unknown/offscreen story speakers use the existing compact viewport fallback. Long narrative cards retain the existing chunking and pagination. Cinematic captions receive the same cream-and-ink presentation without changing cinematic timing.

The first precinct pilot adds one civilian using an existing civilian atlas, pedestrian routine and existing remark. The optional Chicken/Banana exchange now uses the owner-supplied Chicken NPC pack and the existing banana prop. See ../chicken-npc/README.md for the later Chicken import; the original rubber-chicken stand-in is suppressed in the connected preview. It starts through **Talk** near the props, never automatically. Ambient thoughts use the existing single speech instance, with a 14-second global gap, a 60-second actor cooldown, distance/visibility checks and suppression during driving, conversations or HUD panels.

## Local review

Open `http://127.0.0.1:8767/` and refresh the page. Use the scene selector:

1. **Precinct visitor · comic dialogue**: walk next to the visitor and press **E** or tap **Talk**. Use Enter, E, the text balloon or Continue to advance. Finish any introductory Dispatch line first.
2. Change zoom while speaking. Text should stay readable, the tail should track the speaker and the balloon should avoid the face and controls.
3. **Chicken & Banana · Talk nearby**: press Talk for the three-line exchange. Check angry Chicken, rounded Banana and excited Chicken in sequence.
4. At the marina, stand near an angler or visitor. Brief thoughts/reactions can appear while you continue walking.
5. Return to campaign play and speak with Brooks. The original three briefing choices should appear as buttons in the balloon. Completing the briefing and fridge inspection should still record progress.
6. Test portrait mobile at 390×844, tap to advance, then verify movement resumes after dismissal. With reduced motion enabled, the pop/shake effects should stop.

The direct preview supports `?pilotQA=1&comicLegacy=1` for the unchanged presentation fallback. `comicStage=civilian`, `comedy`, `reactions` and `full` support the incremental test gates; the normal default is `full`.

## Verification

`results.json` contains the final actual-browser results and performance sample. `isolation.json` records protected-source hashes against local commit `bb06c32`. The gate JSON files record the earlier incremental passes.

- Desktop and mobile: real precinct interaction, screen bounds, fixed 18px text at 0.55× and 1.6× zoom, native long-card text preservation, keyboard/tap progression and movement lock during modal dialogue.
- Comedy: all three original requested lines, alternating anchors/styles and final dismissal.
- Reactions: one ambient instance, fish thought in actual marina gameplay, continued player movement and automatic expiry.
- Migration: eight styles, native choice callback exactly once, normal reveal speed, roof visibility, reduced motion and classic unsupported-speaker fallback.
- Actual story: **What happened?** in Brooks's briefing; original `briefed` and fridge-clue completion callbacks both succeeded.
- Short local active-balloon FPS sample with 28 street cars and 17 ambient pedestrians, recorded in `results.json`; this is a desktop sample rather than a guarantee for every device.
- Mobile cruiser gas/brake/reverse, moving-exit refusal, safe parking/exit, save/reload/import, profile isolation and existing lot/building collision checks passed.
- Existing campus geometry/input, pedestrian movement, 30/60/120Hz handling and connected traffic tests passed.
- Zombie guard passed; seeded map SHA-256 matches the previously recorded baseline. Canonical game, world, cast, cruiser, traffic and all existing asset files are unchanged.
- Repeat builds produce identical presentation hooks, with exactly one decoration hook. There are no new runtime dependencies, RAF loops or timers in the presentation module.

The entire campaign was not replayed. Existing mission code and callbacks were preserved, with the actual briefing/fridge progression exercised. Emoji reactions use the platform's glyphs; their exact fish/music appearance may vary by operating system. Existing portraits were not replaced or given new expression artwork.

Run from the repository with Playwright available on `NODE_PATH`:

```powershell
python tools/prepare_civilian_preview.py
node qa/check-comic-dialogue.cjs
node qa/check-comic-isolation.cjs
node qa/check-precinct-cruiser-safety.cjs
node qa/check-v115-campus.cjs
node qa/check-world-pedestrians.cjs
node qa/check-connected-handling.cjs
node qa/check-connected-traffic.cjs
```

## Modified files

- `published-game-capture/comic-dialogue.js` — cached balloon art, tails, connected projection, metadata, reactions and optional comedy presentation.
- `published-game-capture/comic-dialogue.css` — balloon lettering, native choice styling, animation, captions and reduced motion.
- `published-game-capture/v115-campus.js` — optional presentation context, native conversation entry, pilot civilian and modal-input guard.
- `tools/comic_dialogue.py` — repeatable local-build hooks around the canonical native speech renderer; restores its source presentation block before each build.
- `tools/prepare_civilian_preview.py` — copies and cache-busts presentation files, applies guarded hooks, publishes evidence locally.
- `tools/civilian_preview_review.html` — review link and two local scene shortcuts.
- `qa/check-comic-dialogue.cjs`, `qa/check-comic-isolation.cjs` — gameplay, progression, visual and isolation checks.
- `qa/check-precinct-cruiser-safety.cjs` — dismisses the introductory native conversation before its existing driving fixtures; driving assertions are unchanged.
- `docs/comic-dialogue/` — this report, gallery, screenshots and machine-readable results.

Generated `site/` content remains local and ignored by Git. Pre-existing untracked driving notes/tests were left alone.
