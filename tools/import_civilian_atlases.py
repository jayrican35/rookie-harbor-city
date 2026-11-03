"""Import the user's exact PNGs; validate grids without repainting frames."""
from pathlib import Path
from PIL import Image
from io import BytesIO
import hashlib
import json
import zipfile

r = Path.cwd()
source = Path('C:/Users/marre/Downloads/HarborCity_All_30_Civilian_Walking_Atlases.zip')
out = r / 'published-game-capture/assets/civilian-approved'
docs = r / 'docs/civilian-preview'
out.mkdir(parents=True, exist_ok=True)
(docs / 'source-pack').mkdir(parents=True, exist_ok=True)
report = []
with zipfile.ZipFile(source) as z:
    manifest = json.loads(z.read('manifest.json'))
    roles = manifest.get('characters', manifest.get('roles'))
    assert len(roles) == 30
    assert manifest['frame_size'] == [128, 160]
    assert manifest['anchor'] == [64, 153]
    assert manifest['directions'] == ['down', 'left', 'right', 'up']
    (out / 'manifest.json').write_bytes(z.read('manifest.json'))
    for name in ['README_FIRST.md', 'docs/CODEX_IMPLEMENTATION.md', 'docs/QA_JSON.json']:
        (docs / 'source-pack' / Path(name).name).write_bytes(z.read(name))
    for role, spec in roles.items():
        data = z.read(spec['walk_atlas'])
        im = Image.open(BytesIO(data))
        assert im.mode == 'RGBA' and im.size == (512, 640), role
        assert im.getchannel('A').getextrema() == (0, 255), role
        frame_hashes = []
        bounds = []
        for row in range(4):
            row_hashes = []
            for col in range(4):
                frame = im.crop((128*col, 160*row, 128*(col+1), 160*(row+1)))
                box = frame.getbbox()
                assert box and box[0] > 0 and box[2] < 128 and box[3] <= 160, (role, row, col, box)
                bounds.append(box)
                row_hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
            assert len(set(row_hashes)) > 1, (role, 'frozen cycle', row)
            frame_hashes.append(row_hashes)
        for path in [spec['walk_atlas'], spec['idle_image']]:
            target = out / path
            assert target.resolve().is_relative_to(out.resolve())
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(z.read(path))
        report.append({'role': role, 'sha256': hashlib.sha256(data).hexdigest(), 'bounds': bounds, 'frame_hashes': frame_hashes})
    (docs / 'source-pack/ALL_30_CIVILIAN_ROSTER.png').write_bytes(z.read('previews/ALL_30_CIVILIAN_ROSTER.png'))
(docs / 'asset-validation.json').write_text(json.dumps({'source_zip_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'roles': report, 'import': 'Exact supplied bytes; no image generation or repainting'}, indent=2))
print('Validated and imported 30 exact RGBA atlases / 480 frames plus original role idles.')
