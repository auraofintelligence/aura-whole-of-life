"""Validate publication integrity without installing dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from collections import Counter
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build

def normalise(text):
    return ' '.join(text.split())

class Document(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = []
        self.links = []
        self.assets = []
        self.source_text = {}
        self.source_ids = []
        self.source_tables = {}
        self.headings = []
        self.nav_hrefs = []
        self.meta = {}
        self.lang = None
        self.h1_count = 0
        self.canonical = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        node = {'tag': tag, 'attrs': a}
        if tag not in self.VOID:
            self.stack.append(node)
        if a.get('id'):
            self.ids.append(a['id'])
        if 'data-source-paragraph' in a:
            pid = int(a['data-source-paragraph'])
            self.source_ids.append(pid)
            self.source_text[pid] = []
        if 'data-source-table' in a:
            self.source_tables[int(a['data-source-table'])] = []
        if tag in {'td', 'th'}:
            node['cell'] = []
        if tag == 'a':
            self.links.append(a)
            if any(x['tag'] == 'nav' and x['attrs'].get('aria-label') == 'All pages' for x in self.stack):
                self.nav_hrefs.append(a.get('href', ''))
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'meta':
            self.meta[a.get('name', a.get('property'))] = a.get('content')
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        if a.get('src'):
            self.assets.append(a['src'])
        if a.get('srcset'):
            self.assets.extend(x.strip().split()[0] for x in a['srcset'].split(','))
        if tag == 'link' and a.get('rel') in {'stylesheet', 'icon', 'apple-touch-icon'}:
            self.assets.append(a['href'])
        if tag == 'img':
            assert a.get('alt'), 'Images must have meaningful alternative text'
            assert a.get('width') and a.get('height'), 'Images need explicit dimensions'
        if tag == 'br':
            self.handle_data(' ')

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                node = self.stack[i]
                if tag in {'th', 'td'} and 'cell' in node:
                    parent = next((x for x in reversed(self.stack[:i]) if 'data-source-table' in x['attrs']), None)
                    if parent:
                        self.source_tables[int(parent['attrs']['data-source-table'])].append(normalise(''.join(node['cell'])))
                self.stack = self.stack[:i]
                return

    def handle_data(self, data):
        if any('sr-only' in x['attrs'].get('class', '').split() for x in self.stack):
            return
        for node in self.stack:
            if 'data-source-paragraph' in node['attrs']:
                self.source_text[int(node['attrs']['data-source-paragraph'])].append(data)
            if 'cell' in node:
                node['cell'].append(data)

def main():
    docs = {p.name: Document(p.read_text(encoding='utf-8')) for p in ROOT.glob('*.html')}
    expected_routes = {x['slug'] + '.html' for x in build.PAGES}
    assert set(docs) == expected_routes | {'404.html'}, 'Unexpected or missing HTML routes'
    errors = []
    originals = Counter()
    table_records = {}
    external_urls = set()
    for filename, doc in docs.items():
        assert len(doc.ids) == len(set(doc.ids)), f'Duplicate IDs in {filename}'
        assert doc.lang == 'en-AU' and doc.h1_count == 1, f'Language/title contract failed: {filename}'
        assert doc.meta.get('description') and doc.meta.get('og:image'), f'Metadata missing: {filename}'
        assert doc.canonical and doc.canonical.startswith(build.BASE), f'Canonical missing: {filename}'
        assert expected_routes.issubset(set(doc.nav_hrefs)), f'Menu omits routes: {filename}'
        if filename == '404.html':
            assert 'noindex' in doc.meta.get('robots', ''), '404 must be noindex'
        for attr in doc.links:
            href = attr.get('href', '')
            parts = urlsplit(href)
            if parts.scheme in {'http', 'https'}:
                external_urls.add(href)
                if attr.get('target') == '_blank':
                    assert {'noopener', 'noreferrer'}.issubset(set(attr.get('rel', '').split())), f'External tab without protection: {filename}'
                continue
            if parts.scheme in {'mailto', 'tel'}:
                continue
            dest = unquote(parts.path) or filename
            path = (ROOT / dest).resolve()
            if not path.is_relative_to(ROOT.resolve()) or not path.exists():
                errors.append(f'{filename}: missing/unsafe link {href}')
            if parts.fragment:
                target_doc = docs.get(dest)
                if target_doc is None or unquote(parts.fragment) not in target_doc.ids:
                    errors.append(f'{filename}: missing fragment {href}')
        for asset in doc.assets:
            if urlsplit(asset).scheme:
                errors.append(f'{filename}: remote runtime asset {asset}')
            elif not (ROOT / unquote(urlsplit(asset).path)).is_file():
                errors.append(f'{filename}: missing asset {asset}')
        for pid, pieces in doc.source_text.items():
            originals[pid] += 1
            block = next(b for b in build.BLOCKS if b['kind'] == 'paragraph' and b['id'] == pid)
            assert normalise(''.join(pieces)) == normalise(block['text']), f'Source text changed at paragraph {pid} in {filename}'
        for key, cells in doc.source_tables.items():
            assert key not in table_records, f'Duplicate original table {key}'
            table_records[key] = cells
    for block in build.BLOCKS:
        if block['kind'] == 'paragraph' and block['id'] >= 4 and block['text']:
            assert originals[block['id']] == 1, f'Source paragraph missing or duplicated: {block["id"]}'
        if block['kind'] == 'table':
            expected_cells = [normalise(cell['text']) for row in block['rows'] for cell in row]
            assert table_records.get(block['id']) == expected_cells, f'Table content changed: {block["id"]}'
    for entry in build.ORIGINAL_LINKS:
        assert entry['url'] in external_urls, f'Original source URL omitted: {entry["url"]}'
    for image in build.IMAGES.values():
        assert hashlib.sha256((ROOT / image['file']).read_bytes()).hexdigest() == image['sha256'], f'Artwork bytes changed: {image["id"]}'
        assert image['prompt'] and image['alt'] and image['generator']
    css = (ROOT / 'assets/site.css').read_text(encoding='utf-8')
    screen_css = css.split('@media print')[0]
    assert ':root' in screen_css and "font:18px" in screen_css, 'Base text must be at least 18px'
    for selector, rules in re.findall(r'([^{}]+)\{([^{}]*)\}', screen_css):
        for size in re.findall(r'font-size\s*:\s*([\d.]+)px', rules):
            assert float(size) >= 18 or 'figcaption' in selector, f'Small ordinary screen text: {selector}'
    for asset in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css):
        assert (ROOT / 'assets' / asset).is_file(), f'CSS asset missing: {asset}'
    assert 'object-fit:cover' not in css and 'background-image:' not in css, 'Keep artwork at natural proportions'
    assert (ROOT / 'assets/fonts/DM-Sans-OFL.txt').is_file() and (ROOT / 'assets/fonts/Manrope-OFL.txt').is_file()
    licence = (ROOT / 'LICENCE.md').read_text(encoding='utf-8')
    assert 'This is not an open-source licence.' in licence and 'aura-whole-of-life' in licence
    snippet = (ROOT / '.github/robots-root-snippet.txt').read_text(encoding='utf-8')
    groups, agents = {}, []
    for line in snippet.splitlines():
        if line.startswith('User-agent:'):
            agents = [line.split(':', 1)[1].strip()]
            groups.setdefault(agents[0], [])
        elif line.startswith(('Allow:', 'Disallow:')):
            for agent in agents:
                groups[agent].append(line)
    for bot in ['*', 'OAI-SearchBot', 'Claude-SearchBot']:
        assert 'Allow: /aura-whole-of-life/' in groups.get(bot, []), f'Search discovery rule missing: {bot}'
    for bot in ['GPTBot', 'ClaudeBot', 'Google-Extended']:
        assert 'Disallow: /aura-whole-of-life/' in groups.get(bot, []), f'Training preference missing: {bot}'
    assert 'Disallow: /\n' not in snippet, 'Root snippet must be project-scoped'
    sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    assert sitemap.count('<loc>') == len(expected_routes) and '404.html' not in sitemap
    assert not errors, '\n'.join(errors)
    report = {'html_pages': len(docs), 'public_routes': len(expected_routes), 'source_paragraphs_preserved': len(originals), 'tables_preserved': len(table_records), 'original_hyperlinks': len(build.ORIGINAL_LINKS), 'source_sha256': build.REGISTER['sha256'], 'checks': 'All local href/src/srcset/fragments, menu routes, original narrative and table cells, source/artwork hashes, metadata, external-tab rel, self-hosted fonts and 18px screen typography passed.'}
    (ROOT / 'data/build-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
