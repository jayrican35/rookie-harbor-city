"""Extract roadway materials/stencils from the owner's sheet at native scale."""
from pathlib import Path
from PIL import Image
import json

repo = Path(__file__).resolve().parent.parent
sheet = Image.open(repo / 'docs/references/roadway-asset-sheet.png').convert('RGBA')
out = repo / 'published-game-capture/assets/roadway'
out.mkdir(parents=True, exist_ok=True)
spec = {
 'asphalt': ((180,60,244,124), None),
 'asphalt_worn': ((270,60,334,124), None),
 'curb_top': ((24,354,184,372), None),
 'curb_bottom': ((24,470,184,488), None),
 'curb_vertical': ((1143,356,1161,482), None),
 'yellow_dashes': ((66,416,94,424), 'yellow'),
 'crosswalk': ((1198,568,1278,630), 'white'),
 'arrow': ((1100,212,1132,282), 'white'),
 'accessible': ((1380,208,1424,284), 'blue'),
}
atlas = Image.new('RGBA', (256,256))
frames = {}; x=y=height=0
for name,(box,mask) in spec.items():
 im=sheet.crop(box)
 if mask:
  pixels=[]
  data=im.tobytes()
  for r,g,b,a in zip(data[::4],data[1::4],data[2::4],data[3::4]):
   keep=(r>160 and g>105 and b<120 and r>b*1.5) if mask=='yellow' else ((b>110 and g>80 and r<140 and b>r*1.3) if mask=='blue' else (min(r,g,b)>165 and max(r,g,b)-min(r,g,b)<55))
   pixels.append((r,g,b,a if keep else 0))
  im.putdata(pixels)
 im=im.resize((im.width//2,im.height//2),Image.Resampling.NEAREST)
 im.save(out/(name+'.png'))
 if x+im.width>256:x=0;y+=height+4;height=0
 assert y+im.height<=256
 atlas.paste(im,(x,y));frames[name]={'x':x,'y':y,'w':im.width,'h':im.height,'sourceRect':list(box),'mask':mask}
 x+=im.width+4;height=max(height,im.height)
atlas.save(out/'roadway-atlas.png')
(out/'manifest.json').write_text(json.dumps({'version':'owner-roadway-1','atlas':'roadway-atlas.png','sourceScale':0.5,'frames':frames},indent=2),encoding='utf-8')
print('Extracted owner road materials, curbs and paint-only stencils')
