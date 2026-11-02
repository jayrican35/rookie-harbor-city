"""Extract overhead owner vehicles and derive four consistent camera directions."""
from pathlib import Path
from PIL import Image
import json

repo=Path(__file__).resolve().parent.parent
sheet=Image.open(repo/'docs/references/vehicle-sprite-sheet.png').convert('RGBA')
out=repo/'published-game-capture/assets/vehicles-owner'
out.mkdir(parents=True,exist_ok=True)
families={
 'police': (110,192,['blue','red','white','black','green']),
 'sedan': (326,408,['blue','red','white','black','tan']),
 'compact': (524,604,['yellow','blue','white','black','green']),
 'pickup': (704,786,['blue','red','white','black','tan']),
 'suv': (892,976,['blue','red','white','black','green']),
}
centers=[304,542,779,1018,1254]
atlas=Image.new('RGBA',(512,512));frames={};x=y=row=0
for family,(top,bottom,colors) in families.items():
 for center,color in zip(centers,colors):
  box=(center-30,top,center+30,bottom)
  im=sheet.crop(box);data=im.tobytes()
  im.putdata([(r,g,b,0 if a<224 else min(255,round(a*255/252))) for r,g,b,a in zip(data[::4],data[1::4],data[2::4],data[3::4])])
  # Keep the main car silhouette, not detached cutout flecks in the upload.
  px=im.load();seen=set();largest=[]
  for yy in range(im.height):
   for xx in range(im.width):
    if (xx,yy) in seen or not px[xx,yy][3]:continue
    queue=[(xx,yy)];seen.add((xx,yy));component=[]
    while queue:
     p=queue.pop();component.append(p)
     for nx,ny in [(p[0]-1,p[1]),(p[0]+1,p[1]),(p[0],p[1]-1),(p[0],p[1]+1)]:
      if 0<=nx<im.width and 0<=ny<im.height and (nx,ny) not in seen and px[nx,ny][3]:
       seen.add((nx,ny));queue.append((nx,ny))
    if len(component)>len(largest):largest=component
  keep=set(largest)
  for yy in range(im.height):
   for xx in range(im.width):
    if (xx,yy) not in keep:px[xx,yy]=(0,0,0,0)
  assert im.getbbox(),(family,color)
  im=im.crop(im.getbbox());im.thumbnail((32,48),Image.Resampling.NEAREST)
  base=Image.new('RGBA',(32,48));base.paste(im,((32-im.width)//2,(48-im.height)//2))
  for direction,rotation in [('down',None),('up',Image.Transpose.ROTATE_180),('right',Image.Transpose.ROTATE_90),('left',Image.Transpose.ROTATE_270)]:
   sprite=base if rotation is None else base.transpose(rotation)
   if x+sprite.width>atlas.width:x=0;y+=row+2;row=0
   assert y+sprite.height<=atlas.height
   atlas.paste(sprite,(x,y))
   frames[f'{family}.{color}.{direction}']={'x':x,'y':y,'w':sprite.width,'h':sprite.height,'bounds':list(sprite.getbbox()),'sourceRect':list(box)}
   x+=sprite.width+2;row=max(row,sprite.height)
assert len(frames)==100
atlas.save(out/'vehicles-atlas.png')
(out/'manifest.json').write_text(json.dumps({'version':'owner-vehicles-1','atlas':'vehicles-atlas.png','frames':frames,'families':{k:v[2] for k,v in families.items()},'camera':'overhead; cardinal rotations from original overhead views'},indent=2),encoding='utf-8')
print('Prepared 100 overhead direction frames from 25 owner car variants')
