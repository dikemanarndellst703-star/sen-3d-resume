# AI Hamster Hole · 3D Exploration Pod V2

Alex's learning gateway for AI beginners. An original glasses-wearing hamster welcomes visitors inside a ring-shaped exploration pod, introduces Alex, and helps them choose a path into the [AI Hamster Hole learning site](https://ai.alexdbg.com/).

[简体中文](README.md) · [Before/after report](docs/redesign-2026-09-08/index.html) · [Model delivery notes](docs/redesign-2026-09-08/model-delivery.md)

![New hamster model](web/public/brand/hamster-v2-poster.png)

## The V2 experience

- A real Blender character with sculpted cheeks, thick glasses, separate glossy eyes, paws, a backpack and a learning badge. The character looks toward the pointer, blinks and breathes.
- Click the character or its pet button for a response and wave; spin it to inspect the backpack; switch between day and night lighting.
- Native scrolling with a sticky desktop stage and gentle camera movement. Mobile follows a natural vertical layout.
- Five expandable sections about Alex and four learning tabs: AI Basics, AI Art, AI Coding and AI Productivity. Tabs support arrow keys, Home and End.
- Text and learning links render independently of 3D. React.lazy splits the Stage module; the GLB loads when the scene mounts, with a progress indicator. A static poster is available when WebGL is unavailable or the scene fails.
- System `prefers-reduced-motion` disables ongoing character and decoration animation; the spin control becomes an immediate turn. Rendering pauses outside the viewport or in a hidden tab, and mobile uses a lower pixel ratio.

This is a static front-end SPA with no backend, database or API keys. Main learning links open `https://ai.alexdbg.com/` in a new tab. The current website UI is Chinese.

## Run and verify

The application lives in `web/`; run npm commands there. Node.js must satisfy the installed ESLint requirement, `^20.19.0 || ^22.13.0 || >=24`. The existing CI uses Node.js 20.

```sh
git clone https://github.com/dikemanarndellst703-star/sen-3d-resume.git
cd sen-3d-resume/web
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

Development normally runs at `http://localhost:5173`. Build output is `web/dist/`; serve it with `npm run preview` or an HTTP server.

Check desktop and mobile layouts, pet/wave/spin, day/night, all five accordion entries, all four route tabs, keyboard navigation, reduced motion and the WebGL fallback. Model validation is recorded in [model-asset-verification.json](docs/redesign-2026-09-08/model-asset-verification.json).

## Where to edit

Paths below are relative to the repository root.

| Change | File |
| --- | --- |
| Hero, navigation, main destination and footer | `web/src/App.tsx` |
| Alex's five story entries | `STORY` in `web/src/ui/Resume.tsx` |
| Route titles, lessons and external links | `web/src/data/works.ts` |
| Tabs, route copy and CSS illustration structure | `web/src/ui/Works.tsx` |
| Controls, messages, loading, fallback and render suspension | `web/src/scene/Stage.tsx` |
| Character movement, camera, pod, satellite icons and lights | `web/src/scene/Scene.tsx` |
| Interaction and selection state | `web/src/store.ts` |
| Palette, typography, layout, breakpoints and CSS motion | `web/src/styles.css` |
| Brand guidelines | `brand-spec.md` |

The current camera and character are animated in code. They do not require a GLB camera clip or focus anchors. Retained `tutor/` guides concerning the original résumé scene describe the historical architecture.

## Editable Blender assets

- `blender/hamster-v2.blend`: editable model, materials, studio camera and lights.
- `blender/build_hamster_v2.py`: original geometry, GLB export and transparent poster generation.
- `blender/render_model_comparison.py`: renders V1 and V2 under identical studio lighting and camera settings.
- `web/public/models/hamster-v2.glb`: runtime model.
- `web/public/brand/hamster-v2-poster.png`: transparent poster and fallback.

Run from the repository root. Replace this macOS executable path with your local Blender executable as needed. Blender runs the Python scripts with its bundled interpreter.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_hamster_v2.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_model_comparison.py
```

The glTF origin is on the floor, Y points up and +Z faces forward. Height is approximately 3.59 units. Preserve these names:

| Node | Contract |
| --- | --- |
| `HamsterRoot` | Character root |
| `Head` | Neck pivot; glasses, ears and facial details follow it |
| `Eye_L` / `Eye_R` | Separate eyes with child catchlights; `scale.y` supports blinking |
| `Arm_L` / `Arm_R` | Shoulder pivots with their respective paws |

V2 contains **93,696 triangles** and is **1,895,128 bytes**, an **88.2%** smaller GLB than V1. It uses PBR materials and vertex colors with no external textures. File size and geometry savings are not claims of equivalent frame-rate gains. See the [model notes](docs/redesign-2026-09-08/model-delivery.md) for measurements and trade-offs.

## Deployment and history

The existing [GitHub Pages workflow](.github/workflows/deploy.yml) runs on pushes to `main` or manual dispatch. It executes `npm ci` and `npm run build` in `web/`, then uploads and deploys `web/dist/`. Configure the repository's Pages source as GitHub Actions. Actual publication status is established by Actions and the release record in the redesign report.

Vite uses `base: './'`; runtime public assets use `import.meta.env.BASE_URL`, allowing deployment under a subdirectory. Other static HTTP hosts can also serve `web/dist/`.

The [redesign report](docs/redesign-2026-09-08/index.html) includes page, model and interaction comparisons. Its directory preserves baseline screenshots, walkthrough recordings, plans, research, model statistics and verification evidence. The original `blender/sen.blend` and `web/public/models/ai-hamster.glb` remain intact. The report is stored under source `docs/`; the current Pages workflow publishes only `web/dist/`.

## Attribution and rights

This project builds on Sen Zheng (SEN)'s [sen-3d-resume](https://github.com/dayinji/sen-3d-resume). The original [LICENSE](LICENSE) and [NOTICE](NOTICE) remain in place. Source code is MIT-licensed; the original author's name, likeness, models, résumé, work content and branding are excluded from that license.

AI Hamster Hole / Alex branding, content, character models and presentation assets are project-specific content and are not automatically licensed for reuse by the code's MIT license. Third-party fonts, images and HDR assets retain their own terms. Keep the original license notices and obtain permission for, or replace, the content and assets you reuse.

The build also publishes the complete visual and motion report at `update-report/`, using `web/scripts/copy-report.mjs`. Its source remains under `docs/`.
