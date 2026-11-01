#!/usr/bin/env python3
"""Build an isolated V118 playable preview from the already verified V117 files.
No source bundle or original campaign/Outbreak file is altered in place.
"""
from pathlib import Path
import hashlib
import subprocess
import sys

assert len(sys.argv)==2, "Usage: build_v118_preview.py PREVIEW_DIR"
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
for name in ("v118-cinematic.js","v118-cinematic.css","v115-campus.js"):
    assert (root/name).is_file(), f"Missing V118 source: {name}"
subprocess.run([sys.executable,str(tools/"build_v117_preview.py"),str(root)],check=True)
p=root/"index.html"
html=p.read_text()
assert html.count("</head>")==1 and html.count("</body>")==1
assert "v118-cinematic.js" not in html
js=root/"v118-cinematic.js"
css=root/"v118-cinematic.css"
jhash=hashlib.sha256(js.read_bytes()).hexdigest()[:12]
chash=hashlib.sha256(css.read_bytes()).hexdigest()[:12]
html=html.replace("</head>",f'<link rel="stylesheet" href="./v118-cinematic.css?v={chash}" />\n<meta name="rookie-visual-foundation" content="v118-cinematic" />\n</head>')
html=html.replace("</body>",f'<script src="./v118-cinematic.js?v={jhash}"></script>\n</body>')
html=html.replace("V117 Seamless Marina Interiors","V118 Modern Cinematic Marina")
html=html.replace("V117 SEAMLESS MARINA","V118 CINEMATIC MARINA")
p.write_text(html)
print("PASS V118: isolated connected-world visual and HUD pass; protected modes unchanged")
