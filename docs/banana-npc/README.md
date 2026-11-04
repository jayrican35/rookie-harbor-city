# Banana NPC — local import and review

Imported the owner's `ROOKIE_Banana_NPC_Import_Pack.zip` into the connected main-world preview. Banana replaces the older banana prop as Chicken's partner in the existing comic exchange. No new mission or automatic cutscene was added.

## Try it

Refresh `http://127.0.0.1:8767/`, choose **Chicken & Banana NPCs · Talk nearby**, and finish any opening Dispatch line. On foot, approach either NPC and press **E** or tap **Talk**. Advance Chicken's opening line to hear Banana's reply, with its supplied smug portrait. Both NPCs resume walking when the conversation ends.

`index.html` shows actual gameplay screenshots. `results.json` records the Banana browser tests. `source-validation.json` contains ZIP/file hashes and individual-frame/atlas comparisons.

## Talking-frame repair

The initial pack had cut-off artwork in talking cells 2 and 3. The owner's `ROOKIE_Banana_Talking_Frames_Fixed_PATCH (1).zip` now replaces exactly those two individual PNGs and the assembled talking atlas. All four repaired cells were visually reviewed and exercised in the real game. The temporary 0/1-only restriction is removed; speech now plays **0, 1, 2, 3** at the supplied 220ms cadence.

The cell size (112×120), foot anchor (56,110), scale and portrait/dialogue behavior are unchanged. A content hash on the talk-atlas URL refreshes the browser's cached artwork. Other Banana art, walking, spawn, route and Chicken are unchanged.

This remains reference-extracted pilot artwork; subtle pose/edge differences may still be visible at large zoom. The corrected gloves are part of the supplied repair, not a runtime reconstruction. The original checkerboard preview remains historical; `previews/banana_talk_repaired_zoom.png` is the supplied repaired preview.

## Integration

- `published-game-capture/assets/banana-npc/` preserves the base pack, with only the talking atlas and frames 2/3 replaced by the owner-supplied repair.
- Walk atlas: 112×120 cells, four columns, rows **down, left, right, up**, foot anchor **(56,110)**, 170ms equivalent distance cadence. It uses the same 0.75 world scale, 30-unit walking speed and native collision radius as Chicken.
- Idle/talk sheets use the same cells and anchor but contain taller artwork. Scale **60/102** normalizes visible body height to about 60 world units. Argument poses use 160×160 cells, anchor **(80,155)** and scale **0.45**. All states keep the same feet position and soft ground shadow.
- The supplied idle sheet plays while listening; all four repaired talk cells play for ordinary Banana speech. Supplied argument poses are available for angry/excited metadata and were exercised in the actual-game QA view. Eight portraits are imported; normal comic replies use smug, with annoyed, surprised and thinking available for matching moods.
- A single `npc_banana` joins the existing ambient pedestrian route list, native interaction list and feet-sorted actor queue. Its short sidewalk route sits a few tiles from Chicken, away from the precinct entrance and cruiser lot. No new solid geometry is created.
- Existing camera projection, comic renderer, modal controls, pagination and conversation callbacks are reused. There is no new simulation, dialogue engine, dependency, animation clock or save writer.
- The existing exchange resolves both live NPCs, and its proximity check works near either actor. The old banana prop is suppressed in the connected view.
- Chicken's **renderer source, artwork, manifest, route, speed and animations are unchanged**. Both NPCs pause through the same conversation and resume through the existing movement routine.

## Tests actually run

- Every imported source file matches either the base ZIP or the supplied repair ZIP. All 28 animation cells match the individual PNGs and retain RGBA transparency and margins. Visual inspection confirms the repaired talking cells have complete gloves; structural bounds alone did not detect the original defects.
- Actual walking through all four directions, correct source rows, stable feet and unobstructed native collision positions.
- Idle, full four-frame repaired talking, argument animation and loaded expressive portrait in the real game.
- Stable world anchor and scale while zooming at 0.55×, 1.7× and 2.5×.
- Both NPCs pause during conversation, then resume. Exactly one Chicken and one Banana remain after closing/reopening the preview.
- Mobile portrait 390×844: taps advance to Banana; its speech balloon remains visible and within the screen.
- Existing Chicken, comic/story, precinct geometry/input and pedestrian regression checks passed. The comic suite exercises Brooks's real briefing and fridge-clue callbacks as well as reduced motion and the legacy fallback.
- Zombie requests **zero Chicken/Banana images**, refuses entry to the connected preview and produces the exact earlier seeded-map hash. Canonical game, Zombie, Chicken, civilian, cruiser and traffic source files remain unchanged.

Run the local server/build and, with Playwright available on `NODE_PATH`:

```powershell
node qa/check-banana-npc.cjs
node qa/check-chicken-npc.cjs
node qa/check-comic-dialogue.cjs
node qa/check-comic-isolation.cjs
node qa/check-v115-campus.cjs
node qa/check-world-pedestrians.cjs
```

## Files and scope

New: `published-game-capture/banana-npc.js`, the supplied `assets/banana-npc/` pack, `qa/check-banana-npc.cjs` and this evidence directory.

Updated: connected actor registration/draw hooks in `v115-campus.js`; live speaker, portrait and proximity resolution in `comic-dialogue.js`; local builder and scene links; asset-addition isolation checks; review reports and regenerated gameplay screenshots/results.

Everything stays local. No push, deployment, PR, remote merge or version change was performed. Existing untracked driving notes/tests were left alone.
