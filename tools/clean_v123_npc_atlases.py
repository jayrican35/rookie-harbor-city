#!/usr/bin/env python3
"""V123 repair detached animation-sheet bleed in marina NPCs. Originals unchanged.

Every 4x4 atlas frame is independently alpha segmented. Keep the character
silhouette and connected accessories; discard detached black/colored horizontal
bars and other off-character islands from the source artwork. Offline only.
"""
from pathlib import Path
from PIL import Image
from collections import deque
import sys
if len(sys.argv)!=3:raise SystemExit('Usage: clean_v123_npc_atlases.py SOURCE_DIR OUTPUT_DIR')
src=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
for name in ('officer','fisher','visitor'):
    original=Image.open(src/f'walk-{name}.webp').convert('RGBA')
    width,height=original.size
    assert width%4==0 and height%4==0,(name,original.size)
    fw,fh=width//4,height//4
    cleaned=Image.new('RGBA',(width,height),(0,0,0,0))
    removed_count=0;total_alpha=0;frame_stats=[]
    for row in range(4):
      for col in range(4):
        frame=original.crop((col*fw,row*fh,(col+1)*fw,(row+1)*fh))
        pix=frame.load()
        mask=bytearray(1 if pix[x,y][3]>=26 else 0 for y in range(fh) for x in range(fw))
        seen=bytearray(fw*fh);components=[]
        for y in range(fh):
          for x in range(fw):
            p=y*fw+x
            if not mask[p] or seen[p]:continue
            queue=deque([p]);seen[p]=1;component=[]
            while queue:
              cur=queue.popleft();component.append(cur)
              cx=cur%fw;cy=cur//fw
              for yy in range(max(0,cy-1),min(fh,cy+2)):
                for xx in range(max(0,cx-1),min(fw,cx+2)):
                  q=yy*fw+xx
                  if mask[q] and not seen[q]:seen[q]=1;queue.append(q)
            components.append(component)
        if not components:continue
        # Prefer dense central torso; floating bars above a head have near-zero
        # overlap with the character core even when their horizontal span is big.
        def rank(c):
          core=sum(1 for p in c if .28*fw<=p%fw<=.72*fw and .35*fh<=p//fw<=.86*fh)
          return core*5+len(c)
        main=max(components,key=rank)
        mainxy=[(p%fw,p//fw) for p in main]
        mnx=min(p[0] for p in mainxy);mxx=max(p[0] for p in mainxy)
        mny=min(p[1] for p in mainxy);mxy=max(p[1] for p in mainxy)
        keep=set(main)
        for comp in components:
          if comp is main:continue
          xx=[p%fw for p in comp];yy=[p//fw for p in comp]
          w=max(xx)-min(xx)+1;h=max(yy)-min(yy)+1
          cx=sum(xx)/len(xx);cy=sum(yy)/len(yy)
          near=(mnx-6<=cx<=mxx+6 and mny-5<=cy<=mxy+5)
          line=(w>=max(10,3*h) and h<=5)
          # Retain only substantial nearby components plausibly belonging to
          # the sprite; do not retain stray thin scanline/atlas artifacts.
          if near and len(comp)>=15 and not line:keep.update(comp)
        new=Image.new('RGBA',(fw,fh),(0,0,0,0));target=new.load()
        for p in keep:
          x=p%fw;y=p//fw
          target[x,y]=pix[x,y]
        # The rim of an antialiased sprite may use alpha under 26: preserve
        # nearest neighbors of kept artwork, but never independent scanlines.
        for p in tuple(keep):
          x=p%fw;y=p//fw
          for yy in range(max(0,y-1),min(fh,y+2)):
            for xx in range(max(0,x-1),min(fw,x+2)):
              if pix[xx,yy][3]<26 and pix[xx,yy][3]>0:
                target[xx,yy]=pix[xx,yy]
        cleaned.paste(new,(col*fw,row*fh))
        total_alpha+=sum(1 for z in mask if z)
        removed_count+=sum(1 for z in mask if z)-len(keep)
        frame_stats.append((row,col,len(components),sum(1 for z in mask if z)-len(keep)))
    result=out/f'walk-{name}.png'
    cleaned.save(result,optimize=True)
    assert result.stat().st_size>2000,result
    print(name,original.size,'removed',removed_count,'of',total_alpha,'opaque pixels;',
          'frames with detached bleed:',sum(1 for r in frame_stats if r[3]>0),'/16')
