from basic_aura import enhance_basic_aura
"""Build a complete, dependency-free reading website from the preserved DOCX."""
from pathlib import Path
from html import escape
import hashlib
import json
import re
import shutil
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://auraofintelligence.github.io/aura-whole-of-life/'
REPO = 'https://github.com/auraofintelligence/aura-whole-of-life'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
W = '{' + NS['w'] + '}'
R = '{' + NS['r'] + '}'
DATE = '28 October 2026'
REGISTER = json.loads((ROOT / 'data/source-register.json').read_text(encoding='utf-8'))
IMAGES = {x['id']: x for x in json.loads((ROOT / 'data/images.json').read_text(encoding='utf-8'))}
CHAPTERS = [
    dict(slug='getting-started', label='Getting started', title='A first account you recognise', start=11, end=28, summary='Choose one useful purpose, record enough personal context to begin, and review the result in your own words. The relationship develops through experience and correction.', image='whole-life-hero', action='What would you like the first useful encounter to help you do? A short care introduction, a meaningful activity or a question for someone supporting you can provide a beginning.'),
    dict(slug='changing-support', label='Changing support needs', title='Support shaped by your life', start=29, end=63, summary='Younger onset dementia, disability and emerging aged care involve different lives and support arrangements. Begin with the person’s communication, abilities and chosen goals.', image=None, action='Choose a familiar activity and describe what makes it manageable or enjoyable. The relevant support team can then discuss a particular change and review what helped.'),
    dict(slug='identity-and-wishes', label='Identity and future wishes', title='Room to remember and to change', start=64, end=75, summary='Explore why an experience or preference matters. Earlier stories sit alongside present wishes, new friendships and possibilities still to come.', image=None, action='A simple question can open a useful conversation: when you say you miss home, which part of home do you mean? The person’s explanation leads the next step.'),
    dict(slug='memory-palaces', label='Memory palaces and downsizing', title='Keep the meaning of a place', start=76, end=99, summary='A familiar room, garden or object can lead back to a story. A place-based collection preserves selected photographs, recordings and their personal meaning through a move.', image='places-and-memories', action='Begin with one place and one story. Give the item a recognisable name, its source and the person’s explanation, then try opening it in the format they expect to use later.'),
    dict(slug='moving-home', label='Moving home and into care', title='Carry your story into the next home', start=100, end=111, summary='Prepare a small, useful introduction for the receiving team. Earlier places remain part of a life that continues in a new room, with present routines and relationships.', image=None, action='Before moving day, agree what travels, who receives access and who can help open or correct the collection. Make the introduction short enough for a real care encounter.'),
    dict(slug='adult-genesis', label='Adult Genesis and wellbeing', title='Understand the adult research proposal', start=112, end=135, summary='The intensive adult Genesis design brings personal reflection, HBOT and Truth Engine research into a proposed programme. Each element needs its own purpose, assessment and evidence.', image=None, action='An actual research invitation needs to explain the activity, recording, clinical purpose, responsible team, alternatives and a practical way to stop. Everyday Aura support has its own introduction route.'),
    dict(slug='people-and-choice', label='People, consent and safety', title='People you can turn to', start=136, end=156, summary='Families, carers, providers, clinicians and researchers bring different responsibilities. A dependable offer makes those responsibilities and the person’s choices understandable.', image=None, action='Name who receives a concern, who follows it up, and where independent help is available. Choosing whether to join research remains separate from decisions about existing care.'),
    dict(slug='personal-records', label='Personal records and legal context', title='Useful access with clear boundaries', start=157, end=180, summary='Understand where information is held, who can use it and how to find or correct it. Legal learning helps prepare a clearer question and identify the responsible decision-maker.', image=None, action='Try recovering a selected story from a backup. Check the information and permission needed for the next encounter, including what happens if a device, supporter or provider changes.'),
    dict(slug='clinical-development', label='Clinical development and evidence', title='Test a defined benefit', start=181, end=204, summary='A personal record, a clinical software function, HBOT and a Truth Engine task ask different questions. The proposed development route connects each claim with a suitable evaluation.', image=None, action='Describe one input, one output and the decision being supported. A clear purpose makes it possible to choose useful outcomes, examine errors and decide what the next study should test.'),
    dict(slug='pathways-and-place', label='Care pathways and a local beginning', title='A practical place to begin', start=205, end=238, summary='Funding pathways, quality standards and local relationships shape what can actually be offered. A focused Queensland beginning would examine a defined need and the resources around it.', image=None, action='Set out who is paying, what is included, what support is needed and who is accountable. The Amity land proposal and a funded care or research service each require their own agreements.'),
    dict(slug='community-and-futures', label='Community, work and time', title='A whole life in the community', start=239, end=262, summary='Friendship, learning, creativity, rest and contribution belong alongside support needs. Wider Aura proposals explore voluntary reciprocity, shared enterprise and time throughout life.', image='community-and-choice', action='Look for an invitation connected to the person’s interests and access needs. A welcoming event, creative project or skill shared with a neighbour can be worthwhile in its own right.'),
    dict(slug='partnerships', label='Developing the programme', title='Turn a useful purpose into a clear offer', start=263, end=274, summary='Prepare a demonstration, name the people and resources involved, and establish readiness before recruitment. The next step follows a review of the actual experience.', image=None, action='Bring one goal and your questions about what is currently available. Individuals, carers, providers, clinicians and research partners can each begin with the role they are considering.'),
]
UTILITIES = [dict(slug='sources', label='Sources and original document', title='Keep the source close'), dict(slug='projects', label='Connected projects', title='Find the right next connection'), dict(slug='licence', label='Licence and rights', title='Strange But True Public Source Licence'), dict(slug='sitemap', label='Every page', title='Find your way through the site')]
PAGES = [dict(slug='index', label='Welcome', title='Aura of Intelligence for Adaptive Whole of Life Support')] + CHAPTERS + UTILITIES
PAGE_BY_SLUG = {p['slug']: p for p in PAGES}
TABLE_CAPTIONS = ['What a starting self record brings together', 'Responsibilities around the proposed support', 'Population context in the 27 October 2026 proposal']

