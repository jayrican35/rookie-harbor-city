"""Prepare Jay's transparent production atlases from generated uniform grids.
Usage: python3 tools/prepare_v117_jay.py walk=SOURCE run=SOURCE
No runtime image manipulation; originals are retained. Walk column 0 is idle.
"""
from PIL import Image
from pathlib import Path
import sys,json,hashlib,re
root=Path(__file__).resolve().parent.parent/'published-game-capture/assets/jay-v117'
def frame_bounds(atlas,cols):
 """Measure only the principal actor island; neighboring-row pixels are not art.
 Returns [x,y,width,height] in cell-local coordinates. A two-pixel gutter
 preserves faint anti-alias edges. This data changes drawImage source bounds,
 never the sprite pixels or their world anchor.
 """
 bounds=[]
 for row in range(4):
  for col in range(cols):
   alpha=atlas.crop((col*128,row*128,(col+1)*128,(row+1)*128)).getchannel('A')
   pixels=alpha.load();seen=set();components=[]
   for y in range(128):
    for x in range(128):
     if pixels[x,y]<=32 or (x,y) in seen:continue
     todo=[(x,y)];seen.add((x,y));points=[]
     while todo:
      xx,yy=todo.pop();points.append((xx,yy))
      for ny in range(max(0,yy-1),min(128,yy+2)):
       for nx in range(max(0,xx-1),min(128,xx+2)):
        if (nx,ny) not in seen and pixels[nx,ny]>32:seen.add((nx,ny));todo.append((nx,ny))
     components.append(points)
   body=max(components,key=len);assert len(body)>1000
   x0=max(0,min(x for x,y in body)-2);x1=min(128,max(x for x,y in body)+3)
   y0=max(0,min(y for x,y in body)-2);y1=min(128,max(y for x,y in body)+3)
   # Reject any padding that would include a visible detached strip.
   for extra in components:
    if extra is body or len(extra)<3:continue
    assert not any(x0<=x<x1 and y0<=y<y1 for x,y in extra),('Adjacent-frame pixels within crop',row,col)
   bounds.append([x0,y0,x1-x0,y1-y0])
 return bounds

def publish_bounds(report):
 module=root.parent.parent/'v117-jay.js'
 text=module.read_text();clips={mode:data['frame_bounds'] for mode,data in report.items()}
 line=' const frameClips='+json.dumps(clips,separators=(',',':'))+';\n'
 if ' const frameClips=' in text:text=re.sub(r' const frameClips=.*?;\n',lambda m:line,text)
 else:text=text.replace(" let shift=false,toggle=false;",' // Offline-measured actor bounds exclude adjacent-row bleed.\n'+line+" let shift=false,toggle=false;")
 module.write_text(text)

root.mkdir(parents=True,exist_ok=True);report={}
if sys.argv[1:]==['--bounds-only']:
 report=json.loads((root/'manifest.json').read_text())
 for mode,data in report.items():
  atlas=Image.open(root/data['file']).convert('RGBA')
  assert hashlib.sha256((root/data['file']).read_bytes()).hexdigest()==data['sha256']
  data['frame_bounds']=frame_bounds(atlas,data['columns'])
 (root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');publish_bounds(report)
 print('PASS: measured 68 isolated frame rectangles; atlas pixels unchanged')
 raise SystemExit(0)
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
 report[mode]={'file':target.name,'source_sha256':hashlib.sha256(Path(src).read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'cell':[128,128],'baseline':122,'columns':cols,'rows':['down','left','right','up'],'idle_column':0 if mode=='walk' else None,'unique_by_row':[len(set(hashes[r*cols:(r+1)*cols])) for r in range(4)],'frame_bounds':frame_bounds(atlas,cols)}
 print(mode,atlas.size,target.stat().st_size)
(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')

if len(report)==2:publish_bounds(report)
