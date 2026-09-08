# Project conventions · AI Hamster Hole V4

Read this file before changing the project; AGENTS.md points here. This repository is Alex's AI learning gateway. V4 refines the user's actual uploaded seated hamster into a matte clay sculpture and adapts the existing flagship promotional camera sequence. Preserve the uploaded source and V1–V3 assets, reports and tags.

## Commands and layout

`web/` contains React 18, TypeScript, React Three Fiber, Three.js, Framer Motion and Vite. Run `npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run preview` there. Node must satisfy `^20.19.0 || ^22.13.0 || >=24`; CI uses Node 20. Build runs `tsc -b && vite build && node scripts/copy-report.mjs` into `web/dist/`.

`blender/` contains editable assets and reproducible scripts. `docs/redesign-v4-clay-2026-09-08/` contains source provenance, source inspection, refinement evidence, final model statistics, browser checks, screenshots, recordings and the V4 report. `docs/redesign-v3-2026-09-08/` and `docs/redesign-2026-09-08/` are preserved V3 and V2 reports. Draft renders and surgery statistics are not final delivery evidence.

## Current architecture

Paths below are relative to `web/src/`.

- `App.tsx`: header, lazy Cinema, FlagshipRoutes, FlagshipAbout and footer. Main destination remains `https://ai.alexdbg.com/`.
- `scene/Cinema.tsx`: four-chapter sticky viewport, scroll progress spring, changing copy/background, chapter jumps, rotate button, poster/progress and error boundaries. Text is available before the GLB. The canvas uses `demand` while visible and `never` while off-screen or document-hidden.
- `scene/cinematicTimeline.ts`: camera keyframes and chapter timing. Camera and copy consume the same damped native-scroll progress; no wheel interception. Recheck all four compositions for the seated model, especially facial crop, ground contact and backpack visibility.
- `scene/CinematicWorld.tsx`: full-detail `hamster-v4-clay.glb`, whole-sculpture rotation and authored camera/light transitions. No blink/head/arm animation: the source is a fused mesh. Lightweight picking volumes avoid raycasting the display geometry on pointer movement. Request frames when scroll, explicit rotation, drag, viewport or other visible state changes; continue only while interpolation needs to settle. A stable normal-motion scene must stop issuing WebGL draws.
- `ui/FlagshipRoutes.tsx` and `ui/flagship-sections.css`: four full-width desktop horizontal chapters with direct selection and Arrow/Home/End keyboard navigation. Natural vertical flow for mobile, short screens and reduced motion. All 16 original course links remain.
- `ui/FlagshipAbout.tsx`: original factual statistics, five expanded experience entries, 15 supporting points and the closing learning CTA.
- `hooks/useMotionPreference.ts`: live media-query subscription shared by DOM and WebGL behavior.

Old Stage.tsx, Scene.tsx, Resume.tsx, Works.tsx, store fields and tutorials remain historical. The current App does not use the old pod/pet/night/accordion contract. V2/V3 articulated nodes and furry details do not describe the V4 asset.

## Motion, rendering and accessibility

Native vertical scrolling drives the camera sequence and desktop route translation. Mouse drag rotates the entire sculpture; touch drag must retain vertical page scrolling. The explicit rotate button provides touch and keyboard access. Clear pointer-capture state and the grabbing cursor on pointer cancellation as well as pointer release. Hidden chapter copy remains inert and aria-hidden. Preserve focus indicators, skip links, semantic headings, tab relationships and safe `target`/`rel` on external links.

The normal V4 sculpture has no continuous idle animation. Use `invalidate()` only for visible updates and unfinished damping; avoid a self-sustaining render loop after motion settles. Check actual draw calls, not just requestAnimationFrame timing, when asserting that rendering is idle. Resume correctly after returning from off-screen or a hidden tab. Keep delta-based damping and local monotonic time because R3F clocks can restart across frameloop changes. Mobile DPR is 1; desktop is capped at 1.5.

Follow live `prefers-reduced-motion`: collapse Cinema into a stable hero, render learning routes in natural flow and stop automated camera/CSS movement. Explicit rotation still works immediately. Model loading uses the actual V4 poster and progress; GLB failure or missing WebGL must not trap visitors in an endless loader or hide learning links.

## Route illustration loops — verified in production preview

The four CSS artworks loop independently of scrolling: slow lens rotation/breathing light, eight orange layers separating/rejoining with staggered timing, opening brackets with a rhythmic orange bar, and 11 staggered waveform bars. Preserve the composition and all 16 learning links. Normal desktop and mobile play automatically. The pause/resume control preserves animation phase; off-screen timelines stop, hidden documents pause, and live reduced-motion mode removes decorative animations. Mobile uses natural vertical layout.

All 10 checks in `docs/redesign-v4-clay-2026-09-08/route-motion-qa.json` passed against the production preview, including all four loops and 390px touch-emulated layout with no horizontal overflow. Visibility handling was checked by simulating `document.hidden` and dispatching `visibilitychange` in the page; this is not an actual operating-system background-switch test. Reproduce with `SITE_URL=http://127.0.0.1:5175/ node scripts/verify-route-motion-v4.cjs`; record with `SITE_URL=http://127.0.0.1:5175/ node scripts/capture-route-motion-v4.cjs`.

Preserve static baseline commit `528ef15d9dbae70084b966643ba4846fc1e18035` in `motion-before/`; keep desktop/mobile after frames, original-timing `loops.mp4` and capture metadata in `motion-after/`. CSS loops must not wake the million-face WebGL scene. The model and its checksums remain frozen. Local validation does not establish online publication.

