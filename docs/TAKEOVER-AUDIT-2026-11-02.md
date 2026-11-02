# Development takeover audit — November 2, 2026

This records Stage A findings before implementation. The approved image was
subsequently supplied; see `PRECINCT9-OPTION-A-REVIEW.md` for changes, current
evidence and the bounded protected-mode checks completed afterward.

## Baseline recommendation

Use `feature/v140-precinct9-approved-layout` at `e762267` as the **source-development candidate**, with the original captured campaign kept intact. Do not call its connected-city preview a complete campaign replacement. Keep `published-v1-backup` (`5f73fbf`) and the owner's original hosted game as preservation references. The original site could not be retrieved by the web tool during this audit; equivalence to today's hosted site is unverified.

`main` (`e529fde`) contains only README and three workflows. Its deployment workflow assembles pinned historical branches into separate previews. It is a deployment repository tree, not the editable game baseline. The V140 branch contains the actual game sources, assets, tools and QA. V139 is its ancestor, and the V138 actor-depth branch has no commits absent from V140. Do not merge those branches again. Historical branches and deployment pins remain unchanged.

Local work branch: `audit/canonical-baseline-20261102`, starting from `e762267`. No remote branch, deployment or merge was performed.

## Critical completeness finding

`published-game-capture/v115-campus.js` explicitly describes itself as an isolated walkable prototype with missions and vehicles not migrated. It maintains its own campus player/camera and `harbor-main` district graph. Ambient street cars are not player driving. Its interface still says driving and missions need integration, and marker interactions do not advance missions. `tools/build_v116_preview.py` suspends hidden campaign simulation while this connected world is open.

Thus there is no verified single implementation that simultaneously delivers the newest precinct art and all original campaign functionality. Preserving the campaign alongside the preview is different from integrating campaign gameplay into the seamless world. That larger integration must be scoped separately before promoting this candidate to production.

## Authoritative systems and entry points

| Responsibility | Current source |
| --- | --- |
| Captured campaign, original state/MAPS and protected modes | `published-game-capture/game.js` |
| Original captured entry | `published-game-capture/index.html` |
| Connected topology | `v115-world.js` |
| Connected movement, camera, collision, district placement, depth queue | `v115-campus.js` |
| Current precinct ground geometry | `v133-precinct-campus.js` |
| Precinct architecture, garage, entrance sensor, grounds and forecourt | `v134-precinct-reference.js` |
| Atlas loading and modular drawing | `v135-precinct-wallkit-test.js` |
| Active facade/entrance atlas | `assets/precinct9-entrance-phase3/manifest.json` |
| Active ground atlas | `assets/precinct9-ground-phase5/manifest.json` |
| Build entry | `tools/build_v140_precinct_approved_layout_preview.py` |

Paths in this table are relative to `published-game-capture` unless prefixed otherwise. `game-v115.bundle.js` is generated output: builders inject extensions inside the captured engine's private IIFE. Loading the raw captured index is not equivalent to running the built V140 preview.

The build entry invokes predecessor builders recursively. Retain this chain until a replacement proves equivalent; it encodes script order, activation flags, save isolation and private-scope access. Earlier atlas manifests remain relevant to builder assertions even where the latest combined atlas is selected at runtime. File presence alone does not establish runtime usage or safe deletion.

## Causes of conflicting visuals

1. Several active terrain passes overlap: V115 pilot/reference/premium layers, V130 pavement, V133 cached grounds, V134 cached grounds, original station apron, then V134 forecourt. Their coordinates are owned in separate files. Correcting one does not establish final visible ownership.
2. V140 replaces V133's north-ground authoring and removes three legacy V115 trees, but deliberately retains V134's plaza objects. The actual overview still shows a **VISITOR PARKING** sign on the pedestrian plaza, beside the new parking lot. This is a concrete obsolete label, not a hypothetical issue.
3. Multiple road painters/crosswalk sources survive. The captured overview shows an additional crossing by the garage approach as well as the central pedestrian crossing. Resolve ownership against the approved image before editing these.
4. Cached V133 and V134 ground canvases use separate bounds and material readiness keys. V133 is 2410×1720 (about 15.8 MiB RGBA); V134 grounds are 1710×647 (about 4.2 MiB), plus forecourt and architecture caches. They are cached, not rebuilt every frame; overlapping blits still consume bandwidth. No Android performance conclusion follows from this desktop audit.
5. Some older architecture is already correctly suppressed: V130 frontage and V133 facade are skipped when V134 owns architecture, and showcase precinct roofs are skipped when V132 is present. Do not remove every historical module under the assumption it is all duplicating the facade.
6. The V138 fix puts main and garage shells in the same feet-Y sorted queue as actors. Preserve this rather than reintroducing a late facade overlay. Ground decorations still require a separate occlusion audit; not every decorative tree or lamp participates in that queue.

