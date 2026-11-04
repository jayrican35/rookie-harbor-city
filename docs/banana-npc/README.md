# Banana NPC — local import and review

Imported the owner's `ROOKIE_Banana_NPC_Import_Pack.zip` into the connected main-world preview. Banana replaces the older banana prop as Chicken's partner in the existing comic exchange. No new mission or automatic cutscene was added.

## Try it

Refresh `http://127.0.0.1:8767/`, choose **Chicken & Banana NPCs · Talk nearby**, and finish any opening Dispatch line. On foot, approach either NPC and press **E** or tap **Talk**. Advance Chicken's opening line to hear Banana's reply, with its supplied smug portrait. Both NPCs resume walking when the conversation ends.

`index.html` shows actual gameplay screenshots. `results.json` records the Banana browser tests. `source-validation.json` contains ZIP/file hashes and individual-frame/atlas comparisons.

## Important source-art defect

The supplied **talking frames 2 and 3 contain visibly cut-off artwork**. Their transparent margins are valid, but the extracted character silhouette inside those margins is incomplete. The original PNGs and manifest are preserved unchanged for reference; these two cells are **excluded from gameplay**. Talking uses the intact cells **0, 1, 0, 1** at the supplied 220ms cadence. The test samples playback and confirms neither damaged cell appears.

This remains reference-extracted pilot artwork. Minor edge, pose and directional differences remain at large zoom. The import does not claim to have redrawn or repaired those source pixels. Additional talk poses require a corrected source rather than silently displaying a chopped character.

## Integration

- `published-game-capture/assets/banana-npc/` preserves the supplied pack byte-for-byte at import.
- Walk atlas: 112×120 cells, four columns, rows **down, left, right, up**, foot anchor **(56,110)**, 170ms equivalent distance cadence. It uses the same 0.75 world scale, 30-unit walking speed and native collision radius as Chicken.
- Idle/talk sheets use the same cells and anchor but contain taller artwork. Scale **60/102** normalizes visible body height to about 60 world units. Argument poses use 160×160 cells, anchor **(80,155)** and scale **0.45**. All states keep the same feet position and soft ground shadow.
- The supplied idle sheet plays while listening; the approved talk cells play for ordinary Banana speech. Supplied argument poses are available for angry/excited metadata and were exercised in the actual-game QA view. Eight portraits are imported; normal comic replies use smug, with annoyed, surprised and thinking available for matching moods.
- A single `npc_banana` joins the existing ambient pedestrian route list, native interaction list and feet-sorted actor queue. Its short sidewalk route sits a few tiles from Chicken, away from the precinct entrance and cruiser lot. No new solid geometry is created.
- Existing camera projection, comic renderer, modal controls, pagination and conversation callbacks are reused. There is no new simulation, dialogue engine, dependency, animation clock or save writer.
- The existing exchange resolves both live NPCs, and its proximity check works near either actor. The old banana prop is suppressed in the connected view.
- Chicken's **renderer source, artwork, manifest, route, speed and animations are unchanged**. Both NPCs pause through the same conversation and resume through the existing movement routine.

## Tests actually run

- All original ZIP files match their imported bytes. All 28 animation cells match the individual PNGs, retain RGBA transparency and have margins. Visual inspection separately identified and withheld talking cells 2/3; structural bounds alone would not have caught their defects.
- Actual walking through all four directions, correct source rows, stable feet and unobstructed native collision positions.
- Idle, approved talking, argument animation and loaded expressive portrait in the real game.
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
