"""Optional presentation hooks in the LOCAL connected build; canonical game stays intact."""

def apply_family_lines(bundle):
    replacements = {
        '    setDialogue(L[0], L[1],': '    var renderLine = () => setDialogue(L[0], L[1],',
        '    document.getElementById("dlgNext").addEventListener("click", function(){':
            '''    if (L[3] && window.ROOKIE_MAIN_CITY_ACTIVE && window.ROOKIE_COMIC) {
      window.ROOKIE_COMIC.withLine(L[3], renderLine);
    } else renderLine();

    document.getElementById("dlgNext").addEventListener("click", function(){''',
        'return[speakers[l[0]],l[1]];': 'return[speakers[l[0]],l[1],null,{speakerId:l[0],emotion:l[2]}];',
        'cards.push([l[0],t,i===parts.length-1?l[2]:undefined]);':
            'cards.push([l[0],t,i===parts.length-1?l[2]:undefined,l[3]]);',
        '  var v=viewport();if(v.right-v.left<100||v.bottom-v.top<80)return;':
            '''  var v=viewport();
  if(active.familyLine&&window.ROOKIE_COMIC)v.top=Math.min(v.bottom-80,window.ROOKIE_COMIC.familyTop(active,v));
  if(v.right-v.left<100||v.bottom-v.top<80)return;''',
        'lines([[speakers[id],familyLine(id)]],null);':
            'lines([[speakers[id],familyLine(id),null,{speakerId:id}]],null);',
        '''['kaleb',"That’s not a Code Red."],['gigi','Maybe it ran away.'],['lingling','Did anybody check under the bread?']''':
            '''['kaleb',"That’s not a Code Red.",'thinking'],['gigi','Maybe it ran away.','happy'],['lingling','Did anybody check under the bread?','thinking']''',
        '''[playerSpeaker(),'When did you last see it?']''':
            '''[playerSpeaker(),'When did you last see it?',null,{speakerId:who(),emotion:'thinking'}]''',
        '''['jay','Let’s find out what actually happened.'],['rosa','And stop accusing people before breakfast.']''':
            '''['jay','Let’s find out what actually happened.','determined'],['rosa','And stop accusing people before breakfast.','worried']''',
    }
    for before, after in replacements.items():
        if after in bundle:
            continue
        expected = 2 if before == 'lines([[speakers[id],familyLine(id)]],null);' else 1
        assert bundle.count(before) == expected, before
        bundle = bundle.replace(before, after)
    return bundle

