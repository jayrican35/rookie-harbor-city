# A Very Suspicious Parking Spot — local encounter report

Implemented November 4, 2026, in the current connected city preview. This is a real, player-paced encounter using the installed Chicken and Banana NPCs, their existing artwork, native movement, native dialogue and native campus camera.

## Playing the first encounter

1. Refresh `http://127.0.0.1:8767/` and finish any opening dialogue.
2. On foot, leave the precinct/front entrance area and walk southwest into the paved Community Walk frontage near Chicken and Banana.
3. The explicit world trigger is **x590–830, y1300–1415**. The player must have visited the precinct interior or entrance frontage (x860–1100, y1100–1290), actually moved at least 20 world units, and entered this zone on foot after the loading guard.
4. The pair walk into position and the existing camera gently frames them and the precinct. Advance each balloon with Enter/E, the existing Continue control, or a tap on the text.
5. Use **Skip scene** or Escape at any stage. The camera restores smoothly and movement becomes available again.

Loading directly inside the trigger does not start the scene. Driving inside it does not start the scene. A pending on-foot entry waits for another conversation to finish while the player remains in the zone.

## Development replay

The local review toolbar includes **Replay encounter (dev)**. Stand on foot near the pair, finish any current conversation and use that button. It calls the query-gated API:

```js
ROOKIE_PARKING_ENCOUNTER.replay()
```

For the root review page, that API is inside the playable iframe; the toolbar handles this automatically. The direct game URL is `/preview/civilian-updated/?pilotQA=1`. Replay is unavailable without `pilotQA=1`, during driving, another conversation, Academy or Zombie mode. It never deletes or rewrites the real completion flag.

The `encounterPilot=1` development parameter runs only the first two lines. That minimal prototype was tested before the full script and movements were added; its results are retained in `prototype-results.json`. QA browser contexts use their own isolated storage, not the user's saved browser profile.

## Script and presentation

The seven supplied lines are unchanged and occur in their exact order:

1. Chicken: **OFFICER! THIS BANANA STOLE MY PARKING SPOT!**
2. Banana: **You don't even own a car.**
3. Chicken: **THAT IS COMPLETELY IRRELEVANT!**
4. Banana: **Speaking of which... did you move those boxes?**
5. Chicken: **WHAT BOXES?!**
6. Banana: **The ones under your eyes. You look exhausted.**
7. Chicken: **I DEMAND TO SPEAK TO YOUR SUPERVISOR!**

Chicken uses angry/excited balloons and the supplied arguing art. The confused line uses its existing confused portrait and nearest directional pose. Banana uses normal/smug speech, its repaired four-frame talking sheet, and a smaller 288px whisper balloon for the quiet line. Standard balloons remain 354px or fit to the viewport. A below-speaker tail curves around the face rather than crossing it.

Staging uses short native walking routes: Chicken ends up to Banana's left, so the existing argument artwork faces its partner without mirroring. Banana steps ten units toward Chicken for the quiet line, changes attention toward the player, then Chicken storms left. Banana gives a brief directional glance toward the player and follows. Both remain real world actors and resume safe local four-corner roaming afterward. Skip restores their saved ambient routes/speeds without teleporting their feet.

The scene itself never changes player coordinates, switches maps or loads another scene. Camera requests feed the existing `cameraFollow` interpolation; the saved follow/zoom/auto-zoom settings are restored at the end. NPC actions feed `stepAmbientPedestrians`; there is no second movement, dialogue, camera or game-loop implementation.

## Persistence

The existing profile state stores:

```json
{"connectedEvents":{"precinctParkingEncounter":true}}
```

Normal completion and explicit skip set the flag through `HARBOR.save()`. The existing local preview importer restores it and preserves sibling event data. Separate profiles have independent flags. Old saves need no conversion or version increment; an absent/non-true flag means unseen. Interrupted scenes or profile switches cancel safely without completing a different profile's event. A reload during an unfinished encounter can offer it again after a fresh qualifying approach.

No mission, clue, evidence or villain-status flag is created. The boxes reference appears only in the dialogue. Existing mission progress was compared before and after the encounter and stayed unchanged.

## Confirmed tests

