"""Update the existing continuous-world build, preserving a before snapshot."""
from pathlib import Path
import hashlib
import re
import shutil

r = Path.cwd()
base = r / 'site/preview/roads-updated'
before = r / 'site/preview/marina-before'
after = r / 'site/preview/marina-updated'
for target in [before, after]:
    if not target.exists():
        shutil.copytree(base, target)
bundle = (after / 'game-v115.bundle.js').read_text(encoding='utf-8')
name = 'v115-campus.js'
old = (after / name).read_text(encoding='utf-8')
new = (r / 'published-game-capture' / name).read_text(encoding='utf-8')
assert bundle.count(old) == 1
(after / 'game-v115.bundle.js').write_text(bundle.replace(old, new), encoding='utf-8')
(after / name).write_text(new, encoding='utf-8')
for name in ['v116-marina.js', 'v116-marina-hud.js', 'v120-marina-art.js', 'v127-citywide-art.js']:
    shutil.copy2(r / 'published-game-capture' / name, after / name)
shutil.copytree(r / 'published-game-capture/assets/marina-integration', after / 'assets/marina-integration', dirs_exist_ok=True)
html = (after / 'index.html').read_text(encoding='utf-8')
for name in ['game-v115.bundle.js', 'v116-marina.js', 'v116-marina-hud.js', 'v120-marina-art.js', 'v127-citywide-art.js']:
    digest = hashlib.sha256((after / name).read_bytes()).hexdigest()[:12]
    html = re.sub(re.escape(name) + r'\?v=[\da-f]+', name + '?v=' + digest, html)
(after / 'index.html').write_text(html, encoding='utf-8')
roads_review = r / 'site/roads-review'
roads_review.mkdir(exist_ok=True)
shutil.copy2(r / 'tools/road_repair_review.html', roads_review / 'index.html')
shutil.copy2(r / 'tools/marina_integration_review.html', r / 'site/index.html')
print('Continuous Marina build updated; before preserved.')
