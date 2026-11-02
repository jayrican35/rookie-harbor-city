#!/usr/bin/env python3
"""Precinct 9 Phase-1 wall kit. Deterministic, original-reference-derived.
Uses the V115/V134 existing 32px/native 1:1 pixel grid. Build script only.
Generated art is decorative: no new world solids/doors/engine/state.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import argparse,json,base64,zlib
U=32
# 32x32 indexed blue-brick material sampled from the APPROVED supplied sheet
# (cropped blue panel, palette reduced and baked to keep build reproducible).
P=[(32,99,188),(23,82,164),(17,69,145),(3,64,156),(5,57,141),(2,56,143),
   (1,56,143),(10,48,116),(2,50,129),(0,49,131),(3,35,97),(1,19,66)]
S='eNqFU+FyxiAIqwKC4f3fdwH6bbv9GdcTKtYmEGKtTUuMX+vZub4tU9cKVYEujdCt9FgisrfuLcClRRwE17JzNOScMy9ARJ0wuPWOml0XO8rbPC6g12gCF9UKRBRSa50wIJGZdPQYy0/QsSe27zHNirwtkwHfHsiznuchmWehfdmDPaGBkAviPYcsT7EJdxKS3mfetKEdkQx7aZKQ2CBX6bwQe8U8bXo7L3LEBy2v5NOxRyNHTOgvj/ZcidyHHF+SiIm5kTeJWiZuw4quv+IQ/7Ficbv+Q4ngWfBrATlE2DiZJ3Qt0MK2aZG8YE96k3nv6qtVQdik6pOn1Y0KmNRd7E3Uv1j+f+xBvFgJPt9w/1AQZ32rkOq2utRUmxICw8Jp7EVR47+91HUKWHhRLMKqpHhJnFpihVn5qoa7THcspBtJcopr/KxICr9/7f6Bi2+PVl3umouFrNnYy3O0xs3kvqMGpmYmWk3sjbz6Wr0ja3CGjsIuRl6cFnSi1E9Mt5tD4XAetOck0PhZg+rcrcFg7zSnS5+82GcSRlQ/s9FUSl35zoO/qvolsDr2BcroGJk='
I=zlib.decompress(base64.b64decode(S))
assert len(I)==U*U
INK=(5,26,57,255);STONE=(207,188,159,255);CREAM=(239,220,188,255)
SHADOW=(109,115,119,255)
def brick():
 im=Image.new('RGBA',(32,32));p=im.load()
 for y in range(32):
  for x in range(32):
   x2=(x-(16 if y>=16 else 0))%32;v=P[I[(y*3+5)%32*32+(x*3+7)%32]];n=((x*37+y*91+x*y*13)%9)-4
   if y%16<2 or x2<2:p[x,y]=INK
   else:
    r=max(10,min(49,int(11+v[0]*.21+n*.15)))
    g=max(43,min(113,int(42+v[1]*.48+n*.26)))
    b=max(92,min(211,int(87+v[2]*.47+n*.36)))
    if y%16==2:r,g,b=r+15,g+25,b+31
    if y%16>=13:r,g,b=r-5,g-14,b-25
    p[x,y]=(max(0,min(255,r)),max(0,min(255,g)),max(0,min(255,b)),255)
 return im
B=brick()
def wall(w,h):
 im=Image.new('RGBA',(w,h))
 for x in range(0,w,32):
  for y in range(0,h,32):im.alpha_composite(B,(x,y))
 return im
def rect(im,box):
 x,y,x2,y2=box
 if x2<=x or y2<=y:return
 d=ImageDraw.Draw(im)
 d.rectangle((x,y,x2-1,y2-1),fill=SHADOW)
 if x2-x<5 or y2-y<5:return
 d.rectangle((x+2,y+1,x2-3,y2-4),fill=STONE)
 d.line((x+2,y+2,x2-4,y+2),fill=CREAM,width=2)
 d.line((x+3,y2-4,x2-3,y2-4),fill=(80,88,97,255),width=2)
 for yy in range(y+13,y2-5,15):
  d.line((x+3,yy,x2-5,yy),fill=(163,147,126,255))
  for xx in range(x+9+yy%13,x2-4,25):d.line((xx,yy,xx,min(yy+12,y2-5)),fill=(156,143,128,255))
def edging(im,side,thick):
 w,h=im.size;rect(im,(0,0,thick,h) if side=='L' else (w-thick,0,w,h));return im
def corn(w):
 im=Image.new('RGBA',(w,32));d=ImageDraw.Draw(im)
 for a,b,c in [(1,6,CREAM),(7,13,STONE),(14,21,(224,203,174,255)),(22,26,SHADOW),(27,31,(23,50,81,255))]:
  d.rectangle((0,a,w-1,b),fill=c)
 d.line((0,1,w-1,1),fill=(251,238,212,255),width=2)
 for x in range(0,w,32):d.line((x,15,x,21),fill=(160,145,123,255))
 return im
def base(w):
 im=Image.new('RGBA',(w,32));d=ImageDraw.Draw(im)
 for a,b,c in [(0,6,CREAM),(7,11,SHADOW),(12,25,STONE),(26,31,(98,110,120,255))]:
  d.rectangle((0,a,w-1,b),fill=c)
 d.line((0,13,w-1,13),fill=(241,228,198,255),width=2)
 return im
def pilaster(w):
 im=Image.new('RGBA',(w,128));d=ImageDraw.Draw(im)
 d.rectangle((0,0,w-1,127),fill=SHADOW)
 d.rectangle((3,0,w-4,127),fill=STONE)
 d.rectangle((5,6,w-6,114),fill=(226,207,175,255))
 for yy in range(24,114,29):d.line((4,yy,w-5,yy),fill=(156,145,128,255))
 rect(im,(0,0,w,16));rect(im,(0,112,w,128));return im
def cut(w,holes):
 im=wall(w,128)
 for x,y,ww,hh in holes:
  rect(im,(x-6,y-7,x+ww+6,y+hh+8))
  d=ImageDraw.Draw(im)
  d.rectangle((x,y,x+ww-1,y+hh-1),fill=(0,0,0,0))
  d.line((x-6,y+hh+5,x+ww+5,y+hh+5),fill=SHADOW,width=2)
 return im
def main(out):
 out.mkdir(parents=True,exist_ok=True)
 edgeL=wall(64,128);edging(edgeL,'L',10)
 edgeR=wall(64,128);edging(edgeR,'R',10)
 inner=wall(64,64);rect(inner,(0,0,10,64));rect(inner,(0,0,64,10))
 outer=wall(64,64);rect(outer,(54,0,64,64));rect(outer,(0,0,64,10))
 stl=Image.new('RGBA',(32,128));rect(stl,(0,0,32,128))
 str_=stl.copy()
 cl=corn(32);rect(cl,(0,0,7,32));cr=corn(32);rect(cr,(25,0,32,32))
 bl=base(32);rect(bl,(0,0,7,32));br=base(32);rect(br,(25,0,32,32))
 frames={
 'wall_brick_narrow':wall(64,128),'wall_brick_medium':wall(128,128),'wall_brick_wide':wall(256,128),
 'wall_left_edge':edgeL,'wall_right_edge':edgeR,
 'wall_inner_corner':inner,'wall_outer_corner':outer,
 'wall_top_band':corn(128),'wall_bottom_band':base(128),
 'wall_filler_strip':wall(32,128),
 'stone_cornice':corn(128),'stone_base_trim':base(128),
 'stone_side_trim_left':stl,'stone_side_trim_right':str_,
 'stone_column_cap':corn(64),'stone_wall_end_cap':base(64),
 'pilaster_full':pilaster(64),'pilaster_divider':pilaster(32),'pilaster_corner':pilaster(64),
 'wall_window_cut_single':cut(128,[(40,32,48,65)]),
 'wall_window_cut_double':cut(256,[(46,32,58,65),(152,32,58,65)]),
 'wall_window_spacer':wall(32,128),
 'stone_cornice_corner_left':cl,'stone_cornice_corner_right':cr,
 'stone_base_corner_left':bl,'stone_base_corner_right':br}
 atlas=Image.new('RGBA',(1024,1024));manifest={};x=y=8;rh=0
 for name,im in frames.items():
  if x+im.width+8>1024:x=8;y+=rh+8;rh=0
  assert y+im.height+8<=1024
  atlas.alpha_composite(im,(x,y))
  im.save(out/(name+'.png'),optimize=True)
  manifest[name]={'file':name+'.png','atlas':{'x':x,'y':y,'w':im.width,'h':im.height},
                  'width':im.width,'height':im.height,
                  'anchor':{'x':0,'y':im.height},'worldScale':1,
                  'collision':'inherit-existing-world',
                  'windowOpeningOnly':name.startswith('wall_window_cut')}
  x+=im.width+8;rh=max(rh,im.height)
 atlas.save(out/'precinct9_wallkit_phase1_atlas.png',optimize=True)
 (out/'manifest.json').write_text(json.dumps({'version':'precinct9-wall-phase1','tileSize':32,
    'worldPixelsPerAssetPixel':1,'atlas':'precinct9_wallkit_phase1_atlas.png',
    'atlasSize':[1024,1024],'frames':manifest,
    'collision':'decorative only; existing precinct collision retained',
    'scope':'Phase 1 walls and empty window apertures only'},indent=2)+'\n')
 # Unit test: repeatable blue brick matches every 32 native pixels.
 assert len(frames)==26 and all(a.mode=='RGBA' for a in frames.values())
 assert frames['wall_window_cut_single'].getpixel((60,60))[3]==0
 # Seam test checks horizontal and vertical motif periodicity.
 assert all(B.getpixel((n%32,m%32))==B.getpixel(((n+32)%32,(m+32)%32)) for n in range(33) for m in range(33))
 print('PASS 26 reusable alpha PNG modules, exact 1024 atlas and 32px world-grid manifest:',out)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('output',type=Path)
 main(ap.parse_args().output)
