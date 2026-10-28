"""Verify the native Studio runtime, sample assets and contextual figure mounts."""
from pathlib import Path
import hashlib,json,re
from urllib.parse import urlsplit,unquote

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
native=json.loads((ASSETS/'matrix-studio/upstream-manifest.json').read_text(encoding='utf-8'))
for name,record in native['modules'].items():assert sha(ASSETS/'matrix-studio'/name)==record['sha256'],name
starter=json.loads((ASSETS/'matrix-starter/upstream-manifest.json').read_text(encoding='utf-8'))
for record in starter['records']:
    if record.get('included') and record.get('output_sha256'):
        assert sha(ASSETS/'matrix-starter'/record['output'])==record['output_sha256'],record['output']
modules=list((ASSETS/'matrix-studio').rglob('*.js'))+list((ASSETS/'matrix-starter').rglob('*.js'))
for path in modules:
    if path.name=='three.min.js':continue
    text=path.read_text(encoding='utf-8-sig')
    for relative in re.findall(r'(?:^|\n)\s*import\s+(?:[^;]*?from\s*)?[\'\"]([^\'\"]+)[\'\"]',text):
        assert relative.startswith('.'),(path,relative)
        target=(path.parent/unquote(urlsplit(relative).path)).resolve()
        assert target.is_relative_to(ASSETS) and target.is_file(),(path,relative)
config=json.loads((ASSETS/'visual-example-placement.json').read_text(encoding='utf-8'))
figures=starters=0
for route,placements in config.items():
    assert len(placements)<=2,(route,'too many examples')
    page=(ROOT/(route+'.html')).read_text(encoding='utf-8')
    assert page.count('data-visual-example=')==len(placements),route
    for number,item in enumerate(placements,1):
        assert 'id="visual-'+route+'-'+str(number)+'"' in page,route
        figures+=1
        if item['module']=='starter':
            starters+=1
            assert f'data-aura-starter="{item["mode"]}"' in page,route
            assert f'stage={item["mode"]}&amp;example={item["example"]}' in page,route
assert 'new AuraView' in (ASSETS/'matrix-studio/viewer.js').read_text(encoding='utf-8')
assert 'aura-starter-ready' in (ASSETS/'aura-starter.js').read_text(encoding='utf-8')
assert 'sampleStorage as localStorage' in (ASSETS/'matrix-starter/studio/travel-data.js').read_text(encoding='utf-8')
print(json.dumps({'status':'passed','native_runtime_files':len(native['modules']),'module_graph_files':len(modules),'figures':figures,'native_starter_placements':starters,'source_and_adaptation_hashes':'verified'}))
