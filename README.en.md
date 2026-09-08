# AI Hamster Hole · Flagship Experience V3

Alex's learning gateway for AI beginners. A million-triangle hamster leads four cinematic chapters, from discovering AI to choosing a learning path and entering the [AI Hamster Hole learning site](https://ai.alexdbg.com/). The website UI is Chinese.

[简体中文](README.md) · [Live website](https://dikemanarndellst703-star.github.io/sen-3d-resume/) · [V3 comparison report](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report-v3/) · [V2 historical report](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report/) · [Model delivery](docs/redesign-v3-2026-09-08/model-delivery.md)

![Actual V3 desktop website](docs/redesign-v3-2026-09-08/after/hero-desktop.png)

## What changed

- Both the final Blender model and the default browser GLB contain **1,018,268 real triangles**. Added detail includes fine surface geometry, ear folds, glasses hinges, facial structure, backpack stitching, zippers and strap connections. A separate authoring master preserves editable polygon topology.
- The exploration pod becomes four continuous camera chapters: a silver studio portrait, a dark facial close-up, a backpack orbit, and a silver closing scene. Native vertical scrolling drives camera, lighting and copy; chapter controls jump directly to each scene.
- Mouse dragging rotates the character. A rotation button provides touch and keyboard access, while touch scrolling remains available over the canvas. Lightweight picking volumes avoid raycasting the million-triangle display geometry on every pointer move.
- Four learning routes become full-screen horizontal chapters. Phones, short viewports and reduced-motion mode use natural vertical sections. All 16 course links, five story entries, 15 supporting points and original audience figures remain available.
- Text appears before the independently loaded 3D module. Loading includes a real model poster and progress; model or WebGL failures show a static poster. Rendering pauses off-screen and in hidden tabs, and reduced-motion mode stops continuous animation.

The GLB is **26,347,280 bytes (25.13 MiB)** and loads at full million-triangle detail by default. This precision budget follows the requested modeling target; more triangles do not imply faster loading or higher frame rates. Device and network performance still vary.

## Run locally

Use Node `^20.19.0 || ^22.13.0 || >=24`; the existing CI uses Node 20. Run npm commands inside `web/`:

```sh
cd web
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

Build output is `web/dist/`, including both V2 and V3 comparison reports. This is a static front-end SPA with no backend, database or API keys.

## Maintenance map

| Area | Repository path |
| --- | --- |
| Navigation, page order and footer | `web/src/App.tsx` |
| Four chapters, loading, fallback and motion preference | `web/src/scene/Cinema.tsx` |
| Character, camera sampling, lights, dragging and blinking | `web/src/scene/CinematicWorld.tsx` |
| Camera poses, rotation and chapter timing | `web/src/scene/cinematicTimeline.ts` |
| Original course data | `web/src/data/works.ts` |
| Learning routes and Alex's story | `web/src/ui/FlagshipRoutes.tsx`, `FlagshipAbout.tsx` |
| Typography, layout and transitions | `web/src/styles.css`, `web/src/ui/flagship-sections.css` |

The old `Stage.tsx`, `Scene.tsx`, `Resume.tsx`, `Works.tsx` and tutorials remain as historical sources. The current entry point does not import those components.

## Blender delivery

| File | Purpose |
| --- | --- |
| [hamster-v3.blend](blender/hamster-v3.blend) | Final triangulated model: 1,018,268 polygons |
| [hamster-v3-authoring.blend](blender/hamster-v3-authoring.blend) | Editable master: 503,769 polygons / 1,018,268 triangles |
| [hamster-v3.glb](web/public/models/hamster-v3.glb) | Full-detail browser model |
| [Model poster](web/public/brand/hamster-v3-poster.png) | Loading and failure fallback |

Run from the repository root; replace the macOS Blender executable path as needed. Scripts requiring `bpy` run in Blender's bundled Python.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_hamster_v3.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_hamster_v3_details.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/verify_hamster_v3_blender.py
python3 blender/verify_hamster_v3.py
```

The glTF model is Y-up, faces +Z, has a floor-level origin and is approximately 3.6 units tall. Preserve `HamsterRoot`, `Head`, `Eye_L/R` and `Arm_L/R`; eye `scale.y` controls blinking. See the [delivery notes](docs/redesign-v3-2026-09-08/model-delivery.md) for reproducible geometry measurements and iteration evidence.

## Validation, deployment and history

Browser acceptance uses `scripts/verify-v3.cjs`; screenshot and recording capture uses `scripts/capture-v3.cjs`. They support environment overrides including `PLAYWRIGHT_CORE`, `CHROME_PATH` and `SITE_URL`; Chrome is required, with ffmpeg for recordings. Evidence lives in the [V3 report directory](docs/redesign-v3-2026-09-08/).

The [GitHub Pages workflow](.github/workflows/deploy.yml) builds and deploys on pushes to `main`. `base: './'` and `import.meta.env.BASE_URL` support repository subpaths. Actions records and the actual live page establish publication status. The build publishes the [V2 source report](docs/redesign-2026-09-08/index.html) at `update-report/` and the [V3 source report](docs/redesign-v3-2026-09-08/index.html) at `update-report-v3/`.

V1 assets, V2 models, separate comparison reports, real screenshots and recordings are preserved. Version references are `v1-before-3d-redesign-20260908`, `v2.0.0` and `v3.0.0`; historical tags are not overwritten.

## Attribution and rights

This project builds on Sen Zheng (SEN)'s [sen-3d-resume](https://github.com/dayinji/sen-3d-resume), retaining [LICENSE](LICENSE) and [NOTICE](NOTICE). Source code is MIT-licensed; the original author's name, likeness, models, résumé, work content and branding are excluded from that license. AI Hamster Hole / Alex branding, content, character models and presentation assets are likewise not automatically licensed for reuse by the code's MIT license. Third-party assets retain their own terms.
