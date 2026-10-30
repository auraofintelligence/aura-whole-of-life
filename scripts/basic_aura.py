"""Insert only the data-free, source-native Aura geometry viewer."""
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]

def enhance_basic_aura(route,document):
    placement=json.loads((ROOT/'assets/aura-geometry-placement.json').read_text(encoding='utf-8')).get(route)
    if not placement:return document
    identifier='visual-'+route+'-geometry'
    content=f'<figure id="{identifier}" data-visual-example="{identifier}" class="basic-aura-figure" aria-label="Seven Aura horn tori"><div data-basic-aura><h3>Seven Aura horn tori</h3><p>Red, Orange, Yellow, Green, Blue, Indigo and Violet. Each torus has separate inside and outside facet selections.</p><p>The interactive geometry viewer needs JavaScript and WebGL.</p><p><a href="https://auraofintelligence.github.io/aura-matrix-studio/" target="_blank" rel="noopener noreferrer">Open Aura Matrix Studio ↗</a></p></div></figure>'
    pattern=re.compile(r'<(?P<tag>p|section|div)\b[^>]*\bid="'+re.escape(placement['after_id'])+r'"[^>]*>.*?</(?P=tag)>',re.S)
    match=pattern.search(document)
    if not match:raise ValueError('Missing Aura geometry anchor '+route+'#'+placement['after_id'])
    document=document[:match.end()]+content+document[match.end():]
    assets='<link rel="stylesheet" href="assets/matrix-studio/basic-viewer.css?v=geometry-1"><script defer src="assets/basic-aura.js?v=geometry-1"></script>'
    return document.replace('</head>',assets+'</head>',1)
