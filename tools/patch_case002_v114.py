#!/usr/bin/env python3
"""V114 rewrite of Case 002 story while preserving all mission gates, save IDs and survival systems.
Apply from the repository root to published-game-capture/game.js. Idempotent.
"""
from pathlib import Path
import hashlib, re
srcpath=Path('published-game-capture/game.js')
if not srcpath.is_file(): raise SystemExit('Run from repository root: published-game-capture/game.js missing')
s=srcpath.read_text('utf8')
if 'CASE002_PICKLE_PANIC_V114' in s:
    print('V114 already applied; no changes')
    raise SystemExit(0)
orig=s
report=[]
def replace(old,new,label):
    global s
    count=s.count(old)
    if count!=1:
        raise RuntimeError('%s expected 1 match; found %s' % (label,count))
    s=s.replace(old,new,1)
    report.append(label)
def section(start,end,new,label):
    global s
    a=s.index(start); b=s.index(end,a+len(start))
    if s.find(start,a+1)!=-1:
        # multiple functions may exist but first is intentionally primary
        pass
    s=s[:a]+new+s[b:]
    report.append(label)

replace('m2:{num:"002", name:"Storefront Break-In", intro:"Someone broke into QuickMart! Talk to Omar, check the back door and follow the clues. Who does the evidence point to?"}',
        'm2:{num:"002", name:"The Midnight Pickle Panic", intro:"QuickMart\'s giant foam mascot Mr. Pickles disappeared, and its snack crates are missing too! Interview Omar, investigate the ridiculous scene, and follow the real evidence."}', 'mission title/intro')
replace('m2door:{m:"m2", name:"Bent Hasp & Grey Paint Chip — Rear Door", desc:"The back-door latch was bent with a metal bar. The lock is still closed, but the latch cannot hold it. A chip of grey car paint is caught in the metal."}',
        'm2door:{m:"m2", name:"Bent Latch & Grey Paint — Pickle Escape Route", desc:"The delivery-door latch was pried open from outside, leaving a grey vehicle paint chip. A banana peel is nearby, but it proves nothing. No evidence supports arresting a fruit."}', 'door evidence metadata')
replace('m2label:{m:"m2", name:"Voss Import Parts Label Fragment", desc:"A torn label was left beside the empty delivery cage. It reads: VOSS IMPORT PARTS — NIGHT DELIVERY — HARBOR AVE. It may have fallen from a crate or work jacket."}',
        'm2label:{m:"m2", name:"Mr. Pickles Found & Voss Shipping Label", desc:"The giant foam pickle mascot was tangled behind the stockroom shelving, wearing a shipping tag that says RETURN TO GHERKIN. Snack crates are still missing. A torn VOSS IMPORT PARTS — NIGHT DELIVERY — HARBOR AVE label gives a genuine lead."}', 'stockroom evidence metadata')
replace('m2camera:{m:"m2", name:"QuickMart Camera Still — 02:07", desc:"The camera shows a person in a grey work jacket at the back door at 02:07. A grey box truck is nearby. You can read part of its plate: HBR-44.."}',
        'm2camera:{m:"m2", name:"Midnight Pickle Camera Still — 02:07", desc:"At 02:07, a worker in a grey jacket loads cartons into a grey box truck while a huge floppy pickle shape wobbles by the door. The partial plate reads HBR-44.. The costume is funny; the license clue is real."}', 'camera evidence metadata')
replace('m2omar:{m:"m2", name:"Omar Haddad — QuickMart Owner", text:"“I locked the store at midnight. At six, the back door was broken and the delivery goods were gone. Nobody took the cash. Voss Import Parts is our only night delivery company. Their driver knows that door.”"}',
        'm2omar:{m:"m2", name:"Omar Haddad — QuickMart Owner", text:"“At midnight I locked the store with Mr. Pickles, my giant foam mascot, on display. By six the back latch was bent, the snack delivery cage was emptied, and Mr. Pickles was missing. Nobody touched the register. Only Voss Import Parts delivers that late. Please find my pickle! And, you know, the actual missing food.”"}', 'Omar statement')
