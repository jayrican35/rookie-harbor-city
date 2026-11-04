"""Apply the civilian adapter to a copy of the current connected-world build."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import argparse
from connected_driving import refine_controller
from comic_dialogue import apply_comic_hooks

r = Path.cwd()
parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');args=parser.parse_args()
asset_dir=r/'published-game-capture/assets/civilian-corrected'
art_ready = json.loads((asset_dir/'review-status.json').read_text())['approvedForPlayback']
pack=json.loads((asset_dir/'manifest.json').read_text())
# Bind the existing canonical controller to connected-world dependencies.
engine=(r/'published-game-capture/game.js').read_text(encoding='utf-8')
start=engine.index('var carReboundTime=0;');end=engine.index('function updateDriveUI()',start)
controller=refine_controller(engine[start:end])
factory='''function(car,keys,window,carCollidesAt,saveThrottled,feedback){
const driveKeys={},CAR_MAX=265,CAR_REV=-92,document={getElementById:()=>null},AC=null,traffic=[];
const syncPlayerToCar=()=>{},checkCarExits=()=>{},perfCollision=feedback,tone=()=>{},toast=()=>{};
'''+controller+'\nreturn updateCar;}'
cruiser=(r/'published-game-capture/precinct-cruiser.js').read_text(encoding='utf-8').replace('/* CANONICAL_CONTROLLER */null',factory)
base = r / 'site/preview/marina-updated'
before = r / 'site/preview/civilian-before'
after = r / ('site/preview/civilian-candidate' if args.candidate else 'site/preview/civilian-updated')
for target in [before, after]:
    if not target.exists():
        shutil.copytree(base, target)
for target in [before, after]:
    # Query-gated telemetry is present in both for fair behavior comparisons.
    name = 'v115-campus.js'
    old = (target / name).read_text(encoding='utf-8')
    new = (r / 'published-game-capture' / name).read_text(encoding='utf-8')
    bundle = (target / 'game-v115.bundle.js').read_text(encoding='utf-8')
    # The legacy importer rebuilds known fields before startup autosaves.
    # Extend ONLY this preview's compiled importer, so parking survives that rebuild.
    bundle=re.sub(r'  /\* connected cruiser save extension \*/.*?  state = f;', '  state = f;',bundle,flags=re.S)
    if '/* connected cruiser save extension */' not in bundle:
        schema='''  /* connected cruiser save extension */
  var unit=s.connectedCruiser;
  if(unit&&unit.id==='precinct-unit-9'&&Number.isFinite(unit.x)&&Number.isFinite(unit.y)&&Number.isFinite(unit.angle)&&unit.x>=-3100&&unit.x<=9656&&unit.y>=0&&unit.y<=4680)
    f.connectedCruiser={id:unit.id,x:unit.x,y:unit.y,angle:unit.angle,lightMode:['off','red','blue','alternating'].includes(unit.lightMode)?unit.lightMode:'off'};
'''
        token='  state = f;'
        assert bundle.count(token)==1
        bundle=bundle.replace(token,schema+token)
    prior=target/'precinct-cruiser.compiled.js'
    if prior.exists():
        previous=prior.read_text(encoding='utf-8')
        assert bundle.count(previous)==1
        bundle=bundle.replace(previous+'\n','')
    bundle=apply_comic_hooks(bundle,engine)
    assert bundle.count(old) == 1
    (target / name).write_text(new, encoding='utf-8')
    (target / 'game-v115.bundle.js').write_text(bundle.replace(old, cruiser+'\n'+new), encoding='utf-8')
    (target/'precinct-cruiser.compiled.js').write_text(cruiser,encoding='utf-8')
    shutil.copytree(r/'published-game-capture/assets/police-driving',target/'assets/police-driving',dirs_exist_ok=True)
    shutil.copy2(r/'published-game-capture/cruiser-visuals.js',target/'cruiser-visuals.js')
    shutil.copy2(r/'published-game-capture/connected-traffic.js',target/'connected-traffic.js')
    html = (target / 'index.html').read_text(encoding='utf-8')
    chicken=r/'published-game-capture/assets/chicken-npc'
    if chicken.exists():
        shutil.copytree(chicken,target/'assets/chicken-npc',dirs_exist_ok=True)
        shutil.copy2(r/'published-game-capture/chicken-npc.js',target/'chicken-npc.js')
        html=re.sub(r'<script data-chicken-pack>.*?</script>\s*<script src="\./chicken-npc\.js[^"]*"></script>\s*','',html)
        chicken_pack=json.loads((chicken/'chicken_manifest.json').read_text(encoding='utf-8'))
        payload=json.dumps(chicken_pack,separators=(',',':')).replace('<','\\u003c')
        digest=hashlib.sha256((target/'chicken-npc.js').read_bytes()).hexdigest()[:12]
        html=html.replace('</head>','<script data-chicken-pack>window.ROOKIE_CHICKEN_PACK='+payload+';</script><script src="./chicken-npc.js?v='+digest+'"></script></head>')
    banana=r/'published-game-capture/assets/banana-npc'
    if banana.exists():
        shutil.copytree(banana,target/'assets/banana-npc',dirs_exist_ok=True)
        shutil.copy2(r/'published-game-capture/banana-npc.js',target/'banana-npc.js')
        html=re.sub(r'<script data-banana-pack>.*?</script>\s*<script src="\./banana-npc\.js[^"]*"></script>\s*','',html)
        banana_pack=json.loads((banana/'banana_manifest.json').read_text(encoding='utf-8'))
        payload=json.dumps(banana_pack,separators=(',',':')).replace('<','\\u003c')
        digest=hashlib.sha256((target/'banana-npc.js').read_bytes()).hexdigest()[:12]
        html=html.replace('</head>','<script data-banana-pack>window.ROOKIE_BANANA_PACK='+payload+';</script><script src="./banana-npc.js?v='+digest+'"></script></head>')
    for ext in ['js','css']:
        name='comic-dialogue.'+ext
        shutil.copy2(r/'published-game-capture'/name,target/name)
        if ext=='js':html=re.sub(r'<script src="\./comic-dialogue\.js[^"]*"></script>\s*','',html)
        html=re.sub(r'<link[^>]*href="\./comic-dialogue\.css[^"]*"[^>]*>\s*','',html)
        digest=hashlib.sha256((target/name).read_bytes()).hexdigest()[:12]
        element=('<script src="./'+name+'?v='+digest+'"></script>') if ext=='js' else ('<link rel="stylesheet" href="./'+name+'?v='+digest+'">')
        html=html.replace('</head>',element+'</head>')
    digest = hashlib.sha256((target / 'game-v115.bundle.js').read_bytes()).hexdigest()[:12]
    html = re.sub(r'game-v115\.bundle\.js\?v=[\da-f]+', 'game-v115.bundle.js?v='+digest, html)
    html=re.sub(r'<script src="\./cruiser-visuals\.js[^\"]*"></script>\s*','',html)
    html=re.sub(r'<script src="\./connected-traffic\.js[^\"]*"></script>\s*','',html)
    traffic_digest=hashlib.sha256((target/'connected-traffic.js').read_bytes()).hexdigest()[:12]
    html=html.replace('</head>','<script src="./connected-traffic.js?v='+traffic_digest+'"></script></head>')
    visual_digest=hashlib.sha256((target/'cruiser-visuals.js').read_bytes()).hexdigest()[:12]
    html=re.sub(r'(<script src="\./game-v115\.bundle\.js[^\"]*"></script>)',lambda m:'<script src="./cruiser-visuals.js?v='+visual_digest+'"></script>\n'+m.group(1),html)
    if target == after:
        shutil.copy2(r / 'published-game-capture/civilian-connected.js', target / 'civilian-connected.js')
        shutil.copytree(asset_dir, target / 'assets/civilian-corrected', dirs_exist_ok=True)
        html = re.sub(r'<script data-civilian-preview>.*?</script>\s*<script src="\./civilian-connected\.js[^\"]*"></script>', '', html)
        digest = hashlib.sha256((target / 'civilian-connected.js').read_bytes()).hexdigest()[:12]
        payload=json.dumps(pack,separators=(',',':')).replace('<','\\u003c')
        html = html.replace('</body>', '<script data-civilian-preview>window.ROOKIE_CIVILIAN_PACK='+payload+';window.ROOKIE_CONNECTED_CIVILIANS_ACTIVE='+str(art_ready or args.candidate).lower()+';</script><script src="./civilian-connected.js?v='+digest+'"></script></body>')
    (target / 'index.html').write_text(html, encoding='utf-8')
if not args.candidate:
    shutil.copy2(r / 'tools/civilian_preview_review.html', r / 'site/index.html')
    evidence=r/'docs/comic-dialogue'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/comic-dialogue',dirs_exist_ok=True)
    evidence=r/'docs/chicken-npc'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/chicken-npc',dirs_exist_ok=True)
    evidence=r/'docs/banana-npc'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/banana-npc',dirs_exist_ok=True)
if not art_ready and not args.candidate:
    target=r/'site/evidence/civilian-preview'
    target.mkdir(parents=True,exist_ok=True)
    shutil.copy2(r/'tools/civilian_art_hold.html',target/'index.html')
print('Updated local connected civilian preview; original campaign assets unchanged.')
