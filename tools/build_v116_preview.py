#!/usr/bin/env python3
"""Inject isolated V116 Southbay renderer; all previous features and source remain unchanged."""
from pathlib import Path
import sys, re, hashlib
assert len(sys.argv)==2,'Usage: build_v116_preview.py SITE_PREVIEW_DIR'
root=Path(sys.argv[1]);p=root/'index.html';html=p.read_text()
for name in ['v117-jay.js','v117-jay-bridge.js','v117-jay.css','v116-marina.js','v116-marina-hud.js','v116-marina-walk.js','v116-marina.css','v115-campus.js','game-v115.bundle.js','v115-precinct-pilot.js']:
 assert (root/name).is_file(),f'Missing {name}'
assert 'rookie:v116-marina-sandbox:' in (root/'v115-preview-save-isolation.js').read_text()
needle='<script src="./v115-precinct-pilot.js"></script>'
assert html.count(needle)==1
assert 'src="./v116-marina.js"' not in html
# Extend the compiled scope only; protected original game.js remains byte-identical.
bundle=root/'game-v115.bundle.js';compiled=bundle.read_text()
assert 'jay-shared-v117' not in compiled
end=list(re.finditer(r'\}\)\(\);',compiled))[-1].start()
compiled=compiled[:end]+(root/'v117-jay-bridge.js').read_text()+'\n'+compiled[end:]
# One active world: suspend hidden campaign simulation/render and reset its clock.
needle_loop='  if(document.hidden){lastT=0;simDt=0;return;}'
assert compiled.count(needle_loop)==1
compiled=compiled.replace(needle_loop,needle_loop+'\n  if(window.HARBOR?.seamlessCampusV115?.isOpen() && !window.ROOKIE_JAY?.excluded()){lastT=0;simDt=0;return;}')
bundle.write_text(compiled)
assert html.count('<script src="./game-v115.bundle.js"></script>')==1
html=html.replace('<script src="./game-v115.bundle.js"></script>','<script src="./v117-jay.js"></script>\n<script src="./game-v115.bundle.js"></script>')
html=html.replace('</head>','<link rel="stylesheet" href="./v117-jay.css" />\n</head>')
html=html.replace('</head>','<link rel="stylesheet" href="./v116-marina.css" />\n<meta name="rookie-build" content="v116-southbay-marina" />\n</head>')
html=html.replace(needle,needle+'\n<script src="./v116-marina.js"></script>\n<script src="./v116-marina-hud.js"></script>\n<script src="./v116-marina-walk.js"></script>')
html=html.replace('V115 PRECINCT ART PILOT','V116 MARINA PLAYTEST')
# Content fingerprints prevent a phone from keeping the old single-pose renderer.
def versioned(m):
 name=m.group(2)[2:];asset=root/name
 if not asset.is_file():return m.group(0)
 return m.group(1)+m.group(2)+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:12]+m.group(3)
html=re.sub(r'((?:src|href)=["\'])(\./[^"\']+\.(?:js|css))(["\'])',versioned,html)
p.write_text(html)
print('V116_MARINA_BUILD_OK — connected gameplay city, independent saves, engine unchanged')