replace('text:"Get the Case 002 briefing from Sgt. Brooks"', 'text:"Get the Midnight Pickle Panic briefing from Sgt. Brooks"','brief objective')
replace('text:"Interview Omar Haddad, owner of the QuickMart"', 'text:"Ask Omar what happened to Mr. Pickles and the missing snacks"','Omar objective')
replace('text:"Examine the entry point — the QuickMart rear door"', 'text:"Check the rear door for clues (not banana-based guesses)"','door objective')
replace('text:"Search the stockroom aisle for clues"', 'text:"Search the stockroom for the lost pickle and delivery label"','stock objective')
replace('text:"Recover the camera still from Omar\'s monitor"', 'text:"Review the wobbly-pickle security video at 02:07"','camera objective')
replace('text:"Search the Records database — try \'Voss\' or \'4417\'"', 'text:"Check the truck\'s partial plate in Records: Voss / 4417"','db objective')
replace('text:"Return the Case 002 evidence to the Evidence Room"', 'text:"Log the pickle case evidence in the Evidence Room"','return objective')
replace('text:"Report to Sgt. Brooks and identify the supported lead"', 'text:"Tell Brooks what REALLY happened (no seagull arrests)"','conclusion objective')
# The original database rows intentionally contain literal JS \u2014 escapes.
match = re.search(r'^  \{badge:"CASE-002".*?\},$', s, re.M)
if not match: raise RuntimeError("Case 002 database row not found")
replace(match.group(0), '  {badge:"CASE-002", name:"CASE 002 — The Midnight Pickle Panic", role:"Case Record · QuickMart, Harbor Ave", detail:"Giant foam mascot Mr. Pickles was wedged behind the stockroom shelves while snack crates disappeared. Grey paint, a Voss label and camera truck HBR-44.. establish a delivery-route lead. Available to each family detective."},', 'case record')
match = re.search(r'^  \{badge:"HBR-4417".*?\},$', s, re.M)
if not match: raise RuntimeError("Truck database row not found")
replace(match.group(0), '  {badge:"HBR-4417", name:"VEHICLE — Grey Box Truck", role:"Vehicle · Plate HBR-4417", detail:"Registered to Voss Import Parts LLC (fictional). Only truck on the QuickMart night-delivery route. The 02:07 security video shows part of its plate (HBR-44..) and a worker loading the missing snack crates beside a wobbling giant pickle costume."},', 'truck record')
# Replace the entire Case 002 briefing; every other briefing is unchanged.
section('  m2:[\n    ["SGT. BROOKS", "Officer Jay. Case 002', '  m3:[\n    ["SGT. BROOKS", "Case 003', '''  m2:[
    ["SGT. BROOKS", "CASE 002: THE MIDNIGHT PICKLE PANIC. Dispatch says a seven-foot dancing pickle has been kidnapped. I asked whether the pickle had a pulse. They said: 'Foam.' I need a different career."],
    ["SGT. BROOKS", "QuickMart's mascot, Mr. Pickles, has disappeared. The back door was forced, snack crates are gone, and someone left a rubber chicken at the scene. The chicken has declined to comment."],
    ["SGT. BROOKS", "Talk to Omar, check the rear door and stockroom, watch the security video, check Records, and log your evidence. Remember: being suspiciously silly isn't proof of a crime."],
  ],
''', 'Case 002 briefing')
# scoped helpers within main IIFE; all speakers remain recognized characters.
anchor='/* ================= CAMPAIGN BRIEFINGS / CONCLUSIONS / ENDING ================= */\n'
helper='''/* CASE002_PICKLE_PANIC_V114 — family-safe detective story; no new save fields. */
function case2Family(){
  var key=window.HARBOR && window.HARBOR.profiles && window.HARBOR.profiles.current ? window.HARBOR.profiles.current() : activeFamily;
  return /^(jay|rosa|kaleb|gigi|lingling)$/.test(key||'')?key:'jay';
}
function case2Player(){return {jay:'JAY',rosa:'ROSA',kaleb:'KALEB',gigi:'GIGI',lingling:'LINGLING'}[case2Family()];}
function case2OpeningQuip(){return {
  jay:'A missing pickle and a rubber chicken. Good thing I put detective work on my resume.',
  rosa:'I can investigate the evidence. I cannot promise to keep a straight face.',
  kaleb:'Seven-foot pickle? Do we need a search warrant or a sandwich?',
  gigi:'Papi, I call dibs on questioning the pickle. I have IMPORTANT QUESTIONS.',
  lingling:'CHICKEN BANANA! Oh. Sorry. Official detective voice now.'
}[case2Family()];}
function case2WinQuip(){return {
  jay:'Case closed. The pickle is safe, the snacks are still missing, and I have a dill-lightful report.',
  rosa:'I am putting that rubber chicken on unpaid administrative leave.',
  kaleb:'I solved the pickle mystery with science: look at the plate, not the vegetable.',
  gigi:'MR. PICKLES LIVES! He owes me an autograph. Or a sticker.',
  lingling:'Chicken Banana! Detective LingLing has cracked the cucumber code!'
}[case2Family()];}
'''
replace(anchor,helper+anchor,'family voice helpers')
section('var LEAD2 = [', 'var CONCLUSION3 = [', '''var LEAD2 = [
  {label:"Follow Voss Import Parts' night-delivery truck. The label, latch paint, footage and records agree.", correct:true},
  {label:"Arrest the rubber chicken. It was at the scene and has not said a word.",
    wrong:"The chicken is rubber and is exercising its right to remain squeaky. A prop cannot drive a truck. Find the real clues: damaged latch, Voss label, video and plate."},
  {label:"Accuse Omar of secretly eating the seven-foot pickle.",
    wrong:"Mr. Pickles is a foam costume, not an edible pickle! You found him tangled behind the shelves. Omar reported the missing stock and helped preserve the video. Accusing someone needs evidence."},
  {label:"Arrest the seagull seen on camera. It looks extremely smug.",
    wrong:"The bird is definitely smug. Unfortunately, it lacks a driver's license, a loading schedule and hands. The truck plate and shipping label lead to a human delivery route."}
];
''','Case 002 conclusions')
section('  if(m === "m2"){\n    showLines(', '  } else if(m === "m3"){', '''  if(m === "m2"){
    showLines([["SGT. BROOKS", "You found Mr. Pickles! The poor foam fellow was stuck behind cereal boxes. But the real snack crates are still missing. Which lead is supported by your evidence?"]],
      function(){case2ConclusionChoices();});
''', 'conclusion prompt')
section('function closeM2(){', 'function closeM3(){', '''function closeM2(){
  awardScore("concl:m2", "Supported conclusion", RULES.score.conclusion, "Case 002 — The Midnight Pickle Panic: a supported night-delivery lead identified without false accusations.");
  state.camp.m2.done = true; save(); refreshPanels();
  tone(523,0.12,0,"sine");tone(659,0.12,0.11,"sine");tone(784,0.22,0.22,"sine");
  showLines([
    ["SGT. BROOKS", "Case 002: CLOSED. Mr. Pickles has been rescued from behind the stockroom shelves. The store's ACTUAL snack crates are still gone. Our evidence points to the Voss night-delivery route. That's a lead, not a reason to accuse everybody in a grey jacket."],
    ["DISPATCH", "Attention all units: the rubber chicken is NOT a suspect. Please stop trying to read it its rights."],
    [case2Player(), case2WinQuip()],
    ["SGT. BROOKS", "Omar has named you an honorary DILL DETECTIVE. I'm refusing to wear the certificate. Also: a welfare check just came in from Maple Court. Case 003 is waiting when you're ready."],
    ["OFFICER RIVERA", "Sergeant, the chicken would like a lawyer."],
    ["SGT. BROOKS", "GET IT OUT OF MY OFFICE."]
  ], function(){toast("CASE 002 SOLVED! Mr. Pickles rescued · Dill Detective · Voss lead found");endShift("m2");});
}
''','Case 002 finish')
replace('var CONCLUSION3 = [', '''
function case2ConclusionChoices(){
  showChoices("CASE 002 — THE GREAT DILL-EMMA", "Choose the lead supported by the evidence. Silly guesses are welcome, and trying again costs nothing!", LEAD2.map(function(c){
    return {label:c.label,fn:function(){
      if(c.correct){closeM2();return;}
      showLines([["SGT. BROOKS",c.wrong],[case2Player(),"Okay! Evidence first, chicken second. I can try again."]],case2ConclusionChoices);
    }};
  }));
}
var CONCLUSION3 = [''', 'non-punitive Case 002 retry choices')
replace('{n:"CASE 002 — STOREFRONT BREAK-IN", t:"The QuickMart\'s rear door was pried by a crew that knew its delivery routine. The label fragment, grey paint chip, camera still and route records identified the supported lead: Voss Import Parts\' night-delivery operation."}',
        '{n:"CASE 002 — THE MIDNIGHT PICKLE PANIC", t:"Omar\'s giant foam mascot Mr. Pickles was found wedged behind the stockroom shelves, but the missing snack crates were real. A bent latch, paint chip, Voss delivery label, security still and partial plate established the night-delivery route as the next evidence-based lead. An honorary Dill Detective badge was issued; no rubber chickens were arrested."}', 'case summary')
