"""Apply the civilian adapter to a copy of the current connected-world build."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import argparse
import subprocess
import sys
import os
os.environ['PYTHONUTF8']='1'
from connected_driving import controller_factory
from comic_dialogue import apply_comic_hooks, apply_family_lines
from connected_tactics import bind_tactics
from campaign_transition import bind_campaign

r = Path.cwd()
parser=argparse.ArgumentParser();parser.add_argument('--candidate',action='store_true');parser.add_argument('--main',action='store_true');parser.add_argument('--reuse-world',action='store_true',help='Reuse the verified local V140 baseline instead of rebaking unchanged historical art');args=parser.parse_args()
asset_dir=r/'published-game-capture/assets/civilian-corrected'
art_ready = json.loads((asset_dir/'review-status.json').read_text())['approvedForPlayback']
pack=json.loads((asset_dir/'manifest.json').read_text())
# Bind the existing canonical controller to connected-world dependencies.
engine=(r/'published-game-capture/game.js').read_text(encoding='utf-8')
factory=controller_factory(engine)
cruiser=(r/'published-game-capture/precinct-cruiser.js').read_text(encoding='utf-8').replace('/* CANONICAL_CONTROLLER */null',factory)
base = r / 'site/preview/marina-updated'
before = r / 'site/preview/civilian-before'
after = r / ('site/preview/civilian-candidate' if args.candidate else 'site/preview/civilian-updated')
if args.main:
    after=r/'site/game'
    shutil.copytree(r/'published-game-capture',after,dirs_exist_ok=True)
    if args.reuse_world:
        cached=r/'site/preview/precinct9-v140-approved-layout'
        assert hashlib.sha256((cached/'game.js').read_bytes()).digest()==hashlib.sha256((r/'published-game-capture/game.js').read_bytes()).digest(),'Cached canonical engine differs'
        assert 'window.ROOKIE_V140_APPROVED_CAMPUS_ACTIVE=true' in (cached/'index.html').read_text(encoding='utf-8'),'Not a V140 world baseline'
        for name in ['index.html','game-v115.bundle.js','v115-campus.js']:
            shutil.copy2(cached/name,after/name)
        for source in cached.rglob('*'):
            dest=after/source.relative_to(cached)
            if source.is_file() and not dest.exists():
                dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
        print('Reused verified local V140 baseline; current source adapters are rebound below.')
    else:
        subprocess.run([sys.executable,str(r/'tools/build_v140_precinct_approved_layout_preview.py'),str(after)],check=True)
targets=[after] if args.main else [before,after]
for target in targets:
    if not target.exists():
        shutil.copytree(base, target)
for target in targets:
    # Query-gated telemetry is present in both for fair behavior comparisons.
    name = 'v115-campus.js'
    old = (target / name).read_text(encoding='utf-8')
    new = (r / 'published-game-capture' / name).read_text(encoding='utf-8')
    for asset_name in ['v115-campus.css','v116-marina-hud.js','v127-citywide-art.js','v135-precinct-wallkit-test.js']:
        shutil.copy2(r/'published-game-capture'/asset_name,target/asset_name)
    new=new.replace('/* CONNECTED_STORY */null',(r/'published-game-capture/connected-story.js').read_text(encoding='utf-8'))
    new=new.replace('/* CONNECTED_MAIN */null',(r/'published-game-capture/connected-main.js').read_text(encoding='utf-8'))
    new=new.replace('/* CONNECTED_TACTICS */null',(r/'published-game-capture/connected-tactics.js').read_text(encoding='utf-8'))
    new=new.replace('/* CONNECTED_CAMPAIGN */null',(r/'published-game-capture/connected-campaign.js').read_text(encoding='utf-8'))
    bundle = (target / 'game-v115.bundle.js').read_text(encoding='utf-8')
    # The legacy importer rebuilds known fields before startup autosaves.
    # Extend ONLY this preview's compiled importer, so parking survives that rebuild.
    bundle=re.sub(r'  /\* connected cruiser save extension \*/.*?  state = f;', '  state = f;',bundle,flags=re.S)
    if '/* connected cruiser save extension */' not in bundle:
        schema='''  /* connected cruiser save extension */
  var unit=s.connectedCruiser;
  if(unit&&unit.id==='precinct-unit-9'&&Number.isFinite(unit.x)&&Number.isFinite(unit.y)&&Number.isFinite(unit.angle)&&unit.x>=-3100&&unit.x<=9656&&unit.y>=0&&unit.y<=4680)
    f.connectedCruiser={id:unit.id,x:unit.x,y:unit.y,angle:unit.angle,lightMode:['off','red','blue','alternating'].includes(unit.lightMode)?unit.lightMode:'off'};
  if(s.connectedEvents&&typeof s.connectedEvents==='object'&&!Array.isArray(s.connectedEvents))f.connectedEvents={...s.connectedEvents,precinctParkingEncounter:s.connectedEvents.precinctParkingEncounter===true};
  var world=s.connectedWorld;
  if(world&&world.schema===1&&world.worldId==='harbor-main'&&Number.isFinite(world.x)&&Number.isFinite(world.y)&&world.x>=-3100&&world.x<=9656&&world.y>=0&&world.y<=4680)
    f.connectedWorld={schema:1,worldId:'harbor-main',x:world.x,y:world.y,dir:['up','down','left','right'].includes(world.dir)?world.dir:'down',zoom:Number.isFinite(world.zoom)?Math.max(.35,Math.min(2.5,world.zoom)):.9};
'''
        token='  state = f;'
        assert bundle.count(token)==1
        bundle=bundle.replace(token,schema+token)
    prior=target/'precinct-cruiser.compiled.js'
    if prior.exists() and not args.main:
        previous=prior.read_text(encoding='utf-8')
        assert bundle.count(previous)==1
        bundle=bundle.replace(previous+'\n','')
    bundle=apply_comic_hooks(bundle,engine)
    bundle=bind_tactics(bundle)
    travel="function goTo(mapId, x, y){"
    if '/* connected story travel */' not in bundle:
        bundle=bundle.replace(travel,travel+"\n  /* connected story travel */ if(window.HARBOR?.seamlessCampusV115?.travelStory?.(mapId))return true;",1)
    bundle=bundle.replace('travelStory?.(mapId))return true;', 'travelStory?.(mapId,x,y))return true;')
    if 'mainCity?.travel?.' not in bundle:
        bundle=bundle.replace('/* connected story travel */ if(', '/* connected story travel */ if(window.HARBOR?.mainCity?.travel?.(mapId,x,y))return true; if(',1)
    if 'connectedFamilyTalk:' not in bundle:
        bundle=bundle.replace('H.caper={usesNewCase:',"H.caper={connectedFamilyTalk:function(id){if(ids.indexOf(id)>=0&&id!==who())return lines([[speakers[id],familyLine(id)]],null);},usesNewCase:",1)
    if args.main:bundle=apply_family_lines(bind_campaign(bundle))
    if '/* connected original precinct roster */' not in bundle:
        token=" DB_RECORDS.forEach(function(r){if(r.badge==='2315')"
        bundle=bundle.replace(token," /* connected original precinct roster */ window.HARBOR.connectedOriginalStation=MAPS.station.npcs.map(function(n){return Object.assign({},n);});\n"+token,1)
        token="var reception=doReception;doReception=function(){if(currentMission()==='m3'"
        bundle=bundle.replace(token,"window.HARBOR.connectedLegacyReception=doReception;"+token,1)
        token="TALKS.park=function(){showLines([['KALEB'"
        bundle=bundle.replace(token,"window.HARBOR.connectedLegacyPark=TALKS.park;"+token,1)
        token="function text(s){return typeof s==='string'?s.replace(/OFFICER CHEN"
        bundle=bundle.replace(token,"function text(s){if(window.ROOKIE_CONNECTED_STORY_UNREPLACED)return s;return typeof s==='string'?s.replace(/OFFICER CHEN",1)
    assert bundle.count(old) == 1
    (target / name).write_text(new, encoding='utf-8')
    (target / 'game-v115.bundle.js').write_text(bundle.replace(old, cruiser+'\n'+new), encoding='utf-8')
    subprocess.run(['node','--check',str(target/'game-v115.bundle.js')],check=True)
    (target/'precinct-cruiser.compiled.js').write_text(cruiser,encoding='utf-8')
    shutil.copytree(r/'published-game-capture/assets/police-driving',target/'assets/police-driving',dirs_exist_ok=True)
    shutil.copytree(r/'published-game-capture/assets/civic-monument',target/'assets/civic-monument',dirs_exist_ok=True)
    shutil.copy2(r/'published-game-capture/cruiser-visuals.js',target/'cruiser-visuals.js')
    shutil.copy2(r/'published-game-capture/connected-traffic.js',target/'connected-traffic.js')
    html = (target / 'index.html').read_text(encoding='utf-8')
    if args.main:
        shutil.copytree(r/'published-game-capture/assets/family-dialogue',target/'assets/family-dialogue',dirs_exist_ok=True)
        for name in ['main-save-guard.js','connected-main.css']:
            shutil.copy2(r/'published-game-capture'/name,target/name)
        shutil.copytree(r/'published-game-capture/assets/chapter-006',target/'assets/chapter-006',dirs_exist_ok=True)
        html=re.sub(r'<title>.*?</title>','<title>ROOKIE: HARBOR CITY</title>',html,flags=re.S)
        html=re.sub(r'<script[^>]*src="\./v115-preview-save-isolation\.js[^\"]*"[^>]*></script>\s*','',html)
        html=html.replace('<head>','<head><script>window.ROOKIE_MAIN_CITY_ACTIVE=true;</script><script src="./main-save-guard.js"></script><link rel="stylesheet" href="./connected-main.css">',1)
        flags='window.ROOKIE_CITY_PERSPECTIVE_ACTIVE=true;window.ROOKIE_PERSPECTIVE_PILOT_ACTIVE=true;window.ROOKIE_INTERIOR_WALLS_ACTIVE=true;window.ROOKIE_LOCKER_FURNITURE_ACTIVE=true;'
        html=html.replace('<script src="./v135-precinct-wallkit-test.js','<script>'+flags+'</script><script src="./v135-precinct-wallkit-test.js',1)
    city_digest=hashlib.sha256((target/'v127-citywide-art.js').read_bytes()).hexdigest()[:12]
    html=re.sub(r'v127-citywide-art\.js(?:\?[^"\s]*)?', 'v127-citywide-art.js?v='+city_digest, html)
    wallkit_digest=hashlib.sha256((target/'v135-precinct-wallkit-test.js').read_bytes()).hexdigest()[:12]
    html=re.sub(r'v135-precinct-wallkit-test\.js(?:\?[^"\s]*)?', 'v135-precinct-wallkit-test.js?v='+wallkit_digest, html)
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
    banter=json.loads((r/'published-game-capture/living-city-dialogue.json').read_text(encoding='utf-8'))
    html=re.sub(r'<script data-living-banter>.*?</script>','',html)
    html=html.replace('</head>','<script data-living-banter>window.ROOKIE_BANTER_PACK='+json.dumps(banter,separators=(',',':')).replace('<','\\u003c')+';</script></head>')
    sound_dir=r/'published-game-capture/assets/audio/city-ambient'
    shutil.copytree(sound_dir,target/'assets/audio/city-ambient',dirs_exist_ok=True)
    sound_pack=json.loads((sound_dir/'manifest.json').read_text(encoding='utf-8'))
    html=re.sub(r'<script data-city-audio>.*?</script>','',html)
    html=html.replace('</head>','<script data-city-audio>window.ROOKIE_CITY_AUDIO_PACK='+json.dumps(sound_pack,separators=(',',':')).replace('<','\\u003c')+';</script></head>')
    for name in ['wild-arcade-collisions.js','connected-audio.js','living-city-banter.js','comic-dialogue.js','comic-dialogue.css','precinct-encounter.js','precinct-encounter.css']:
        ext=name.rsplit('.',1)[1]
        presentation=name.rsplit('.',1)[0]
        shutil.copy2(r/'published-game-capture'/name,target/name)
        if ext=='js':html=re.sub(r'<script src="\./'+re.escape(presentation)+r'\.js[^"]*"></script>\s*','',html)
        if ext=='css':html=re.sub(r'<link[^>]*href="\./'+re.escape(presentation)+r'\.css[^"]*"[^>]*>\s*','',html)
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
    # A reused world baseline must not retain stale cache keys for current
    # source adapters. Hash the actual local JS/CSS files packaged above.
    def current_asset(match):
        file=target/match.group(2)
        if not file.is_file():return match.group(0)
        digest=hashlib.sha256(file.read_bytes()).hexdigest()[:12]
        return match.group(1)+match.group(2)+'?v='+digest+'"'
    html=re.sub(r'((?:src|href)="\./)([^"?]+\.(?:js|css))(?:\?[^"\s]*)?"',current_asset,html)
    (target / 'index.html').write_text(html, encoding='utf-8')
if args.main:
    review=r/'site/review';review.mkdir(parents=True,exist_ok=True)
    shutil.copy2(r/'tools/civilian_preview_review.html',review/'index.html')
    html=(after/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="./game/">',1)
    (r/'site/index.html').write_text(html,encoding='utf-8')
    (r/'site/connected-main.json').write_text(json.dumps({'schema':1,'entry':'/','world':'harbor-main','profiles':'all','review':'/review/'}),encoding='utf-8')
elif not args.candidate:
    if (r/'site/connected-main.json').exists():
        review=r/'site/review';review.mkdir(parents=True,exist_ok=True)
        shutil.copy2(r/'tools/civilian_preview_review.html',review/'index.html')
    else:
        shutil.copy2(r / 'tools/civilian_preview_review.html', r / 'site/index.html')
    evidence=r/'docs/comic-dialogue'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/comic-dialogue',dirs_exist_ok=True)
    evidence=r/'docs/chicken-npc'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/chicken-npc',dirs_exist_ok=True)
    evidence=r/'docs/banana-npc'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/banana-npc',dirs_exist_ok=True)
    evidence=r/'docs/connected-story'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/connected-story',dirs_exist_ok=True)
    evidence=r/'docs/parking-encounter'
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence/parking-encounter',dirs_exist_ok=True)
for evidence_name in ['midtown-reference','coast-park','midtown-west-connection','environment-reference','civic-monument','living-city-banter','contextual-reactions','ambient-audio','wild-arcade','world-transition']:
    evidence=r/'docs'/evidence_name
    if evidence.exists():shutil.copytree(evidence,r/'site/evidence'/evidence_name,dirs_exist_ok=True)
if not art_ready and not args.candidate:
    target=r/'site/evidence/civilian-preview'
    target.mkdir(parents=True,exist_ok=True)
    shutil.copy2(r/'tools/civilian_art_hold.html',target/'index.html')
print('Built local connected main game for all profiles.' if args.main else 'Updated local connected civilian preview; original campaign assets unchanged.')
