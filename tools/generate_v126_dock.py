#!/usr/bin/env python3
"""V126: deterministic unique full-length 90px marina timber surface.
Runs only in isolated preview build. Never modifies V121 originals or maps.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import random,sys,math
if len(sys.argv)!=2:raise SystemExit('Usage: generate_v126_dock.py OUTPUT_DIR')
dst=Path(sys.argv[1]);dst.mkdir(parents=True,exist_ok=True)
W,H=90,320
wood=Image.new('RGBA',(W,H),(78,47,30,255))
d=ImageDraw.Draw(wood,'RGBA');rr=random.Random(126)
# Strong wooden stringers and under-edge shading remain below actual board surface.
d.rectangle((0,0,89,H-1),fill=(72,46,29,255))
d.rectangle((2,0,87,H-1),fill=(113,71,42,255))
y=0;boards=0
while y<H:
 h=rr.randint(18,23)
 h=min(h,H-y)
 tone=rr.randrange(-14,16)
 base=(min(255,185+tone),min(255,117+tone),min(255,61+tone),255)
 d.rectangle((4,y+1,85,y+h-3),fill=base)
 # Real planks: bevel highlight, dark board-length gap, and raw end grain.
 d.line((5,y+2,84,y+2),fill=(250,190+max(-10,tone),115+max(-10,tone),255),width=2)
 d.line((5,y+h-4,84,y+h-4),fill=(113,65,41,245))
 d.rectangle((4,y+h-2,85,y+h-1),fill=(44,29,30,255))
 if h>=17:
  d.line((5,y+4,84,y+4),fill=(239,155,81,86),width=1)
  # Fine woody grain follows a plank, not repetitive crosswise scanlines.
  for _ in range(rr.randrange(12,21)):
   x=rr.randrange(9,77);yy=rr.randrange(y+5,y+h-5);ln=rr.randrange(6,25)
   end=min(84,x+ln)
   shade=rr.choice([(90,57,36,120),(238,175,94,105),(126,72,42,155),
                    (255,212,140,80)])
   d.line((x,yy,end,yy+rr.choice([-1,0,0,1])),fill=shade,width=1)
  # Weathered shallow knot / hairline crack: irregular and sparse.
  if boards%4==2:
   kx=rr.randrange(30,65);ky=y+h//2
   d.ellipse((kx-5,ky-2,kx+4,ky+2),outline=(87,50,32,178),width=1)
   d.line((kx+5,ky,kx+14,ky+rr.choice([-1,1])),fill=(105,63,36,140))
  # Each board has paired metal fasteners at supporting stringers.
  for x in (11,78):
   nail_y=y+max(5,h//2)
   d.rectangle((x-2,nail_y-1,x+1,nail_y+2),fill=(64,58,51,255))
   d.point((x-1,nail_y-1),fill=(235,209,166,255))
  # One occasional scarf joint with a real stagger rather than tiled seam.
  if boards in (4,10):
   jx=rr.choice([43,52])
   d.line((jx,y+4,jx,y+h-5),fill=(90,53,35,187))
   d.line((jx+1,y+4,jx+1,y+h-5),fill=(239,175,92,125))
 y+=h;boards+=1
# Side rails: stepped bright west sun bevel and dark east side thickness.
d.rectangle((0,0,3,H-1),fill=(51,43,33,255))
d.line((4,0,4,H-1),fill=(244,187,108,255),width=2)
d.line((6,0,6,H-1),fill=(251,207,136,205))
d.line((84,0,84,H-1),fill=(73,48,38,255),width=2)
d.rectangle((87,0,89,H-1),fill=(41,33,32,255))
wood.save(dst/'dock-wood.png',optimize=True)
assert wood.size==(90,320)
print('PASS V126 one-of-a-kind dock wood',wood.size,boards,'planks; no repeating seam')
