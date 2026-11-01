#!/usr/bin/env python3
"""V120 reproducible hand-directed pixel-material atlas bake (never run per frame).
Builds small reusable PNGs, not a baked world screenshot. Pillow + numpy only.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math, random, sys

target=Path(sys.argv[1]) if len(sys.argv)>1 else Path('published-game-capture/assets/v120-marina')
target.mkdir(parents=True,exist_ok=True)
rng=random.Random(120)
N=512
y,x=np.mgrid[0:N,0:N].astype(np.float32)
T=2*math.pi
# All frequencies have integer periods, so opposite edges tile without gaps.
u=T*x/N; v=T*y/N
flow=np.sin(3*u+.58*np.sin(2*v)+.29*np.cos(5*v))+\
     .64*np.sin(4*v-.5*np.sin(3*u))+\
     .30*np.cos(7*u+3*v)+.22*np.sin(6*v-5*u)
lagoon=np.cos(2*v+1.5*np.sin(u))*.45+np.sin(3*u-2*v)*.25
depth=np.clip((flow+2.0)/4.0,0,1)
R=np.clip(3+depth*13+lagoon*4,0,255)
G=np.clip(43+depth*62+lagoon*12,0,255)
B=np.clip(75+depth*61+lagoon*8,0,255)
base=Image.fromarray(np.stack([R,G,B],axis=2).astype('uint8'),'RGB').convert('RGBA')
d=ImageDraw.Draw(base,'RGBA')
# Authored clusters of irregular pool-sized facets, not horizontal streaks.
for i in range(125):
    cx=rng.randrange(N);cy=rng.randrange(N)
    r1=rng.randrange(13,54);r2=rng.randrange(9,28)
    vertices=[]
    for k in range(8):
        a=T*k/8;rr=.74+.33*rng.random()
        vertices.append((cx+math.cos(a)*r1*rr,cy+math.sin(a)*r2*rr))
    color=rng.choice([(0,107,147,38),(7,138,165,34),(6,36,78,46),
                      (4,73,112,39),(28,159,172,28)])
    for sx in (-N,0,N):
        for sy in (-N,0,N):
            pts=[(round(px+sx),round(py+sy)) for px,py in vertices]
            d.polygon(pts,fill=color)
# Toned interlocking wave-facet contours.
for i in range(135):
    cx=rng.randrange(N);cy=rng.randrange(N);sx=rng.randrange(17,69)
    pts=[(cx+int(k*sx/5),cy+int(math.sin(k*.7+i)*3+(k/5)*rng.randrange(-4,5))) for k in range(6)]
    for ox in (-N,0,N):
      for oy in (-N,0,N):
        shift=[(px+ox,py+oy) for px,py in pts]
        d.line(shift,fill=(30,174,190,38),width=rng.choice([1,2,2,3]))
base.save(target/'water-body.png',optimize=True)

# Caustics atlas: large curving irregular closed loops and fractured
# illuminated rims. Material scrolls in world space, not camera space.
caustic=Image.new('RGBA',(N,N),(0,0,0,0)); dc=ImageDraw.Draw(caustic,'RGBA')
for i in range(160):
    cx=rng.randrange(N);cy=rng.randrange(N);r1=rng.randrange(10,42);r2=rng.randrange(7,31)
    phase=rng.random()*T;pts=[]
    for k in range(13):
        a=T*k/12;rad=1+.20*math.sin(a*3+phase)+.12*math.cos(a*5-phase)
        pts.append((round(cx+math.cos(a)*r1*rad),round(cy+math.sin(a)*r2*rad)))
    for ox in (-N,0,N):
      for oy in (-N,0,N):
        p=[(px+ox,py+oy) for px,py in pts]
        dc.line(p,fill=(95,234,234,rng.randrange(45,96)),width=rng.choice([1,2,2]),joint='curve')
        if i%3==0:
            dc.line(p[2:8],fill=(208,255,229,82),width=1)
caustic.save(target/'water-caustics.png',optimize=True)

# Shallow reef details: translucent silhouettes visible through turquoise
# water, softened by translucent shape fill; cropped to shore at runtime.
reef=Image.new('RGBA',(N,N),(0,0,0,0)); dr=ImageDraw.Draw(reef,'RGBA')
for i in range(40):
    cx=rng.randrange(N);cy=rng.randrange(N);rx=rng.randrange(9,49);ry=rng.randrange(7,23)
    points=[]
    for k in range(9):
        a=T*k/9;scale=.77+rng.random()*.37
        points.append((cx+math.cos(a)*rx*scale,cy+math.sin(a)*ry*scale))
    color=rng.choice([(5,41,64,72),(9,85,73,76),(24,98,74,64),(2,58,69,74)])
    for ox in (-N,0,N):
      for oy in (-N,0,N):
        dr.polygon([(round(px+ox),round(py+oy)) for px,py in points],fill=color)
for i in range(34):
    cx=rng.randrange(N);cy=rng.randrange(N)
    for ox in (-N,0,N):
      for oy in (-N,0,N):
        yy=cy+oy
        dr.line([(cx+ox,yy),(cx+ox+rng.randrange(-9,10),yy-13)],
          fill=(10,91,80,61),width=2)
reef.save(target/'water-reef.png',optimize=True)

# True hand-authored-looking material, fitted to existing EXACT 90px piers.
wood=Image.new('RGBA',(90,128),(93,53,32,255));dw=ImageDraw.Draw(wood,'RGBA')
for b in range(8):
    y0=b*16;tone=rng.randrange(-9,13)
    col=(min(255,182+tone),min(255,118+tone),min(255,64+tone),255)
    dw.rectangle((4,y0+1,85,y0+14),fill=col)
    dw.line((4,y0+1,85,y0+1),fill=(248,184,113,255),width=2)
    dw.line((4,y0+14,85,y0+14),fill=(76,39,29,255),width=2)
    dw.line((4,y0+4,85,y0+4),fill=(120,72,43,90),width=1)
    for i in range(7):
        xx=rng.randrange(12,77);yy=y0+rng.randrange(4,12)
        dw.line((xx,yy,xx+rng.randrange(4,18),yy),fill=(105,64,42,70))
    for xx in (10,79):
        dw.ellipse((xx-2,y0+6,xx+1,y0+9),fill=(70,68,63,240))
        dw.point((xx-1,y0+6),fill=(231,201,152,255))
dw.rectangle((0,0,4,127),fill=(72,40,31,255))
dw.rectangle((85,0,89,127),fill=(72,40,31,255))
dw.line((4,0,4,127),fill=(241,162,95,255),width=2)
dw.line((85,0,85,127),fill=(100,61,38,255),width=2)
wood.save(target/'dock-wood.png',optimize=True)

# 4 animation frames, each 96 square. White broken circular contact foam.
foam=Image.new('RGBA',(384,96),(0,0,0,0));df=ImageDraw.Draw(foam,'RGBA')
for frame in range(4):
    cx=frame*96+48; cy=48
    for ring in range(3):
        radius=16+ring*9+frame*2
        for segment in range(13):
            a=(segment+frame*.7+ring*.5)*T/13
            if (segment+ring+frame)%5==0:continue
            px=cx+math.cos(a)*radius;py=cy+math.sin(a)*radius*.55
            color=(221,254,241,190-ring*42)
            df.ellipse((px-2,py-1,px+3,py+2),fill=color)
    df.arc((cx-26-frame*1.4,cy-16,cx+26+frame*1.4,cy+16),
           200,338,fill=(157,244,246,160),width=2)
foam.save(target/'foam-frames.png',optimize=True)

# Pixel-art timber piling sprite with rope wraps, silver weathered cap and
# algae-blackened base; alpha backdrop. Drawn once for each existing piling.
post=Image.new('RGBA',(36,76),(0,0,0,0));dp=ImageDraw.Draw(post,'RGBA')
dp.ellipse((4,65,34,74),fill=(3,28,46,150))
dp.rounded_rectangle((8,8,29,70),radius=3,fill=(99,54,34,255),outline=(52,34,30,255),width=2)
dp.rectangle((12,15,15,60),fill=(213,133,69,230))
dp.rectangle((23,16,25,61),fill=(49,37,28,200))
dp.rectangle((9,56,29,70),fill=(21,80,69,170))
for yy in (21,25,45,49):
    dp.arc((6,yy-4,31,yy+6),0,180,fill=(247,204,124,255),width=3)
    dp.arc((6,yy-4,31,yy+6),180,360,fill=(155,99,53,255),width=2)
dp.ellipse((7,3,31,15),fill=(242,222,172,255),outline=(101,94,90,255),width=2)
dp.ellipse((11,5,28,12),fill=(255,244,214,255))
post.save(target/'dock-post.png',optimize=True)

# Warm sea-wall embedded light panel, pixel art, with built-in metal housing.
light=Image.new('RGBA',(40,30),(0,0,0,0));dl=ImageDraw.Draw(light,'RGBA')
dl.rectangle((2,6,37,24),fill=(20,38,49,250),outline=(183,138,79,255),width=2)
dl.rectangle((7,10,32,20),fill=(255,194,74,255))
dl.rectangle((9,11,30,17),fill=(255,244,167,255))
dl.line((8,23,32,23),fill=(78,57,38,255),width=2)
light.save(target/'seawall-light.png',optimize=True)

# Dappled shadow mask: overlapping clustered leaf silhouette patches.
shadow=Image.new('RGBA',(300,210),(0,0,0,0));ds=ImageDraw.Draw(shadow,'RGBA')
for cx,cy,s in [(74,45,1),(155,65,1.3),(228,45,.94),(112,150,.92),(238,165,1.1)]:
    for j in range(38):
        a=rng.random()*T;r=rng.random()*42*s
        xx=cx+math.cos(a)*r;yy=cy+math.sin(a)*r*.54
        rad=rng.randrange(4,14)*s
        ds.ellipse((xx-rad,yy-rad*.55,xx+rad,yy+rad*.55),fill=(16,42,59,47))
shadow.save(target/'tree-shadows.png',optimize=True)
print('V120 material atlas baked:', ', '.join(p.name for p in target.glob('*.png')))
