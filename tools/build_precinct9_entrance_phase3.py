#!/usr/bin/env python3
"""Phase 3 entrance art added to the EXISTING 42-frame precinct atlas.

Reuses Phase-1 pilasters, caps, Phase-2 windows/glazing palette, V134 badges,
the V134 canvas façade and native roof fade; no new atlas manager or engine.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops
import json,sys
if len(sys.argv)!=3:raise SystemExit("Usage: build_precinct9_entrance_phase3.py PHASE2_DIR OUTPUT_DIR")
prior,out=map(Path,sys.argv[1:]);out.mkdir(parents=True,exist_ok=True)
m=json.loads((prior/'manifest.json').read_text())
assert len(m['frames'])==42 and m['tileSize']==32
atlas=Image.open(prior/m['atlas']).convert('RGBA')
assert atlas.size==(1024,1024)
NAVY=(20,48,79,255);BLUE=(34,84,134,255);HIGHLIGHT=(73,131,181,255)
CREAM=(242,225,196,255);LIMESTONE=(208,187,157,255);SHADE=(124,125,120,255)
GOLD=(247,206,116,255);AMBER=(234,177,80,255);GLASS=(36,91,121,255)
def box(draw,x,y,w,h,color):draw.rectangle((x,y,x+w-1,y+h-1),fill=color)
def stone_lintel():
 im=Image.new('RGBA',(192,128));d=ImageDraw.Draw(im)
 # The original real 72px open collision portal sits in the CENTRE;
 # draw only exterior wall/column structure around it, never a wall across it.
 for x in (0,160):
  box(d,x+3,13,29,114,SHADE);box(d,x+5,15,24,106,LIMESTONE)
  box(d,x+8,19,17,97,CREAM)
  for yy in (44,72,100):box(d,x+5,yy,24,3,SHADE)
  box(d,x,112,32,16,SHADE);box(d,x+2,112,28,9,LIMESTONE)
  box(d,x,11,32,16,CREAM);box(d,x+3,18,27,6,LIMESTONE)
 # Top lintel ends before the door glazing; empty alpha in its 72px slot.
 box(d,25,0,142,18,LIMESTONE)
 box(d,29,2,134,7,CREAM)
 box(d,33,16,126,5,SHADE)
 # stone/glass seam - decorative jamb outside accessible central gap
 for xx in (55,134):
  box(d,xx,26,4,86,SHADE)
  box(d,xx+1,26,2,84,CREAM)
 return im
def double_doors(kind):
 im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
 # Exterior of door is transparent: only 72px-wide real opening, at x=12..84.
 box(d,11,0,74,94,NAVY)
 box(d,13,2,70,90,LIMESTONE)
 box(d,16,4,64,86,GLASS)
 box(d,17,7,62,15,(67,125,151,255))
 box(d,17,27,62,57,(151,103,59,255))
 box(d,19,31,58,47,(207,142,74,255))
 box(d,20,32,56,5,(253,218,140,255))
 for yy in (42,57,70):
  box(d,18,yy,60,3,(29,66,88,255))
 box(d,12,89,72,5,(130,139,136,255))
 if kind=='closed':
  box(d,47,3,3,84,(13,36,57,255))
  box(d,25,9,3,76,(23,66,92,255))
  box(d,69,9,3,76,(23,66,92,255))
  box(d,42,50,3,16,GOLD);box(d,53,50,3,16,GOLD)
 elif kind=='half':
  box(d,18,4,14,82,(22,60,88,255));box(d,64,4,14,82,(22,60,88,255))
  box(d,33,6,11,77,(53,103,128,230))
  box(d,52,6,11,77,(53,103,128,230))
  box(d,43,3,3,85,(20,51,75,160))
  box(d,50,3,3,85,(20,51,75,160))
 else:
  # Original entrance open: a clean visible central portal rather than
  # two opaque rectangular leaves. No collider introduced by any frame.
  d.rectangle((28,3,67,86),fill=(0,0,0,0))
  box(d,16,5,11,81,(49,101,137,255))
  box(d,69,5,11,81,(49,101,137,255))
  box(d,19,11,3,67,(145,201,208,255))
  box(d,74,11,3,67,(145,201,208,255))
  box(d,25,49,3,16,GOLD);box(d,68,49,3,16,GOLD)
 return im
def awning_top():
 im=Image.new('RGBA',(256,64));d=ImageDraw.Draw(im)
 # 2.5D top-down south-facing roof perspective, native 1px world scale.
 for y in range(0,55):
  pad=max(0,int(8-(y/11)))
  box(d,pad,y,256-pad*2,1,(25+int(y*.28),74+int(y*.20),124+int(y*.19),255))
 for x in range(0,256,32):
  box(d,x,6,2,46,(102,161,191,255))
  box(d,x+3,5,1,46,(18,48,81,255))
 box(d,0,52,256,7,NAVY)
 box(d,2,59,252,5,(14,35,65,255))
 return im
def awning_fascia():
 im=Image.new('RGBA',(256,32));d=ImageDraw.Draw(im)
 box(d,0,0,256,28,NAVY);box(d,0,0,256,4,HIGHLIGHT)
 box(d,6,7,244,3,(200,179,138,255))
 box(d,9,12,238,11,(31,60,97,255))
 for x in range(32,231,32):box(d,x,25,12,4,GOLD)
 box(d,0,28,256,4,(12,30,49,255))
 return im
def sign():
 im=Image.new('RGBA',(192,32));d=ImageDraw.Draw(im)
 box(d,0,0,192,30,(17,36,58,255))
 box(d,2,2,188,2,GOLD);box(d,2,27,188,3,LIMESTONE)
 font=None
 for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf',
           '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
  if Path(f).is_file():font=ImageFont.truetype(f,17);break
 if font is None:font=ImageFont.load_default()
 label='MAIN ENTRANCE'
 bb=d.textbbox((0,0),label,font=font)
 tw=bb[2]-bb[0];tx=max(8,(192-tw)//2)
 d.text((tx,5),label,font=font,fill=(255,228,166,255),
        stroke_width=0)
 return im
new={
 'entry_stone_portal_frame':stone_lintel(),
 'entry_double_glass_closed':double_doors('closed'),
 'entry_double_glass_half':double_doors('half'),
 'entry_double_glass_open':double_doors('open'),
 'entry_blue_awning_roof':awning_top(),
 'entry_blue_awning_edge':awning_fascia(),
 'entry_main_entrance_sign':sign(),
}
# Fill empty bottom of the SAME 1024x1024 atlas without moving any previous
# frames. Explicitly check the 42 originals remain pixel-for-pixel identical.
frames=json.loads(json.dumps(m['frames']))
x,y,row=8,664,0
for name,im in new.items():
 if x+im.width+8>1024:x=8;y+=row+8;row=0
 assert y+im.height+8<=1024,(name,y)
 atlas.alpha_composite(im,(x,y))
 im.save(out/(name+'.png'),optimize=True)
 frames[name]={'file':name+'.png','atlas':{'x':x,'y':y,'w':im.width,'h':im.height},
   'width':im.width,'height':im.height,'anchor':{'x':im.width//2,'y':im.height},
   'worldScale':1,'collision':'original-72px-precinct-front-opening',
   'usage':'Phase 3 entrance modular art, no collider authored'}
 x+=im.width+8;row=max(row,im.height)
for name,f in m['frames'].items():
 a=f['atlas'];rect=(a['x'],a['y'],a['x']+a['w'],a['y']+a['h'])
 old=Image.open(prior/m['atlas']).convert('RGBA').crop(rect)
 assert ImageChops.difference(atlas.crop(rect),old).getbbox() is None,name
assert len(frames)==49 and new['entry_double_glass_open'].getpixel((45,55))[3]==0
name='precinct9_phase3_combined_atlas.png'
atlas.save(out/name,optimize=True)
m.update({'version':'precinct9-entrance-phase3','atlas':name,'frames':frames,
 'newFrames':list(new),'phase2Unchanged':True,
 'sourceReference':'user-approved Precinct 9 pixel facade sheet; existing V134 crest, pilasters, lettering reused',
 'scope':'entrance art and auto-door only; no map, collider or mode mutations'})
(out/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
print('PASS 7 new RGBA door/frame/awning/sign assets, 49 original atlas+new frames; all prior 42 exact')
