"""Prepare modular wall crops from the owner's supplied precinct interior pack."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,shutil
r=Path(__file__).resolve().parent.parent
ref=r/'docs/references/precinct-interior-asset-sheet.png'
if not ref.exists():shutil.copy2(r'C:\Users\marre\AppData\Local\Temp\codex-clipboard-a1258c07-7fd4-4136-be83-cb343ef260f7.png',ref)
s=Image.open(ref).convert('RGBA');out=r/'published-game-capture/assets/precinct-interior-walls';out.mkdir(exist_ok=True)
spec={
 'wall_plain':((25,147,178,265),(64,48)),
 'wall_badge':((325,147,426,265),(64,48)),
 'wall_picture':((634,135,716,227),(64,48)),
 'wall_stone':((824,136,907,227),(64,48)),
 'wall_utility':((918,136,1000,227),(64,48)),
 'end_cap':((519,148,542,265),(24,48)),
 'jamb':((422,458,434,552),(8,48)),
 'top_cap':((25,148,178,157),(64,4)),
 'baseboard':((25,235,178,263),(64,12)),
}
a=Image.new('RGBA',(512,256));frames={};x=y=rowh=0
for name,(box,size) in spec.items():
 im=s.crop(box).resize(size,Image.Resampling.NEAREST)
 if x+size[0]>512:x=0;y+=rowh+2;rowh=0
 a.paste(im,(x,y));frames[name]={'atlas':{'x':x,'y':y,'w':size[0],'h':size[1]},'sourceCrop':list(box),'anchor':'bottom-left'}
 x+=size[0]+2;rowh=max(rowh,size[1])
# Orthogonal side-wall strip: source cap, plaster and navy trim run along
# the existing wall thickness. No world rotation or illustrated room overlay.
v=Image.new('RGBA',(24,32));v.paste(s.crop((30,149,170,156)).resize((6,32),Image.Resampling.NEAREST),(0,0));v.paste(s.crop((36,184,150,216)).resize((15,32),Image.Resampling.NEAREST),(6,0));v.paste(s.crop((32,240,170,252)).resize((3,32),Image.Resampling.NEAREST),(21,0))
a.paste(v,(0,104));frames['wall_vertical']={'atlas':{'x':0,'y':104,'w':24,'h':32},'source':'cap/plaster/navy trim from owner pack','anchor':'top-left'}
# Furniture uses unused space in the SAME atlas; wall pixels remain identical.
from collections import deque
def cutout(box,size):
 im=s.crop(box);px=im.load();seen=set();q=deque()
 def background(x,y):
  r,g,b,alpha=px[x,y];return r<38 and g<50 and b<70
 for xx in range(im.width):q.extend([(xx,0),(xx,im.height-1)])
 for yy in range(im.height):q.extend([(0,yy),(im.width-1,yy)])
 while q:
  xx,yy=q.popleft()
  if (xx,yy) in seen or xx<0 or yy<0 or xx>=im.width or yy>=im.height:continue
  seen.add((xx,yy))
  if not background(xx,yy):continue
  px[xx,yy]=(0,0,0,0);q.extend([(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)])
 return im.resize(size,Image.Resampling.NEAREST)
closed=cutout((550,649,681,769),(132,120))
opened=closed.copy();door=cutout((744,652,778,763),(36,114));ImageDraw.Draw(opened).rectangle((48,8,83,117),fill=(20,34,48,255));opened.paste(door,(48,4),door)
pieces={
 'locker_closed':(closed,(26,104),(550,649,681,769)),
 'locker_open':(opened,(160,104),'closed bank with owner open-door crop (744,652,778,763)'),
 'changing_bench':(cutout((553,792,675,841),(108,44)),(294,104),(553,792,675,841)),
 'locker_bag':(cutout((918,647,971,678),(28,16)),(404,104),(918,647,971,678)),
 'locker_towels':(cutout((931,686,966,709),(20,13)),(434,104),(931,686,966,709)),
}
for name,(im,pos,crop) in pieces.items():
 a.paste(im,pos);frames[name]={'atlas':{'x':pos[0],'y':pos[1],'w':im.width,'h':im.height},'sourceCrop':crop,'anchor':'bottom-center','role':'locker-room furniture'}
a.save(out/'walls-atlas.png')
(out/'manifest.json').write_text(json.dumps({'id':'precinct-interior-walls','tileSize':32,'worldPixelsPerAssetPixel':1,'atlas':'walls-atlas.png','atlasSize':[512,256],'wallHeight':48,'frames':frames,'connections':{'corner':['wall_plain','wall_vertical','top_cap'],'t_junction':['wall_plain','wall_vertical','top_cap'],'intersection':['wall_plain','wall_vertical','top_cap'],'end':['end_cap'],'door':'Reuse precinctDoors.plan jambs; preserve passage rectangle'}},indent=2),encoding='utf-8')
print('Prepared owner-derived wall and locker modules in one shared atlas.')