## Source provenance and model contract

User file `tripo_convert_bfa920ab-ad7b-44e1-b2ac-2ceb65744036.glb` is byte-identical to preserved `web/public/models/ai-hamster.glb`: 501,070 triangles, 16,039,824 bytes, SHA-256 `f196abdedb71ff60ed22014b88551f9f4c4f244b3b53d0de821f667bae4ec94c`. Read `docs/redesign-v4-clay-2026-09-08/provenance.json` and source inspection before refinement. Work from that geometry; do not substitute the V3 generator or overwrite the uploaded asset.

Preserve seated proportions, hands before the belly, forward feet, the broad face and square glasses. Remove the fused crayfish/contact area, repair a continuous round crown, protect ears, clean scan artifacts and retain facial color boundaries. The surface is matte clay with restrained impressions. Keep lips cream and only the mouth groove dark brown; depth-bounded eye and ear regions must not spill onto cheek skin or the forehead. The new backpack is a separate accessory fitted around the seated rear body and tail.

Deliverables:

- `blender/hamster-v4-clay.blend`: final triangulated source.
- `blender/hamster-v4-clay-authoring.blend`: editable authoring master.
- `blender/refine_hamster_v4_clay.py`: source-based repair, material rebuild and export.
- `blender/clay_backpack_v4.py`: accessory geometry in the original source frame; called by the refinement script.
- `blender/verify_hamster_v4.py`: independently reads binary GLB indices/positions, checks real triangle counts and preservation hashes.
- `blender/verify_hamster_v4_blender.py`: reopens the saved final Blender and reimports the runtime GLB; checks matching actual polygons/triangles and closed, manifold main-body topology.
- `blender/clay_color_regions_v4.py`: original-coordinate/color classifier and linear palette; source samples are encoded RGB. After remeshing, map back to original source points before classification. Newly repaired crown should use the gold palette, not inherit removed red attachment samples.
- `web/public/models/hamster-v4-clay.glb`: full-detail browser asset.
- `web/public/brand/hamster-v4-clay-poster.png`: loading/fallback image.

Run scripts requiring `bpy` in Blender's Python from the repository root. Regenerate with `Blender --background --python blender/refine_hamster_v4_clay.py`, then run `python3 blender/verify_hamster_v4.py` and `Blender --background --python blender/verify_hamster_v4_blender.py` using the actual Blender executable path. Source is Z-up facing +X; output is rotated to Blender -Y forward, exported glTF Y-up / +Z forward, normalized to a floor-level origin and a body height of about 3.6. `HamsterRoot` controls the whole sculpture and `ClayBackpack` roots the separate accessory. There are no independent `Head`, `Eye_L/R` or `Arm_L/R` joints; do not animate or add empty nodes as evidence of articulation.

Current full GLB and final Blender: 1,025,000 real triangles/polygons, 512,688 Blender vertices, 29,364,716 GLB bytes. The editable master has 994,602 polygons / 1,025,000 triangles with mixed topology; do not call it an all-quad master. The body contributes 965,700 triangles and the independent backpack 59,300. There are five meshes, 11 materials and zero bitmap textures. The GLB POSITION accessors total 518,667 vertices because material boundaries are split; do not confuse this with the welded Blender vertex count. The saved Blender body has zero open/non-manifold edges; GLB reimport retains material-boundary splits and must not be described as a welded closed mesh. Frozen GLB SHA-256: `e3c5eeb1fa3534707fa45cf74848b2dea20f3997be894bfc787e3a2ceb548c76`. Final values and hashes come from `docs/redesign-v4-clay-2026-09-08/model-stats.json` and independent verification records; refresh these numbers if the asset changes. Do not copy V3's 1,018,268 / 26,347,280 figures into V4. Full precision is the default runtime model; no silent low-poly replacement. Report authored polygons and exported triangles separately. Geometry count and byte size are not FPS measurements.

## Verification and publishing

After source or asset changes run typecheck, lint and build. Verify actual desktop/mobile compositions and changed interactions. `scripts/verify-v4.cjs` checks normal idle draw inactivity, rendering resumption, chapter jumps and reverse scroll, dragging and pointer cancellation, native touch scrolling, reduced motion and failure fallback. `scripts/verify-v4-loading.cjs` checks delayed loading and disabled-WebGL behavior. `scripts/capture-v4.cjs` records actual browser screenshots and video with original timing. Use production-preview evidence and the exact final asset hash; pending scripts or draft captures do not constitute a pass. Do not claim unmeasured real-device frame rates.

GitHub Pages builds `main` and deploys `web/dist/`. `copy-report.mjs` publishes V2 at `/update-report/`, V3 at `/update-report-v3/` and V4 at `/update-report-v4/`; preserve all three. Local report source links remain relative; copied online source links target the matching version tag. Assets use `import.meta.env.BASE_URL` with `base: './'`. Confirm Actions success and actual online assets before saying published. V4 release details belong in `docs/redesign-v4-clay-2026-09-08/release-notes.md` with tag `v4.0.0`.

V3 baseline is `v3.0.0` / `c8784bc7fa07be203f441576305f0eda16df6913`. Do not overwrite historical tags or V1–V3/source assets. Preserve LICENSE / NOTICE and Sen's MIT code attribution. Original personal assets, user-uploaded models and Alex/AI Hamster Hole brand/content are outside blanket MIT reuse. Never add credentials or external local archive bundles to Git. Keep version references, model checksums and before/after evidence traceable.
