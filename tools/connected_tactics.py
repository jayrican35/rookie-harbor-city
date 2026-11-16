"""Bind the existing two encounter controllers to the connected room geometry.

Changes apply only to the compiled connected build. Original game.js and all
combat-mode modules/assets remain unchanged.
"""
def bind_tactics(bundle):
    if '/* connected tactical geometry */' in bundle:
        return bundle
    start=bundle.index("var H=window.HARBOR,m=MAPS.warehouse,npc=")
    end=bundle.index('/* Contextual attachments only.',start)
    code=bundle[start:end]
    token='function sync(){'
    hook="function sync(){/* connected tactical geometry */ if(H.connectedTactics?.owns()){if(!H.connectedTactics.executing('warehouse'))return false;var c=H.connectedTactics.config('warehouse');if(c){m=c.map;npc=c.npc;home=c.home;}}"
    assert code.count(token)==1
    code=code.replace(token,hook)
    code=code.replace('player.x=627;player.y=780;',"var entry=H.connectedTactics?.config('warehouse')?.entry;player.x=entry?entry.x:627;player.y=entry?entry.y:780;")
    code=code.replace('ctx.arc(640,800,16,0,7)',"ctx.arc(H.connectedTactics?.config('warehouse')?.door.x||640,H.connectedTactics?.config('warehouse')?.door.y||800,16,0,7)")
    code=code.replace('update:function(dt){update(dt,0);}','update:function(dt,moved){update(dt,moved||0);}')
    code=code.replace('function choose(choice){',"function choose(choice){if(H.connectedTactics?.owns()&&!H.connectedTactics.executing('warehouse'))return H.connectedTactics.action('warehouse',()=>choose(choice));",1)
    bundle=bundle[:start]+code+bundle[end:]
    start=bundle.index('var H=window.HARBOR,map=MAPS.hale,owner=')
    end=bundle.index('H.haleTactical={',start)
    code=bundle[start:end]
    hook="function sync(){if(H.connectedTactics?.owns()){if(!H.connectedTactics.executing('hale'))return false;var c=H.connectedTactics.config('hale');if(c)map=c.map;}"
    assert code.count(token)==1
    code=code.replace(token,hook)
    code=code.replace('actor:{x:310,y:330}',"actor:H.connectedTactics?.config('hale')?.threat||{x:310,y:330}")
    code=code.replace('if(visible){silhouette(actor.x,actor.y,',"if(visible){if(!H.connectedTactics?.drawThreat(ctx,actor,run.phase==='threat'))silhouette(actor.x,actor.y,")
    bundle=bundle[:start]+code+bundle[end:]
    bundle=bundle.replace('H.haleTactical={weapon:weapon,','H.haleTactical={paint:paint,weapon:weapon,',1)
    bundle=bundle.replace('function draw(t){', 'function draw(t){if(window.ROOKIE_MAIN_CITY_ACTIVE&&window.HARBOR?.seamlessCampusV115?.isOpen())return;',1)
    return bundle
