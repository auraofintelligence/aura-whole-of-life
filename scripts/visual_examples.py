"""Place self-contained visual examples beside existing, unchanged source passages."""
from pathlib import Path
from html import escape
import json,re

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'assets/visual-example-placement.json'

def enhance_visual_document(route,document):
    placements=json.loads(CONFIG.read_text(encoding='utf-8')).get(route,[])
    if not placements:return document
    fallbacks=json.loads((ROOT/'assets/aura-everyday-fallbacks.json').read_text(encoding='utf-8'))
    used=set()
    for number,item in enumerate(placements,1):
        module,mode,example=item['module'],item['mode'],item['example']
        used.add(module)
        identifier=f'visual-{route}-{number}'
        label={'layers':'Seven nested Aura layers','inside':'An internal Aura view','stack':'A facet and its ordered layers','place':'Place, twin and linked records','meaning':'One meaning across different interfaces','mates':'Everyday Mate examples'}[mode]
        if module=='learning':
            alt={'layers':'Seven nested horn-torus layers, red inside through violet outside, with a shared centre.','inside':'A perspective view from inside a curved, faceted Aura shell.','stack':'A selected facet with three ordered layers spaced apart for inspection.'}[mode]
            content=f'<div class="aura-learning" data-aura-learning="{mode}" data-aura-example="{example}"><figure class="al-fallback"><img src="assets/aura-{mode}-fallback.svg" width="800" height="500" loading="lazy" alt="{alt}"></figure></div>'
        else:content=fallbacks[mode+':'+example]
        visual=f'<figure class="aura-visual-example" id="{identifier}" data-visual-example="{identifier}" aria-label="{escape(label)}"><figcaption>Visual example · sample data</figcaption>{content}</figure>'
        anchor=re.escape(item['after_id'])
        # Existing source paragraphs and short sections are left byte-for-byte intact.
        pattern=re.compile(r'<(?P<tag>p|section|div)\b[^>]*\bid="'+anchor+r'"[^>]*>.*?</(?P=tag)>',re.S)
        match=pattern.search(document)
        if not match:raise ValueError(f'Missing visual placement anchor {route}#{item["after_id"]}')
        end=match.end()
        document=document[:end]+visual+document[end:]
    links='<link rel="stylesheet" href="assets/visual-examples.css">'
    for module in sorted(used):
        links+=f'<link rel="stylesheet" href="assets/aura-{module}.css"><script defer src="assets/aura-{module}.js"></script>'
    return document.replace('</head>',links+'</head>',1)
