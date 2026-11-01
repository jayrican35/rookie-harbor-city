from PIL import Image,ImageDraw,ImageFont
import random, math, os
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent/'published-game-capture/assets/v116-marina';ROOT.mkdir(parents=True,exist_ok=True)
F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=lambda n: ImageFont.truetype(F,n)
def seeded(i): return random.Random(19631+i)
def pxpoly(draw,points,color):draw.polygon(points,fill=color)
# Authentic repeating 32x32 16-bit inspired image tiles. Every tile drawn once to an atlas.
atlas=Image.new('RGBA',(256,128),(0,0,0,0))
colors=['#cfab80','#c99b75','#bd8d69','#d3ae88','#427e50','#386f46','#568a55','#304f40','#154a74','#206486','#267c9a','#377a9c','#866544','#b78b5d','#d0a576','#a77e53','#455765','#d7c5a7','#596958','#6e7976','#d69c82','#deb398','#9a6959','#91af85','#193953','#226b90','#3b8f9a','#f4e4be','#5b4a48','#435d55','#79a0ad','#2c6a71']
for idx in range(32):
 im=Image.new('RGBA',(32,32),colors[idx]);d=ImageDraw.Draw(im);rng=seeded(idx)
 if idx in (0,1,2,3,20,21,22,27):
  for y in range(0,32,8):
   for x in range(-8 if (y//8)%2 else 0,32,16):
    d.rectangle((x,y,x+15,y+7),outline=('#8f705d' if idx!=27 else '#a89d87'),width=1)
    d.line((x+2,y+1,x+12,y+1),fill='#efd8ae' if idx in (0,1,3,21,27) else '#c4a58f')
  for j in range(12):
   x=rng.randrange(32);y=rng.randrange(32); d.point((x,y),fill='#e7c6a7' if j%2 else '#916f5c')
 elif idx in (4,5,6,7,23):
  for j in range(110):
   x=rng.randrange(32);y=rng.randrange(32)
   color=['#2f6947','#6d9954','#8ea958','#244f3e','#568f46'][rng.randrange(5)]
   d.point((x,y),fill=color)
   if j%7==0:d.line((x,y,x+1,y-2),fill='#b0bd6b')
 elif idx in (8,9,10,11,24,25,26,29,31):
  for j in range(14):
   x=rng.randrange(-7,32);y=rng.randrange(32)
   d.line((x,y,x+rng.randrange(5,14),y),fill=['#3d8baa','#60a9bb','#87c8d1','#205b78'][rng.randrange(4)],width=1)
  for j in range(8):
   x=rng.randrange(32);y=rng.randrange(32);d.point((x,y),fill='#9dd3ce')
 elif idx in (12,13,14,15,28):
  for y in range(0,32,8):
   d.rectangle((0,y,31,y+7),fill=['#9e754e','#b99062','#ab7d57','#8c674b'][y//8]);d.line((0,y,31,y),fill='#e0b17c')
   for x in range(3+(y//8)%2*5,32,15):d.line((x,y+1,x+1,y+5),fill='#59453d')
 else:
  for j in range(18):
   x=rng.randrange(32);y=rng.randrange(32);d.line((x,y,x+4,y+1),fill='#b4b1a1' if j%2 else '#364f51')
 atlas.paste(im,((idx%8)*32,(idx//8)*32))
atlas.save(ROOT/'marina-tiles.png',optimize=True)

def roof(name,w,h,roof_color,accent,label,kind):
 rng=seeded(w+h);im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im)
 # drop shadow + 16-bit rooftop volume
 d.rectangle((12,16,w-2,h-5),fill='#2c3e4b80');d.rectangle((6,22,w-11,h-18),fill='#b89275',outline='#5e5148',width=3)
 d.rectangle((10,7,w-12,h-38),fill=roof_color,outline='#4f4452',width=5)
 for y in range(16,h-45,11):
  d.line((15,y,w-18,y),fill='#deb28d' if kind=='cafe' else '#78939f',width=2)
  for x in range(16+(y//11)%2*11,w-26,22):
   d.line((x,y+2,x+1,y+9),fill='#7d5361' if kind=='cafe' else '#39586c',width=1)
 # trim and vents
 d.line((11,10,w-14,10),fill='#edcca6',width=3)
 for x in (w//3,w*2//3):
  d.rectangle((x-10,32,x+15,56),fill='#536a72',outline='#344756',width=3)
  d.line((x-5,38,x+10,38),fill='#9cb6b3',width=2)
 # front windows
 d.rectangle((12,h-47,w-17,h-10),fill='#b98460',outline='#584f56',width=3)
 for x in range(22,w-37,45):
  d.rectangle((x,h-42,x+28,h-19),fill='#214e62',outline='#f6d18b',width=3)
  d.rectangle((x+4,h-38,x+12,h-23),fill='#8ed6c8')
 # awning facing south, no side view
 for x in range(12,w-16,20):d.rectangle((x,h-57,min(w-17,x+19),h-45),fill=accent if (x//20)%2 else '#f4dfbd')
 d.rectangle((w//2-18,h-33,w//2+15,h-9),fill='#554a46',outline='#e8c48d',width=2)
 # sign badge near facade
 lab=label.upper();f=font(12)
 tw=d.textbbox((0,0),lab,font=f)[2]
 d.rounded_rectangle((w//2-tw//2-10,h-68,w//2+tw//2+10,h-49),radius=3,fill='#19384b',outline='#dfbe79',width=2)
 d.text((w//2-tw//2,h-66),lab,font=f,fill='#fff0c4')
 if kind=='cafe':
  for x in (w-33,20):
   d.ellipse((x-15,h-24,x+15,h+1),fill='#335a39');d.ellipse((x-11,h-30,x+11,h-14),fill='#80aa54')
 if kind=='tackle':
  for x in (20,w-25):d.line((x,h-27,x+3,h-3),fill='#dec187',width=2)
 if kind=='office': d.ellipse((w-56,61,w-29,88),fill='#e3c587',outline='#4d6577',width=3)
 im.save(ROOT/f'{name}.png',optimize=True)
roof('marina-cafe',228,166,'#ad614b','#386e87','MARINA CAFE','cafe')
roof('bait-and-tackle',228,166,'#456779','#ba764d','BAIT & TACKLE','tackle')
roof('marina-office',230,168,'#5e7b84','#c69a58','MARINA OFFICE','office')
roof('boat-service',228,166,'#797063','#537683','BOAT SHED B','service')
# kiosk, compact shaded pixel art
im=Image.new('RGBA',(96,112));d=ImageDraw.Draw(im)
d.rectangle((14,33,86,109),fill='#90634b',outline='#4e4544',width=4)
d.rectangle((19,45,81,89),fill='#335f71',outline='#eac88f',width=3)
d.rectangle((25,52,53,79),fill='#a2c7c1');d.rectangle((61,52,78,80),fill='#f0d3a3')
d.polygon([(4,32),(48,4),(94,32),(90,41),(6,41)],fill='#295d78');d.line([(4,32),(48,4),(94,32)],fill='#90b5bc',width=3)
for y in (12,22,32):d.line((20,y,75,y),fill='#3e7f96',width=2)
d.rectangle((21,88,79,99),fill='#cc9d6d');d.text((25,88),'INFO',font=font(11),fill='#172e3a')
im.save(ROOT/'marina-kiosk.png')
# shaded boat sprites, world view top-down pointing north
for name,width,length,body,accent,sail in [('boat-motor',58,116,'#f3e3be','#2f719b',False),('boat-sail',72,143,'#f5e4c7','#be6e55',True),('boat-fishing',72,137,'#dfddc3','#477f6e',False)]:
 im=Image.new('RGBA',(width+20,length+30));d=ImageDraw.Draw(im)
 cx=(width+20)//2;y=10
 d.ellipse((cx-width//2+4,length-6,cx+width//2,length+19),fill='#153d58')
 hull=[(cx-width//3,y+18),(cx+width//3,y+18),(cx+width//2,y+length*.65),(cx+width*.33,y+length-7),(cx,y+length+5),(cx-width*.33,y+length-7),(cx-width//2,y+length*.65)]
 d.polygon(hull,fill=body);d.line(hull+[hull[0]],fill='#344c5f',width=4)
 d.polygon([(cx-13,y+42),(cx+13,y+42),(cx+17,y+length-30),(cx-17,y+length-30)],fill=accent)
 d.rectangle((cx-10,y+length//2-5,cx+10,y+length//2+13),fill='#bad2cf',outline='#456676',width=2)
 for yy in (y+length-24,y+length-12):d.line((cx-15,yy,cx+15,yy),fill='#f5dda9',width=2)
 if sail:
  d.line((cx,y+23,cx,y+length-23),fill='#5c514b',width=3)
  d.polygon([(cx-4,y+20),(cx-4,y+length-35),(cx-29,y+length-40)],fill='#f1ece0',outline='#c7c8bd')
  d.polygon([(cx+5,y+30),(cx+25,y+length-35),(cx+5,y+length-40)],fill='#a8d2d5')
 if name=='boat-fishing':
  d.line((cx+20,y+55,cx+42,y-8),fill='#b7a06d',width=2)
  for dy in (26,48,70):d.rectangle((cx-24,y+dy,cx-15,y+dy+9),fill='#dbb773')
 im.save(ROOT/f'{name}.png',optimize=True)
# ambient characters sprite sheet with six poses (each 32x48)
chars=Image.new('RGBA',(6*32,48));d=ImageDraw.Draw(chars)
for i in range(6):
 ox=i*32;shirt=['#376e88','#9a694a','#5c8861','#8d5b78','#a1764f','#4d718e'][i]
 d.ellipse((ox+7,39,ox+25,45),fill='#293a3c99')
 d.rectangle((ox+11,31,ox+15,41),fill='#304757');d.rectangle((ox+18,31,ox+22,41),fill='#25374e')
 d.rectangle((ox+9,17,ox+25,33),fill=shirt,outline='#263c43',width=2)
 d.rectangle((ox+6,21,ox+10,33),fill='#c69a76');d.rectangle((ox+25,21,ox+28,33),fill='#c69a76')
 d.ellipse((ox+10,5,ox+24,19),fill='#d2a27a',outline='#503d3b',width=2)
 d.rectangle((ox+9,4,ox+25,10),fill='#3b4350' if i%2 else '#734b2f')
 d.point((ox+15,13),fill='#2b3641');d.point((ox+21,13),fill='#2b3641')
chars.save(ROOT/'marina-people.png')
# seabird small two frames horizontally, transparent
birds=Image.new('RGBA',(64,28));d=ImageDraw.Draw(birds)
for i in range(2):
 ox=i*32
 d.ellipse((ox+6,11,ox+22,21),fill='#f1f0e6',outline='#647d86',width=2)
 d.polygon([(ox+22,14),(ox+29,17),(ox+22,19)],fill='#e9bb53')
 d.ellipse((ox+6,8 if i==0 else 3,ox+17,15),fill='#e0e6e5')
 d.point((ox+20,14),fill='#243a4d')
birds.save(ROOT/'marina-gulls.png')
print('\n'.join(f'{p.name} {p.stat().st_size} bytes' for p in ROOT.iterdir()))