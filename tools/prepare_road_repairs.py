from pathlib import Path
import shutil
r=Path.cwd();base=r/'site/preview/vehicle-perspective-updated';before=r/'site/preview/roads-before';after=r/'site/preview/roads-updated'
for p in [before,after]:
 if not p.exists():shutil.copytree(base,p)
bundle=(after/'game-v115.bundle.js').read_text('utf-8')
for name in ['v115-world.js','v115-campus.js']:
 old=(after/name).read_text('utf-8');new=(r/'published-game-capture'/name).read_text('utf-8');assert bundle.count(old)==1;bundle=bundle.replace(old,new);(after/name).write_text(new,encoding='utf-8')
(after/'game-v115.bundle.js').write_text(bundle,encoding='utf-8')

shutil.copy2(r/'tools/road_repair_review.html',r/'site/index.html')
