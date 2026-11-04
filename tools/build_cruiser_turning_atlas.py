"""Pack retained cruiser art and reviewed in-betweens; never rotate body pixels."""
from pathlib import Path
from PIL import Image, ImageDraw
from collections import deque
import argparse, hashlib, json, math

r=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--approve',action='store_true');args=parser.parse_args()
d=r/'published-game-capture/assets/police-driving/turning';(d/'frames').mkdir(parents=True,exist_ok=True)
sheet=Image.open(d.parent/'cruiser-16-source.png').convert('RGBA')
cell=256;anchor=[128,168];scale=.5
retained={0:0,2:1,4:4,6:5,12:12,14:13,15:15}
baseline=[0,1,4,5,8,10,12,13]

def old_cell(i):
    y=round(i//4*271.5);return sheet.crop((i%4*362,y,i%4*362+362,round((i//4+1)*271.5)))

def body_box(im):
    # Identify the body envelope, excluding tiny detached gutter fragments.
    # Keep every pixel inside this envelope, including dark tires and trim.
    a=im.getchannel('A');w,h=im.size;raw=a.tobytes();seen=bytearray(w*h);components=[]
    for i,v in enumerate(raw):
        if v<64 or seen[i]:continue
        q=deque([i]);seen[i]=1;xs=[];ys=[]
        while q:
            p=q.popleft();x=p%w;y=p//w;xs.append(x);ys.append(y)
            for n in ((p-1 if x else -1),(p+1 if x<w-1 else -1),p-w,p+w):
                if 0<=n<len(raw) and not seen[n] and raw[n]>=64:seen[n]=1;q.append(n)
        components.append((len(xs),(min(xs),min(ys),max(xs)+1,max(ys)+1)))
    biggest=max(components)[0];kept=[b for n,b in components if n>=max(12,biggest*.002)]
    b=(min(b[0] for b in kept),min(b[1] for b in kept),max(b[2] for b in kept),max(b[3] for b in kept))
    return (max(0,b[0]-1),max(0,b[1]-1),min(w,b[2]+1),min(h,b[3]+1))

def hull(points):
    points=sorted(set(points))
    def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];hi=[]
    for p in points:
        while len(lo)>=2 and cross(lo[-2],lo[-1],p)<=0:lo.pop()
        lo.append(p)
    for p in reversed(points):
        while len(hi)>=2 and cross(hi[-2],hi[-1],p)<=0:hi.pop()
        hi.append(p)
    return lo[:-1]+hi[:-1]

def lens(im,b,color):
    pts=[]
    for y in range(b[1],round(b[1]+(b[3]-b[1])*.54)):
        for x in range(b[0],b[2]):
            R,G,B,A=im.getpixel((x,y))
            ok=(R>145 and R>G*1.8 and R>B*1.7) if color=='red' else (B>145 and B-R>100 and B-G>65)
            if A>128 and ok:pts.append((x,y))
    # Keep the lens component, not a distant orange headlamp or glass glint.
    remaining=set(pts);parts=[]
    while remaining:
        first=remaining.pop();part=[first];queue=[first]
        while queue:
            x,y=queue.pop()
            for q in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if q in remaining:remaining.remove(q);part.append(q);queue.append(q)
        parts.append(part)
    pts=max(parts,key=len)
    assert len(pts)>3,(color,b)
    assert max(p[0] for p in pts)-min(p[0] for p in pts)<35
    assert max(p[1] for p in pts)-min(p[1] for p in pts)<35
    return {'polygon':hull(pts),'center':[round(sum(p[k] for p in pts)/len(pts),2) for k in range(2)]}

widths=[]
for i in baseline:
    b=body_box(old_cell(i));widths.append((b[2]-b[0])*.34)
atlas=Image.new('RGBA',(cell*4,cell*4));frames=[]
reference=Image.new('RGB',(cell*4,(cell+24)*4),'#102238');draw=ImageDraw.Draw(reference)
for i in range(16):
    source=old_cell(retained[i]) if i in retained else Image.open(d/'sources'/f'heading-{i:02}.png').convert('RGBA')
    b=body_box(source);crop=source.crop(b);a=math.radians(i*22.5)
    target=(widths[i//2] if i%2==0 else (widths[i//2]+widths[(i//2+1)%8])/2)/scale
    ratio=target/crop.width;size=(round(crop.width*ratio),round(crop.height*ratio))
    assert ratio<=1,'Never upscale the source to claim extra detail'
    sprite=crop.resize(size,Image.Resampling.NEAREST)
    bottom=anchor[1]+round((14*abs(math.cos(a))+34*abs(math.sin(a)))/scale)
    pos=(round(anchor[0]-sprite.width/2),bottom-sprite.height)
    assert pos[0]>=2 and pos[1]>=2 and pos[0]+size[0]<cell-2 and bottom<cell-2,(i,pos,size)
    tile=Image.new('RGBA',(cell,cell));tile.alpha_composite(sprite,pos);tile.save(d/'frames'/f'cruiser-{i:02}.png')
    x=i%4*cell;y=i//4*cell;atlas.alpha_composite(tile,(x,y));bounds=tile.getbbox()
    lighting={color:lens(tile,bounds,color) for color in ['red','blue']}
    frames.append({'index':i,'angleDegrees':i*22.5,'angleRadians':a,'rect':[x,y,cell,cell],
        'anchor':anchor,'visualHeadingOffset':0,'bodyBounds':bounds,'lighting':lighting,
        'source':{'kind':'retained' if i in retained else 'image_gen reconstruction','cell':retained.get(i),
                  'file':'../cruiser-16-source.png' if i in retained else f'sources/heading-{i:02}.png',
                  'crop':b,'uniformExportScale':ratio},
        'sha256':hashlib.sha256(tile.tobytes()).hexdigest()})
    rx=i%4*cell;ry=i//4*(cell+24)
    for yy in range(0,cell,16):
        for xx in range(0,cell,16):draw.rectangle((rx+xx,ry+yy,rx+xx+15,ry+yy+15),fill='#304154' if (xx//16+yy//16)%2 else '#425467')
    reference.paste(tile,(rx,ry),tile)
    draw.line((rx+anchor[0]-8,ry+anchor[1],rx+anchor[0]+8,ry+anchor[1]),fill='#5ff1c4')
    draw.line((rx+anchor[0],ry+anchor[1]-8,rx+anchor[0],ry+anchor[1]+8),fill='#5ff1c4')
    draw.text((rx+8,ry+cell+5),f'{i:02} | {i*22.5:g} degrees',fill='#ffe2a2')
assert len({f['sha256'] for f in frames})==16
atlas.save(d/'cruiser-16-atlas.png');reference.save(d/'angle-reference.png')
manifest={'vehicleId':'precinct-unit-9','atlas':'cruiser-16-atlas.png','reviewed':args.approve,
    'cellSize':[cell,cell],'anchor':anchor,'renderScale':scale,'physicsFootprint':[96,48],
    'angleConvention':'0=east; positive clockwise with screen/world y down; fixed camera, no camera yaw',
    'frameStepDegrees':22.5,'visualHeadingOffset':0,'directionCount':16,
    'pixelBodyRotationsInExport':0,'bodyMirrorsInExport':0,'frames':frames}
(d/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Packed 16 transparent, distinct, unrotated poses; common anchor and per-frame roof-light hulls. Reviewed:',args.approve)
