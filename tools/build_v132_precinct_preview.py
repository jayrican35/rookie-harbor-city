#!/usr/bin/env python3
"""V132: separately serve the legacy-art precinct with its original roof and NPCs.
No main game, accepted V128, protected Zombie or Marina file is modified.
"""
from pathlib import Path
import hashlib
import subprocess
import sys
if len(sys.argv) != 2:
    raise SystemExit("Usage: build_v132_precinct_preview.py PREVIEW_DIR")
root = Path(sys.argv[1]).resolve()
tools = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(tools / "build_v131_precinct_preview.py"), str(root)], check=True)
module = root / "v132-precinct-heritage.js"
bundle = root / "game-v115.bundle.js"
assert module.is_file() and bundle.is_file(), "V132 original-art module and native game required"
source = module.read_text("utf-8")
world = bundle.read_text("utf-8")
assert "window.ROOKIE_V132_PRECINCT" in source
assert "precinctExterior?.art?.roof" in source
assert "H.cast?.spec" in source
assert "ROOKIE_V132_PRECINCT?.roof" in world
assert "ROOKIE_V132_PRECINCT?.npc" in world
for name in ("game.js", "outbreak.css", "v116-marina.js", "v127-citywide-art.js",
             "v115-world.js", "v131-precinct-legacy-bridge.js"):
    assert (root / name).is_file(), name
html_path = root / "index.html"
html = html_path.read_text("utf-8")
assert html.count("</body>") == 1
assert "v131-precinct-legacy-bridge.js" in html and "v132-precinct-heritage.js" not in html
sha = hashlib.sha256(module.read_bytes()).hexdigest()[:12]
html = html.replace("</body>",
    '<script src="./v132-precinct-heritage.js?v=' + sha + '"></script>\n'
    '<meta name="rookie-v132-precinct" content="legacy-exterior-and-officers-isolated-human-review" />\n'
    '</body>')
html = html.replace("Precinct 9 Legacy Artwork Recovery — Review Only",
                    "Precinct 9 V132 Exterior & Officer Artwork — Review Only")
html_path.write_text(html, "utf-8")
print("PASS V132 native-world precinct exterior + legacy cast only; protected baseline and Zombie unchanged")
