# Aura of Intelligence for Adaptive Whole of Life Support

A public introduction by **Luke Nathan Hayes**, dated **27 October 2026**, for adults living with dementia or disability, people beginning aged care, and their supporters, providers, clinicians and prospective partners.

**Public website:** https://auraofintelligence.github.io/aura-whole-of-life/

The complete reading site contains a welcome page, twelve substantive grouped chapters, the unchanged original Word document, all three original tables in their source positions, a full reference library, connected projects, licence and HTML/XML sitemaps. Reference-led Protopian concept artwork makes personal Aura representations, spatial memory and shared civic technology visible through human-directed choices. Purple clothing and physical details sit alongside electric blue depth and golden warmth. The homepage connects whole-of-life support with a fair go in the age of superintelligence.

## Scope and status

Aura is in development. The public browser prototype, everyday support proposal, optional intensive adult Genesis/HBOT/Truth Engine research and planned clinical software pathway have distinct functions and evidence needs. The site does not claim a validated Aura treatment, lie detector, regulatory approval, automatic NDIS/aged-care funding or an operating Amity service. C-Hours are nonmonetary records of verified voluntary contribution; essential care is independent of contribution.

All substantive source narrative is preserved, with grouped web pages and clearly separate introductions, reading aids and dated primary-source checks. The full source remains dated 27 October 2026. TGA software guidance, NDIS age requirements, My Aged Care Support at Home and AT-HM, and RBWH hyperbaric delivery were checked against primary pages on 28 October 2026; this is not a full independent fact-check of every source claim.

## Build and preview

Python 3.12+ is sufficient. No package installation or service credentials are needed for normal builds.

```text
python scripts/build.py
python scripts/check.py
node --check assets/site.js
python -m http.server 8000
```

Open `http://localhost:8000`. Root HTML is committed with its sources for main/root publishing. GitHub Actions builds, checks, exports the public files and deploys Pages; pull requests validate without deployment. Set repository Pages source to GitHub Actions for workflow deployment.

The one-time `scripts/prepare_assets.py` imports original files from their authoring locations and needs Pillow. It is not part of the reproducible build or deployment. The already committed DOCX, images and fonts are sufficient. It must never silently replace the source with another version.

## Files to maintain

| Location | Purpose |
| --- | --- |
| `documents/Aura_of_Intelligence_Adaptive_Whole_of_Life_Support.docx` | Original supplied bytes; authoritative source. |
| `data/source-register.json` | Authorship, source date and original SHA-256. |
| `scripts/build.py` | OOXML parser, chapter groupings, web additions, metadata and supporting indexes. |
| `data/reading-map.json` | Complete paragraph ranges, table positions, original URLs/labels and routes. |
| `data/images.json` and `data/image-generation-prompts.json` | Original artwork provenance, exact prompts, alternatives and hashes. |
| `data/verification.json` | Scope and findings of dated primary-source checks. |
| `assets/site.css`, `assets/site.js` | Responsive design and optional menu/search enhancements. |
| `scripts/check.py` | Content fidelity, source/asset hashes, local links/fragments, nav coverage, typography and policy checks. |
| `RIGHTS.md` and `LICENCE.md` | Rights, attribution, third-party terms and full licence. |

## Design and privacy

The active `protopia-v3` artwork was generated from new audience-specific scene briefs and the supplied visual references. Exact prompts, reference basenames and hashes, active asset hashes and previous artwork metadata are recorded in the image manifests. Earlier artwork files remain available in the repository history and asset directory. The lyric sheet informed tone and purpose; no lyrics or reference-image files are published by this site.

Light neutral paper, plum and violet with electric blue and warm gold accents; self-hosted DM Sans and Manrope with OFL licences; at least 18px ordinary screen text; naturally proportioned generated artwork with titles above it. Reading and native details navigation work without JavaScript. Keyboard access, skip links, chapter contents, circular previous/next navigation, floating top links, reduced motion and print styles are included. Optional site-index search stays in the browser and saves nothing.

There are no accounts, forms, analytics, tracking, remote fonts or third-party embeds. This reading website does not collect personal or health information. GitHub hosting and linked external services have their own terms.

## Crawlers and publication

The project `robots.txt` is informational because GitHub Pages robots policy is read at the origin root. `.github/robots-root-snippet.txt` contains a narrowly scoped merge proposal allowing ordinary search, OAI-SearchBot and Claude-SearchBot while asking GPTBot, ClaudeBot and Google-Extended not to collect this project. Existing domain-root decisions and other project rules must be preserved. This repository does not edit or claim to enforce the domain-root policy. Crawling preferences confer no extra reuse or commercial AI-training rights.

## Authorship and licence

Luke Nathan Hayes / Strange But True / Aura of Intelligence. Implementation prepared with ChatGPT. Original concept artwork generated with OpenAI image generation. External material and self-hosted fonts retain their own rights.

The **Strange But True Public Source Licence** permits specified attributed non-commercial use. It is **not an open-source licence**; commercial, corporate, institutional and government uses require separate written permission. See the complete terms in `LICENCE.md`.

## Imagery geometry correction

The geometry-v4 artwork edits correct selected Aura display regions using an exact reference calculated from Aura Matrix Studio's current source. People, activities and the existing visual direction are retained. The visitor-facing written content continues to use its original source document and reviewed web edition; later geometry and implementation references inform imagery only. See IMAGERY-GEOMETRY.md, the reference board in docs/imagery/ and the artwork register for exact prompts, input/output hashes and retained previous versions.
