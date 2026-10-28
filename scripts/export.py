"""Copy only public publication files to the GitHub Pages upload directory."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_site'
OUT.mkdir(exist_ok=True)
for pattern in ['*.html', 'robots.txt', 'llms.txt', 'sitemap.xml', 'LICENCE.md', 'RIGHTS.md', '.nojekyll']:
    for source in ROOT.glob(pattern):
        shutil.copyfile(source, OUT / source.name)
for name in ['assets', 'data', 'documents']:
    shutil.copytree(ROOT / name, OUT / name, dirs_exist_ok=True)
print('Exported public site to _site/')
