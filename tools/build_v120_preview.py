#!/usr/bin/env python3
"""Build V120 in an isolated published website directory; source files untouched."""
from pathlib import Path
import hashlib,subprocess,sys
assert len(sys.argv)==2, "Usage: build_v120_preview.py SITE_DIR"
root=Path(sys.argv[1]).resolve()
tools=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(tools/'build_v119_preview.py'),str(root)],check=True)
subprocess.run([sys.executable,str(tools/'generate_v120_marina_art.py'),str(root/'assets'/'v120-marina')],check=True)
for name in ['water-body.png','water-caustics.png','dock-wood.png','foam-frames.png','dock-post.png']:
    assert (root/'assets'/'v120-marina'/name).stat().st_size>100,name
js=root/'v120-marina-art.js';assert js.is_file()
stamp=hashlib.sha256(js.read_bytes()).hexdigest()[:12]
p=root/'index.html';html=p.read_text()
assert html.count('</body>')==1 and 'v120-marina-art.js' not in html
html=html.replace('</body>',f'<script src="./v120-marina-art.js?v={stamp}"></script>\n<meta name="rookie-marina-art" content="v120-materials" />\n</body>')
html=html.replace('V119 Living Waterfront + Motion','V120 Premium Marina Reconstruction')
html=html.replace('V119 LIVING WATERFRONT','V120 PREMIUM MARINA')
p.write_text(html)
print('PASS V120: repeatable premium-material atlas generated, existing world renderer retained; separate sandbox')