def apply_comic_hooks(bundle, engine):
    # Restore just the canonical presentation IIFE before applying optional hooks.
    # Local builds are repeatable, including builds made by older hook revisions.
    start='/* In-world dialogue presentation. Narrative buttons/callbacks remain authoritative. */'
    end='/* Adaptive presentation over the existing resolver, joystick and vehicle actions. */'
    a=bundle.index('/* comic presentation hooks */') if '/* comic presentation hooks */' in bundle else bundle.index(start)
    bundle=bundle[:a]+engine[engine.index(start):engine.index(end)]+bundle[bundle.index(end):]

    replacements = {
        'var s=settings();active=': 'var s=settings(full);active=',
        ' function blocks(v,actor){': ' function blocks(v,actor){var comic=window.ROOKIE_COMIC?.blocks(actor);if(comic)return comic;',
        'var actor=present(active.actor)?active.actor:null,ap=actor?point(actor):null;': 'if(window.ROOKIE_COMIC?.cameraChanged())active.dirty=true;var actor=present(active.actor)?active.actor:null,ap=actor?point(actor):null;',

        "var full=text.textContent;typeText(full);prepare();finishType();": "var full=String(t||'');typeText(full);prepare();finishType();",
        "var pos=p?place(p,w,h,v,blocks(v,a),active.side)": "active.comicAnchor=p;var pos=p?place(p,w,h,v,blocks(v,a),active.side)",
        "if(!active||panel.style.display==='none'||overlayOpen())return;": "if(!active||panel.style.display==='none'||(overlayOpen()&&!window.ROOKIE_COMIC?.modalActive()))return;",
        "if(dlgOpen||csActive||overlayOpen()||(H.profiles": "if(dlgOpen||csActive||(overlayOpen()&&!window.ROOKIE_COMIC?.ambientAllowed())||(H.profiles",
        "||!present(ambient.actor)||csActive||overlayOpen())": "||!present(ambient.actor)||csActive||(overlayOpen()&&!window.ROOKIE_COMIC?.ambientAllowed()))",
        "small.style.left=clamp(p.x-r.width/2,v.left,v.right-r.width)+'px';small.style.top=clamp(p.y-p.head-r.height-10,v.top,v.bottom-r.height)+'px';": "var bp=ambient.actor.ref.comicBanter?place(p,r.width,r.height,v,blocks(v,ambient.actor),null):null;small.style.left=(bp?bp.x:clamp(p.x-r.width/2,v.left,v.right-r.width))+'px';small.style.top=(bp?bp.y:clamp(p.y-p.head-r.height-10,v.top,v.bottom-r.height))+'px';",

        ' function resolve(speaker){': ' function resolve(speaker){\n  var comic=window.ROOKIE_COMIC?.resolve(speaker);if(comic)return comic;',
        ' function present(a){': " function present(a){if(a?.kind==='connected')return !!window.ROOKIE_COMIC?.present(a);",
        ' function point(a){': " function point(a){if(a?.kind==='connected')return window.ROOKIE_COMIC.point(a);",
        ' function screen(p,r){': ' function screen(p,r){var comic=window.ROOKIE_COMIC?.screen(p);if(comic)return comic;',
        ' function viewport(){': ' function viewport(){var comic=window.ROOKIE_COMIC?.viewport();if(comic)return comic;',
        'metrics.font="500 16px Barlow, sans-serif";': 'metrics.font=window.ROOKIE_COMIC?.font()||"500 16px Barlow, sans-serif";',
        ' function settings(){': ' function settings(full){var comic=window.ROOKIE_COMIC?.settings(full);if(comic)return comic;',
        's.width-32,s.lines': 's.width-(window.ROOKIE_COMIC?.inset()||32),s.lines',
        'conf.width-32,conf.lines': 'conf.width-(window.ROOKIE_COMIC?.inset()||32),conf.lines',
        ' function layout(){': ' function layout(){window.ROOKIE_COMIC?.decorate(active,panel);',
        "if(a&&a.kind!=='player'&&a.kind!=='scene')": "if(a&&a.kind!=='connected'&&a.kind!=='player'&&a.kind!=='scene')",
        "var oldHide=hideDlgPanel;hideDlgPanel=function(){oldHide();": "var oldHide=hideDlgPanel;hideDlgPanel=function(){window.ROOKIE_COMIC?.dismiss();oldHide();",
        'lastLayout=now;if(active)layout();smallLayout();': 'lastLayout=now;if(active)layout();smallLayout();window.ROOKIE_COMIC?.afterLayout(active,ambient);',
    }
    for old,new in replacements.items():
        if old == new: continue
        if new in bundle: continue
        assert bundle.count(old)==1, (old,bundle.count(old))
        bundle=bundle.replace(old,new)
    marker='/* In-world dialogue presentation. Narrative buttons/callbacks remain authoritative. */'
    bridge='''/* comic presentation hooks */
window.HARBOR.comicDialogue={
 lines:function(lines,done){if(window.ROOKIE_COMIC?.enabled())showLines(lines,done);},
 choices:function(s,t,c){if(window.ROOKIE_COMIC?.enabled())showChoices(s,t,c);},
 pop:function(){if(window.ROOKIE_COMIC?.enabled())sndClick();},
 close:function(){hideDlgPanel();}
};
'''
    assert bundle.count(marker)==1
    return bundle if '/* comic presentation hooks */' in bundle else bundle.replace(marker,bridge+marker)
