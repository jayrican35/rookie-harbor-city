# ROOKIE: Harbor City

`published-game-capture/` is the complete playable seamless main game. Its
`index.html` boots the connected city, current campaign and introduction,
police cruiser, connected traffic, directional vehicle artwork, two-way
collisions, dialogue and audio. No preview harness, `site/` folder, scene
selector or compilation is required to play a checkout.

## Play the committed game

Requires Python 3. Run from the repository root:

```powershell
python -m http.server 8768 --bind 127.0.0.1 --directory published-game-capture
```

Open [the game](http://127.0.0.1:8768/index.html). Select a family profile;
fresh profiles play First Shift. Approach Unit 9 in the Precinct 9 parking lot
and use **Drive**. Academy and Zombie Outbreak retain their existing mode access.

## Verify or copy the package

Python 3 and Node are required for package verification:

```powershell
python tools/package_main_game.py
python tools/package_main_game.py --output site/distribution
```

The output destination must be empty. This copies only the committed game
inventory, with no generated asset cache or external source ZIP needed.
`PLAYABLE-PACKAGE.json` hashes normalize text line endings for Windows/Linux.

Authoring adapters remain beside the distributable. Their already bound
runtime is `game-v115.bundle.js`; `precinct-cruiser.compiled.js` contains the
existing bound controller. The original `game.js` and Zombie files remain
unchanged. Recompiling gameplay source is separate from copying this package;
historical preview tools remain available as authoring utilities.

For direct-folder browser verification, install Playwright with Chrome
available, then run `node qa/check-published-package.cjs`. It starts a fresh
server rooted exclusively in `published-game-capture/`, checks normal startup,
and uses the same index with existing diagnostics for live fleet verification.

See [packaging verification and limitations](docs/published-package/README.md).
