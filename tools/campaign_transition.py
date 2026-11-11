"""Main-build-only migration hooks. Historical engine and protected modes stay intact."""
import re
def bind_campaign(bundle):
    assert '/* authoritative connected campaign */' not in bundle
    token='(function introBoot(){'
    assert bundle.count(token)==1
    bundle=bundle.replace(token,token+'if(window.ROOKIE_MAIN_CITY_ACTIVE)return;',1)
    token='var s=raw!==null?JSON.parse(raw):freshState();s.intro={done:true,playing:false,setupApplied:true};'
    assert bundle.count(token)==1
    bundle=bundle.replace(token,"var s=raw!==null?JSON.parse(raw):freshState();if(!window.ROOKIE_MAIN_CITY_ACTIVE)s.intro={done:true,playing:false,setupApplied:true};",1)
    match=re.search(r'function orientation\(\).*?var t=(.*?);lines\(\[\[child\(\)\?',bundle,re.S)
    assert match
    welcome=match.group(1)
    bundle=bundle.replace('function orientation(){',"function orientation(){if(window.ROOKIE_MAIN_CITY_ACTIVE)return window.HARBOR.mainOpening?.orient()||false;",1)
    assert bundle.count('H.caper={')==1
    bundle=bundle.replace('H.caper={',"H.caper={openingWelcome:function(){return [child()?'PAPI':'DISPATCH',"+welcome+"];},openingSpawn:function(){return who()==='jay'?{x:1390,y:520}:who()==='rosa'?{x:655,y:850}:{x:570,y:850};},openingSetup:function(){data().orientation=true;save();},",1)
    # Never run the classic overworld simulation behind the authoritative canvas.
    token='if(document.hidden){lastT=0;simDt=0;return;}'
    assert bundle.count(token)==1
    bundle=bundle.replace(token,token+"\n/* authoritative connected campaign */ if(window.ROOKIE_MAIN_CITY_ACTIVE&&window.HARBOR?.seamlessCampusV115?.isOpen()&&!window.HARBOR.academy.active()&&!window.HARBOR.outbreak.active()){lastT=0;simDt=0;return;}",1)
    # All normal travel must resolve in the connected world or fail safely.
    token='function goTo(mapId, x, y){'
    hook="if(window.ROOKIE_MAIN_CITY_ACTIVE&&window.HARBOR?.mainCity&&!window.HARBOR.academy.active()&&!window.HARBOR.outbreak.active()){if(window.HARBOR.mainCity.travel(mapId,x,y))return true;toast('That destination is not available from here.');return false;}"
    assert bundle.count(token)==1
    bundle=bundle.replace(token,token+hook,1)
    bundle=bundle.replace('Object.keys(DAWN_PLATES).forEach(function(k){','Object.keys(DAWN_PLATES).forEach(function(k){if(window.ROOKIE_MAIN_CITY_ACTIVE)return;',1)
    return bind_continuity(bundle)

