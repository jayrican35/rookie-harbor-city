"""Deterministic reference-matched material atlas. Does not edit legacy assets."""
from PIL import Image,ImageDraw
from pathlib import Path
import random
root=Path(__file__).resolve().parent.parent/'published-game-capture/assets/v116-marina'
out=Image.new('RGBA',(256,128))
for idx in range(32):
 rng=random.Random(880+idx);im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im)
 if idx in [8,9,10,11,24,25,26,29,31]:
  d.rectangle((0,0,31,31),fill='#07548e')
  for j in range(30):
   x=rng.randrange(-8,32);y=rng.randrange(32);w=rng.randrange(3,13)
   d.line((x,y,x+w,y),fill=rng.choice(['#075087','#085b99','#0964a1','#09609a','#0b6cab']))
   if j%6==0:d.line((x+2,y+1,x+w-1,y+1),fill='#2384b6')
 elif idx in [4,5,6,7,23]:
  d.rectangle((0,0,31,31),fill='#4a902a')
  for j in range(110):
   x=rng.randrange(32);y=rng.randrange(32)
   d.rectangle((x,y,x+1,y+1),fill=rng.choice(['#438329','#549b2e','#5b9f30','#3c7c29','#619e2c']))
 elif idx in [12,13,14,15,28]:
  d.rectangle((0,0,31,31),fill='#a56b37')
  for y in range(0,32,8):
   d.rectangle((0,y,31,y+7),fill=rng.choice(['#b98043','#b57a3f','#bc8347']))
   d.line((0,y,31,y),fill='#ebbb72');d.line((0,y+7,31,y+7),fill='#6b432c')
   for j in range(5):
    x=rng.randrange(32);d.line((x,y+3,x+rng.randrange(3,8),y+3),fill='#d39752')
   d.point((2,y+2),fill='#5b3b2a');d.point((29,y+2),fill='#5b3b2a')
 else:
  d.rectangle((0,0,31,31),fill='#c3a28e')
  for y in range(0,32,8):
   for x in range(-8 if y//8%2 else 0,32,16):
    col=rng.choice(['#d5b69e','#d8baa4','#cfad99','#d2b29c'])
    d.rectangle((x,y,x+15,y+7),fill=col,outline='#a68477')
    d.line((x+1,y+1,x+14,y+1),fill='#edceb3');d.line((x+1,y+2,x+1,y+6),fill='#dfc0aa')
 out.paste(im,(idx%8*32,idx//8*32))
out.save(root/'marina-detail-tiles.png')
