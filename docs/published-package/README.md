# Standalone published game wiring

Scope: packaging only. Promoted the existing main boot HTML, compiled
runtime/controller and four missing existing generated asset files from
`site/game/` into `published-game-capture/`. No driving tuning, new behavior,
baseline measurements, checkpoint or Stage A audit was performed.

The promoted runtime is byte-identical to the previously assembled game. The
standalone `v115-campus.js` remains its authoring source with compiler insertion
markers; `index.html` loads its already bound version inside
`game-v115.bundle.js`, not a second standalone copy. The upgraded cruiser,
connected traffic, 16-heading visual adapter, two-way collision adapter and
connected main/story/tactical adapters all run from this committed directory.

`tools/package_main_game.py` verifies every packaged file against
`published-game-capture/PLAYABLE-PACKAGE.json` and reproduces the complete
distributable into an empty output folder using no ignored build cache. Text
hashes use LF normalization to support Git's Windows line-ending conversion.
The original engine normalized SHA-256 is
`fed646e5a213439b9ec269a80a2b7bb928d16d378b6a99714f10483d8e830d3f`;
the original working-copy SHA-256 is
`302d93ed8fbe6001e2690ead38fde87a7067ddefdd92c130410e1af8f8715282`.
No changes were made to `game.js` or any Zombie Outbreak file.

All 870 package files (869 inventory entries plus the manifest itself) were
checked against the Git index. Every normalized content hash matches, so no
required package file is present only as an untracked/ignored local file.

## Direct-folder verification

`qa/check-published-package.cjs` creates a new dedicated HTTP server on a free
port with its document root set exclusively to `published-game-capture/`.
It does not reuse the local preview server or load a scene selector.

- Normal `/index.html`: choose Jay, original intro starts, Skip returns to
  the connected city, standard menu is visible.
- Same index with existing `pilotQA=1` diagnostics: actual connected traffic
  moves; one Unit 9 is visible in its parking bay and its Drive control enters it.
- Cruiser directional art reports ready with 16 headings.
- Existing fixture hooks position real fleet bodies at a clear road location;
  actual keyboard acceleration drives the cruiser into a civilian car.
  The existing solver records nonzero velocity changes for both bodies.
- Existing driving controls remain visible at 390×844 portrait viewport.
- No JavaScript errors, no request into `site/`, `/game/` or preview folders,
  and no missing required runtime resources.

Results: `results.json`. Captures: `direct-main.png`, `parked-cruiser.png`,
`two-way-contact.png`, `phone-direct.png`. Phone-size browser verification
does not replace a physical phone playtest.

Five unchanged optional legacy preloads return 404, also in the old assembled
build: `exterior/parking_bay.webp`, `exterior/wheel_stop.webp`, and the old
`civilians/civilian_man_blue.webp`, `civilian_man_tan.webp`,
`civilian_woman_red.webp`. The newer ground artwork paints parking; the
approved civilian adapter replaces those old sheets. No blank substitute art
or gameplay change was introduced to hide these requests. The verification
reports these separately from required assets.

Serve directly:

```powershell
python -m http.server 8768 --bind 127.0.0.1 --directory published-game-capture
```

Open `http://127.0.0.1:8768/index.html`. A fresh checkout already contains
the complete runtime and assets; building `site/` first is unnecessary.
