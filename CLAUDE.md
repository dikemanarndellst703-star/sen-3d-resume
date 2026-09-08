# Project conventions · AI Hamster Hole V3

Read this file before changing the project. AGENTS.md points here. This repository is Alex's AI learning gateway with a million-triangle character and a flagship promotional scroll experience. Preserve original and V2 assets and their independent reports.

## Commands and layout

`web/` contains React 18, TypeScript, React Three Fiber, Three.js, Framer Motion and Vite. Run `npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run preview` there. Node must satisfy `^20.19.0 || ^22.13.0 || >=24`; CI uses Node 20. Build runs `tsc -b && vite build && node scripts/copy-report.mjs` into `web/dist/`.

`blender/` contains editable source and reproducible generators. `docs/redesign-v3-2026-09-08/` contains V3 research, model evidence, browser acceptance, screenshots, real recordings and index.html. `docs/redesign-2026-09-08/` is the preserved V2 report.

## Current architecture

- App.tsx: header, lazy Cinema, FlagshipRoutes, FlagshipAbout, footer; main destination https://ai.alexdbg.com/.
- scene/Cinema.tsx: sticky four-chapter viewport, scroll progress spring, changing copy/background, chapter jumps, rotate button, poster/progress, error boundary and rendering visibility. Text loads before GLB.
- scene/cinematicTimeline.ts: normalized keyframes shared by camera and chapter navigation. Camera and copy consume the same damped progress; no wheel interception.
- scene/CinematicWorld.tsx: loads hamster-v3.glb at full precision; authored camera/light transitions, mouse rotation, subtle blink/head movement. Pointer picking uses simple invisible volumes while the full mesh remains displayed. No million-triangle raycasting on mouse moves. No per-frame high-poly shadow passes; contact shadow renders once.
- ui/FlagshipRoutes.tsx and flagship-sections.css: four full-width horizontal scenes in a sticky desktop region, tabs/arrow/Home/End navigation. Natural vertical flow on mobile, short screens and reduced-motion preference. All 16 original course links remain.
- ui/FlagshipAbout.tsx: three factual statistics, five expanded experience entries and 15 points, closing learning CTA.
- hooks/useMotionPreference.ts: live media-query subscription for both DOM and WebGL.

Old Stage.tsx, Scene.tsx, Resume.tsx, Works.tsx, store and tutor material remain for historical reference; the current App does not import them. Do not apply the old pod/pet/night/accordion contract to V3.

## Motion and accessibility

Native vertical scrolling drives Cinema and desktop route translation. Mouse drag affects character yaw; touch drag must continue to scroll vertically. Rotation button is the keyboard/touch alternative. Hidden chapter copies are inert and aria-hidden. Keep visible focus, skip links, semantic headings, tab relationships and safe target/rel on external links.

Follow live prefers-reduced-motion: Cinema collapses to a static hero, routes become natural flow, camera/idle/CSS animation stops, explicit turn still works immediately. Use demand rendering in reduced mode, never rendering while off-screen or document-hidden, and resume on return. Mobile DPR is 1; desktop capped at 1.5. Keep delta-based damping and local monotonic time because R3F clock restarts across frameloop changes.

## Model contract

Blender Z-up facing -Y exports to glTF Y-up facing +Z. Floor origin, height 3.6. Stable nodes: HamsterRoot, Head (neck pivot), Eye_L/R (scale.y blink), Arm_L/R (shoulder pivots). Current shoulder x is ±0.64. Vertex colors and PBR, no external textures.

Final GLB: 1,018,268 triangles, 28 meshes, 14 materials, 26,347,280 bytes. Full mesh is loaded by default on desktop and mobile. This explicit user precision requirement must not silently become a low-poly runtime replacement.

hamster-v3.blend is triangulated: actual Blender polygon count 1,018,268. hamster-v3-authoring.blend preserves the editable pre-triangulation source: 503,769 polygons, 1,018,268 evaluated triangles. Report both metrics clearly. Face count and asset size are not FPS measurements.

Run build_hamster_v3.py and render_hamster_v3_details.py with Blender's bundled Python; verify_hamster_v3_blender.py opens the final source and independently reimports GLB. verify_hamster_v3.py uses standard Python to inspect the binary. Regeneration should refresh source, GLB, poster, stats and all model comparison images together. Original sen.blend / ai-hamster.glb and V2 assets are never overwritten.

## Verification and publishing

After source/asset edits run typecheck, lint and build; inspect actual desktop/mobile compositions and test changed interactions. scripts/verify-v3.cjs tests chapters, reverse scrolling, drag, native touch scrolling, reduced mode and failure fallback. scripts/capture-v3.cjs produces real browser screenshots and native-time video. Lower-section content/keyboard verification is recorded separately. No unmeasured real-device FPS promises.

GitHub Pages workflow builds main and deploys web/dist. copy-report.mjs publishes V2 at /update-report/ and V3 at /update-report-v3/; preserve both. Local report source links remain relative; copied online source links target the corresponding version tag. Asset URLs use import.meta.env.BASE_URL with base './'. Confirm deployment success and the actual online artifacts before saying published.

Preserve LICENSE / NOTICE and Sen's MIT code attribution. Original personal assets and Alex/AI Hamster Hole brand/content are outside blanket MIT reuse. Never add credentials or local archives to Git. Keep version tags, model checksums and before/after evidence traceable.