## Geometry and behavior observed

Existing main door `(948,1124)`, garage `(1918,1256)`, Harbor Avenue y=1721..1848. V140 defines parking `(1640,1464,670,237)`, garage apron `(1742,1264,354,224)`, and connecting drive `(1856,1450,146,271)`. Their rectangles connect geometrically. Current art shows seven clear stalls and a central garage approach with no trees or bushes inside the stalls.

Eight sampled pedestrian collision points at y=1560 across x=1675..2200 were unblocked. This is not proof of vehicle swept-path clearance or every parking stall's usability. Player driving is not integrated into this preview. Decorative planters are described by the source as presentation objects rather than colliders; visual/physical correspondence is not globally established.

Camera follows the connected player. Lobby entry was tested by holding W, exit by holding S, with the existing world/canvas and player retained. Interior roof alpha reached .04 and began recovering on exit (.12 at the immediate exit sample). Separate exterior screenshots were captured with Jay away from the roof fade zone. Camera-only overview captures must not be mistaken for the player's location.

## Actual validation and evidence

- Built V140 locally using bundled Python with UTF-8 mode.
- Passed `qa/check-v134-precinct.cjs`, `qa/check-v133-precinct.cjs`, `qa/check-world-roads.cjs`, `qa/check-world-traffic.cjs`.
- Ran installed Chrome headlessly at 390×844 with mobile/touch emulation and 1280×720 desktop; this is not a physical Android test.
- Captured overview, parking, entrance, interior and normal exterior gameplay at both sizes in `audit-evidence/`.
- Both browser runs had zero uncaught JavaScript exceptions, but each requested five missing assets: `assets/exterior/parking_bay.webp`, `assets/exterior/wheel_stop.webp`, and `assets/civilians/civilian_{man_blue,man_tan,woman_red}.webp`.
- `audit-evidence/runtime.json` contains exact runtime snapshots, geometry, atlas metrics, failed URLs and movement observations. `qa/audit-baseline.cjs` reproduces these observations using an ephemeral local server on port 8766.

No gameplay, assets, collision, saves, or Zombie source was edited in this audit. The only existing code edit compares original engine **bytes** with bytes in the V115 builder. The prior assertion compared decoded CRLF bytes with Python universal-newline text and falsely failed on Windows. This is a tooling correction, not a gameplay change.

Zombie runtime identity, full campaign missions, player driving, all districts, touch joystick operation, animated depth correctness and performance are **not yet regression-certified**. Source preservation does not substitute for those tests. The protected mode must remain excluded from future precinct changes.

## Corrective plan before substantial implementation

1. Obtain the actual approved campus image. The repository has a written approved site plan but no clearly identifiable corresponding approval image. Do not invent a replacement composition.
2. Keep V140 as one source candidate and original campaign as the protected release reference. Document that the connected world is a preview; do not promote it as a complete replacement.
3. Inventory final visible ownership per precinct rectangle and list decorations by world footprint. Reconcile the obsolete plaza parking sign, ground seams and crossing ownership against the image.
4. Correct placement in V133/V134's existing authoring functions and the existing V115 decoration list. Avoid another overlay or renderer. Consider one shared layout data object only where it removes conflicting coordinates safely.
5. Recover the five requested missing assets from existing history/capture manifests where possible. Determine whether each requested asset is still needed before removing a request. Do not replace protected/shared asset behavior casually.
6. Repeat identical desktop/mobile captures before/after, trace lobby and garage routes, test all stall approaches, actor depth, touch controls and other districts. Compare protected source/assets by hash and run Zombie before/after without modifying it.
7. Deliver a focused PR against the chosen source baseline and a separate review build; no merge or production update without explicit approval. A PR against current `main` would misleadingly introduce the whole captured source tree and needs a deliberate repository policy decision.

## Local reproduction

Requires Python 3, Node, Playwright and installed Chrome. Build output must begin as a fresh copy of `published-game-capture`; recursive builders are not idempotent on already-built HTML. On Windows set `PYTHONUTF8=1` for the whole builder process tree. Run:

```powershell
$env:PYTHONUTF8 = '1'
New-Item -ItemType Directory -Force site/preview/precinct9-v140-approved-layout
Copy-Item published-game-capture/* site/preview/precinct9-v140-approved-layout -Recurse -Force
python tools/build_v140_precinct_approved_layout_preview.py site/preview/precinct9-v140-approved-layout
python -m http.server 8765 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:8765/preview/precinct9-v140-approved-layout/`. The raw captured source index does not activate the V140 build. With Playwright resolvable, run `node qa/audit-baseline.cjs` separately for the audit captures. The script starts and closes its own server. Generated outputs and logs are ignored by Git.
