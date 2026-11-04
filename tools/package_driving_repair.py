"""Publish review artifacts to the ignored local site, never to a remote."""
from pathlib import Path
import shutil, json, html, re
root=Path(__file__).resolve().parents[1]
source=root/'docs/driving-repair'
target=root/'site/evidence/driving-repair'
target.mkdir(parents=True,exist_ok=True)
report=(source/'TEST_REPORT.md').read_text(encoding='utf-8')
city=json.loads((source/'city-simulation.json').read_text(encoding='utf-8'))
performance=json.loads((source/'performance.json').read_text(encoding='utf-8'))
m=city['metrics']
stats=f"""- City fleet: {m['cars']} cars; {m['legs']} candidate directed legs, {m['liveLegs']} usable continuing legs, {m['turns']} validated turn connectors.
- Actual city test: {city['seconds']} simulated seconds, {city['checks']:,} body-pair checks, zero detected overlaps, {city['visitedLegs']} visited legs and {m['distinctTransitions']} distinct driven two-leg routes/transitions. These are road-to-road routes, not a claim that every complete destination itinerary was exercised.
- {len(city['physicalDistrictCrossings'])} distinct continuous district-crossing directions were observed, excluding off-screen reentry. Both Precinct directions have graph reachability to all nine tested districts.
- Final longest wait: {m['maxWait']:.1f} simulated seconds; {m['recoveries']} sampled turnarounds, {m['reroutes']} intersection reroutes and {m['offscreenReentries']} explicitly off-screen reentries. No visible position snap was detected.

| Driving comparison | Prior fleet FPS / P95 | City fleet FPS / P95 |
|---|---|---|
"""
for rate,label in [(1,'Normal CPU'),(4,'4× CPU slowdown')]:
    old=next(r for r in performance['runs'] if r['rate']==rate and r['baseline'])
    new=next(r for r in performance['runs'] if r['rate']==rate and not r['baseline'])
    stats+=f"| {label} | {old['fps']} / {old['p95Ms']:.1f} ms | {new['fps']} / {new['p95Ms']:.1f} ms |\n"
stats+='\nThe 4.5-second comparisons isolate the prior campus/fleet from commit `8d073e1` versus the new routing, using the same current handling, art, view and inputs. They are not physical-handset benchmarks.'
report=re.sub(r'<!-- MEASUREMENTS_START -->.*?<!-- MEASUREMENTS_END -->','<!-- MEASUREMENTS_START -->\n'+stats+'\n<!-- MEASUREMENTS_END -->',report,flags=re.S)
(source/'TEST_REPORT.md').write_bytes(report.encode('utf-8'))
for p in source.iterdir():
    if p.is_file():shutil.copy2(p,target/p.name)
body='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Driving and city traffic review</title>
<style>body{margin:0;background:#102238;color:#f4ebd4;font:16px system-ui;line-height:1.5}main{max-width:1200px;margin:auto;padding:22px}a{color:#f6d083}img{display:block;max-width:100%;margin:15px 0;border-radius:10px}pre{white-space:pre-wrap;background:#192f43;padding:20px;border-radius:10px;font:14px system-ui}figure{margin:30px 0}</style><main><h1>Sporty Arcade driving and citywide traffic</h1><p><a href="/">Play connected Harbor City</a> · <a href="TEST_REPORT.md">Full report</a> · <a href="DIAGNOSIS.md">Diagnosis before changes</a> · <a href="city-simulation.json">City test data</a> · <a href="performance.json">Frame timings</a></p>'''
for name,caption in [('precinct-road','Precinct public road'),('downtown-intersection','Downtown intersection'),('midtown-streets','Midtown roads'),('southbay-roads','Southbay / Marina approach'),('industrial-road','Industrial traffic')]:
    body+=f'<figure><img loading="lazy" src="{name}.png" alt="{caption}"><figcaption>{caption}: actual connected-game capture.</figcaption></figure>'
body+='<figure><img loading="lazy" src="mobile-driving.png" alt="Portrait mobile driving controls"><figcaption>Portrait mobile GAS, steering and STOP check.</figcaption></figure>'
body+='<h2>Test report</h2><pre>'+html.escape(report)+'</pre></main></html>'
(target/'index.html').write_bytes(body.encode('utf-8'))
shutil.copy2(root/'tools/civilian_preview_review.html',root/'site/index.html')
print('Packaged local driving/traffic review:',target)
