"""Main-build-only migration hooks. Historical engine and protected modes stay intact."""
import re
def bind_campaign(bundle):
    assert '/* authoritative connected campaign */' not in bundle
    # Cell 1 stays occupied in the connected campaign after Case 002.
    reed = "currentMission()==='m2'&&!state.camp.m2.done?'Elias Reed':null"
    assert bundle.count(reed) == 1
    bundle = bundle.replace(reed, "(currentMission()==='m2'&&!state.camp.m2.done||window.ROOKIE_MAIN_CITY_ACTIVE&&state.camp.m2.done)?'Elias Reed':null")
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
    return bind_kid_friendly_story(bind_command_pilot(bind_continuity(bundle)))

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


def bind_command_pilot(bundle):
    """Present Chapter 006 through the existing chapter and activity handlers."""
    def replace(old, new):
        nonlocal bundle
        assert bundle.count(old) == 1, old
        bundle = bundle.replace(old, new, 1)

    replace("a.scene=c.title;save();refreshPanels();showJournal('brief');return true;",
            """a.scene=c.title;save();refreshPanels();
    if(a.index===0&&window.ROOKIE_MAIN_CITY_ACTIVE){
      closeStory();
      const lines=[['SGT. BROOKS','Medical kits are missing!'],
        ['DISPATCH',c.intro.slice('Medical kits are missing! '.length)]];
      if(window.HARBOR.commandBeat?.('command-briefing',lines,()=>showJournal('brief')))return true;
    }
    showJournal('brief');return true;""")
    replace("  function renderActivity(){if(!activity)",
            """  function commandLists(){return window.ROOKIE_MAIN_CITY_ACTIVE&&activity?.i===0&&activity.j===0;}

  function renderActivity(){if(!activity)""")
    replace("    var right=(activity.i+activity.j)%2;",
            """    var clue='<blockquote>'+htmlEscape(s[4])+'</blockquote>';
    if(commandLists()){
      title='COMPARE THE SUPPLY LISTS';
      question='How many medical kits are unaccounted for?';
      options=['16 kits','24 kits'];
      clue='<div class="command-evidence">'+
        '<figure><img src="assets/chapter-006/ordered.png" alt=""><figcaption>Delivery list <strong>40 kits listed</strong></figcaption></figure>'+
        '<figure><img src="assets/chapter-006/received.png" alt=""><figcaption>Warehouse list <strong>24 kits received</strong></figcaption></figure></div>';
    }
    var right=(activity.i+activity.j)%2;""")
    replace("+htmlEscape(s[3])+'</h3><blockquote>'+htmlEscape(s[4])+'</blockquote><p>'+question",
            "+htmlEscape(s[3])+'</h3>'+clue+'<p>'+question")
    replace("activity.feedback=activity.kind==='document'?",
            "activity.feedback=commandLists()?'Subtract the number received from the number listed.':activity.kind==='document'?")
    replace("    var right=(activity.i+activity.j)%2;",
            """    if(window.ROOKIE_MAIN_CITY_ACTIVE&&activity.i===0&&activity.j===2){
      title='MUNICIPAL RECORD';
      clue='<article class="command-order" aria-label="Municipal signed order">'+
        '<div class="command-order-header"><img src="assets/chapter-006/signed_order.png" alt=""></div>'+
        '<blockquote>'+htmlEscape(s[4])+'</blockquote></article>';
    }
    var right=(activity.i+activity.j)%2;""")
    replace("interview={i:i,j:j,timeline:false,corroboration:false,response:''};renderInterview();return true;",
            """interview={i:i,j:j,timeline:false,corroboration:false,response:''};
    if(window.ROOKIE_MAIN_CITY_ACTIVE&&i===0&&j===1&&window.HARBOR.commandBeat?.('command-ortiz',null,renderInterview))return true;
    renderInterview();return true;""")
    replace("interview.timeline=true;interview.response=step[4];",
            """interview.timeline=true;interview.response=step[4];
    if(window.ROOKIE_MAIN_CITY_ACTIVE&&interview.i===0&&interview.j===1){
      story.classList.remove('show');
      if(window.HARBOR.commandBeat?.('command-ortiz',[['FOREMAN ORTIZ',step[4]]],renderInterview))return true;
    }""")
    replace("save();refreshPanels();showJournal();return true;",
            """save();refreshPanels();
    if(c===CHAPTERS[0]&&window.ROOKIE_MAIN_CITY_ACTIVE){
      closeStory();
      const result=c.result[choice];
      const lines=choice===0?[['DISPATCH',result]]:[
        ['DISPATCH',result.slice(0,result.indexOf(' Brooks says'))],
        ['SGT. BROOKS',result.slice(result.indexOf('“')+1,result.lastIndexOf('”'))]
      ];
      if(window.HARBOR.commandBeat?.('command-consequence',lines,()=>showJournal()))return true;
    }
    showJournal();return true;""")
    replace("var nextChapter=CHAPTERS[a.index];h+='<h3>'+htmlEscape(nextChapter.title)+'</h3><button",
            "var nextChapter=CHAPTERS[a.index];h+='<h3>'+htmlEscape(nextChapter.title)+'</h3>';"+
            "if(a.index===1&&(a.choices[0]===0||a.choices[0]===1))h+='<p>'+htmlEscape(CHAPTERS[0].result[a.choices[0]])+'</p>';"+
            "h+='<button")
    replace("document.getElementById('rankLabel').textContent=a.done?'CITIZEN':c.rank.toUpperCase();",
            """const junior=window.ROOKIE_MAIN_CITY_ACTIVE&&c===CHAPTERS[0]&&
      ['kaleb','gigi','lingling'].includes(window.HARBOR?.profiles?.current());
    document.getElementById('rankLabel').textContent=junior?'JUNIOR DETECTIVE':a.done?'CITIZEN':c.rank.toUpperCase();""")
    return bundle


