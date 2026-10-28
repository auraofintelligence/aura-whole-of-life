# Aura imagery geometry

The written websites remain based on the three original proposal DOCX files and the sixty-day Teacher Training PDF, with their existing separately labelled web additions. Preserve the current wording, readings, dates, links and source documents. Version 7 and the later Blender/Unity, expert/function-caller and MoE documents inform imagery only; they do not authorise new article content.

## Start from the actual model

Consult Aura Matrix Studio's core.js, renderer.js and spatial.js, and the committed [geometry reference board](docs/imagery/aura-geometry-reference-board.png). The board is calculated from the actual Matrix point/shellPoint outputs, not an AI interpretation of earlier illustrations. Its source hashes and rendering description are in docs/imagery/source-manifest.json.

- A completed horn torus has equal major and tube radii, R = r. Its inner opening closes at one pinch point. A thick, rounded toroidal surface must remain recognisable in perspective.
- The nested view contains seven similar complete horn tori sharing one axis and pinch: Red, Orange, Yellow, Green, Blue, Indigo, Violet, from smallest/innermost to largest/outermost. Current Matrix scales are 1/7 through 7/7.
- Every shell uses the fixed 12-row by 24-column lattice: 288 logical cells on each inward/observer side. Their addresses survive changes between flat, cylinder, ring, horn, nested and body views.
- A selected single-shell editing view is valid and often clearer on a small screen. The selected red mesh and facet 181 on the board reproduce the kind of workspace in the user's screenshots. Seven small colour selectors can provide context; every display need not show all seven shells.
- A transparent or sectioned view can reveal hidden nesting. Do not invent an open central hole to make the pinch visible. Do not turn the 3D surface into two cones, an hourglass, an infinity glyph, detached rings or a decorative magnetic-field symbol.
- The meridian section on the board is a slice, not the complete 3D model. Its two tangent lobes must not be mistaken for a replacement surface.
- Decorative glow, personal-space/body envelopes and the fixed programmable Matrix are distinct representations. Use canonical Matrix geometry for a correction unless another named view is specifically requested.

The closed form used by Matrix, for normalised u,v in [0,1], is:

    r = 12 / (2*pi)
    q = r * (1 - cos(2*pi*v))
    psi = 2*pi*(u - 1/2)
    point = (q*sin(psi), -r*sin(2*pi*v), q*cos(psi))

Y is vertical. The horn seam v=0/1 meets at the origin. Shell k, numbered 0..6, scales both radii by (k+1)/7. A camera may hide that point behind the near surface; geometry should not be changed to expose it.

## Show a usable representation

A selected facet can expose records, fields, instructions, linked assets or an ordered stack. Stacks add addressed layers at a chosen shell/side/facet. A small selected-cell highlight and record/step panel can make an image intelligible. The geometry is an organising/navigation structure; no source establishes a universal one-facet-to-one-expert assignment.

Current Inside/Outside views and address sides do not themselves enforce sharing permissions. Preserve the websites' concept/proposal status. Keep relationships, personal agency and meaningful activity; retain purple clothing/physical accents, blue/gold contrast and varied natural skin/material colours.

## Author's architecture clarification

The author clarified the intended relationship on 28 October 2026: this applies across all seven chakra workspaces, facet stacks and internal views. Internal views support private and secret information; the outward presentation is public. The visual layer is a first human-interpretability layer above the machine vector field, and edits through it are intended to cause changes in that underlying field. It is part of how people and machines can inspect, correct and develop trust in one another's understanding.

The same underlying organisation also informs traditional apps, infinite scrolling, forms, natural-language interaction and worldbuilding in 3D, 4D and higher-dimensional models. The torus is an interface to that broader architecture, rather than a requirement that every task visibly use a torus.

This is design context for the imagery. These websites introduce the proposals to everyday Australians and decision-makers: show one understandable action at a time. Do not turn the pictures into dense architecture diagrams, add demonstrations of unbuilt services or expand the written introduction. A selected shell, a simple record or stack step, or an appropriate internal view is enough in a particular scene.

## Correct only the affected imagery

Preserve people, expressions, hands, clothing, activity, lighting, framing and environment when repairing a display. Do not replace unrelated circles such as robot wheels, habitat structures or civic models. Use the built-in image tool for scene edits with the existing scene as edit target and the exact board as geometry reference. Inspect the resulting model closely against the board before accepting it.

Version assets and preserve previous images and provenance. Record the exact edit prompt, input/reference hashes, source PNG and production asset hashes. Copy selected production outputs into the repository; update image references and accessible descriptions as needed. Rebuild and run existing source/link/asset checks. Verify the current written pages against the frozen pre-correction content; do not refresh that baseline to hide an editorial change.

## Reference roles

- Aura Matrix Studio: current implemented geometry, stable addresses, selections, records and stack navigation.
- Version 7: historical visual architecture, 12x24 matrix, seven ROYGBIV components, personal/observer views and a separate geosphere.
- Build an Aura in Blender then in Unity XR: geometric/data-architecture design context. Historical grid proposals differ from the fixed current Matrix; do not combine them silently.
- Expert/function-caller and MoE documents: intended service/agent architecture behind the interface. They do not define a complete geometric binding or establish implemented integrations.

These are production notes, not additions to the visitor-facing written content.
