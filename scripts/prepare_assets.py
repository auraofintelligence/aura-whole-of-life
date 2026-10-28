"""One-time import of unchanged source material and original generated artwork."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\Aura2020\Documents\Aura_of_Intelligence_Adaptive_Whole_of_Life_Support.docx')
GENERATED = Path(r'C:\Users\Aura2020\.codex\generated_images\01a18182-4378-7352-8e29-22971b92a1a0')
ART = [
    ('whole-life-hero', 'exec-d7c79261-3e8d-4fd2-a696-e71b201b3f39.png', 'A woman directs a tablet conversation with her adult daughter at a table overlooking a Queensland garden.', 'A confident woman in her late fifties and her adult daughter sit at a timber table in a welcoming garden-facing Queensland home. The woman directs an ordinary tablet beside a favourite printed photograph and ceramic keepsake. Faces, relationships and everyday agency lead.'),
    ('places-and-memories', 'exec-d0ea5f53-1009-4be7-8d06-abf1c87af73d.png', 'An older man and his chosen supporter discuss a plant and keepsake while preparing to move from a familiar home.', 'An older man preparing to move from a beloved Queensland house sits beside a window with a chosen supporter. An ordinary tablet shows a photographic garden view. He points to a potted plant and timber keepsake; moving boxes, an album and familiar chair establish the transition. Preserving meaning through a move, not a treatment.'),
    ('community-and-choice', 'exec-93b26bc3-8cb4-441a-a30b-d11722b405aa.png', 'Adults of different ages, including a wheelchair user, share seedlings and practical knowledge in an accessible community garden.', 'An accessible Australian community garden gathering of four adults of different ages, including an adult using a wheelchair at a raised herb bed, a younger gardener and an older mentor passing a seedling. A shared table holds vegetables and a meal. Warm relationships, choice, learning and belonging, realistic accessible paths.'),
]
PREFIX = ('Use case: photorealistic-natural. Original landscape editorial illustration for an Australian personal-AI whole-of-life support proposal. Wide 3:2, documentary realism with subtle painterly warmth, warm ivory, deep jade, muted gold and natural timber, soft Queensland daylight. No writing, logos, watermarks, medical claims, glowing holograms or diagnostic displays. Fictional people, dignified, relaxed and self-directed. Plausible ordinary technology. Imagined concept artwork, not a photograph of a service. ')

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    for directory in ['documents', 'data', 'assets/images', 'assets/fonts']:
        (ROOT / directory).mkdir(parents=True, exist_ok=True)
    target = ROOT / 'documents' / SOURCE.name
    if not target.exists():
        shutil.copyfile(SOURCE, target)
    assert digest(target) == digest(SOURCE), 'Original must remain byte-for-byte unchanged'
    licence = Path(r'G:\GithubLocal-PC\aura-verse-box\LICENCE.md').read_text(encoding='utf-8')
    (ROOT / 'LICENCE.md').write_text(licence.replace('aura-verse-box', 'aura-whole-of-life'), encoding='utf-8', newline='\n')
    font_root = Path(r'G:\GithubLocal-PC\C-Hour-introduction\assets\fonts')
    for name in ['font-1.ttf', 'font-4.ttf', 'font-7.ttf', 'DM-Sans-OFL.txt', 'Manrope-OFL.txt']:
        shutil.copyfile(font_root / name, ROOT / 'assets/fonts' / name)
    exact_prompts = {x['key']: x['prompt'] for x in json.loads((ROOT / 'data/image-generation-prompts.json').read_text(encoding='utf-8'))['prompts']}
    records = []
    for slug, original, alt, prompt in ART:
        with Image.open(GENERATED / original) as im:
            im = im.convert('RGB')
            full = ROOT / f'assets/images/{slug}.webp'
            im.save(full, 'WEBP', quality=87, method=6)
            width, height = im.size
            small = im.copy()
            small.thumbnail((800, 800))
            small.save(ROOT / f'assets/images/{slug}-800.webp', 'WEBP', quality=85, method=6)
            if slug == 'whole-life-hero':
                icon = im.copy()
                icon.thumbnail((192, 192))
                # A reduced full original image, never a fabricated vector substitute.
                icon.save(ROOT / 'assets/favicon.png')
        records.append({'id': slug, 'file': f'assets/images/{slug}.webp', 'small': f'assets/images/{slug}-800.webp', 'width': width, 'height': height, 'alt': alt, 'sha256': digest(full), 'generator': 'OpenAI built-in image generation', 'generated': '2026-10-28', 'status': 'Imagined editorial concept; fictional people and setting; not evidence of a service or outcome.', 'prompt': exact_prompts[slug]})
    (ROOT / 'data/images.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'data/source-register.json').write_text(json.dumps({'title': 'Aura of Intelligence for Adaptive Whole of Life Support', 'author': 'Luke Nathan Hayes', 'source_date': '2026-10-27', 'file': 'documents/' + SOURCE.name, 'sha256': digest(target), 'policy': 'Original DOCX bytes preserved. Complete substantive narrative, all three tables and original hyperlink labels published across the reading chapters and source register. Website introductions, connections, reading aids and explicitly dated verification notes are additions.'}, indent=2) + '\n', encoding='utf-8')
    print('Imported unchanged DOCX, licence, OFL fonts and three original illustrations.')

if __name__ == '__main__':
    main()
