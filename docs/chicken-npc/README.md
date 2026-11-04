# Chicken NPC import — local review

Imported the owner's `ROOKIE_Chicken_NPC_Import_Pack.zip` into the connected main-world preview on November 4, 2026. The real NPC replaces the connected preview's rubber-chicken stand-in. It does not create another Banana character or change the existing comic exchange, campaign story, missions or saves.

## Review in game

1. Refresh `http://127.0.0.1:8767/`.
2. Choose **Chicken NPC · Talk nearby** in the scene selector.
3. Finish any opening Dispatch line, then press **E** or tap **Talk** near Chicken.
4. Chicken pauses its short sidewalk patrol, plays the supplied argument poses and displays its supplied angry/surprised portrait in the existing comic balloon. Continue through the exchange; Chicken resumes its patrol afterward.
5. Watch it turn through right, up, left and down. The walking loop stays on the precinct's paved frontage, away from the entrance and police cruiser bay.

`index.html` contains actual gameplay screenshots. `results.json` records the browser checks. `source-validation.json` records ZIP/file hashes, complete transparent cell bounds and individual-frame/atlas equality.

## Assets and implementation

- Original, unmodified pack preserved in `published-game-capture/assets/chicken-npc/`.
- Walking: `sprites/atlas/chicken_walk_4x4.png`, 112×120 cells, rows **down, left, right, up**, four frames each, supplied feet anchor **(56,110)**.
- Walking uses the existing pedestrian distance phase at the equivalent of the supplied 170ms cadence. Idle uses frame zero. Whole cells are drawn; no auto-trimming, recoloring, matte changes or silhouette reconstruction.
- Argument: `sprites/atlas/chicken_argue_4x1.png`, four 160×160 cells, anchor **(80,155)** and supplied 230ms cadence, driven by the existing render timestamp.
- Walking scale 0.75 and argument scale 0.45 preserve roughly 60 world pixels of visible body height for both sheets. Wings may spread naturally; the body and ground anchor do not randomly change size.
- Eight original portrait files are imported. The angry, surprised and talking variants are connected to current dialogue moods. Their original illustrated RGB backgrounds are deliberately retained inside the portrait frame.
- One `npc_chicken` actor joins the existing ambient pedestrian simulation, interaction list and feet-sorted world drawing queue. The same collision checks govern movement. Existing two-way pedestrian routes retain their behavior; Chicken uses a four-corner route through that routine.
- Existing `H.speech` dialogue, comic styles, choice/page handlers, movement guard, camera projection, roof visibility and mobile controls are reused. There is no new simulation clock, dialogue engine, dependency or save writer.
- The native civilian adapter already protects the name Chicken from civilian skin replacement. Its code was not changed. No unrelated character or vehicle art was replaced.

## Checks actually run

- All imported files match their ZIP bytes. All 16 walk frames are complete RGBA cells, match the corresponding atlas pixels and have transparent margins on every edge. No foreground touches a cell boundary.
- Actual in-game traversal through all four directions; source row selection, fixed feet anchor and clear collision positions verified.
- Stable world dimensions at 0.55×, 1.7× and 2.5× zoom. Shared queue supplies correct actor/furniture/tree layering and a soft feet shadow.
- Comic argument animation and loaded portrait; native progression through Chicken/Banana/Chicken, pause during the exchange and resumed walking afterward.
- Exactly one Chicken remains after closing and reopening the connected preview.
- Mobile portrait 390×844: balloon fits the viewport and taps advance to Banana.
- Existing comic dialogue suite: desktop/mobile wrapping, zoom, long text, native choices, actual Brooks briefing/fridge-clue progression, reduced motion and legacy fallback all passed.
- Latest active-balloon regression sample: approximately **60 FPS**, 28 street cars and 18 ambient actors. This is a short local desktop sample, not a guarantee for every device.
- Existing pedestrian and precinct geometry/input tests passed.
- Zombie guard passed with **zero Chicken asset requests**; its seeded map hash exactly matches the earlier baseline. Canonical game/Zombie, civilian renderer, marina, cruiser and traffic source files remain unchanged.

Run the local server and build, then:

```powershell
node qa/check-chicken-npc.cjs
node qa/check-comic-dialogue.cjs
node qa/check-comic-isolation.cjs
node qa/check-world-pedestrians.cjs
node qa/check-v115-campus.cjs
```

Playwright must be available on `NODE_PATH`, as in the repository's other browser tests.

## Quality and scope

This is a working local pilot using the supplied artwork. The source pack explicitly describes extracted prototype art: slight silhouette/pose differences and occasional edge specks remain visible at large zoom. Those original pixels were preserved, not represented as hand-cleaned final animation. The argument sheet has one supplied facing direction; no incorrect mirrored expression was invented. Portrait backgrounds are not transparent. No further NPC pack was generated from this source.

The later Banana import now replaces the older banana prop with its owner-supplied NPC; see ../banana-npc/README.md. Chicken’s original art, route and renderer remain unchanged. Normal gameplay remains playable, and the existing exchange is manually started rather than automatically interrupting the player.

All work stays local. No push, deployment, remote merge, PR or version-number change was performed for this import. Pre-existing untracked driving notes/tests were left alone.

## Changed files

- `published-game-capture/assets/chicken-npc/` — supplied pack, unchanged.
- `published-game-capture/chicken-npc.js` — manifest-based skin, pose/portrait selection and read-only QA.
- `published-game-capture/v115-campus.js` — one actor registration, four-way native route support, conversation pause and shared draw-queue hook.
- `published-game-capture/comic-dialogue.js` and `.css` — live Chicken speaker instead of the old prop, portrait presentation and suppression of the old stand-in.
- `tools/prepare_civilian_preview.py` — repeatable local asset/module injection and evidence copy.
- `tools/civilian_preview_review.html` — Chicken scene and review links.
- `qa/check-chicken-npc.cjs` — actual-game import checks.
- `qa/check-comic-isolation.cjs` — permits only newly added Chicken assets while continuing to reject changes to existing assets.
- `docs/chicken-npc/` and updated `docs/comic-dialogue/` — current screenshots/results and import report.
