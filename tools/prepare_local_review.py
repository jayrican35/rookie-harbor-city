"""Build the existing V140 review and reconstruct its pinned before comparison.

Run from any directory with Python 3. Only writes beneath this checkout's site/.
"""
from pathlib import Path
import os
import shutil
import subprocess
import sys

repo = Path(__file__).resolve().parent.parent
source = repo / 'published-game-capture'
after = repo / 'site/preview/precinct9-v140-approved-layout'
before = repo / 'site/preview/precinct9-audit-before'
baseline = 'e762267'
os.environ['PYTHONUTF8'] = '1'

shutil.copytree(source, after, dirs_exist_ok=True)
subprocess.run([sys.executable, str(repo / 'tools/build_v140_precinct_approved_layout_preview.py'), str(after)], check=True)
shutil.copytree(after, before, dirs_exist_ok=True)
for name in ('v115-campus.js', 'v133-precinct-campus.js', 'v134-precinct-reference.js'):
    original = subprocess.check_output(['git', 'show', f'{baseline}:published-game-capture/{name}'], cwd=repo).decode('utf-8')
    if name == 'v115-campus.js':
        bundle = before / 'game-v115.bundle.js'
        combined = bundle.read_text(encoding='utf-8')
        current = (source / name).read_text(encoding='utf-8')
        assert combined.count(current) == 1, 'Expected one existing scope bridge'
        bundle.write_text(combined.replace(current, original), encoding='utf-8')
    (before / name).write_text(original, encoding='utf-8')

assert (source / 'game.js').read_bytes() == (after / 'game.js').read_bytes()
assert (before / 'game.js').read_bytes() == (after / 'game.js').read_bytes()
shutil.copyfile(repo / 'tools/review_index.html', repo / 'site/index.html')
print('Review built. Serve site/ locally or run node qa/audit-baseline.cjs --review.')
