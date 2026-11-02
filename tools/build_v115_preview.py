#!/usr/bin/env python3
"""Build the isolated V115 preview with access to the legacy engine's private scope.

The original game.js, outbreak.css, Zombie Outbreak assets, root site, and
V113/V114 preview remain byte-for-byte untouched. This ONLY creates
preview/v115/game-v115.bundle.js and modifies preview/v115/index.html.

Why: game.js encloses MAPS/state/player/openMap in one top-level IIFE; V115
features originally loaded as separate scripts, where those variables were
not visible, causing the entire extension to silently return.
"""
from __future__ import annotations
import hashlib
from pathlib import Path
import re
import sys

if len(sys.argv) != 3:
    raise SystemExit('Usage: python3 tools/build_v115_preview.py SITE_PREVIEW_DIR ORIGINAL_GAME_JS')
preview = Path(sys.argv[1]).resolve()
baseline = Path(sys.argv[2]).resolve()
engine_file = preview / 'game.js'
entry_file = preview / 'index.html'
world_file = preview / 'v115-world.js'
campus_file = preview / 'v115-campus.js'
for file in (engine_file, baseline, entry_file, world_file, campus_file,
             preview / 'outbreak.css', preview / 'v115-preview-save-isolation.js'):
    if not file.is_file():
        raise SystemExit(f'Missing required file: {file}')
engine_bytes = engine_file.read_bytes()
if engine_bytes != baseline.read_bytes():
    raise SystemExit('The V115 base game.js has changed. Refusing to build.')
source = engine_bytes.decode('utf-8')
if not source.lstrip().startswith('(function(){'):
    raise SystemExit('Unexpected engine entrypoint; refusing to patch private scope')
last = re.search(r'\}\)\(\);\s*\Z', source)
if not last:
    raise SystemExit('Original engine does not end with the expected IIFE closure')
for path in (world_file, campus_file):
    text = path.read_text(encoding='utf-8')
    if not text.strip().endswith('})();') or len(text) < 3000:
        raise SystemExit(f'Malformed V115 extension: {path}')
world = world_file.read_text('utf-8')
campus = campus_file.read_text('utf-8')
if 'H.worldV115' not in world or 'H.seamlessCampusV115' not in campus:
    raise SystemExit('V115 extension markers missing')

# Insert each extension as its own inner IIFE just BEFORE the original
# game engine's final closure, sharing the legacy MAPS/state/player scope.
# Everything in game.js before that closure is copied byte-for-byte.
combined = (source[:last.start()] + '\n/* V115 preview-only world bridge: private engine scope */\n' +
            world + '\n' + campus + '\n' + source[last.start():])
compiled = preview / 'game-v115.bundle.js'
compiled.write_text(combined, encoding='utf-8')

html = entry_file.read_text('utf-8')
original = '<script src="./game.js"></script>\n<script src="./v115-world.js"></script>\n<script src="./v115-campus.js"></script>'
if html.count(original) != 1:
    raise SystemExit('Unexpected preview script order: refusing unsafe replacement')
if 'v115-preview-save-isolation.js' in html:
    raise SystemExit('Preview save isolation already injected')
html = html.replace(original,
    '<script src="./v115-preview-save-isolation.js"></script>\n'
    '<script src="./game-v115.bundle.js"></script>')
# A noninteractive build stamp makes accidental navigation to the old game
# unmistakable on Android without modifying main game UI or interactions.
if html.count('</body>') != 1 or html.count('</head>') != 1:
    raise SystemExit('Unexpected HTML layout')
html = html.replace('</head>',
    '<meta name="rookie-build" content="v115-phase2-scope-fixed" />\n'
    '<style>#v115PreviewStamp{position:fixed;top:4px;right:4px;z-index:2147483647;'
    'font:700 10px system-ui,sans-serif;color:#17243b;background:#ffe1a0;'
    'padding:3px 6px;border-radius:5px;box-shadow:0 1px 4px #14243844;'
    'pointer-events:none;opacity:.86}</style>\n</head>')
html = html.replace('</body>',
    '<span id="v115PreviewStamp" aria-label="V115 development preview">V115 DEV BUILD</span>\n</body>')
entry_file.write_text(html, encoding='utf-8')

assert engine_bytes == engine_file.read_bytes(), 'The legacy engine was modified'
assert html.index('v115-preview-save-isolation.js') < html.index('game-v115.bundle.js')
assert 'src="./game.js"' not in html
assert 'src="./v115-world.js"' not in html
assert 'src="./v115-campus.js"' not in html
print('V115_SCOPE_FIX_OK')
print('Original engine SHA256:', hashlib.sha256(engine_bytes).hexdigest())
print('Compiled V115 SHA256:', hashlib.sha256(compiled.read_bytes()).hexdigest())
print('Compiled bytes:',compiled.stat().st_size)