def E(value):
    return escape(str(value), quote=True)

def external(url, label, cls=''):
    return f'<a href="{E(url)}" target="_blank" rel="noopener noreferrer" class="{E(cls)}">{label}<span class="sr-only"> (opens in a new tab)</span></a>'

def link(slug, label=None, cls=''):
    return f'<a href="{slug}.html" class="{E(cls)}">{E(label or PAGE_BY_SLUG[slug]["label"])}</a>'

def extract():
    source = ROOT / REGISTER['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == REGISTER['sha256'], 'Source DOCX bytes changed'
    links = []
    with ZipFile(source) as archive:
        rels = {x.attrib['Id']: x.attrib['Target'] for x in ET.fromstring(archive.read('word/_rels/document.xml.rels'))}
        body = ET.fromstring(archive.read('word/document.xml')).find('w:body', NS)

        def run_html(node):
            result = ''
            for x in node:
                if x.tag == W + 't':
                    result += E(x.text or '')
                elif x.tag == W + 'br':
                    result += '<br>'
                elif x.tag == W + 'tab':
                    result += ' '
            props = node.find('w:rPr', NS)
            if props is not None:
                if props.find('w:b', NS) is not None:
                    result = '<strong>' + result + '</strong>'
                if props.find('w:i', NS) is not None:
                    result = '<em>' + result + '</em>'
            return result

        def inline(node):
            value = ''
            for child in node:
                if child.tag == W + 'r':
                    value += run_html(child)
                elif child.tag == W + 'hyperlink':
                    label = ''.join(run_html(x) for x in child if x.tag == W + 'r')
                    target = rels.get(child.get(R + 'id'))
                    if target:
                        links.append({'label': ''.join(child.itertext()).strip(), 'url': target})
                        value += external(target, label)
                    else:
                        value += label
            return value

        blocks, p_id, table_id = [], 0, 0
        for child in body:
            if child.tag == W + 'p':
                p_id += 1
                style = child.find('w:pPr/w:pStyle', NS)
                text = ''.join(child.itertext()).strip()
                blocks.append({'kind': 'paragraph', 'id': p_id, 'style': style.get(W + 'val') if style is not None else 'body', 'text': text, 'html': inline(child)})
            elif child.tag == W + 'tbl':
                table_id += 1
                rows = []
                for tr in child.findall('w:tr', NS):
                    rows.append([{'text': '\n'.join(''.join(p.itertext()).strip() for p in tc.findall('w:p', NS)), 'html': '<br>'.join(inline(p) for p in tc.findall('w:p', NS))} for tc in tr.findall('w:tc', NS)])
                blocks.append({'kind': 'table', 'id': table_id, 'after': p_id, 'rows': rows})
    return blocks, links

BLOCKS, ORIGINAL_LINKS = extract()

def citation_links(html):
    def group(match):
        return '[' + re.sub(r'\b([PR]\d+)\b', lambda x: f'<a href="sources.html#{x[1]}" class="citation">{x[1]}</a>', match[1]) + ']'
    return re.sub(r'\[([PR]\d+[^\]]*)\]', group, html)

def blocks_for(start, end):
    return [b for b in BLOCKS if (b['kind'] == 'paragraph' and start <= b['id'] <= end) or (b['kind'] == 'table' and start <= b['after'] <= end)]

def render_blocks(blocks, sources=False):
    out = []
    for b in blocks:
        if b['kind'] == 'table':
            rows = b['rows']
            head = ''.join('<th scope="col">' + x['html'] + '</th>' for x in rows[0])
            body = ''.join('<tr>' + ''.join(f'<td data-label="{E(rows[0][i]["text"])}">{x["html"]}</td>' for i, x in enumerate(row)) + '</tr>' for row in rows[1:])
            out.append(f'<div class="table-wrap" data-source-table="{b["id"]}"><table><caption>{TABLE_CAPTIONS[b["id"] - 1]}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')
            continue
        if not b['text']:
            continue
        tag = 'h2' if b['style'] == 'Heading1' else 'h3' if b['style'] == 'Heading2' else 'p'
        ref = re.match(r'^([PR]\d+)\s', b['text']) if sources else None
        anchor = f'<span id="{ref[1]}" class="source-anchor"></span>' if ref else ''
        out.append(f'{anchor}<{tag} id="source-p-{b["id"]}" data-source-paragraph="{b["id"]}">{citation_links(b["html"])}</{tag}>')
    return '\n'.join(out)

def figure(image_id, eager=False):
    im = IMAGES[image_id]
    return f'<figure class="artwork"><img src="{im["file"]}" srcset="{im["small"]} 800w, {im["file"]} {im["width"]}w" sizes="(max-width: 760px) 100vw, 1280px" alt="{E(im["alt"])}" width="{im["width"]}" height="{im["height"]}" {"fetchpriority=\"high\"" if eager else "loading=\"lazy\""} decoding="async"><figcaption>AI-generated concept artwork · fictional people and setting. {link("sources", "Image provenance and prompts")}</figcaption></figure>'

def header(slug):
    menu = ''.join(f'<a href="{p["slug"]}.html" {"aria-current=\"page\"" if p["slug"] == slug else ""}><span>{str(i).zfill(2)}</span>{E(p["label"])}</a>' for i, p in enumerate(PAGES))
    return f'<a class="skip" href="#main">Skip to content</a><header class="site-header wrap"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">a</span><span>Aura of Intelligence<span class="brand-subtitle">Whole of life support</span></span></a><nav class="quick-nav" aria-label="Main">{link("getting-started", "Begin here")}{link("memory-palaces", "Memories and places")}</nav><details class="site-menu"><summary>Every page <span aria-hidden="true">＋</span></summary><nav aria-label="All pages">{menu}</nav></details></header>'

def footer(slug):
    i = [p['slug'] for p in PAGES].index(slug) if slug in PAGE_BY_SLUG else 0
    prev, nxt = PAGES[(i - 1) % len(PAGES)], PAGES[(i + 1) % len(PAGES)]
    return f'<nav class="page-turns wrap" aria-label="Previous and next page"><a href="{prev["slug"]}.html"><span>← Previous page</span><strong>{E(prev["label"])}</strong></a><a href="{nxt["slug"]}.html"><span>Next page →</span><strong>{E(nxt["label"])}</strong></a></nav><footer class="site-footer"><div class="wrap footer-grid"><div><a class="footer-brand" href="index.html">A whole life, with you at its centre.</a><p>A proposal by Luke Nathan Hayes<br>Strange but True: tech, art and ideas that’ll help.</p><p>Source document dated 27 October 2026.<br>Web edition prepared 28 October 2026.</p></div><nav aria-label="Footer">{link("sitemap")}{link("sources")}{link("projects")}{link("licence")}{external("https://auraofintelligence.github.io/contact.html", "Project enquiries ↗")}{external(REPO, "GitHub repository ↗")}</nav></div><div class="wrap footer-base"><p>© 2026 Luke Nathan Hayes / Strange But True / Aura of Intelligence</p><p>Public source licence · No analytics or personal-data forms</p></div></footer><a class="to-top" href="#top" aria-label="Back to top">↑</a>'

def page(slug, title, summary, body, noindex=False):
    canonical = BASE + ('' if slug == 'index' else slug + '.html')
    description = E(summary)
    schema = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': title, 'description': summary, 'url': canonical, 'inLanguage': 'en-AU', 'isPartOf': {'@type': 'WebSite', 'name': 'Aura of Intelligence for Adaptive Whole of Life Support', 'url': BASE}, 'author': {'@type': 'Person', 'name': 'Luke Nathan Hayes'}}
    doc = f'''<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">{'<base href="' + BASE + '">' if slug == '404' else ''}<meta name="theme-color" content="#36184f"><title>{E(title)} | Aura Whole of Life</title><meta name="description" content="{description}"><link rel="canonical" href="{canonical}">{'<meta name="robots" content="noindex, follow">' if noindex else ''}<meta property="og:type" content="website"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{BASE}{IMAGES['whole-life-hero']['file']}"><meta property="og:image:alt" content="{E(IMAGES['whole-life-hero']['alt'])}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/png" href="assets/favicon.png"><link rel="stylesheet" href="assets/site.css"><script src="assets/site.js" defer></script><script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script></head><body id="top">{header(slug)}<main id="main">{body}</main>{footer(slug)}</body></html>'''
    doc = enhance_basic_aura(slug, doc)
    (ROOT / f'{slug}.html').write_text(doc, encoding='utf-8', newline='\n')

def intro(kicker, title, summary):
    return f'<section class="page-intro wrap"><p class="eyebrow">{E(kicker)}</p><h1>{E(title)}</h1><p class="lead">{E(summary)}</p></section>'

def source_context():
    return '<aside class="reading-context"><p><strong>Reading the proposal</strong> · The chapter text below is from Luke Nathan Hayes’s 27 October 2026 introduction. It describes a programme in development. Research, clinical and funding pathways retain their stated conditions. <a href="sources.html#verification">Dated checks and original sources</a> are available alongside the unchanged document.</p></aside>'

def chapter(ch, i):
    blocks = blocks_for(ch['start'], ch['end'])
    toc = ''.join(f'<a href="#source-p-{b["id"]}">{E(b["text"])}</a>' for b in blocks if b['kind'] == 'paragraph' and b['style'] == 'Heading1')
    body = intro(f'Chapter {str(i).zfill(2)} / 12', ch['title'], ch['summary'])
    if ch['image']:
        body += '<div class="wrap">' + figure(ch['image']) + '</div>'
    body += f'<div class="reading-layout wrap"><aside class="contents"><details open><summary>In this chapter</summary><nav aria-label="Chapter contents">{toc}<a href="#next-step">A useful next step</a></nav></details><a class="source-download" href="{REGISTER["file"]}">Original document ↓</a></aside><article class="prose">{source_context()}{render_blocks(blocks)}<section class="next-step" id="next-step"><p class="eyebrow">A useful next step</p><h2>Begin with something that matters</h2><p>{E(ch["action"])}</p>{link("partnerships" if ch["slug"] != "partnerships" else "projects", "Explore the next conversation →", "text-link")}</section></article></div>'
    page(ch['slug'], ch['title'], ch['summary'], body)

def homepage():
    body = intro('A fair go in the age of superintelligence', 'A whole life, with you at its centre.', 'Explore a proposal for personal intelligence you can understand, question and direct, supporting your choices, memories and ambitions through dementia, disability and changing care needs.')
    body += '<div class="wrap intro-actions">' + link('getting-started', 'Explore a first useful step →', 'button') + link('sources', 'Read the original document ↓', 'button secondary') + '</div>'
    body += '<div class="wrap">' + figure('whole-life-hero', True) + '</div>'
    body += '<section class="wrap purpose-panel"><div><p class="eyebrow">The Protopian purpose</p><h2>Raise capability. Keep the person in charge.</h2></div><div><p>Aura’s ambition is a fair go as intelligence becomes more capable: people developing the understanding, tools and judgement to shape their own lives. Younger adults, older people and those whose needs change belong in that future, with room for creativity, pleasure, learning and relationships.</p><p>Ethical engagement means being able to examine a source, question an interpretation, change a record and choose what an assistant may share or do. The proposed human and twin partnership develops through that continuing exchange.</p><p>Protopian improvement begins with something useful, tests its effects and learns from the people involved. Personal dignity, accountable support and wider access to capability give the technological ambition its purpose.</p>' + link('personal-records', 'Explore personal records and control →', 'text-link') + '</div></section>'
    body += '<section class="wrap home-paths"><h2>Where would you like to begin?</h2><div><p><strong>For yourself or someone close</strong><br>Start with what matters in daily life. ' + link('changing-support', 'Explore changing support needs →') + '</p><p><strong>Preparing for a move</strong><br>Keep the connection between a place, its objects and your own stories. ' + link('memory-palaces', 'Explore memories and places →') + '</p><p><strong>For care and research partners</strong><br>Consider a defined purpose and the people, evidence and resources around it. ' + link('clinical-development', 'Explore the development pathway →') + '</p></div></section>'
    body += '<section class="wrap home-reading"><div><p class="eyebrow">The introduction</p><h2>Support that can grow with a person</h2><p>The first step is a useful, recognisable account of a life. The next step is learning whether it helps in an actual encounter.</p></div><article class="prose">' + render_blocks(blocks_for(4, 10)) + '</article></section>'
    body += '<section class="journey-band"><div class="wrap"><p class="eyebrow">A practical beginning</p><h2>Choose a purpose. Try it. Review it.</h2><ol class="steps"><li><strong>Choose one goal</strong><p>A care introduction, an activity or a question worth preparing.</p></li><li><strong>Record enough to begin</strong><p>Personal context, chosen sources and unanswered questions.</p></li><li><strong>Try something useful</strong><p>Use the account in the situation it was prepared for.</p></li><li><strong>Review and correct</strong><p>Keep what helped and change what did not fit.</p></li></ol>' + link('getting-started', 'Read about the minimum viable self →', 'text-link') + '</div></section>'
    body += '<section class="wrap story-feature"><div>' + figure('places-and-memories') + '</div><div><p class="eyebrow">Memories and meaningful places</p><h2>A home is more than an address</h2><p>A garden path, a kitchen shelf or a favourite chair can lead into a story. Preparing a small collection before downsizing gives those connections a way to travel into the next home.</p><p>Photographs and recordings join the person’s own explanation. A printed album or an ordinary conversation may be the right format.</p>' + link('memory-palaces', 'Keep the meaning of a place →', 'button') + '</div></section>'
    body += '<section class="wrap chapter-index" id="chapters"><div class="section-heading"><div><p class="eyebrow">The complete reading journey</p><h2>Explore the whole proposal</h2></div><p>Twelve chapters bring together the full introduction, its practical examples and the conditions attached to each proposed pathway.</p></div><ol>'
    for i, ch in enumerate(CHAPTERS, 1):
        body += f'<li><a href="{ch["slug"]}.html"><span class="chapter-number">{str(i).zfill(2)}</span><div><h3>{E(ch["label"])}</h3><p>{E(ch["summary"])}</p></div><span class="chapter-arrow" aria-hidden="true">↗</span></a></li>'
    body += '</ol></section><section class="wrap research-invitation"><p class="eyebrow">An everyday route and a separate research proposal</p><h2>Understand what is being offered</h2><p>Ordinary Aura support begins with a chosen use. The intensive adult Genesis design brings HBOT and Truth Engine research into a separate proposed experience. It is research in development; it does not establish a validated Aura treatment or lie-detection service.</p>' + link('adult-genesis', 'Read the adult research chapter →', 'text-link') + '</section>'
    body += contact_panel()
    page('index', 'Aura of Intelligence for Adaptive Whole of Life Support', 'A fair-go proposal for ethical personal intelligence, human agency and whole-of-life support through dementia, disability and changing care needs in the age of superintelligence.', body)

def contact_panel():
    return '<section class="contact-panel"><div class="wrap"><p class="eyebrow">An understandable next conversation</p><h2>Bring a goal. Bring your questions.</h2><p>Begin with what you would like supported and ask what is actually available. The next offer needs clear terms, responsible people and a purpose worth trying.</p>' + external('https://auraofintelligence.github.io/contact.html', 'Contact Luke about the project ↗', 'button') + '</div></section>'

def sources_page():
    body = intro('Original document and reference library', 'Keep the source close', 'Read the unchanged introduction, follow its original references and distinguish project proposals from independent evidence and current guidance.')
    body += f'<section class="wrap document-feature" id="original"><div><p class="eyebrow">Luke Nathan Hayes · 27 October 2026</p><h2>Aura of Intelligence for Adaptive Whole of Life Support</h2><p>The original Word document is preserved byte for byte. Its substantive narrative and three tables appear across this site in their source order within each reading group. Original reference labels and hyperlink wording are retained.</p><a class="button" href="{REGISTER["file"]}">Download the original DOCX ↓</a></div><div><h3>Source record</h3><p><strong>Author</strong><br>Luke Nathan Hayes</p><p><strong>Original date</strong><br>27 October 2026</p><p><strong>SHA-256</strong><br><code class="hash">{REGISTER["sha256"]}</code></p><a href="data/source-register.json">Open the source register</a></div></section>'
    body += '<section class="wrap prose utility-reading" id="verification"><p class="eyebrow">Primary-source checks · 28 October 2026</p><h2>Current context alongside the dated proposal</h2><p>The checks below cover specific statements. The complete source text remains the author’s dated proposal; these checks do not establish Aura’s clinical benefit, regulatory approval or funding eligibility.</p>'
    checks = [
        ('Software intended for a medical purpose', 'TGA guidance explains that intended purpose determines whether software is a medical device. Regulated software generally needs ARTG inclusion before supply unless excluded or exempt. This does not classify or approve Aura.', 'https://www.tga.gov.au/resources/guidance/understanding-how-we-regulate-software-based-medical-devices', 'TGA: understanding software-based medical devices'),
        ('NDIS age and transition rules', 'The NDIS page states that applicants must be younger than 65 when applying. Existing participants can choose to continue after 65, with a separate requirement to leave when moving into residential aged care after 65. Other eligibility and item-funding rules also apply.', 'https://www.ndis.gov.au/applying/eligibility-requirements/what-are-age-requirements', 'NDIS: what are the age requirements'),
        ('Assessed support at home', 'My Aged Care confirms Support at Home began in November 2025. Services and funding follow assessment and approval. Its AT-HM scheme separately funds approved assistive technology and home modifications for assessed needs; this is not approval of an Aura product.', 'https://www.myagedcare.gov.au/support-at-home', 'My Aged Care: Support at Home'),
        ('Assistive technology and home modifications', 'The AT-HM scheme page describes an aged care assessment, an approval recorded in the person’s decision letter and support plan, and provider involvement for relevant equipment or modifications.', 'https://www.myagedcare.gov.au/aged-care-programs/assistive-technology-and-home-modifications-scheme', 'My Aged Care: AT-HM scheme'),
        ('Specialist hyperbaric delivery', 'RBWH describes specialist fitness assessment, qualified medical, nursing and technical delivery, permitted-item restrictions and clinical referral. Its service information does not establish a benefit for the proposed combined Aura programme.', 'https://metronorth.health.qld.gov.au/rbwh/healthcare-services/hyperbaric-medicine', 'Royal Brisbane and Women’s Hospital: Hyperbaric Medicine'),
    ]
    for title, description, url, label in checks:
        body += '<section class="verification-item"><h3>' + E(title) + '</h3><p>' + E(description) + '</p><p>' + external(url, E(label) + ' ↗') + '</p></section>'
    body += '<p>The clinical studies, population figures, research-consent detail and other references below are retained in their original dated context. An individual decision requires its current jurisdiction, circumstances, operative sources and appropriately responsible people.</p></section>'
    body += '<div class="wrap reading-layout source-layout"><aside class="contents"><details open><summary>Source groups</summary><nav aria-label="Source groups">'
    for b in blocks_for(275, 371):
        if b['kind'] == 'paragraph' and b['style'] == 'Heading1':
            body += f'<a href="#source-p-{b["id"]}">{E(b["text"])}</a>'
    body += '<a href="#artwork">Artwork and provenance</a><a href="#privacy">This website and your privacy</a></nav></details></aside><article class="prose sources-prose">' + render_blocks(blocks_for(275, 371), True) + '</article></div>'
    body += '<section class="wrap prose utility-reading" id="artwork"><p class="eyebrow">Original artwork</p><h2>Imagined scenes, clearly labelled</h2><p>Three reference-led Protopian illustrations were generated with OpenAI’s built-in image-generation tool on 28 October 2026. The people and places are fictional. Personal Aura representations, selected memory connections and shared civic models express human agency and useful technology. These concepts do not establish an operating service or a health outcome.</p><p>The same illustrations appear in relevant reading groups. Supplied visual references guided new compositions; the reference-image files are not published here. WebP sizes are conversions of the generated PNGs. The artwork register records exact prompts, reference basenames and hashes, active asset hashes and previous versions. The favicon remains a reduced detail of the earlier home illustration.</p>'
    for im in IMAGES.values():
        body += '<details class="prompt"><summary>' + E(im['id'].replace('-', ' ').title()) + ' · prompt and record</summary><p>' + E(im['prompt']) + '</p><p><strong>SHA-256</strong> <code class="hash">' + E(im['sha256']) + '</code></p></details>'
    body += '<p><a href="data/images.json">Read the artwork register</a></p></section><section class="wrap prose utility-reading" id="privacy"><h2>This website and your privacy</h2><p>This is a static reading website. It has no accounts, personal-data forms, analytics, tracking cookies, third-party embeds or remote font requests. Navigation, source reading and downloads work without JavaScript. The optional page search stays in your browser and saves nothing.</p><p>GitHub hosts the site and may process normal hosting access information. Following an external link opens another service with its own terms. This reading website is not an onboarding, health-record or clinical service.</p></section>'
    page('sources', 'Sources and original document', 'The unchanged 27 October 2026 document, complete source references, dated primary-source checks and artwork provenance.', body)
    (ROOT / 'data/verification.json').write_text(json.dumps({'checked': '2026-10-28', 'method': 'Primary pages opened and read with the web tool', 'checks': [{'title': x[0], 'finding': x[1], 'url': x[2]} for x in checks], 'scope': 'Specific checks only. Not a full independent fact-check of the source introduction.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

PROJECTS = [
    ('Aura of Intelligence', 'The wider personal intelligence concept and project family.', 'https://auraofintelligence.github.io/'),
    ('Aura Matrix Studio', 'Working browser prototype for personal questions, editable records and visual organisation. Sensitive clinical readiness and secure integration remain development work.', 'https://auraofintelligence.github.io/aura-matrix-studio/'),
    ('Aura Verse Box', 'A proposed supported public computing station and guided introduction to personal Aura tools.', 'https://auraofintelligence.github.io/aura-verse-box/personal-aura.html'),
    ('Aura Genesis and Geode Atlas', 'A fuller account of the intensive adult programme and proposed physical setting. Everyday support has its own introduction route.', 'https://auraofintelligence.github.io/aura-genesis-geode-atlas/'),
    ('A gift for generations at Amity', 'The 82 Claytons Road property and partnership invitation, including dementia care, learning, personal Aura and original source history.', 'https://auraofintelligence.github.io/Anglican-Diocese-82-Claytons-Amity/'),
    ('UNGA81 and Joyful Responsible Abundance', 'The wider purpose connecting care, ownership, civic intelligence, time and possibilities for a worthwhile life.', 'https://auraofintelligence.github.io/UNGA81-Luke-Hayes/'),
    ('P4A Aura Genesis', 'Civic, research and storytelling directions within the wider P4A project.', 'https://p4a.xyz/pages/aura-genesis.html'),
    ('C-Hour introduction', 'Verified voluntary contribution in a reciprocity economy. C-Hours have no monetary value; communities choose their own incentives.', 'https://auraofintelligence.github.io/C-Hour-introduction/'),
    ('Mutual Futures: work and life', 'Paid supervised learning, Try Everything Once and funded arrangements for time away from paid work.', 'https://auraofintelligence.github.io/mutual-futures/workforce.html'),
    ('Mutual Futures: shared ownership', 'Proposed member benefit, participation and responsibilities around shared businesses. Its legal structure is not yet chosen.', 'https://auraofintelligence.github.io/mutual-futures/ownership.html'),
    ('Mutual Futures: business succession', 'Voluntary handover, fair sale terms and paid mentoring as an experienced owner considers their next chapter.', 'https://auraofintelligence.github.io/mutual-futures/succession.html'),
    ('Mutual Futures: world travel', 'Learning, visiting family, projects and rest, with the actual journey and activity considered on their own terms.', 'https://auraofintelligence.github.io/mutual-futures/travel.html'),
    ('Australian law and your relevance', 'A questionnaire and learning method for preparing legal research questions. Historical source material does not establish current law.', 'https://auraofintelligence.github.io/australian-law-2012-lukes-relevance/pages/your-relevance.html'),
    ('Oceania Healthy De-Slop Co-ops', 'Community-shaped wellbeing proposals around food, shared capability and meaningful activity. Specialist services retain their own conditions.', 'https://auraofintelligence.github.io/Oceania-healthy-de-slop-co-ops/'),
]

def projects_page():
    body = intro('The wider project family', 'Find the right next connection', 'Each project has a distinct role. These links connect the whole-of-life introduction with its prototypes, proposals, source material and wider community ambitions.')
    body += '<section class="wrap project-list">'
    for i, (title, description, url) in enumerate(PROJECTS, 1):
        body += f'<article><span class="project-number">{str(i).zfill(2)}</span><div><h2>{E(title)}</h2><p>{E(description)}</p>{external(url, "Explore this project ↗", "text-link")}</div></article>'
    body += '</section>' + contact_panel()
    page('projects', 'Connected projects', 'Explore related Aura, Amity, UNGA81, P4A, C-Hour and Mutual Futures work, with the role and development status of each connection.', body)
    (ROOT / 'data/projects.json').write_text(json.dumps([dict(title=x[0], description=x[1], url=x[2]) for x in PROJECTS], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def markdown_html(text):
    out, in_list = [], False
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('- '):
            if not in_list:
                out.append('<ul>')
                in_list = True
            out.append('<li>' + E(line[2:]) + '</li>')
            continue
        if in_list:
            out.append('</ul>')
            in_list = False
        if line.startswith('# '):
            continue
        if line.startswith('## '):
            out.append('<h2>' + E(line[3:]) + '</h2>')
        else:
            value = E(line)
            value = re.sub(r'https://[^\s<]+', lambda m: external(m[0], m[0]), value)
            out.append('<p>' + value + '</p>')
    if in_list:
        out.append('</ul>')
    return '\n'.join(out)

def licence_page():
    body = intro('Authorship, use and third-party rights', 'Strange But True Public Source Licence', 'Original work by Luke Nathan Hayes / Strange But True / Aura of Intelligence. This is a public source licence. The complete terms below govern use.')
    body += '<section class="wrap prose utility-reading"><p><a href="LICENCE.md">Download the licence text</a> · <a href="RIGHTS.md">Read the rights and attribution record</a></p>' + markdown_html((ROOT / 'LICENCE.md').read_text(encoding='utf-8')) + '</section>'
    page('licence', 'Licence and rights', 'Full Strange But True Public Source Licence, authorship and third-party rights for Aura Whole of Life.', body)

def sitemap_page():
    body = intro('Every chapter and useful page', 'Find your way through the site', 'Read in sequence, choose a topic or search page titles and descriptions. Every link remains available when JavaScript is disabled.')
    body += '<section class="wrap sitemap-index"><div class="search-tools" hidden><label for="page-search">Find a page</label><input id="page-search" type="search" placeholder="Try memories, consent or funding" autocomplete="off"><p id="search-status" role="status" aria-live="polite"></p></div><ol id="page-index">'
    for i, p in enumerate(PAGES):
        description = p.get('summary', 'Read ' + p['label'].lower() + '.')
        body += f'<li data-page-search="{E(p["label"] + " " + description)}"><a href="{p["slug"]}.html"><span>{str(i).zfill(2)}</span><div><h2>{E(p["label"])}</h2><p>{E(description)}</p></div><span aria-hidden="true">↗</span></a></li>'
    body += '</ol><p id="no-results" hidden>No pages match. Try a shorter word or clear the search.</p><p><a href="sitemap.xml">XML sitemap</a> · <a href="llms.txt">Machine-readable site introduction</a></p></section>'
    page('sitemap', 'Every page', 'The complete chapter index, source library, project connections and licence, with optional browser-only page search.', body)

def support_files():
    urls = ''.join('<url><loc>' + BASE + ('' if p['slug'] == 'index' else p['slug'] + '.html') + '</loc></url>' for p in PAGES)
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + '</urlset>\n', encoding='utf-8')
    robots = '# Informational project copy. GitHub Pages crawler rules apply only at the origin root.\n# Merge .github/robots-root-snippet.txt into the existing origin-root robots.txt.\n# Discovery grants no additional reuse or AI-training rights.\nUser-agent: *\nAllow: /\nSitemap: ' + BASE + 'sitemap.xml\n'
    (ROOT / 'robots.txt').write_text(robots, encoding='utf-8')
    llms = '# Aura of Intelligence for Adaptive Whole of Life Support\n\n> A dated public proposal by Luke Nathan Hayes for personal continuity, meaningful activities and support through changing adult care needs.\n\nThe full source is dated 27 October 2026. A working browser prototype and proposed clinical service have distinct development stages. This site is reading material, not onboarding or an operating clinical service. Preserve research, funding and evidence limitations. C-Hours are nonmonetary verified voluntary contributions.\n\n## Reading pages\n\n'
    llms += '\n'.join(f'- [{p["label"]}]({BASE}{p["slug"]}.html)' for p in PAGES)
    llms += '\n\n## Rights\n\nStrange But True Public Source Licence. Discovery and search access grant no commercial AI-training rights. Full terms: ' + BASE + 'LICENCE.md\n'
    (ROOT / 'llms.txt').write_text(llms, encoding='utf-8')
    (ROOT / 'data/reading-map.json').write_text(json.dumps({'source': REGISTER['file'], 'home': [4, 10], 'chapters': CHAPTERS, 'sources': [275, 371], 'tables': [{'id': b['id'], 'after_paragraph': b['after']} for b in BLOCKS if b['kind'] == 'table'], 'original_links': ORIGINAL_LINKS, 'routes': [p['slug'] + '.html' for p in PAGES]}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def main():
    homepage()
    for i, ch in enumerate(CHAPTERS, 1):
        chapter(ch, i)
    sources_page()
    projects_page()
    licence_page()
    sitemap_page()
    page('404', 'This page could not be found', 'Return to the whole-of-life reading journey or browse every chapter.', intro('Page not found', 'Let’s find your next page', 'This address does not lead to a page in the whole-of-life introduction.') + '<div class="wrap error-actions">' + link('index', 'Return to the welcome page →', 'button') + link('sitemap', 'Browse every page →', 'button secondary') + '</div>', True)
    support_files()
    print(f'Built {len(PAGES)} public pages and a custom 404; full source narrative, three tables and {len(ORIGINAL_LINKS)} original hyperlinks.')

if __name__ == '__main__':
    main()
