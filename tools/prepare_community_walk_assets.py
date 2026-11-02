"""Extract owner-supplied sprites; discard faint cutout noise, keep source art."""
from pathlib import Path
from PIL import Image
import json

repo = Path(__file__).resolve().parent.parent
source = Image.open(repo / 'docs/references/community-walk-asset-sheet.png').convert('RGBA')
out = repo / 'published-game-capture/assets/community-walk'
out.mkdir(parents=True, exist_ok=True)
# Reviewed source rectangles, exclusive right/bottom. No generated artwork.
crops = {
    'curb_straight': (941, 34, 1045, 74),
    'curb_corner': (1060, 34, 1116, 90),
    'curb_corner_bottom': (1060, 132, 1116, 188),
    'curb_vertical': (1094, 74, 1110, 90),
    'grass': (40, 344, 104, 408),
    'tree': (477, 805, 655, 1047),
    'tree_round': (650, 802, 794, 1048),
    'tree_flowering': (794, 812, 930, 1048),
    'hedge': (940, 325, 1130, 390),
    'hedge_corner': (1237, 325, 1361, 463),
    'shrub': (1366, 324, 1434, 389),
    'flower_patch': (576, 606, 700, 674),
    'planter_small': (408, 470, 534, 566),
    'planter_corner': (548, 470, 680, 610),
    'pot_square': (802, 570, 892, 674),
    'bollard': (894, 582, 936, 674),
    'lamp_short': (1072, 548, 1128, 694),
    'bench_small': (994, 711, 1144, 788),
    'shrub_flowering': (918, 908, 1018, 986),
    'bench': (816, 684, 972, 790),
    'lamp': (1158, 500, 1218, 734),
    'planter': (16, 464, 392, 568),
    'pot': (710, 574, 802, 672),
    'monument': (16, 724, 476, 944),
    'sign': (500, 720, 776, 794),
}
atlas = Image.new('RGBA', (512, 512))
frames = {}
x = y = row_height = 0
for name, box in crops.items():
    sprite = source.crop(box)
    # The upload has colored near-transparent matte pixels around its art.
    # Remove those pixels rather than painting their colors onto the ground.
    cleaned = []
    for r, g, b, a in sprite.getdata():
        matte = max(r, g, b) > 245 and min(r, g, b) < 10
        cleaned.append((r, g, b, 0 if a < 224 or matte else min(255, round(a * 255 / 252))))
    sprite.putdata(cleaned)
    # Discard detached matte flecks without changing the connected artwork.
    pixels = sprite.load()
    visited = set(); largest = []
    for yy in range(sprite.height):
        for xx in range(sprite.width):
            if (xx, yy) in visited or not pixels[xx, yy][3]:
                continue
            todo = [(xx, yy)]; visited.add((xx, yy)); component = []
            while todo:
                point = todo.pop(); component.append(point)
                for nx, ny in [(point[0]-1,point[1]),(point[0]+1,point[1]),(point[0],point[1]-1),(point[0],point[1]+1)]:
                    if 0 <= nx < sprite.width and 0 <= ny < sprite.height and (nx,ny) not in visited and pixels[nx,ny][3]:
                        visited.add((nx,ny)); todo.append((nx,ny))
            if len(component) > len(largest): largest = component
    keep = set(largest)
    for yy in range(sprite.height):
        for xx in range(sprite.width):
            if (xx,yy) not in keep: pixels[xx,yy] = (0,0,0,0)
    sprite = sprite.resize((sprite.width // 2, sprite.height // 2), Image.Resampling.NEAREST)
    if name == 'curb_straight':
        sprite = sprite.crop(sprite.getbbox())
    sprite.save(out / (name + '.png'))
    if x + sprite.width + 2 > atlas.width:
        x = 0; y += row_height + 4; row_height = 0
    assert y + sprite.height <= atlas.height
    atlas.paste(sprite, (x, y))
    frames[name] = {'x': x, 'y': y, 'w': sprite.width, 'h': sprite.height,
                    'sourceRect': list(box)}
    x += sprite.width + 4
    row_height = max(row_height, sprite.height)
atlas.save(out / 'community-walk-atlas.png')
(out / 'manifest.json').write_text(json.dumps({'version': 'owner-community-walk-1',
    'atlas': 'community-walk-atlas.png', 'sourceScale': 0.5,
    'alphaNoiseCutoff': 224, 'frames': frames}, indent=2), encoding='utf-8')
print('Extracted', len(frames), 'owner sprites into the existing atlas pipeline')
