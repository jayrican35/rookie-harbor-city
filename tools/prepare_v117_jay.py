"""Prepare Jay's transparent production atlases from generated uniform grids.
Usage: python3 tools/prepare_v117_jay.py walk=SOURCE run=SOURCE
No runtime image manipulation; originals are retained. Walk column 0 is idle.
"""
from PIL import Image
from pathlib import Path
import sys,json,hashlib
root=Path(__file__).resolve().parent.parent/'published-game-capture/assets/jay-v117'
root.mkdir(parents=True,exist_ok=True);report={}
for arg in sys.argv[1:]:
 mode,src=arg.split('=',1);assert mode in ('walk','run');cols=9 if mode=='walk' else 8
 im=Image.open(src).convert('RGBA');frames=[]
 assert im.getchannel('A').getextrema()[0]==0,'True transparency required'
 for r in range(4):
  for c in range(cols):
   frame=im.crop((round(c*im.width/cols),round(r*im.height/4),round((c+1)*im.width/cols),round((r+1)*im.height/4)))
   box=frame.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();assert box,(r,c)
   frame=frame.crop(box);assert frame.width>20 and frame.height>40
   frames.append(frame)
 centers=[]
 for f in frames:
  head=f.getchannel('A').crop((0,0,f.width,max(1,round(f.height*.42)))).point(lambda a:255 if a>=128 else 0).getbbox()
  centers.append((head[0]+head[2])/2)
 scale=min(59/max(centers),59/max(f.width-c for f,c in zip(frames,centers)),116/max(f.height for f in frames))
 atlas=Image.new('RGBA',(cols*128,512));hashes=[]
 for i,f in enumerate(frames):
  # Use the head center, independent of the swinging arms and leading boot.
  head=f.getchannel('A').crop((0,0,f.width,max(1,round(f.height*.42)))).point(lambda a:255 if a>=128 else 0).getbbox()
  anchor=(head[0]+head[2])/2
  sprite=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.NEAREST)
  x=i%cols*128+round(64-anchor*scale);y=i//cols*128+122-sprite.height
  assert x>=i%cols*128 and x+sprite.width<=(i%cols+1)*128,'Insufficient horizontal padding'
  atlas.alpha_composite(sprite,(x,y));hashes.append(hashlib.sha256(sprite.tobytes()).hexdigest())
 assert all(len(set(hashes[r*cols:(r+1)*cols]))>=8 for r in range(4))
 target=root/f'jay-{mode}.webp';atlas.save(target,lossless=True,method=6)
 report[mode]={'file':target.name,'source_sha256':hashlib.sha256(Path(src).read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'cell':[128,128],'baseline':122,'columns':cols,'rows':['down','left','right','up'],'idle_column':0 if mode=='walk' else None,'unique_by_row':[len(set(hashes[r*cols:(r+1)*cols])) for r in range(4)]}
 print(mode,atlas.size,target.stat().st_size)
(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
