"""Package local, reproducible cruiser review evidence without publishing."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs/cruiser-turning'
SITE = ROOT / 'site/evidence/cruiser-turning'
IMAGES = [
    'game-angle-1.png', 'game-angle-3.png', 'game-angle-10.png',
    'game-angle-14.png', 'reverse-parking.png', 'downtown-corner.png',
    'marina-road.png', 'handbrake-cosmetics.png', 'game-mobile.png',
    'viewer-desktop.png', 'red-attachments.png', 'blue-attachments.png',
]
DOCS.mkdir(parents=True, exist_ok=True)
SITE.mkdir(parents=True, exist_ok=True)
for name in IMAGES + ['gameplay.json', 'isolation.json']:
    shutil.copy2(ROOT / 'cruiser-turning-evidence' / name, DOCS / name)
shutil.copy2(ROOT / 'cruiser-evidence/safety.json', DOCS / 'save-mobile.json')
for source in DOCS.iterdir():
    if source.is_file():
        shutil.copy2(source, SITE / source.name)
viewer = (ROOT / 'tools/cruiser_turning_viewer.html').read_text(encoding='utf-8')
gallery = '<h2>Actual game and attachment checks</h2><p>Local browser captures from the completed gameplay tests.</p>'
for name in IMAGES:
    gallery += f'<figure><img loading="lazy" src="{name}" alt="{name[:-4].replace("-", " ")}"><figcaption>{name}</figcaption></figure>'
(SITE / 'index.html').write_bytes(viewer.replace('</main>', gallery + '</main>').encode('utf-8'))
print(f'Packaged {len(IMAGES)} captures and reports at {SITE}')
