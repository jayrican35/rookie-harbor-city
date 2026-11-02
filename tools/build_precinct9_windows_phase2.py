#!/usr/bin/env python3
"""Precinct 9 Phase 2 windows: append cleaned RGBA assets to existing Phase 1 atlas.

Use original Phase 1 PNGs verbatim; add only window modules and panel composites.
Same 32-pixel grid, same 1:1 Canvas drawing and same atlas manifest schema.
No new asset pipeline, world collision, game rendering system or lighting engine.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, sys, hashlib
if len(sys.argv)!=3:
    raise SystemExit('Usage: build_precinct9_windows_phase2.py PHASE1_DIR PHASE2_DIR')
src,dst=map(Path,sys.argv[1:]);dst.mkdir(parents=True,exist_ok=True)
old=json.loads((src/'manifest.json').read_text())
assert old['tileSize']==32 and old['worldPixelsPerAssetPixel']==1 and len(old['frames'])==26
original=Image.open(src/old['atlas']).convert('RGBA')
assert original.size==(1024,1024)
blue=(24,53,89,255);navy=(9,31,53,255);stone=(210,195,164,255)
cream=(246,230,194,255);darkstone=(101,109,114,255)
glass=(27,69,101,255);darkglass=(11,37,67,255);gold=(245,181,80,255)
amber=(255,220,136,255)
def rect(d,box,fill):
    x,y,x2,y2=box
    if x2>x and y2>y:d.rectangle((x,y,x2-1,y2-1),fill=fill)
def raw_window(lit='warm',blinds=False):
    im=Image.new('RGBA',(64,96));d=ImageDraw.Draw(im)
    # Irregular cream-stone architrave and recessed blue-brick jambs.
    rect(d,(1,2,63,93),(52,66,83,255))
    rect(d,(3,0,61,9),cream);rect(d,(5,8,59,14),stone)
    rect(d,(1,14,8,87),darkstone);rect(d,(4,17,10,84),stone)
    rect(d,(56,14,63,87),darkstone);rect(d,(54,17,60,84),stone)
    rect(d,(7,13,57,84),navy)
    rect(d,(11,17,53,80),glass if lit=='warm' else darkglass)
    if lit=='warm':
        # Warm interior with distant lighting, not an emissive bloom overlay.
        rect(d,(13,22,51,75),(163,109,56,255))
        rect(d,(15,26,49,75),(210,146,65,255))
        rect(d,(18,28,46,72),(249,196,94,255))
        rect(d,(19,21,45,26),amber)
        rect(d,(23,24,41,29),(255,239,178,255))
        rect(d,(19,29,46,35),(235,170,75,255))
    else:
        rect(d,(14,25,50,74),(26,67,91,255))
        rect(d,(15,26,28,71),(39,90,113,255))
        rect(d,(37,25,50,73),(13,43,73,255))
    if blinds or lit=='warm':
        for yy in range(36,75,7):
            rect(d,(13,yy,51,yy+2),(24,53,74,255) if lit=='warm' else (56,81,97,255))
            rect(d,(14,yy+2,50,yy+4),(240,185,96,255) if lit=='warm' else (87,112,130,255))
            rect(d,(15,yy+4,49,yy+5),(88,77,71,255) if lit=='warm' else navy)
    # Deep mullions and a subtle inward-lit upper pane.
    rect(d,(30,16,34,81),(18,44,65,255))
    rect(d,(10,48,54,52),(15,41,63,255))
    rect(d,(11,17,15,81),(102,132,150,255))
    rect(d,(49,17,53,81),(15,41,57,255))
    for i in range(0,26,4):
        rect(d,(15+i,17,17+i,19),(124,167,172,255))
    # Stone ledge with bottom-facing shadow, no background halos.
    rect(d,(0,83,64,89),stone)
    rect(d,(0,83,64,85),cream)
    rect(d,(3,89,61,93),(123,126,117,255))
    rect(d,(7,93,57,96),(36,53,69,255))
    return im
def make_strip(count,mode):
    im=Image.new('RGBA',(64*count,96))
    for i in range(count):
        variant=mode if mode!='mixed' else ('warm' if i%2==0 else 'dark')
        im.alpha_composite(raw_window(variant,mode=='blinds'),(64*i,0))
    return im
def overlay(w,h,kind):
    im=Image.new('RGBA',(w,h));d=ImageDraw.Draw(im)
    if kind=='blinds':
        for y in range(23,74,7):
            rect(d,(14,y,w-13,y+3),(28,57,79,235))
            rect(d,(15,y+3,w-14,y+5),(218,188,136,172))
    elif kind=='closed_shutter':
        rect(d,(9,16,w-9,83),(20,52,78,255))
        for y in range(20,81,7):
            rect(d,(10,y,w-10,y+4),(41,79,104,255))
            rect(d,(12,y+1,w-12,y+2),(99,129,139,255))
        rect(d,(8,14,12,85),stone);rect(d,(w-12,14,w-8,85),stone)
    elif kind=='frame':
        rect(d,(0,0,w,7),cream)
        rect(d,(0,7,7,h-10),stone);rect(d,(w-7,7,w,h-10),stone)
        rect(d,(0,h-11,w,h-5),stone);rect(d,(0,h-5,w,h-2),darkstone)
    elif kind=='lintel':
        rect(d,(0,3,w,10),cream);rect(d,(0,10,w,17),stone)
        for x in range(0,w,32):
            rect(d,(x,18,x+4,25),darkstone)
    elif kind=='sill':
        rect(d,(0,0,w,5),cream);rect(d,(0,5,w,13),stone)
        rect(d,(4,13,w-4,20),darkstone)
    elif kind=='connector':
        rect(d,(0,0,w,h),stone)
        for yy in range(16,h,32):
            rect(d,(0,yy,w,yy+2),darkstone)
        rect(d,(5,3,w-5,h-3),(226,207,174,255))
    return im
def wide_window(lit):
    # 96x96 native world pixels: larger V134 civic lobby/garage bay,
    # not an image-scaled small window. Maintains 1px/1world unit.
    w=96;im=Image.new('RGBA',(w,96));d=ImageDraw.Draw(im)
    rect(d,(1,2,95,93),(52,66,83,255))
    rect(d,(3,0,93,9),cream);rect(d,(5,8,91,14),stone)
    rect(d,(1,14,9,87),darkstone);rect(d,(4,17,11,84),stone)
    rect(d,(87,14,95,87),darkstone);rect(d,(85,17,92,84),stone)
    rect(d,(9,13,87,84),navy)
    rect(d,(13,17,83,80),glass if lit=='warm' else darkglass)
    if lit=='warm':
        rect(d,(16,23,80,75),(195,132,62,255))
        rect(d,(18,27,78,75),(235,170,80,255))
        rect(d,(22,29,74,72),(251,204,111,255))
        for x in (29,59):
            rect(d,(x-7,21,x+8,27),(255,238,165,255))
            rect(d,(x-3,18,x+4,22),(250,219,137,255))
    else:
        rect(d,(16,24,80,76),(26,64,91,255))
        rect(d,(18,26,40,73),(51,94,117,255))
        rect(d,(61,24,79,73),(15,40,67,255))
    for yy in range(37,76,7):
        rect(d,(14,yy,82,yy+2),(27,51,71,255))
        rect(d,(15,yy+2,81,yy+4),(239,180,87,255) if lit=='warm' else (82,111,130,255))
        rect(d,(17,yy+4,79,yy+5),(74,68,69,255) if lit=='warm' else navy)
    rect(d,(45,16,51,81),(17,40,60,255))
    rect(d,(12,49,84,53),(17,40,60,255))
    rect(d,(12,17,16,82),(112,147,159,255))
    rect(d,(80,17,84,82),(13,35,53,255))
    rect(d,(0,83,96,89),stone);rect(d,(0,83,96,85),cream)
    rect(d,(4,89,92,93),(113,117,111,255))
    rect(d,(8,93,88,96),(34,52,68,255))
    return im
windows={
  'window_wide_warm':wide_window('warm'),
  'window_wide_dark':wide_window('dark'),
  'window_single_warm':raw_window('warm'),
  'window_single_dark':raw_window('dark'),
  'window_single_blinds':raw_window('dark',True),
  'window_single_closed':overlay(64,96,'closed_shutter'),
  'window_double_warm':make_strip(2,'warm'),
  'window_double_dark':make_strip(2,'dark'),
  'window_double_mixed':make_strip(2,'mixed'),
  'window_triple_warm':make_strip(3,'warm'),
  'window_triple_mixed':make_strip(3,'mixed'),
  'window_stone_frame':overlay(64,96,'frame'),
  'window_blinds_overlay':overlay(64,96,'blinds'),
  'window_stone_lintel':overlay(64,32,'lintel'),
  'window_stone_sill':overlay(64,32,'sill'),
  'window_connector':overlay(32,96,'connector'),
}
# Put the windows in the unused lower rows of the EXISTING same-size atlas.
atlas=original.copy()
frames=json.loads(json.dumps(old['frames']))
x,y,rowH=8,448,0
for name,im in windows.items():
    if x+im.width+8>1024:x=8;y+=rowH+8;rowH=0
    assert y+im.height+8<=1024,(name,x,y)
    atlas.alpha_composite(im,(x,y))
    im.save(dst/(name+'.png'),optimize=True)
    frames[name]={
       'file':name+'.png',
       'atlas':{'x':x,'y':y,'w':im.width,'h':im.height},
       'width':im.width,'height':im.height,
       'anchor':{'x':im.width//2,'y':im.height},
       'worldScale':1,'collision':'inherit-existing-world',
       'lightMode':('warm' if 'warm' in name else 'unlit' if 'dark' in name else 'decorative')}
    x+=im.width+8;rowH=max(rowH,im.height)
atlas.save(dst/'precinct9_phase2_facade_atlas.png',optimize=True)
m=dict(old);m.update({
  'version':'precinct9-windows-phase2','atlas':'precinct9_phase2_facade_atlas.png',
  'frames':frames,'phase1Unchanged':True,
  'newFrames':list(windows),'scope':'Phase 2 reusable windows and trim; one existing atlas loader; original gameplay unchanged',
  'sourceReference':'user-approved Precinct 9 blue brick and warm-window parts sheet; cleaned/re-authored pixels'
})
(dst/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
assert len(frames)==42
# All preexisting source regions must remain precisely unchanged in new atlas.
from PIL import ImageChops
for name,f in old['frames'].items():
    a=f['atlas'];xy=(a['x'],a['y'],a['x']+a['w'],a['y']+a['h'])
    assert ImageChops.difference(original.crop(xy),atlas.crop(xy)).getbbox() is None,name
print('PASS 16 new transparent window modules; 42 combined frames; original 26 Phase-1 atlas rectangles byte-equivalent')
