"""Pack generated, reference-guided 3/4 vehicles into native 64px atlas cells."""
from pathlib import Path
from PIL import Image
import json

repo=Path(__file__).resolve().parent.parent
folder=repo/'published-game-capture/assets/perspective-pilot'
source=Image.open(folder/'vehicles-source.png').convert('RGBA')
atlas=Image.new('RGBA',(512,512));frames={};packed=0
palette=['557e9a','a66852','7d8b76','c5a975','597b7c','ac7671']
for row,family in enumerate(['police','sedan','van']):
 for col,direction in enumerate(['right','down','left','up']):
  cell=(max(0,round(col*source.width/4)-28),max(0,round(row*source.height/3)-28),
        min(source.width,round((col+1)*source.width/4)+28),min(source.height,round((row+1)*source.height/3)+28))
  sprite=source.crop(cell)
  # Crop only transparent margin. Keep generated alpha and directional art;
  # north is a genuine rear view, never a rotated front/side image.
  bounds=sprite.getchannel('A').point(lambda a:255 if a>48 else 0).getbbox()
  assert bounds,(family,direction)
  sprite=sprite.crop(bounds);sprite.thumbnail((64,60),Image.Resampling.NEAREST)
  frame=Image.new('RGBA',(64,64));frame.paste(sprite,((64-sprite.width)//2,64-sprite.height))
  variants=[('',frame)]
  if family=='sedan':
   for color in palette:
    target=tuple(int(color[i:i+2],16) for i in (0,2,4));tinted=frame.copy();px=tinted.load()
    for yy in range(64):
     for xx in range(64):
      r,g,b,a=px[xx,yy]
      if a and g>r*1.04 and g>b*1.06 and g>35:
       px[xx,yy]=(min(255,round(r*target[0]/121)),min(255,round(g*target[1]/142)),min(255,round(b*target[2]/110)),a)
    variants.append((color+'.',tinted))
  for color,art in variants:
   x=(packed%8)*64;y=(packed//8)*64;assert y+64<=512
   atlas.paste(art,(x,y));packed+=1
   frames[family+'.'+color+direction]={'x':x,'y':y,'w':64,'h':64,'bounds':list(art.getbbox()),'sourceCell':list(cell)}
atlas.save(folder/'vehicles-atlas.png')
(folder/'manifest.json').write_text(json.dumps({'id':'precinct-perspective-pilot','atlas':'vehicles-atlas.png',
 'tileSize':32,'frameSize':64,'camera':'fixed elevated north-facing 3/4 JRPG view',
 'bounds':{'x':387,'y':1124,'w':1923,'h':724},'frames':frames},indent=2),encoding='utf-8')
print('Packed twelve directional designs plus original civilian paint variants')
