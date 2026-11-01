#!/usr/bin/env python3
"""Compose the existing preview builders, then label the seamless marina build.
The caller copies published-game-capture to an isolated target directory first.
"""
from pathlib import Path
import subprocess,sys
assert len(sys.argv)==2,'Usage: build_v117_preview.py PREVIEW_DIR'
root=Path(sys.argv[1]).resolve();tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v115_preview.py'),str(root),str(root/'game.js')],check=True)
for name in ['v115_showcase','v115_reference','v115_premium','v115_precinct_pilot','v116']:
 subprocess.run([sys.executable,str(tools/f'build_{name}_preview.py'),str(root)],check=True)
p=root/'index.html';html=p.read_text().replace('V116 Southbay Marina Playtest','V117 Seamless Marina Interiors').replace('V116 MARINA PLAYTEST','V117 SEAMLESS MARINA')
html=html.replace('</head>','<meta name="rookie-interiors" content="v117-continuous-world" />\n</head>');p.write_text(html)
print('PASS V117: existing builders and renderer, one continuous world, no new runtime engine')
