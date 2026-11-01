#!/usr/bin/env python3
"""V121 authored material replacement for the PLAYABLE marina; deterministic offline
pixel atlas bake. Requires Pillow and NumPy only. Does not render a static scene."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
import math,random,sys
dst=Path(sys.argv[1]) if len(sys.argv)>1 else Path('published-game-capture/assets/v121-marina')
dst.mkdir(parents=True,exist_ok=True)
N=512; T=2*math.pi
y,x=np.mgrid[0:N,0:N].astype('float32');u=T*x/N;v=T*y/N
def noise(c,seed):
 r=np.random.default_rng(seed).random((c,c)).astype('float32')
 a=x*c/N;b=y*c/N;ix=np.floor(a).astype(int);iy=np.floor(b).astype(int)
 fx=a-ix;fy=b-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy)
 return (r[iy%c,ix%c]*(1-fx)+r[iy%c,(ix+1)%c]*fx)*(1-fy)+(r[(iy+1)%c,ix%c]*(1-fx)+r[(iy+1)%c,(ix+1)%c]*fx)*fy
warpU=.85*np.sin(2*v+.7*np.sin(3*u))+.2*np.sin(5*v+2*u)
warpV=.65*np.sin(2*u-.5*np.sin(4*v))+.2*np.cos(4*u-3*v)
flow=.55*np.sin(2*u+warpU)+.45*np.cos(3*v+warpV)+.22*np.sin(5*u-3*v+.6*np.sin(2*v))
low=.35*noise(2,118)+.35*noise(4,111)+.18*noise(8,108)+.12*noise(20,109)
light=np.clip(.46+flow*.22+(low-.5)*.46,0,1)
glow=np.maximum(0,np.sin(2*v+warpV)*np.cos(2*u+warpU))**3
rgb=np.stack([1+light*8+glow*12,41+light*98+glow*25,75+light*82+glow*16],axis=-1).clip(0,255).astype('uint8')
im=Image.fromarray(rgb,'RGB').convert('RGBA');d=ImageDraw.Draw(im,'RGBA')
rr=random.Random(121)
for i in range(84):
 px=rr.randrange(N);py=rr.randrange(N);length=rr.randrange(14,54);rise=rr.randrange(3,11)
 pts=[(px+int(j*length/8),py+int(math.sin(j*math.pi/8)*rise)) for j in range(9)]
 a=rr.randrange(19,45)
 for ox in (-N,0,N):
  for oy in (-N,0,N):d.line([(p+ox,q+oy) for p,q in pts],fill=(48,206,206,a),width=1)
im.save(dst/'water-body.png',optimize=True)
# Sparse bent cellular illumination: avoid V120's bright continuous ice-crack lattice.
S=10;step=N/S;sites=np.random.default_rng(122).uniform(-.28,.28,(S,S,2))
wx=x+9*np.sin(2*v+.35*np.cos(4*u))+4*np.sin(5*v-3*u)
wy=y+8*np.sin(2*u-.4*np.sin(3*v))
d1=np.full((N,N),1e10,dtype='float32');d2=d1.copy()
for j in range(S):
 for i in range(S):
  sx=step*(i+.5+sites[j,i,0]);sy=step*(j+.5+sites[j,i,1])
  dx=((wx-sx+N/2)%N)-N/2;dy=((wy-sy+N/2)%N)-N/2
  dist=dx*dx+dy*dy
  d2=np.where(dist<d1,d1,np.minimum(d2,dist));d1=np.minimum(d1,dist)
edge=np.sqrt(d2)-np.sqrt(d1)
mask=(.18+.82*np.clip((noise(3,201)-.35)*2.3,0,1))*(.45+.55*np.maximum(0,np.sin(u*2+v*3)))
alpha=np.clip(np.exp(-.5*(edge/2.5)**2)*mask*115,0,120).astype('uint8')
caust=Image.fromarray(np.stack([np.full((N,N),160,dtype='uint8'),np.full((N,N),245,dtype='uint8'),np.full((N,N),232,dtype='uint8'),alpha],axis=-1),'RGBA')
caust.save(dst/'water-caustics.png',optimize=True)
reef=Image.new('RGBA',(N,N));d=ImageDraw.Draw(reef,'RGBA');rr=random.Random(123)
for k in range(42):
 cx=rr.randrange(N);cy=rr.randrange(N);rx=rr.randrange(8,42);ry=rr.randrange(4,22)
 pts=[]
 for i in range(9):
  a=T*i/9;r=.7+rr.random()*.45;pts.append((cx+math.cos(a)*rx*r,cy+math.sin(a)*ry*r))
 color=rr.choice([(0,41,51,54),(5,67,66,60),(19,98,74,43)])
 for ox in (-N,0,N):
  for oy in (-N,0,N):d.polygon([(round(px+ox),round(py+oy)) for px,py in pts],fill=color)
reef.save(dst/'water-reef.png',optimize=True)
spark=Image.new('RGBA',(384,96));d=ImageDraw.Draw(spark,'RGBA');rr=random.Random(124)
for f in range(4):
 for j in range(15):
  cx=f*96+rr.randrange(6,90);cy=rr.randrange(9,87);r=rr.choice([1,1,2,2,3,4])
  a=rr.randrange(70,210) if (j+f)%4 else rr.randrange(190,245)
  d.line((cx-r*3,cy,cx+r*3,cy),fill=(207,255,244,a))
  d.line((cx,cy-r*2,cx,cy+r*2),fill=(225,255,244,a))
  d.ellipse((cx-1,cy-1,cx+1,cy+1),fill=(255,253,208,a))
spark.save(dst/'water-glints.png',optimize=True)
foam=Image.new('RGBA',(384,96));d=ImageDraw.Draw(foam,'RGBA');rr=random.Random(125)
for f in range(4):
 cx=f*96+48;cy=48
 for ring in range(3):
  rad=14+ring*10+f*1.2
  for i in range(24):
   a=T*(i+.2*f+.15*ring)/24
   if (i+ring+f)%6 in (0,1):continue
   radw=rad+math.sin(i*.8+f)*2
   px=cx+math.cos(a)*radw;py=cy+math.sin(a)*radw*.6;br=rr.choice([1,1,2,2,3])
   d.ellipse((px-br,py-br*.55,px+br+2,py+br*.55+1),fill=(218,253,243,rr.randint(110,210)-ring*27))
 for i in range(6):
  xx=cx+rr.randrange(-28,29);yy=cy+rr.randrange(-14,15)
  d.line((xx,yy,xx+rr.randrange(3,12),yy-1),fill=(249,255,240,rr.randrange(80,155)))
foam.save(dst/'foam-frames.png',optimize=True)
wood=Image.new('RGBA',(90,192),(89,46,25,255));d=ImageDraw.Draw(wood,'RGBA');rr=random.Random(126)
for row in range(12):
 py=row*16;tone=rr.randrange(-8,13);c=(195+tone,126+tone,69+tone,255)
 d.rectangle((4,py+1,85,py+13),fill=c)
 d.line((5,py+1,84,py+1),fill=(255,202,118,255),width=2)
 d.line((5,py+13,84,py+13),fill=(75,43,30,255),width=3)
 d.line((5,py+8,85,py+8),fill=(131,75,45,90))
 for k in range(10):
  px=rr.randrange(9,77);yy=py+rr.randrange(3,11);ln=rr.randrange(4,20)
  d.line((px,yy,px+ln,yy+rr.choice([-1,0,0,1])),fill=rr.choice([(107,64,38,90),(243,174,99,105),(140,79,42,112)]))
 for px in (11,79):
  d.ellipse((px-2,py+6,px+1,py+9),fill=(65,62,59,255));d.point((px-1,py+6),fill=(240,209,159))
for px in range(90):
 if px<6:color=(25,24,29,min(170,(6-px)*23))
 elif px>81:color=(25,23,30,min(180,(px-81)*25))
 else:continue
 d.line((px,0,px,191),fill=color)
wood.save(dst/'dock-wood.png',optimize=True)
post=Image.new('RGBA',(44,92));d=ImageDraw.Draw(post,'RGBA')
d.ellipse((4,77,41,88),fill=(2,18,35,130))
d.rounded_rectangle((8,10,34,81),radius=4,fill=(99,48,28,255),outline=(45,29,30,255),width=2)
d.rectangle((12,18,17,70),fill=(217,133,66,220));d.rectangle((26,17,30,70),fill=(49,29,25,200))
d.polygon([(8,70),(34,70),(34,82),(8,81)],fill=(9,66,62,185))
for yy in (27,31,57,61):
 d.arc((5,yy-5,38,yy+8),2,178,fill=(253,208,118,255),width=3)
 d.arc((5,yy-5,38,yy+8),182,356,fill=(158,91,49,255),width=2)
d.ellipse((6,3,37,19),fill=(206,201,171,255),outline=(68,73,76,255),width=2)
d.ellipse((10,5,34,15),fill=(253,237,205,255))
d.arc((10,4,34,16),200,350,fill=(255,254,234,255),width=2)
post.save(dst/'dock-post.png',optimize=True)
shadow=Image.new('RGBA',(300,220));d=ImageDraw.Draw(shadow,'RGBA');rr=random.Random(127)
for cx,cy,r in [(80,58,50),(166,82,61),(245,62,44),(106,170,52),(243,171,53)]:
 for i in range(55):
  a=rr.random()*T;dist=rr.random()*r;xx=cx+math.cos(a)*dist;yy=cy+math.sin(a)*dist*.66;radius=rr.randrange(4,15)
  d.ellipse((xx-radius,yy-radius*.49,xx+radius,yy+radius*.49),fill=(21,31,50,rr.randrange(54,100)))
shadow.save(dst/'tree-shadows.png',optimize=True)
light=Image.new('RGBA',(40,30));d=ImageDraw.Draw(light,'RGBA')
d.rectangle((2,6,37,24),fill=(24,36,44,255),outline=(181,141,77,255),width=2)
d.rectangle((6,9,33,21),fill=(245,160,59,255))
d.rectangle((10,11,29,17),fill=(255,246,176,255))
d.line((7,23,34,23),fill=(74,44,31,255),width=2)
light.save(dst/'seawall-light.png',optimize=True)
print('PASS V121: 9 separate production-art materials:',[(p.name,p.stat().st_size) for p in dst.glob('*.png')])