- **Prototype gate:** actual on-foot trigger, one native camera pan, two native speech balloons, preserved player coordinates, restored zoom/controls, completion saved and restored after reload.
- **Full scene:** all seven exact lines, proper speaker anchors, expressive poses, four working Banana talk frames, smaller whisper, confused portrait, short step, storm-off, glance and following. Both NPCs resume movement.
- **Skip:** all seven dialogue stages plus staging, pan, storm, glance, follow and camera-return stages. Every case unlocks controls and preserves the real completion flag correctly.
- **Persistence:** Jay completion/reload/revisit does not repeat; Rosa remains independently unseen, then can skip and persist its own completion. Developer replay retains existing flags. Sibling event flags survive import.
- **Guards:** no initial-load trigger inside the zone; waiting for another conversation; real cruiser entry, gas input and driving inside the exact zone without a cutscene; safe cancellation on profile switch. Cinematic keyboard controls cannot open a blocking HUD menu.
- **Desktop and mobile:** 1280×850 and 390×844. The full script advances using actual Enter presses and mobile text taps. Balloons stay within the screen, both NPCs remain framed, the player remains stationary and the original camera returns. Appearance animations are allowed to settle in the final gallery captures.
- **Existing systems:** normal Banana/Chicken dialogue/animation, native comic choices and real Brooks briefing/fridge-clue progression, mobile cruiser controls/save-reload/profile isolation, shared precinct geometry/input and pedestrian routines passed.
- **Protected content:** all existing Chicken/Banana and other asset files are byte-for-byte unchanged from `c7291e7`; canonical game, Zombie, world, driving, traffic and other civilian sources remain unchanged. Zombie requests no Chicken/Banana images, refuses replay/connected entry and produces the exact recorded seeded-map hash.
- **Performance:** the ordinary comic/world regression still measured approximately 60 FPS with the existing city fleet and actors. The scene adds no RAF loop, interval, timeout, runtime artwork generation or dependency.

`results.json` records the full state-machine/skip/persistence run. `presentation-results.json` records the latest actual-key/tap desktop/mobile run. `guards.json` records driving/conversation/profile/mode guards. `review.json` records the user-facing replay button and active-cinematic FPS sample. `isolation.json` records protected files and build-repeatability checks. Screenshots are from actual gameplay.

Run the existing local server, rebuild and execute:

```powershell
python tools/prepare_civilian_preview.py
node qa/check-parking-encounter.cjs
node qa/check-parking-encounter-full.cjs
node qa/check-parking-encounter-guards.cjs
node qa/check-banana-npc.cjs
node qa/check-comic-dialogue.cjs
node qa/check-precinct-cruiser-safety.cjs
node qa/check-v115-campus.cjs
node qa/check-world-pedestrians.cjs
```

Playwright must be available on `NODE_PATH`, as for the repository's other browser checks. `ENCOUNTER_PRESENTATION_ONLY=1` runs the shorter latest presentation pass.

## Reused systems and modified files

- New `published-game-capture/precinct-encounter.js` — trigger/readiness gate and a small scene-directing state machine; requests existing camera/route/dialogue actions and saves its single event flag through the original profile infrastructure.
- New `published-game-capture/precinct-encounter.css` — local scene title, accessible skip control and cinematic pointer guard.
- `published-game-capture/v115-campus.js` — optional director tick inside the existing simulation; optional target inside existing camera follow; temporary actor/input holds; original controls and geometry retained.
- `published-game-capture/comic-dialogue.js` — native sequence entry, exact-line style metadata, compact whisper layout and face-safe curved tails.
- `published-game-capture/chicken-npc.js` and `banana-npc.js` — optional scene pose/portrait hints using installed assets. Their normal skins remain the same outside the scene.
- `tools/comic_dialogue.py` — optional text/layout metadata and existing UI-pop binding in the compiled local presentation layer.
- `tools/prepare_civilian_preview.py` — local module/CSS loading, one event flag in the existing save importer and local evidence copy.
- `tools/civilian_preview_review.html` — development replay button and evidence link.
- Three new encounter QA files, a precise optional-hook update to the existing Banana source-protection check, and evidence/results in `docs/parking-encounter/` plus refreshed normal-regression captures.

## Limits and remote status

No matching “Chicken and Banana!” sting exists among the approved local assets, so none was invented or downloaded. The existing UI sound is reused, respecting its current settings/autoplay behavior; background music is unchanged. The lean and knowing glance use small movement, directional poses and existing portraits rather than newly drawn animation. Original prototype-art imperfections remain.

The entire campaign was not replayed. Existing normal story/progression tests and protected-source/asset checks passed. This feature remains in the local connected preview; no GitHub push, remote merge, PR, deployment or version-number change occurred. Zombie Outbreak source, art, controls and gameplay were not modified. Pre-existing untracked driving notes/tests were left alone.
