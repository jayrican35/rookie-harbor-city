"""Validate corrected source frames, preserve originals, export aligned runtime atlases."""
from pathlib import Path
from io import BytesIO
from collections import deque
from PIL import Image, ImageDraw, ImageChops
import hashlib
import json
import zipfile

r=Path.cwd()
source=Path('C:/Users/marre/Downloads/HarborCity_All_30_ApprovedStyle_Civilian_Atlas_Pack.zip')
out=r/'published-game-capture/assets/civilian-corrected'
docs=r/'docs/civilian-corrected'
out.mkdir(parents=True,exist_ok=True)
(docs/'source/atlases').mkdir(parents=True,exist_ok=True)
(r/'civilian-evidence/corrected-inspection').mkdir(parents=True,exist_ok=True)

def clean_border_fragments(frame):
    alpha=frame.getchannel('A')
    remaining={(x,y) for y in range(frame.height) for x in range(frame.width) if alpha.getpixel((x,y))}
    components=[]
    while remaining:
        seed=remaining.pop();group=[seed];queue=deque([seed])
        while queue:
            x,y=queue.popleft()
            for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
                p=(x+dx,y+dy)
                if p in remaining:
                    remaining.remove(p);group.append(p);queue.append(p)
        components.append(group)
    main=max(components,key=len)
    bx=(min(x for x,y in main)-3,min(y for x,y in main)-3,max(x for x,y in main)+3,max(y for x,y in main)+3)
    removed=0
    for group in components:
        # Keep all substantial anatomy/accessories and small details inside the
        # body envelope. Only tiny detached outer sheet fragments are removed.
        gx0=min(x for x,y in group);gx1=max(x for x,y in group)
        gy0=min(y for x,y in group);gy1=max(y for x,y in group)
        header_line=gy1<40 and (gx1-gx0+1)>=8*(gy1-gy0+1)
        if len(group)>=128 or not header_line or all(bx[0]<=x<=bx[2] and bx[1]<=y<=bx[3] for x,y in group):continue
        for x,y in group:
            frame.putpixel((x,y),(0,0,0,0));removed+=1
    return removed

report=[]
with zipfile.ZipFile(source) as z:
    original=json.loads(z.read('manifest.json'))
    assert original['frame']['width']==192 and original['frame']['height']==240
    assert original['frame']['anchor']==[96,225]
    assert original['frame']['rows']==['down','left','right','up']
    assert len(original['roles'])==30
    (docs/'source/manifest.json').write_bytes(z.read('manifest.json'))
    for name in ['README_FIRST.md','docs/QA_REPORT.json','docs/CODEX_LOCAL_IMPORT.md']:
        (docs/'source'/Path(name).name).write_bytes(z.read(name))
    manifest={'frame_size':[128,160],'anchor':[64,150],'directions':['down','left','right','up'],
              'source_frame_size':[192,240],'source_anchor':[96,225],'characters':{}}
    sheet=Image.new('RGB',(1280,1440),'#172b43');pen=ImageDraw.Draw(sheet)
    for index,(role,spec) in enumerate(original['roles'].items()):
        assert not spec['is_police']
        raw=z.read(spec['atlas']);im=Image.open(BytesIO(raw)).convert('RGBA')
        assert im.size==(768,960) and im.getchannel('A').getextrema()==(0,255),role
        (docs/'source/atlases'/Path(spec['atlas']).name).write_bytes(raw)
        atlas=Image.new('RGBA',(512,640));frames=[];clipped_head_frames=[]
        for row in range(4):
            hashes=[]
            for col in range(4):
                frame=im.crop((col*192,row*240,(col+1)*192,(row+1)*240))
                if row==0 and any(frame.getpixel((x,0))[3]>128 for x in range(192)):
                    clipped_head_frames.append(col)
                anatomy_alpha=frame.getchannel('A').crop((0,40,192,240))
                removed=clean_border_fragments(frame)
                assert ImageChops.difference(anatomy_alpha,frame.getchannel('A').crop((0,40,192,240))).getbbox() is None
                box=frame.getbbox();assert box and box[0]>0 and box[2]<192 and box[3]<240,(role,row,col,box)
                small=frame.resize((128,160),Image.Resampling.NEAREST)
                atlas.paste(small,(col*128,row*160))
                digest=hashlib.sha256(small.tobytes()).hexdigest();hashes.append(digest)
                frames.append({'row':row,'column':col,'bounds':box,'removed_outer_fragment_pixels':removed,'hand_and_leg_source_alpha_unchanged':True,'hash':digest})
            assert len(set(hashes))>1,(role,row,'frozen cycle')
        target=out/spec['atlas'];assert target.resolve().is_relative_to(out.resolve());target.parent.mkdir(parents=True,exist_ok=True);atlas.save(target)
        manifest['characters'][role]={'label':spec['name'],'walk_atlas':spec['atlas'],'playback_allowed':not clipped_head_frames,
            'hold_reason':'Front headwear is clipped at the supplied source image top edge.' if clipped_head_frames else None}
        report.append({'role':role,'source_sha256':hashlib.sha256(raw).hexdigest(),'runtime_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'clipped_front_frames':clipped_head_frames,'frames':frames})
        x=index%5*256;y=index//5*240
        pen.text((x+8,y+5),spec['name'],fill='#ffd36a')
        for row in range(4):
            thumb=atlas.crop((128,row*160,256,(row+1)*160)).resize((64,80),Image.Resampling.NEAREST)
            for yy in range(y+26,y+106,8):
                for xx in range(x+row*64,x+(row+1)*64,8):
                    pen.rectangle((xx,yy,xx+7,yy+7),fill='#516172' if ((xx//8+yy//8)%2) else '#334252')
            sheet.paste(thumb,(x+row*64,y+26),thumb)
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2))
    (docs/'validation.json').write_text(json.dumps({'source_zip_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'source_frame':[192,240],'runtime_frame':[128,160],'source_anchor':[96,225],'runtime_anchor':[64,150],
        'processing':'Whole-frame nearest-neighbor export; tiny detached outer sheet fragments only removed; no anatomy recoloring or replacement', 'roles':report},indent=2))
    (docs/'held-frames.json').write_text(json.dumps({r['role']:{'direction':'down','frame_indices':r['clipped_front_frames'],'reason':'Opaque hat pixels touch the actual source top edge; separate frame files match the clipped atlas.'} for r in report if r['clipped_front_frames']},indent=2))
    sheet.save(r/'civilian-evidence/corrected-inspection/all-directions.png')
status=out/'review-status.json'
if not status.exists():status.write_text(json.dumps({'approvedForPlayback':False,'status':'visual-review-pending'},indent=2))
print('Validated 480 corrected source frames; preserved original PNGs and exported 30 complete aligned runtime atlases.')
