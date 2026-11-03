"""Apply the civilian adapter to a copy of the current connected-world build."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import argparse

r = Path.cwd()
parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');args=parser.parse_args()
asset_dir=r/'published-game-capture/assets/civilian-corrected'
art_ready = json.loads((asset_dir/'review-status.json').read_text())['approvedForPlayback']
pack=json.loads((asset_dir/'manifest.json').read_text())
base = r / 'site/preview/marina-updated'
before = r / 'site/preview/civilian-before'
after = r / ('site/preview/civilian-candidate' if args.candidate else 'site/preview/civilian-updated')
for target in [before, after]:
    if not target.exists():
        shutil.copytree(base, target)
for target in [before, after]:
    # Query-gated telemetry is present in both for fair behavior comparisons.
    name = 'v115-campus.js'
    old = (target / name).read_text(encoding='utf-8')
    new = (r / 'published-game-capture' / name).read_text(encoding='utf-8')
    bundle = (target / 'game-v115.bundle.js').read_text(encoding='utf-8')
    assert bundle.count(old) == 1
    (target / name).write_text(new, encoding='utf-8')
    (target / 'game-v115.bundle.js').write_text(bundle.replace(old, new), encoding='utf-8')
    html = (target / 'index.html').read_text(encoding='utf-8')
    digest = hashlib.sha256((target / 'game-v115.bundle.js').read_bytes()).hexdigest()[:12]
    html = re.sub(r'game-v115\.bundle\.js\?v=[\da-f]+', 'game-v115.bundle.js?v='+digest, html)
    if target == after:
        shutil.copy2(r / 'published-game-capture/civilian-connected.js', target / 'civilian-connected.js')
        shutil.copytree(asset_dir, target / 'assets/civilian-corrected', dirs_exist_ok=True)
        html = re.sub(r'<script data-civilian-preview>.*?</script>\s*<script src="\./civilian-connected\.js[^\"]*"></script>', '', html)
        digest = hashlib.sha256((target / 'civilian-connected.js').read_bytes()).hexdigest()[:12]
        payload=json.dumps(pack,separators=(',',':')).replace('<','\\u003c')
        html = html.replace('</body>', '<script data-civilian-preview>window.ROOKIE_CIVILIAN_PACK='+payload+';window.ROOKIE_CONNECTED_CIVILIANS_ACTIVE='+str(art_ready or args.candidate).lower()+';</script><script src="./civilian-connected.js?v='+digest+'"></script></body>')
    (target / 'index.html').write_text(html, encoding='utf-8')
if not args.candidate:shutil.copy2(r / 'tools/civilian_preview_review.html', r / 'site/index.html')
if not art_ready and not args.candidate:
    target=r/'site/evidence/civilian-preview'
    target.mkdir(parents=True,exist_ok=True)
    shutil.copy2(r/'tools/civilian_art_hold.html',target/'index.html')
print('Updated local connected civilian preview; original campaign assets unchanged.')
