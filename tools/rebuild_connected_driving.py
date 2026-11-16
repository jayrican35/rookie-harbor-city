"""Rebind only the existing connected cruiser in the committed main bundle.

No world rebake or ignored preview cache. The original engine and all other
compiled systems must remain text-identical outside this one adapter.
"""
from pathlib import Path
import hashlib
import re
import subprocess
from connected_driving import controller_factory

root = Path(__file__).resolve().parents[1]
game = root / 'published-game-capture'
old = (game / 'precinct-cruiser.compiled.js').read_text('utf-8')
bundle = (game / 'game-v115.bundle.js').read_text('utf-8')
assert bundle.count(old) == 1, 'Expected exactly one already bound cruiser'
source = (game / 'precinct-cruiser.js').read_text('utf-8')
assert source.count('/* CANONICAL_CONTROLLER */null') == 1
engine = (game / 'game.js').read_text('utf-8')
assert hashlib.sha256(engine.encode()).hexdigest() == 'fed646e5a213439b9ec269a80a2b7bb928d16d378b6a99714f10483d8e830d3f'
new = source.replace('/* CANONICAL_CONTROLLER */null', controller_factory(engine))
updated = bundle.replace(old, new, 1)
assert updated.replace(new, old, 1) == bundle, 'Unrelated compiled content changed'
(game / 'game-v115.bundle.js').write_text(updated, encoding='utf-8')
(game / 'precinct-cruiser.compiled.js').write_text(new, encoding='utf-8')
subprocess.run(['node', '--check', str(game / 'game-v115.bundle.js')], check=True)
html = (game / 'index.html').read_text('utf-8')
for filename in ['game-v115.bundle.js', 'wild-arcade-collisions.js', 'v135-precinct-wallkit-test.js',
                 'cruiser-visuals.js', 'connected-audio.js']:
    digest = hashlib.sha256((game / filename).read_bytes()).hexdigest()[:12]
    html, count = re.subn(re.escape(filename) + r'\?v=[\da-f]+', filename + '?v=' + digest, html)
    assert count == 1
(game / 'index.html').write_text(html, encoding='utf-8')
print('Rebound only existing connected cruiser; all other compiled systems unchanged.')
