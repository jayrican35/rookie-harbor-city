#!/usr/bin/env python3
"""ROOKIE Precinct 9 Phase 5 — deterministic 32-grid alpha terrain asset build.
Style palette sampled from owner's approved ground/road/plaza parts image.
All art rendered offline to individual transparent RGBA PNG + one atlas.
DO NOT create a new map, collision system, runtime renderer or game mode.
"""
from PIL import Image,ImageDraw,ImageChops
from pathlib import Path
import json,sys,random
if len(sys.argv)!=2:raise SystemExit('Usage: build_precinct9_phase5_ground.py OUTPUT_DIR')
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
T=64;alpha=(0,0,0,0)
# Sampled/cleaned colors of user's supplied 1448x1086 pixel-art parts sheet.
SAND=(224,195,177,255);SAND2=(230,203,185,255);LIGHT=(246,224,205,255)
JOINT=(149,132,127,255);REDSTONE=(219,179,174,255)
ASPHALT=(60,62,81,255);ROAD_LIGHT=(74,76,93,255);ROAD_DARK=(49,51,69,255)
YELLOW=(245,179,48,255);WHITE=(232,229,220,255)
GRASS=(91,141,33,255);GRASS_DARK=(48,106,24,255);LEAF=(43,99,38,255)
INK=(27,42,54,255);WARM=(253,210,116,255);POT=(117,72,52,255)
def draw(fill=alpha,size=(64,64)):
 im=Image.new('RGBA',size,fill)
 return im,ImageDraw.Draw(im)
def R(d,x,y,w,h,c):
 if w>0 and h>0:d.rectangle((int(x),int(y),int(x+w-1),int(y+h-1)),fill=c)
def noise(d,w,h,seed,colors,threshold=2):
 rng=random.Random(seed)
 for yy in range(0,h,4):
  for xx in range(0,w,4):
   if rng.randrange(11)>threshold:continue
   c=colors[rng.randrange(len(colors))]
   dx=rng.randrange(4);dy=rng.randrange(4)
   R(d,xx+dx,yy+dy,rng.randint(1,3),rng.randint(1,2),c)
def paver(mode='stone',variant=0):
 base=SAND if mode=='stone' else REDSTONE
 im,d=draw(base)
 rng=random.Random(531+variant)
 noise(d,64,64,1250+variant,
  [(235,209,188,255),(204,173,159,255),(218,187,171,255)],2)
 # Native 32-unit repeatable pavers. Dividers are at exact tile boundaries.
 for yy in (0,32):
  R(d,0,yy,64,2,JOINT if mode=='stone' else (143,112,117,255))
  R(d,1,yy+2,62,1,(249,230,210,255))
  shift=16 if yy==32 else 0
  for x in range(shift,65,32):
   R(d,x%64,yy+2,2,29,(154,135,129,255))
   R(d,(x+2)%64,yy+3,1,26,(238,212,195,255))
 for i in range(9):
  x=rng.randrange(4,60);y=rng.randrange(4,61)
  R(d,x,y,2+rng.randrange(6),1,(248,220,198,255) if i%2 else (193,162,152,255))
 return im
def asphalt(seed=0):
 im,d=draw(ASPHALT);rng=random.Random(71+seed)
 for y in range(0,64,2):
  for x in range(0,64,2):
   n=rng.randrange(15)
   if n<3:R(d,x,y,2,2,ROAD_LIGHT if n==0 else ROAD_DARK)
 for i in range(18):
  x=rng.randrange(64);y=rng.randrange(64);R(d,x,y,2+rng.randrange(4),1,(94,91,102,255) if i%3 else ROAD_DARK)
 return im
def turf(seed=0):
 im,d=draw(GRASS);rng=random.Random(seed+91)
 cols=[(111,160,31,255),(57,122,24,255),(71,130,21,255),(129,169,38,255),
  (42,103,29,255),(158,182,58,255)]
 for y in range(0,64,3):
  for x in range(0,64,3):
   if rng.randrange(11)>6:continue
   c=cols[rng.randrange(len(cols))];R(d,x+rng.randrange(3),y+rng.randrange(3),2,2,c)
 for i in range(12):
  x=rng.randrange(64);y=rng.randrange(64)
  R(d,x,y,2,1,(212,180,101,255) if seed%2 else (153,193,75,255))
 return im