def bind_continuity(bundle):
    def replace(old, new):
        nonlocal bundle
        assert bundle.count(old) == 1, old
        bundle = bundle.replace(old, new, 1)

    # Keep the original Case 001 visible on profiles that actually closed it.
    # The current Case 001 uses the existing Caper record and outcome.
    new_case = "(window.ROOKIE_MAIN_CITY_ACTIVE && window.HARBOR?.caper?.usesNewCase())"
    replace('  CASE_SUMMARY.forEach(function(c){',
            '  CASE_SUMMARY.forEach(function(c, i){\n'
            f'    if({new_case} && i===0)c={{n:"CASE 001 — THE GREAT SANDWICH CAPER",t:"Nobody stole it. Brooks moved his lunch in the cooler."}};\n'
            f'    if({new_case} && i===3)c={{...c,t:c.t.replace("Patrol Officer → Detective","Detective")}};')
    replace('"From a missing drive in Intake to a freighter at the dock. Same lesson every time: follow what\'s supported."',
            f'{new_case} ? "From a missing sandwich in Intake to a freighter at the dock. Same lesson every time: follow what\'s supported." : '
            '"From a missing drive in Intake to a freighter at the dock. Same lesson every time: follow what\'s supported."')
    replace('  var rows = DB_RECORDS.filter(function(r){',
            '  var records = DB_RECORDS;\n'
            f'  if({new_case}){{\n'
            '    var caperRecords={\n'
            '      "1042":{role:"Rookie Officer",detail:"First shift at Precinct 9. Assigned The Great Sandwich Caper."},\n'
            '      "2210":{detail:"Saw Officer Torres open the break-room fridge and Brooks carrying a cooler."},\n'
            '      "2231":{detail:"Moved Brooks’s cooler to Intake storage."},\n'
            '      "CASE-001":{name:"CASE 001 — THE GREAT SANDWICH CAPER",detail:"Brooks’s missing lunch. Check the fridge, hear all three witnesses, and find the physical clue."}\n'
            '    };\n'
            '    records=records.map(function(r){return caperRecords[r.badge]?{...r,...caperRecords[r.badge]}:r;});\n'
            '  }\n'
            '  var rows = records.filter(function(r){')
    replace("if(rec){rec.name='CASE 001 — THE GREAT SANDWICH CAPER';",
            "if(rec&&!window.ROOKIE_MAIN_CITY_ACTIVE){rec.name='CASE 001 — THE GREAT SANDWICH CAPER';")
    replace('  if(state.closed){\n\n    lines.push(["EVIDENCE SHELVES", "Shelf A, slot 1:',
            f'  if({new_case})return showLines([["EVIDENCE SHELVES","Locked evidence shelves. Every item is tagged, sealed and signed for."]],null);\n'
            '  if(state.closed){\n\n    lines.push(["EVIDENCE SHELVES", "Shelf A, slot 1:')
    replace('  ch.body.forEach(function(p){ html += "<p>" + p + "</p>"; });',
            '  ch.body.forEach(function(p){\n'
            f'    if({new_case})p=p.replace("<b>Patrol Officer</b> after Case 001", "a first-case badge after Case 001").replace("001 The Missing Drive", "001 The Great Sandwich Caper");\n'
            '    html += "<p>" + p + "</p>";\n'
            '  });')
    replace('  shiftOverlay.classList.add("show");',
            '  shiftOverlay.classList.add("show");\n'
            '  if(window.ROOKIE_MAIN_CITY_ACTIVE)document.getElementById("btnShiftNext").focus({preventScroll:true});')
    replace('  endOverlay.classList.add("show");',
            '  endOverlay.classList.add("show");\n'
            '  if(window.ROOKIE_MAIN_CITY_ACTIVE)document.getElementById("btnEndExplore").focus({preventScroll:true});')
    replace('  function chapter(){var a=arc();return !a.done&&a.started?CHAPTERS[a.index]:null;}',
            '  function chapter(){var a=arc();return !a.done&&a.started&&(!window.ROOKIE_MAIN_CITY_ACTIVE||campaignDone())?CHAPTERS[a.index]:null;}')
    replace('    var a=arc();if(!campaignDone()||a.done)return false;',
            '    var a=arc();if(!campaignDone()||a.done||a.started||!CHAPTERS[a.index])return false;')
    replace('    else if(!a.started){h+=\'<h3>Act I complete',
            '    else if(window.ROOKIE_MAIN_CITY_ACTIVE&&!a.started&&a.index>0&&CHAPTERS[a.index]){var nextChapter=CHAPTERS[a.index];h+=\'<h3>\'+htmlEscape(nextChapter.title)+\'</h3><button class="dbtn gold" id="hcBegin">Begin Chapter \'+nextChapter.title.split(" · ")[0]+\'</button>\';}\n'
            '    else if(!a.started){h+=\'<h3>Act I complete')
    replace("storyBtn.onclick=function(){showJournal();};document.querySelector('header.topbar').appendChild(storyBtn);",
            "storyBtn.onclick=function(){if(window.ROOKIE_MAIN_CITY_ACTIVE)closeMenuPage();showJournal();};"
            "document.querySelector(window.ROOKIE_MAIN_CITY_ACTIVE?'.menu-actions':'header.topbar').appendChild(storyBtn);")
    replace("if(storyButton){var storyBefore=storyButton.onclick;",
            "if(storyButton&&!window.ROOKIE_MAIN_CITY_ACTIVE){var storyBefore=storyButton.onclick;")
    replace("next.onclick=function(){document.getElementById('endOverlay').classList.remove('show');beginChapter();};",
            "if(window.ROOKIE_MAIN_CITY_ACTIVE&&(arc().started||arc().index>0||arc().done))next.textContent='Open Story Journal';"
            "next.onclick=function(){document.getElementById('endOverlay').classList.remove('show');"
            "if(!window.ROOKIE_MAIN_CITY_ACTIVE||(!arc().started&&arc().index===0))beginChapter();else showJournal();};")
    replace("currentTargetId=function(){if(active())return 'caper';",
            "currentTargetId=function(){if(window.ROOKIE_MAIN_CITY_ACTIVE&&H.objective())return 'arcLead';if(active())return 'caper';")
    replace("var next=campObjective();document.getElementById('objCount')",
            "var next=(window.ROOKIE_MAIN_CITY_ACTIVE&&H.objective())||campObjective();document.getElementById('objCount')")
    return bundle