replace('002 Storefront Break-In, 003 The Missing Resident', '002 The Midnight Pickle Panic, 003 The Missing Resident','field guide')
replace('function doBriefing(m){\n  showLines(BRIEFINGS[m], function(){ briefMission(m); });\n}',
        'function doBriefing(m){\n  var briefing=m==="m2"?BRIEFINGS.m2.concat([[case2Player(),case2OpeningQuip()]]):BRIEFINGS[m];\n  showLines(briefing,function(){briefMission(m);});\n}', 'dynamic selected-player briefing')


# Three existing in-world clues, now with interactive scenes and comic payoffs.
section('function doStoreCamera(){', 'function doStoreShelf(){', '''function doStoreCamera(){
  if(currentMission() === "m2" && state.camp.m2.brief && !evGot("m2camera")){
    showChoices("QUICKMART SECURITY — 02:07", "A large pickle-shaped shadow wobbles by the back door. Beside it, a person in a grey work jacket loads boxes into a truck. What should we examine?", [
      {label:"Read the truck's partial plate and record the time.",fn:function(){
        showLines([
          ["CAMERA MONITOR", "02:07. The grey box truck backs up beside the rear door. The plate reads HBR-44.. A worker in a grey jacket loads cartons. The oversized mascot silhouette does an accidental moonwalk when someone bumps it."],
          [case2Player(), "The pickle is funny. The plate is evidence. Exporting the still for Records!"]
        ],function(){collectEvidence("m2camera");});
      }},
      {label:"Enhance the seagull's face. He looks suspicious.",fn:function(){
        showLines([["CAMERA MONITOR", "ENHANCE: the seagull is still a seagull. It looks personally offended by the zoom."],[case2Player(), "A beak is not a license plate. Let's check the truck instead."]],doStoreCamera);
      }},
      {label:"Ask whether that pickle can moonwalk.",fn:function(){
        showLines([["CAMERA MONITOR", "The foam pickle tilts left, tips right, and falls off the loading cart like a dancing noodle."],["DISPATCH", "I am begging you not to file that as a dance competition."]],doStoreCamera);
      }}
    ]);
    return;
  }
  if(currentMission() === "m2"){
    showLines([["STORE CAMERA", "Replay saved: a goofy pickle silhouette, one grey truck, and partial plate HBR-44... The seagull is still refusing interviews."]],null);return;
  }
  showLines([["STORE CAMERA MONITOR", "Four security feeds. Today, nothing but shoppers and one seagull who thinks the door sensor belongs to him."]],null);
}
''','camera interactive scene')
section('function doStoreShelf(){', 'function doStoreRear(){', '''function doStoreShelf(){
  if(currentMission() === "m2" && state.camp.m2.brief && !evGot("m2label")){
    showLines([
      ["STOCKROOM", "The snack delivery cage is empty. Behind the cereal boxes, two gigantic green feet stick out. A muffled voice seems to say: 'MFFFRRRF'. Wait, that's just the air conditioner."],
      ["MR. PICKLES", "YOU FOUND ME! (That's what the handwritten tag says. Mr. Pickles is a FOAM COSTUME. He cannot actually speak.)"],
      [case2Player(), "Mr. Pickles was wedged behind the shelves the whole time! And why is he wearing a cardboard crown labeled RETURN TO GHERKIN?"],
      ["STOCKROOM", "Beneath the costume: an actual shipping-label fragment: VOSS IMPORT PARTS — NIGHT DELIVERY — HARBOR AVE. The other snack crates are still missing."],
      [case2Player(), "Mascot recovered, label photographed, clue bagged. I am choosing NOT to interrogate the foam vegetable."]
    ],function(){collectEvidence("m2label");});return;
  }
  if(currentMission() === "m2"){
    showLines([["MR. PICKLES", "Safely standing beside the cereal. Somebody put a tiny paper badge on the foam pickle. It reads: HONORARY OFFICER. The actual snack crates are still missing."]],null);return;
  }
  showLines([["STOCKROOM AISLE", "Chips, snacks and cereal. A little note says: 'Do not taste the display pickle. It is foam.'"]],null);
}
''','stockroom reveal')
section('function doStoreRear(){', 'function doCafeMenu(){', '''function doStoreRear(){
  if(currentMission() === "m2" && state.camp.m2.brief && !evGot("m2door")){
    showLines([
      ["QUICKMART REAR DOOR", "The latch is bent outward as though pried from the alley. A grey fleck of vehicle paint is trapped in the metal. On the floor: one banana peel and a rubber chicken with an extremely judgmental face."],
      [case2Player(), "Paint chip and damaged latch: real evidence. The banana could belong to anyone. The chicken has no fingerprints. I checked."],
      ["RUBBER CHICKEN", "SQUEEEEEAK."],
      [case2Player(), "Thank you for your statement. This is going in the report under 'very unhelpful'."]
    ],function(){collectEvidence("m2door");});return;
  }
  if(currentMission() === "m2"){
    showLines([["REAR DOOR", "The bent latch and grey paint chip are documented. A tiny paper sign now reads: 'NO PICKLE PARKING.' The rubber chicken is still innocent until proven squeaky."]],null);return;
  }
  showLines([["REAR SERVICE DOOR", "QuickMart's delivery entrance. Omar chains it at night and props it for deliveries each morning."]],null);
}
''','rear door gag')
# Replace ONLY Omar's existing handler, leaving other NPCs as they were.
section('  omar:function(){', '  lucia:function(){', '''  omar:function(){
    if(currentMission()==="m2" && state.camp.m2.brief && !stGot("m2omar")){
      showChoices("OMAR HADDAD — QUICKMART", "Omar is carrying a tiny hat and a giant foam pickle's missing shoe. What do you ask?",[
        {label:"Tell me exactly what happened and what is missing.",fn:function(){
          showLines([["OMAR HADDAD",STATEMENTS.m2omar.text],
            ["OMAR HADDAD", "Mr. Pickles is our SEVEN-FOOT mascot, not our lunch. I found one rubber chicken by the delivery door. I have made zero progress interviewing it."],
            [case2Player(), "Statement recorded. I'll examine the latch, stockroom and camera. Facts before accusations!"]],function(){recordStatement("m2omar");});
        }},
        {label:"Does Mr. Pickles have enemies? Perhaps a rival cucumber?",fn:function(){
          showLines([["OMAR HADDAD", "Only the hot-dog mascot across town. They've been arguing about relish for six months. But it's a foam costume, Detective. It cannot hold a grudge."],
            [case2Player(), "Noted: vegetable rivalry is not evidence."]],function(){TALKS.omar();});
        }},
        {label:"May I interrogate the rubber chicken?",fn:function(){
          showLines([["OMAR HADDAD", "Be my guest. It won't crack. I already offered it one cracker and a very stern stare."],
            ["RUBBER CHICKEN", "SQUEEEEAK!"],
            [case2Player(), "I'm going to mark that as a refusal to cooperate with nonsense."]],function(){TALKS.omar();});
        }}
      ]);return;
    }
    if(state.camp && state.camp.m2.done){
      showLines([["OMAR HADDAD", "Mr. Pickles is back on display with a little DILL DETECTIVE badge. You're always welcome here. The snacks are still being traced through Voss deliveries — and the rubber chicken has been promoted to store security."]],null);return;
    }
    showLines([["OMAR HADDAD", "Coffee's on the house for Precinct 9. Please do not mistake the foam pickle mascot for an actual lunch."]],null);
  },
''','Omar branching interview')
replace('toast("Database hit recorded: HBR-4417 — grey box truck, Voss Import Parts, QuickMart night route");',
        'toast("Evidence match: HBR-4417 is the Voss night-delivery truck! The pickle cannot drive it.");','database toast')
