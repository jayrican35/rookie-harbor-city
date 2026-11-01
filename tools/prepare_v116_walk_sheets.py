"""Normalize generated 4x4 directional sheets into fixed 96x128 frame cells.
Usage: python3 tools/prepare_v116_walk_sheets.py officer=SOURCE fisher=SOURCE visitor=SOURCE
Original generated files are retained. Only V116 animation assets are written.
"""
from PIL import Image
from pathlib import Path
import sys,json,hashlib
root=Path(__file__).resolve().parent.parent/'published-game-capture/assets/v116-marina'
report={}
for arg in sys.argv[1:]:
 key,src=arg.split('=',1);assert key in ['officer','fisher','visitor']
 im=Image.open(src).convert('RGBA');frames=[]
 for row in range(4):
  for col in range(4):
   region=(round(col*im.width/4),round(row*im.height/4),round((col+1)*im.width/4),round((row+1)*im.height/4))
   cell=im.crop(region);bbox=cell.getchannel('A').point(lambda x:255 if x>=128 else 0).getbbox()
   assert bbox is not None,(key,row,col)
   frames.append(cell.crop(bbox))
 scale=min(82/max(f.width for f in frames),116/max(f.height for f in frames))
 atlas=Image.new('RGBA',(384,512));checks=[]
 for i,frame in enumerate(frames):
  size=(max(1,round(frame.width*scale)),max(1,round(frame.height*scale)))
  sprite=frame.resize(size,Image.Resampling.NEAREST)
  x=i%4*96+(96-size[0])//2;y=i//4*128+122-size[1]
  atlas.alpha_composite(sprite,(x,y));checks.append(hashlib.sha256(sprite.tobytes()).hexdigest())
 assert all(len(set(checks[r*4:r*4+4]))>=3 for r in range(4)), 'Insufficient pose variation'
 target=root/('walk-'+key+'.webp');atlas.save(target,lossless=True,method=6)
 report[key]={'source_size':list(im.size),'atlas_size':[384,512],'cell':[96,128],'baseline':122,'rows':['down','left','right','up'],'frames_per_direction':4,'unique_frames_by_row':[len(set(checks[r*4:r*4+4])) for r in range(4)],'file':target.name}
 print(key,target.stat().st_size,report[key]['unique_frames_by_row'])
if len(report)==3:(root/'walk-sheets.json').write_text(json.dumps(report,indent=2))
