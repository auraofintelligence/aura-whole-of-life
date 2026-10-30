"""Verify only native geometry is retained; demonstration projects are absent."""
from pathlib import Path
import hashlib,json,re
from urllib.parse import urlsplit,unquote

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((ASSETS/'aura-geometry-provenance.json').read_text(encoding='utf-8'))
for name,value in manifest['productionAssets'].items():assert sha(ASSETS/name)==value,name
native=json.loads((ASSETS/'matrix-studio/upstream-manifest.json').read_text(encoding='utf-8'))
for name,record in native['modules'].items():assert sha(ASSETS/'matrix-studio'/name)==record['sha256'],name
for path in (ASSETS/'matrix-studio').rglob('*.js'):
 if path.name=='three.min.js':continue
 text=path.read_text(encoding='utf-8')
 for relative in re.findall(r'(?:^|\n)\s*import\s+(?:[^;]*?from\s*)?[\'\"]([^\'\"]+)[\'\"]',text):
  assert relative.startswith('.'),(path,relative)
  dep=(path.parent/unquote(urlsplit(relative).path)).resolve()
  assert dep.is_relative_to(ASSETS.resolve()) and dep.is_file(),(path,relative)
for name in ['matrix-studio-samples.json','aura-starter.js','aura-everyday.js','visual-example-placement.json','matrix-studio/samples.js','matrix-studio/viewer.js','matrix-starter/index.html']:
 assert not (ASSETS/name).is_file(),('Removed demonstration asset remains',name)
assert not list((ASSETS/'matrix-starter').rglob('*.*'))
config=json.loads((ASSETS/'aura-geometry-placement.json').read_text(encoding='utf-8'))
count=0
for page in ROOT.glob('*.html'):
 text=page.read_text(encoding='utf-8')
 assert not any(old in text for old in ['data-aura-starter','data-aura-learning','data-aura-everyday','Visual example · sample data','assets/matrix-starter/','assets/aura-everyday','assets/aura-learning','Cardboard world']),page.name
 n=text.count('data-basic-aura')
 assert n==int(page.stem in config),(page.name,n)
 count+=n
host=(ASSETS/'matrix-studio/basic-viewer.js').read_text(encoding='utf-8')
assert 'new AuraView' in host and 'blankProject()' in host
assert not any(x in host for x in ['SAMPLES','recordsAt(','sample project','localStorage','fetch('])
print(json.dumps({'status':'passed','geometry_viewers':count,'native_files_verified':len(native['modules']),'production_assets_verified':len(manifest['productionAssets']),'sample_layer':'removed'}))
