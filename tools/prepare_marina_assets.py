"""Extract the user's marina sprites; preserve the existing material pipeline."""
from pathlib import Path
from collections import deque
import json
import shutil
from PIL import Image, ImageDraw

root = Path.cwd()
refs = root / 'docs/marina-integration/references'
out = root / 'published-game-capture/assets/marina-integration'
refs.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)
sources = {
    'southbay_marina_pixel_asset_atlas.png': Path('C:/Users/marre/AppData/Local/Temp/codex-clipboard-6f02db4d-ecbe-4bcd-869c-5175be54a1ef.png'),
    'marina_bait_tackle_tileset.png': Path('C:/Users/marre/AppData/Local/Temp/codex-clipboard-3423a5e7-fbcb-4706-b68d-9bbcc839b44e.png'),
}
for name, source in sources.items():
    if not (refs / name).exists():
        shutil.copy2(source, refs / name)

specs = {
    'shop': ('shop', (8, 8, 556, 374)),
    'rods': ('shop', (839, 714, 941, 865)),
    'lures': ('shop', (945, 736, 1031, 867)),
    'cooler': ('shop', (1047, 741, 1168, 859)),
    'net': ('shop', (348, 808, 484, 923)),
    'barrel': ('shop', (304, 938, 365, 1016)),
    'crates': ('shop', (24, 816, 101, 901)),
    'life-ring': ('shop', (745, 716, 829, 793)),
    'fish-sign': ('shop', (625, 718, 745, 788)),
    'flowers': ('shop', (606, 899, 715, 976)),
    'shop-lamp': ('shop', (915, 627, 958, 703)),
    'rope': ('shop', (563, 821, 631, 885)),
    'chalkboard': ('shop', (1154, 835, 1253, 990)),
    'dock-cleat': ('dock', (1028, 478, 1072, 520)),
    'dock-ring': ('dock', (31, 733, 94, 833)),
    'dock-rope': ('dock', (247, 739, 316, 832)),
    'rowboat': ('dock', (616, 924, 733, 1067)),
    'fishing-boat': ('dock', (756, 883, 902, 1070)),
    'sailboat': ('dock', (918, 842, 1079, 1069)),
    'planks': ('shop', (1018, 494, 1173, 572)),
    'gateway': ('concept', (866, 621, 974, 727)),
}
sheets = {'shop': Image.open(refs / 'marina_bait_tackle_tileset.png').convert('RGBA'),
          'dock': Image.open(refs / 'southbay_marina_pixel_asset_atlas.png').convert('RGBA'),
          'concept': Image.open(refs / 'Bayview Waterfront Pixel-Art Concept Board.png').convert('RGBA')}

def cut_background(im, concept=False):
    # Flood only sheet-coloured pixels reachable from the crop boundary.
    # This retains opaque dark outlines and interior shadows.
    pixels = im.load()
    w, h = im.size
    queue = deque([(x, y) for x in range(w) for y in [0, h-1]] +
                  [(x, y) for y in range(h) for x in [0, w-1]])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        seen.add((x, y))
        red, green, blue, alpha = pixels[x, y]
        # Sheet background is muted navy; the artwork is saturated blue,
        # gold, wood, or has sufficiently different luminance.
        background = (red < 35 and green < 65 and blue < 95) if concept else (17 <= red <= 58 and 20 <= green <= 61 and 28 <= blue <= 78 and max(red, green, blue)-min(red, green, blue) < 27)
        if alpha == 0 or background:
            pixels[x, y] = (0, 0, 0, 0)
            queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    return im.crop(im.getbbox())

def largest_sprite(im):
    pixels = im.load()
    remaining = {(x, y) for y in range(im.height) for x in range(im.width) if pixels[x,y][3]}
    groups = []
    while remaining:
        seed = remaining.pop()
        group, queue = {seed}, [seed]
        for x, y in queue:
            for point in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if point in remaining:
                    remaining.remove(point)
                    group.add(point)
                    queue.append(point)
        groups.append(group)
    keep = max(groups, key=len)
    for group in groups:
        if group is not keep:
            for x, y in group:
                pixels[x,y] = (0,0,0,0)
    return im.crop(im.getbbox())

manifest = {}
preview = Image.new('RGB', (1000, ((len(specs)+4)//5)*210), '#7b927e')
draw = ImageDraw.Draw(preview)
for index, (name, (sheet, box)) in enumerate(specs.items()):
    sprite = sheets[sheet].crop(box)
    if name != 'planks':
        sprite = cut_background(sprite, concept=sheet == 'concept')
    if name in ['fishing-boat', 'sailboat', 'rowboat', 'chalkboard', 'gateway']:
        sprite = largest_sprite(sprite)
    sprite.save(out / (name + '.png'))
    manifest[name] = {'sheet': sheet, 'crop': box, 'size': sprite.size}
    thumb = sprite.copy()
    thumb.thumbnail((180, 135), Image.Resampling.NEAREST)
    x, y = index % 5 * 200, index // 5 * 210
    preview.paste(thumb, (x+10, y+25), thumb)
    draw.text((x+10, y+170), name, fill='white')
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
preview.save(out / 'extraction-review.png')
print('Extracted', len(manifest), 'user-supplied marina components')