def line_over(name):
 im,d=draw()
 if name=='road_double_yellow':
  R(d,0,26,64,3,YELLOW);R(d,0,34,64,3,YELLOW)
 elif name=='road_center_dashes':
  R(d,12,30,40,4,YELLOW)
 elif name=='road_single_white':
  R(d,0,31,64,3,WHITE)
 elif name=='crosswalk_vertical':
  for x in (6,22,38,54):R(d,x,3,8,58,WHITE)
 elif name=='crosswalk_horizontal':
  for y in (6,22,38,54):R(d,3,y,58,8,WHITE)
 elif name=='parking_stall_top':
  R(d,2,0,3,64,(233,226,214,255));R(d,61,0,3,64,(233,226,214,255))
  R(d,3,2,58,3,(233,226,214,255))
 elif name=='parking_accessible':
  R(d,0,3,64,3,(106,195,217,255))
  for i in range(0,64,12):
   for j in range(5):R(d,(i+j*2)%64,13+j*8,4,3,(101,194,214,255))
 elif name=='parking_access_symbol':
  R(d,18,12,24,3,(129,199,218,255))
  R(d,16,15,3,30,(129,199,218,255))
  R(d,39,15,3,30,(129,199,218,255))
  R(d,18,43,24,3,(129,199,218,255))
  R(d,25,18,10,8,(195,238,245,255))
  R(d,25,26,5,16,(195,238,245,255))
 elif name=='curb_top':
  R(d,0,0,64,5,(250,234,211,255))
  R(d,0,5,64,12,(196,180,169,255))
  R(d,0,17,64,4,(123,125,130,255))
  R(d,0,21,64,5,(66,76,88,200))
  for x in (0,32):R(d,x,6,2,11,(142,137,134,255))
 elif name=='curb_bottom':
  R(d,0,38,64,5,(73,83,88,140))
  R(d,0,43,64,14,(195,182,168,255))
  R(d,0,43,64,3,(249,228,204,255))
  R(d,0,57,64,7,(113,115,119,255))
  R(d,32,46,2,11,(145,142,138,255))
 elif name=='curb_left':
  R(d,0,0,26,64,(191,179,163,255))
  R(d,22,0,4,64,(64,74,85,245))
  R(d,2,0,4,64,(250,225,201,255))
 elif name=='curb_right':
  R(d,38,0,26,64,(191,179,163,255))
  R(d,38,0,4,64,(64,74,85,245))
  R(d,58,0,4,64,(250,225,201,255))
 elif name=='stone_border':
  R(d,0,3,64,6,(242,219,201,255))
  R(d,0,9,64,5,(143,142,137,255))
 elif name=='sidewalk_grass_edge':
  for x in range(0,64,8):
   R(d,x,0,8,7,(183,167,148,255))
   R(d,x,7,8,4,(129,141,102,255))
   R(d,x,11,8,4,GRASS_DARK)
   R(d,x+1,15,3,3,GRASS)
 elif name=='parking_wheelstop':
  R(d,10,23,48,11,(22,28,44,110))
  R(d,8,17,48,10,(203,205,191,255))
  R(d,9,17,46,2,(250,246,232,255))
  R(d,9,25,46,2,(116,128,129,255))
 return im
def hedge_tile(kind='straight'):
 im,d=draw(size=(64,32))
 R(d,0,13,64,14,(27,69,29,255));R(d,0,27,64,4,(18,43,28,160))
 rng=random.Random(33+len(kind))
 for i in range(110):
  x=rng.randrange(0,64);y=rng.randrange(3,25)
  c=[(37,89,40,255),(57,130,42,255),(101,155,50,255),
     (137,184,49,255),(176,207,59,255),(33,65,34,255)][rng.randrange(6)]
  R(d,x,y,rng.randrange(2,6),rng.randrange(2,5),c)
 if kind=='corner':
  R(d,0,0,13,32,(38,88,42,255))
 return im
def planter():
 im,d=draw(size=(128,48))
 R(d,3,23,122,24,(41,35,37,140))
 R(d,0,17,128,28,POT);R(d,3,20,122,20,(146,93,62,255))
 R(d,2,18,124,5,(226,163,106,255))
 R(d,5,11,118,10,(34,87,31,255))
 rng=random.Random(821)
 for i in range(125):
  x=rng.randrange(8,122);y=rng.randrange(3,20)
  c=[(63,123,37,255),(103,159,44,255),(237,196,49,255),
      (244,121,120,255),(227,176,180,255)][rng.randrange(5)]
  R(d,x,y,2+rng.randrange(4),2+rng.randrange(3),c)
 return im
def lamp():
 im,d=draw(size=(32,96))
 R(d,12,22,8,67,(42,57,67,255));R(d,13,23,2,62,(122,135,136,255))
 R(d,6,0,20,9,(62,52,44,255));R(d,7,7,18,22,(190,131,65,255))
 R(d,9,9,14,18,WARM);R(d,12,11,7,13,(255,239,163,255))
 R(d,6,0,20,4,(239,192,109,255));R(d,9,29,14,4,(36,49,59,255))
 R(d,7,87,18,8,(42,58,69,255))
 return im
