"""Place self-contained visual examples beside existing, unchanged source passages."""
from pathlib import Path
from html import escape
import json,re

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'assets/visual-example-placement.json'
STARTER_LABELS={'favourites':'What matters to you','skills':'Learning and skills','goals':'Life goals','dates':'Dates and milestones','timing':'Timing and signals','travel':'Travel plans','family':'Family and belonging','avatar':'Body and avatar','allocate':'Place records in your Aura'}

def starter_content(mode,example):
    samples=json.loads((ROOT/'assets/matrix-studio-samples.json').read_text(encoding='utf-8'))
    context=samples['contexts'][example]
    values=context['stageDefaults'].get(mode,{})
    rows=values if isinstance(values,list) else [values]
    definitions=''
    for row in rows[:3]:
        for name,value in list(row.items())[:4]:
            if value:definitions+=f'<dt>{escape(name)}</dt><dd>{escape(str(value))}</dd>'
    url=f'assets/matrix-starter/index.html?stage={mode}&amp;example={example}&amp;ui=instant-2'
    label=STARTER_LABELS[mode]
    return f'<div class="aura-starter" data-aura-starter="{mode}" data-aura-example="{example}" data-starter-src="{url}" data-starter-title="Matrix Studio sample: {label}"><div class="as-fallback"><h3>{label}</h3><p>Prepared fictional Matrix Studio sample</p><dl>{definitions}</dl><p><a href="{url}" target="_blank" rel="noopener noreferrer">Open this Studio sample ↗</a></p></div></div>'

def enhance_visual_document(route,document):
    placements=json.loads(CONFIG.read_text(encoding='utf-8')).get(route,[])
    if not placements:return document
    fallbacks=json.loads((ROOT/'assets/aura-everyday-fallbacks.json').read_text(encoding='utf-8'))
    used=set()
    for number,item in enumerate(placements,1):
        module,mode,example=item['module'],item['mode'],item['example']
        used.add(module)
        identifier=f'visual-{route}-{number}'
        label=STARTER_LABELS[mode] if module=='starter' else {'layers':'Seven nested Aura layers','inside':'An internal Aura view','stack':'A facet and its ordered layers','place':'Place, twin and linked records','meaning':'One meaning across different interfaces','mates':'Everyday Mate examples'}[mode]
        if module=='learning':
            alt={'layers':'Seven nested horn-torus layers, red inside through violet outside, with a shared centre.','inside':'A perspective view from inside a curved, faceted Aura shell.','stack':'A selected facet with three ordered layers spaced apart for inspection.'}[mode]
            content=f'<div class="aura-learning" data-aura-learning="{mode}" data-aura-example="{example}"><figure class="al-fallback"><img src="assets/aura-{mode}-fallback.svg" width="800" height="500" loading="lazy" alt="{alt}"></figure></div>'
        elif module=='starter':content=starter_content(mode,example)
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
        version='?v=matrix-studio-2' if module in {'learning','starter'} else ''
        links+=f'<link rel="stylesheet" href="assets/aura-{module}.css{version}"><script defer src="assets/aura-{module}.js{version}"></script>'
    return document.replace('</head>',links+'</head>',1)
