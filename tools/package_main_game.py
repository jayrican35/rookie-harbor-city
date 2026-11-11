"""Promote/verify the existing main runtime; no gameplay transformations.

The committed published-game-capture folder is the distributable. --output
reproduces it in an empty directory without site/, a preview cache or a build.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'published-game-capture'
MANIFEST = GAME / 'PLAYABLE-PACKAGE.json'
ENGINE_HASH = 'fed646e5a213439b9ec269a80a2b7bb928d16d378b6a99714f10483d8e830d3f'

def digest(p):
    data = p.read_bytes()
    # Git's core.autocrlf changes text bytes between Windows and Linux. Hash
    # text in Git's LF form so a clean checkout verifies on either platform.
    if p.suffix.lower() in {'.js', '.css', '.html', '.json', '.txt', '.svg', '.md'}:
        data = data.replace(b'\r\n', b'\n')
    return hashlib.sha256(data).hexdigest()

def inventory():
    return {p.relative_to(GAME).as_posix(): digest(p)
            for p in sorted(GAME.rglob('*')) if p.is_file() and p != MANIFEST}

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--import-build', type=Path, help='Promote an already verified assembled main build')
parser.add_argument('--output', type=Path, help='Copy the verified committed package to an empty destination')
args = parser.parse_args()
assert digest(GAME / 'game.js') == ENGINE_HASH, 'Protected original engine differs'

if args.import_build:
    source = args.import_build.resolve()
    assert source != GAME and (source / 'game-v115.bundle.js').is_file()
    html = (source / 'index.html').read_text('utf-8')
    assert 'ROOKIE_MAIN_CITY_ACTIVE=true' in html and '<base ' not in html
    assert digest(source / 'game.js') == ENGINE_HASH
    assert (source / 'outbreak.css').read_bytes() == (GAME / 'outbreak.css').read_bytes()
    # Existing source modules must match the verified build. The standalone
    # campus authoring file retains compiler placeholders; its bound copy is
    # already inside game-v115.bundle.js and is not separately booted.
    changes = []
    for p in sorted(source.rglob('*')):
        if not p.is_file():
            continue
        relative = p.relative_to(source)
        target = GAME / relative
        if target.exists():
            if relative.as_posix() == 'v115-campus.js':
                continue
            if p.read_bytes() == target.read_bytes():
                continue
            assert relative.as_posix() == 'index.html', 'Unexpected runtime difference: ' + str(relative)
        assert relative.as_posix() not in ('game.js', 'outbreak.css')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, target)
        changes.append(relative.as_posix())
    subprocess.run(['node', '--check', str(GAME / 'game-v115.bundle.js')], check=True)
    MANIFEST.write_text(json.dumps({'schema': 1, 'entry': 'index.html',
        'world': 'harbor-main', 'hashConvention': 'SHA256; text CRLF normalized to LF', 'engineSHA256': ENGINE_HASH,
        'files': inventory()}, indent=2) + '\n', encoding='utf-8')
    print('Promoted existing runtime files: ' + ', '.join(changes))

manifest = json.loads(MANIFEST.read_text('utf-8'))
assert manifest['files'] == inventory(), 'Package inventory differs; review and explicitly reimport the assembled build'
assert manifest['engineSHA256'] == ENGINE_HASH
html = (GAME / 'index.html').read_text('utf-8')
assert 'ROOKIE_MAIN_CITY_ACTIVE=true' in html and 'game-v115.bundle.js' in html
assert '<base ' not in html and '<iframe' not in html
subprocess.run(['node', '--check', str(GAME / 'game-v115.bundle.js')], check=True)
if args.output:
    destination = args.output.resolve()
    assert destination != GAME and (not destination.exists() or not any(destination.iterdir())), 'Output must be empty'
    destination.mkdir(parents=True, exist_ok=True)
    for name in [*manifest['files'], 'PLAYABLE-PACKAGE.json']:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(GAME / name, target)
    print('Reproduced complete package at ' + str(destination))
print('PASS standalone main package: ' + str(len(manifest['files'])) + ' files verified')
