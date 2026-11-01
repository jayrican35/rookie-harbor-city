#!/usr/bin/env python3
"""V126 — remove detached scanline/background bleed from Jay's eight-frame run atlas.

Read-only source atlas; preserves 4 directions × 8 original poses, frame sizing
and anchor points. Output is a separate transparent PNG for CONNECTED world
Jay only. Never synthesize limbs or use interpolation that ghosts the feet.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import sys
if len(sys.argv)!=3:raise SystemExit('Usage: clean_v126_run.py INPUT_WEBP OUTPUT_PNG')
source=Image.open(sys.argv[1]).convert('RGBA')
width,height=source.size
assert width%8==0 and height%4==0,(width,height)
fw,fh=width//8,height//4
assert (fw,fh)==(128,128),'Reuse unchanged world-space frame anchors'
output=Image.new('RGBA',(width,height),(0,0,0,0))
removed=0;kept_pixels=0;frame_report=[]
for row in range(4):
 for col in range(8):
  src=source.crop((col*fw,row*fh,(col+1)*fw,(row+1)*fh));pix=src.load()
  mask=bytearray(1 if pix[x,y][3]>=25 else 0 for y in range(fh) for x in range(fw))
  seen=bytearray(fw*fh);comps=[]
  for y in range(fh):
   for x in range(fw):
    p=y*fw+x
    if seen[p] or not mask[p]:continue
    q=deque([p]);seen[p]=1;indices=[]
    while q:
     cur=q.popleft();indices.append(cur);cy,cx=divmod(cur,fw)
     for yy in range(max(0,cy-1),min(fh,cy+2)):
      for xx in range(max(0,cx-1),min(fw,cx+2)):
       ni=yy*fw+xx
       if mask[ni] and not seen[ni]:
        seen[ni]=1;q.append(ni)
    comps.append(indices)
  assert comps,(row,col)
  # Core samples target the face, uniform and central boot/leg support.
  # Detached stripes often have more pixels than a hand, but almost none here.
  def rank(c):
   core=sum(1 for p in c if 36<=p%fw<=91 and 19<=p//fw<=113)
   feet=sum(1 for p in c if 36<=p%fw<=92 and 96<=p//fw<=125)
   return core*7+feet*5+len(c)
  main=max(comps,key=rank);kept=set(main)
  xy=[(p%fw,p//fw) for p in main]
  box=(min(v[0] for v in xy),min(v[1] for v in xy),max(v[0] for v in xy),max(v[1] for v in xy))
  for comp in comps:
   if comp is main:continue
   xs=[p%fw for p in comp];ys=[p//fw for p in comp]
   left,top,right,bottom=min(xs),min(ys),max(xs),max(ys)
   span=right-left+1;ht=bottom-top+1
   # Keep nearby arm/foot glints with real area, not detached bars.
   near=(box[0]-5<=left<=box[2]+6 and box[1]-6<=top<=box[3]+6)
   line=(span>max(12,3*ht) and ht<=7)
   if near and len(comp)>=11 and not line and span<63 and ht<57:kept.update(comp)
  dst=Image.new('RGBA',(fw,fh));dp=dst.load()
  for i in kept:
   y,x=divmod(i,fw)
   # Never import opaque pixels far beyond authored person/animation cell.
   if 8<=x<=116 and 3<=y<=127:dp[x,y]=pix[x,y]
  # Restore one-pixel antialias edging on the kept silhouette only.
  for i in kept:
   y,x=divmod(i,fw)
   for yy in range(max(0,y-1),min(fh,y+2)):
    for xx in range(max(0,x-1),min(fw,x+2)):
     alpha=pix[xx,yy][3]
     if 0<alpha<25:dp[xx,yy]=pix[xx,yy]
  output.paste(dst,(col*fw,row*fh))
  real=sum(1 for i in range(fw*fh) if mask[i])
  removed+=real-len(kept);kept_pixels+=len(kept)
  frame_report.append((row,col,real,len(kept),len(comps)))
path=Path(sys.argv[2]);path.parent.mkdir(parents=True,exist_ok=True)
output.save(path,optimize=True)
assert path.stat().st_size>4000
assert len(frame_report)==32
assert all(k>180 for _,_,_,k,_ in frame_report),frame_report
print('PASS V126 Jay 4x8 cleaned run sheet',output.size,'removed',removed,'detached pixels; retained',kept_pixels,'silhouette pixels')
print('FRAME_STATS',frame_report)
