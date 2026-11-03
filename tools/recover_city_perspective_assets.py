"""Recover only missing Southbay production images from the documented capture origin."""
from pathlib import Path
from urllib.request import urlopen,Request
from concurrent.futures import ThreadPoolExecutor
import re,json,hashlib
repo=Path(__file__).resolve().parent.parent
s=(repo/'published-game-capture/game.js').read_text('utf-8')
meta=json.loads(re.search(r'var SB=\{\}, metrics=(\{.*?\});',s)[1])
origin='https://rookie-harbor-city-jay-20261014.satinyboot35.chatgpt.site/'
def recover(name):
 p=repo/'published-game-capture/assets'/name
 if p.exists():return {'path':name,'status':'existing','sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 try:
  data=urlopen(Request(origin+'assets/'+name,headers={'User-Agent':'Mozilla/5.0'}),timeout=25).read(24*1024*1024)
  if data[:4]!=b'RIFF' or data[8:12]!=b'WEBP':raise ValueError('Expected original WebP')
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
  return {'path':name,'status':'recovered','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 except Exception as e:return {'path':name,'status':'unavailable','error':str(e)}
with ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(recover,meta))
p=repo/'docs/city-perspective';p.mkdir(exist_ok=True)
(p/'recovered-assets.json').write_text(json.dumps({'origin':origin,'results':results},indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
