# Project conventions · AI Hamster Hole V2

Read this file before changing the project. `AGENTS.md` points here. This repository is now Alex's AI learning gateway with an interactive 3D exploration pod. The original Sen résumé source, notices and selected assets remain as project history.

## Repository and commands

- `web/`: React 18, TypeScript, React Three Fiber, Three.js, Framer Motion, Zustand and Vite application.
- `blender/`: editable V2 model and reproducible scripts; preserved original `sen.blend`.
- `docs/redesign-2026-09-08/`: baseline, research, design, model evidence and the before/after report `index.html`.
- `tutor/`: retained original tutorials; their old camera-animation contract does not describe V2.

Run npm commands from `web/`:

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

The installed ESLint requires Node `^20.19.0 || ^22.13.0 || >=24`; the Pages workflow uses Node 20. TypeScript is strict. Build runs `tsc -b && vite build && node scripts/copy-report.mjs`; output is `web/dist/`. There is no separate automated test command. Run typecheck, lint and build, then verify the affected visual or interactive behavior in the browser.

## Current architecture

Paths in this section are relative to `web/`.

- `src/main.tsx` → `src/App.tsx`: static SPA entry, header, hero, stage shell, Alex story, route section and footer. Main learning destination is `https://ai.alexdbg.com/`.
- `App.tsx` loads `src/scene/Stage.tsx` via `React.lazy` and `Suspense`; text and links do not wait for the 3D module.
- `Stage.tsx`: Canvas, model loading progress, scene error boundary and poster fallback; pet, spin and day/night buttons with accessible status feedback. IntersectionObserver and document visibility pause rendering when the stage is not visible. Mobile DPR is capped below desktop DPR.
- `Scene.tsx`: loads `public/models/hamster-v2.glb`; owns the hamster's procedural animation, ring-shaped pod, pedestal, three satellite icons, lights and camera. Scrolling changes the desktop camera gently; the browser retains native scrolling. Character nodes supply eye tracking, blinking, pet/wave and spin actions.
- `src/ui/Resume.tsx`: five `STORY` entries rendered as an accordion with button/region relationships. Store `chapter` chooses the expanded entry and subtly changes character orientation.
- `src/ui/Works.tsx`: four accessible tabs, one route panel, CSS illustrations and final learning CTA. Arrow keys, Home and End update both selection and focus.
- `src/data/works.ts`: learning route titles, descriptions, course names and external links. The current UI is Chinese; some data retains an English variant.
- `src/store.ts`: active runtime fields are `night`, `pet`, `spin`, `chapter`, and `route`; action counts trigger character responses. Older fields remain for compatibility.
- `src/styles.css`: palette, layout, typography, responsive rules and CSS transitions. Desktop uses a sticky exploration stage; mobile uses a single-column flow.

### Motion and accessibility

`MotionConfig reducedMotion="user"`, `useReducedMotion`, and CSS media rules follow system `prefers-reduced-motion`. In reduced mode the scene uses demand rendering, continuous character/decoration animation stops, and spin becomes an immediate half-turn. Pet buttons still provide text feedback. Theme changes invalidate the scene. Preserve pause/resume behavior for off-screen and hidden-tab states.

Maintain visible keyboard focus, skip navigation, semantic links/buttons, tab keyboard support, accordion `aria-expanded`/panel IDs and polite status messages. Main learning links use `target="_blank"` and `rel="noopener noreferrer"`. Touch interactions must work without hover.

### Removed architectural assumptions

V2 does not read `CameraAction`, a GLB camera, or `focus-*` empties. There is no active autofocus/DepthOfField/Bloom pipeline and no markdown work-detail modal. `FOCUS_POINTS` is currently used by the story's `data-point` attributes, not by the camera. Some original utility files or dependencies remain; inspect imports before treating them as active features.

## Model contract and authoring

Repository-relative assets:

| File | Purpose |
| --- | --- |
| `blender/hamster-v2.blend` | Editable model, PBR materials and studio setup |
| `blender/build_hamster_v2.py` | Original mesh construction, GLB export, poster and stats |
| `blender/render_model_comparison.py` | Same-studio V1/V2 comparison renders |
| `web/public/models/hamster-v2.glb` | Runtime character |
| `web/public/brand/hamster-v2-poster.png` | Static fallback and model preview |
| `docs/redesign-2026-09-08/model-delivery.md` | Detailed model and coordinate notes |

Blender is Z-up and faces -Y. Exported glTF is Y-up and faces +Z. Its origin is on the floor; height is approximately 3.59 units. Keep `HamsterRoot`, `Head`, `Eye_L`, `Eye_R`, `Arm_L` and `Arm_R` names stable. `Head` is the neck pivot; eyes are child meshes with child catchlights; arms use shoulder pivots. Eye `scale.y` controls blinking. Positive `Arm_L.rotation.z` and negative `Arm_R.rotation.z` raise the arms outwards. Runtime movement is implemented in `Scene.tsx`, without mandatory animation clips.

The model uses vertex colors and PBR materials, with no external texture dependency. Static parts are merged per material and parent pivot. Current measurement: 93,696 triangles, 20 meshes, 11 materials, 1,895,128 bytes. The build script checks a budget below 120,000 triangles and 8 MB. Do not interpret file-size savings as measured frame-rate improvements.

From the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_hamster_v2.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_model_comparison.py
```

Replace the executable path with the user's local Blender binary as needed. Use Blender's bundled Python, not plain system Python, to run scripts requiring `bpy`. The generator writes the V2 `.blend`, GLB, poster and model statistics; rerun the comparison script when the final model changes. Visually inspect exports and retain interactive node names.

## Validation and history

After relevant changes, verify desktop and mobile layouts; pet/wave/spin, night/day, all five accordion entries, all four route panels, keyboard navigation, reduced motion and fallback behavior. Check console errors and asset loading through the app's actual base URL. Code or asset changes require the standard npm checks above; documentation-only changes require checking paths and claims against source.

Preserve the baseline under `docs/redesign-2026-09-08/before/` and original `web/public/models/ai-hamster.glb` / `blender/sen.blend`. Add evidence for new work rather than overwriting those assets. `model-asset-verification.json` records exact Git blob preservation and the V2 GLB checksum. The report entry point is `docs/redesign-2026-09-08/index.html`; keep screenshots, recordings, source changes and actual deployment evidence traceable.

## Hosting

`.github/workflows/deploy.yml` runs on pushes to `main` or manual dispatch, builds inside `web/`, uploads `web/dist/` and deploys with GitHub Pages. Its success and the live result establish publication status. The report-copy build step publishes `docs/redesign-2026-09-08/` at `web/dist/update-report/`. Local report links stay relative; published source links target the GitHub version tag.

`web/vite.config.ts` uses `base: './'`. Construct public asset URLs with `import.meta.env.BASE_URL` so deployments under a repository subpath work. Preview with an HTTP server or `npm run preview`; do not rely on opening built files through `file://`.

## Attribution and content boundaries

Preserve `LICENSE` and `NOTICE`, including Sen Zheng (SEN)'s original copyright and MIT code attribution. Original personal content and assets are excluded from MIT. Alex / AI Hamster Hole branding, content and character assets are project-specific and are not automatically licensed for redistribution by the source-code license. Third-party assets retain their own licenses. Do not overwrite these boundaries when updating documentation.

Browser regression and artifact capture scripts live under `scripts/`: `verify-upgrade.cjs`, `capture-baseline.cjs`, and `capture-upgrade.cjs`. Run them from the repo root against a production preview. They support `PLAYWRIGHT_CORE` and `CHROME_PATH` overrides.