# Scope misc by context and avoid modifying subsequent case gameplay.
replace('Case 002 \u2014 Storefront Break-In: supported lead identified.', 'Case 002 \u2014 The Midnight Pickle Panic: supported delivery lead identified.', 'legacy 002 scoring if present') if 'Case 002 \u2014 Storefront Break-In: supported lead identified.' in s else None
# Robust semantic invariants: old mission and original save/transition keys stay as-is.
assert len(s)>1_400_000
for marker in ['m2omar','m2door','m2label','m2camera','m2.db','m2.returned','state.camp.m2.done','function currentMission(){','function doStoreCamera(){','function doStoreShelf(){','function doStoreRear(){']:
    assert marker in s, marker
# Verify all tactical/academy/Outbreak, player visuals and case-one additions
# remain byte-for-byte identical after the main-campaign narrative prefix.
protection_marker='/* Presentation-only foot contacts, advanced by resolved world movement. Never saved. */'
assert orig.count(protection_marker)==1 and s.count(protection_marker)==1
assert s[s.index(protection_marker):]==orig[orig.index(protection_marker):], 'Protected engine/Academy/Zombie code was changed!'
srcpath.write_text(s,'utf8')
print('Patched',srcpath,'from',len(orig),'to',len(s),'bytes')
print('Applied:',len(report),'story sections:',', '.join(report))
print('Original SHA256',hashlib.sha256(orig.encode()).hexdigest())
print('Updated SHA256',hashlib.sha256(s.encode()).hexdigest())