def bind_kid_friendly_story(bundle):
    """Edit main-world copy without changing any choice or objective IDs."""
    def replace(old, new):
        nonlocal bundle
        assert bundle.count(old) == 1, old
        bundle = bundle.replace(old, new, 1)

    # Keep the canonical case titles, clues, and the existing dialogue callbacks.
    edits = {
        "Everybody, listen up! We have a Code Red situation!": "Code Red! And by red, I mean tomato.",
        "Everyone is safe. My sandwich is missing!": "Everyone is safe. Except my sandwich. It’s missing!",
        "Not this time. My sandwich is missing!": "The coffee machine has an alibi. My sandwich is missing!",
        "It had EXTRA BACON!": "Extra bacon. I need everyone to understand the stakes.",
        "Early this morning, before I carried some things to Intake. Rivera says Torres was near the fridge.": "This morning. Then I took some stuff to Intake. Rivera saw Torres near the fridge.",
        "Junior Detective, Papi and the team are supervising. Start at the fridge. Please don’t eat the clues.": "Junior Detective, you’re up. Check the fridge in the break room. And please don’t eat the clues.",
        "Rosa, start at the fridge. Please don’t eat the clues.": "Rosa, check the break room fridge first. Please don’t eat the clues.",
        "Find my sandwich, Rookie. Please don’t eat the clues.": "Rookie, check the break room fridge first. Please don’t eat the clues.",
        "An empty shelf. No sandwich. Let’s ask who was here.": "The shelf is empty. Next up: ask Rivera what he saw.",
        "I saw Torres open the fridge. Then Brooks started yelling.": "I saw Torres open the fridge. Then Brooks gave a whole speech about bacon.",
        "Brooks carried a cooler. He almost dropped it on my foot!": "Okay, here’s the tea. Brooks carried a cooler and almost dropped it on my foot.",
        "Rivera also thinks the vending machine is haunted.": "Rivera also thinks the vending machine is haunted. It just owes him a dollar.",
        "Brooks already asked four times! He brought a cooler for a transfer. I put it in Intake storage.": "Brooks asked FOUR times. I put the cooler he brought in Intake storage. It’s right here.",
        "Ready? I’ll open the transport cooler. It carries sealed office supplies, not dangerous items.": "Let’s open the cooler. If his sandwich is in here, it better be paying rent.",
        "Well, that explains a lot.": "The lunch bag has Brooks’s name on it. Let’s tell him what we found.",
        "Well? Who took it?": "Okay, spill the tea. What did you find?",
        "That could explain it. Now find something that proves it.": "Could be! Check the cooler in Intake for something that proves it.",
        "You carried your lunch bag to Intake in the transfer cooler.": "You took your own lunch to Intake. It was inside the cooler.",
        "…That does sound like me. So the suspect was me?": "Plot twist. I was my own suspect.",
        "I need a vacation.": "I need a vacation. And a second sandwich.",
        " · Detective Notebook earned. Case 002 is available when you’re ready.": " · You earned a Detective Notebook! Talk to Brooks again to start Case 002.",
        "Talk to Omar, check the rear door and stockroom, watch the security video, check Records, and log your evidence. Remember: being suspiciously silly isn't proof of a crime.": "Start with Omar at QuickMart. Ask him what went missing. The gold marker will show you where to go.",
        "You found Mr. Pickles! The poor foam fellow was stuck behind cereal boxes. But the real snack crates are still missing. Which lead is supported by your evidence?": "Mr. Pickles was stuck behind cereal boxes. Rough day to be a pickle. The snack crates are still missing. What do your clues tell you?",
        "Check the truck's partial plate in Records: Voss / 4417": "Go to Records. Search for the truck plate ending in 4417.",
        "Log the pickle case evidence in the Evidence Room": "Take your QuickMart clues to the Evidence Room.",
        "Tell Brooks what REALLY happened (no seagull arrests)": "Tell Brooks what your QuickMart clues show.",
        "Take Mrs. Almeida's statement on Maple Court": "Ask Mrs. Almeida what she saw on Maple Court.",
        "Search the warehouse — the opened crate row in bay 3": "Check the open crates in warehouse Bay 3.",
        "Check the foreman's desk ledger in the warehouse": "Read the record book on the warehouse desk.",
        "Take Old Tom's statement at the waterfront": "Ask Old Tom what he saw at the waterfront.",
        "Recover the harbor ledger from the shed desk": "Pick up the harbor record book on the shed desk.",
        "Final report to Sgt. Brooks — name who runs the ring": "Tell Brooks who’s behind the stolen shipments.",
        "Review the evidence and choose the chapter outcome in Story": "Open Story and choose what to do with your clues",
        "Follow the leads on Assignments. Visit the marked places and check each clue. You choose where to start.": "Follow the gold marker to your next clue. To pick a different clue, open Assignments and choose Follow this clue.",
        "Your choice changes what happens next and how much people trust you.": "Read both choices. What you pick changes what happens next and how much people trust you.",
        "How many medical kits are unaccounted for?": "How many medical kits are missing?",
        "Subtract the number received from the number listed.": "Start with 40. Take away the 24 kits that arrived.",
        "Assignments tracks tasks. Story holds briefings and decisions. Inventory holds equipment and evidence.": "Assignments shows where to go. Story is where you make choices. Inventory holds your gear and clues.",
        "Track objective</button>": "Follow this clue</button>",
        "Complete the original five investigations to unlock Command, Outside the Law, and Harbor City. Open Assignments to track your current case. Inventory holds your equipment and evidence.": "Follow the gold marker to your next clue. Need a reminder? Open Assignments to see what to do next.",
    }
    for old, new in edits.items():
        replace(old, new)
    replace("'Briefing & break room',text:n===2?", "key==='fridge'?'Break Room':key==='rivera'?'Hall by the Break Room':'Briefing Room',text:n===2?")
    replace("+'/3 witnesses':definition.stages[n]", "+' of 3 people talked to':definition.stages[n]")
    replace("stages:['Talk to Sergeant Brooks in Briefing','Inspect the break room fridge','Talk to the three witnesses','Inspect the cooler in Intake','Explain what happened to Brooks'",
            "stages:['Talk to Sergeant Brooks','Check the fridge','Talk to three people','Open the cooler','Tell Brooks what you found'")
    return bundle