def bollard():
 im,d=draw(size=(32,48))
 R(d,9,14,14,31,(48,62,73,255));R(d,10,12,12,7,(204,188,150,255))
 R(d,12,17,4,23,(124,139,135,255));R(d,7,40,18,5,(20,43,56,255))
 return im
def grate():
 im,d=draw(size=(64,32))
 R(d,5,3,54,26,(40,52,64,255));R(d,7,5,50,22,(91,103,113,255))
 R(d,12,8,40,16,(31,40,53,255))
 for x in range(15,52,8):R(d,x,9,3,14,(127,142,145,255))
 return im
def manhole():
 im,d=draw(size=(64,64))
 d.ellipse((7,7,56,56),fill=(33,44,58,255),outline=(125,130,138,255),width=3)
 d.ellipse((16,16,47,47),outline=(100,113,126,255),width=2)
 for x,y in [(18,31),(42,31),(31,19),(31,43)]:R(d,x,y,3,3,(177,172,160,255))
 return im
def corners():
 out={}
 for name in ('curb_corner_nw','curb_corner_ne','curb_corner_sw','curb_corner_se'):
  im,d=draw()
  # Corner modules are transparent border overlay, not a second terrain layer.
  if name.endswith('nw'):
   R(d,0,0,64,9,(237,221,197,255));R(d,0,0,9,64,(237,221,197,255))
  if name.endswith('ne'):
   R(d,0,0,64,9,(237,221,197,255));R(d,55,0,9,64,(237,221,197,255))
  if name.endswith('sw'):
   R(d,0,55,64,9,(237,221,197,255));R(d,0,0,9,64,(237,221,197,255))
  if name.endswith('se'):
   R(d,0,55,64,9,(237,221,197,255));R(d,55,0,9,64,(237,221,197,255))
  out[name]=im
 return out
frames={
 'paver_stone':paver('stone',0),'paver_stone_var':paver('stone',1),
 'paver_brick':paver('brick',1),'paver_brick_var':paver('brick',2),
 'asphalt':asphalt(0),'asphalt_var':asphalt(1),
 'grass':turf(0),'grass_var':turf(3),
 'hedge':hedge_tile(),'hedge_corner':hedge_tile('corner'),
 'flower_planter':planter(),'lamp':lamp(),'bollard':bollard(),
 'drain_grate':grate(),'utility_cover':manhole(),
}
for name in ('road_double_yellow','road_center_dashes','road_single_white',
 'crosswalk_vertical','crosswalk_horizontal','parking_stall_top',
 'parking_accessible','parking_access_symbol',
 'curb_top','curb_bottom','curb_left','curb_right',
 'stone_border','sidewalk_grass_edge','parking_wheelstop'):
 frames[name]=line_over(name)
frames.update(corners())
# Atlas 1024x1024 retains original-sized native 32px multiples, transparent padding.
atlas=Image.new('RGBA',(1024,1024))
manifest={};x=y=8;rowH=0
for name,im in frames.items():
 if x+im.width+8>1024:x=8;y+=rowH+8;rowH=0
 if y+im.height+8>1024:raise RuntimeError('atlas full:'+name)
 atlas.alpha_composite(im,(x,y))
 im.save(OUT/(name+'.png'),optimize=True)
 manifest[name]={'file':name+'.png','atlas':{'x':x,'y':y,'w':im.width,'h':im.height},
    'width':im.width,'height':im.height,'anchor':{'x':0,'y':im.height},
    'worldScale':1,'collision':'existing-world-collider-only','layer':
    'terrain' if name.startswith(('paver_','asphalt','grass')) else 'detail'}
 x+=im.width+8;rowH=max(rowH,im.height)
atlas.save(OUT/'precinct9_ground_phase5_atlas.png',optimize=True)
(OUT/'manifest.json').write_text(json.dumps({
 'version':'precinct9-phase5-ground','tileSize':32,'worldPixelsPerAssetPixel':1,
 'atlas':'precinct9_ground_phase5_atlas.png','atlasSize':[1024,1024],
 'frames':manifest,'scope':'precinct9 civic grounds and existing road only',
 'sourceReference':'owner supplied precinct sidewalk/road/plaza sheet; palette inspected and art cleaned/reconstructed',
 'sameWorldGeometry':True},indent=2)+'\n')
assert len(frames)>=34
for key in ['asphalt','grass','paver_stone','crosswalk_vertical','parking_accessible']:
 assert frames[key].size==(64,64)
print('PASS Phase 5',len(frames),'independent alpha PNG assets, one atlas + manifest:',OUT)
