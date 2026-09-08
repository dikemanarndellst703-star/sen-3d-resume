# AI 仓鼠洞 · 坐姿泥塑精修 V4

Alex 大表哥的 AI 新手学习入口。本版以用户上传的坐姿仓鼠 GLB 为基础，修整头顶、形体与颜色，加入独立小背包，并将泥塑角色接入四幕宣传页镜头。学习路线仍通往 [AI 仓鼠洞学习站](https://ai.alexdbg.com/)。

[在线体验](https://dikemanarndellst703-star.github.io/sen-3d-resume/) · [V4 精修报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report-v4/) · [V3 历史报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report-v3/) · [V2 历史报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report/) · [模型统计](docs/redesign-v4-clay-2026-09-08/model-stats.json)

![V4 真实网页首屏](docs/redesign-v4-clay-2026-09-08/after/hero-desktop.png)

## 本次变化

- **沿上传模型精修。** 源文件 `tripo_convert_bfa920ab-ad7b-44e1-b2ac-2ceb65744036.glb` 与保留的 `web/public/models/ai-hamster.glb` 字节一致：501,070 三角面、16,039,824 bytes。保留坐姿、腹前收手、前伸脚掌、胖脸比例与黑色方框眼镜；源文件不覆盖，来源和校验值见 [provenance.json](docs/redesign-v4-clay-2026-09-08/provenance.json)。
- **修复形体与表面。** 清除已融合到头顶的小龙虾及接触区，补出连续圆头，保护耳朵；整理扫描鼓包和不规则边缘。通过源坐标与颜色分区重建基色，保留金棕、奶油脸与肚皮、腮红、耳手足、眼镜和鼻子的独立边界；嘴唇保留奶油色，只在嘴沟使用深棕，去除原贴图烘焙明暗与高光斑块。
- **哑光手工泥塑。** 细节以轻微压痕和柔和表面为主；增加独立小背包与背带结构。网页使用完整精度导出模型，最终面数、字节数、材质数与 SHA-256 以 [模型统计](docs/redesign-v4-clay-2026-09-08/model-stats.json) 为准。
- **适配坐姿的四幕镜头。** 银白全身 → 深色面部近景 → 背部环绕 → 全景收尾。滚动统一驱动镜头、背景与文字，章节可跳转；支持整体拖动和触屏／键盘旋转；近景自由旋转时镜头轻退，给文案留出空间。
- **静止时停止绘制。** 角色是融合雕塑，没有独立头、眼、手关节。本版采用按需渲染，滚动或操作时更新，稳定后停止新的 WebGL 绘制；离屏与隐藏标签页暂停。保留加载海报、真实进度、失败回退及系统减少动态效果支持。
- **学习内容延续。** 四条路线在桌面整屏横向呈现，手机、短屏和减少动态模式自然纵向展开。16 条课程链接、五段经历与 15 项要点继续保留。

- **路线元素持续循环。** 镜头缓转并伴随呼吸光、8 层橙片错峰分合、代码括号轻开合并配合橙条节奏、11 条波形错峰起伏；停留时持续播放。手动暂停保留当前相位，继续时接着播放；离屏停止、实时减少动态时移除循环。生产预览的 [10 项专项验证](docs/redesign-v4-clay-2026-09-08/route-motion-qa.json) 通过，包含 390px 触屏模拟中四组播放、16 条课程链接及无横向溢出。页面内模拟 `document.hidden`／`visibilitychange` 验证暂停恢复，不作为操作系统真实后台切换测试。更新前后画面与原速视频见 [路线动效报告](docs/redesign-v4-clay-2026-09-08/index.html#route-motion)。

当前完整 GLB 与最终三角化 Blender 均为 **1,025,000 个真实三角面**；GLB 为 **29,364,716 bytes**，最终 Blender 包含 **512,688 个顶点**。编辑母版为 **994,602 个多边形 / 1,025,000 个三角面**，属于混合拓扑，不是纯四边形母版。主体为 965,700 三角面，独立背包为 59,300 三角面；共有 5 个网格、11 个材质，无位图纹理。GLB 按材质边界拆分后的 POSITION 顶点合计为 518,667，见 [独立二进制核验](docs/redesign-v4-clay-2026-09-08/model-asset-verification.json)。数值见 [模型统计](docs/redesign-v4-clay-2026-09-08/model-stats.json)。面数与资源体积不代表帧率、加载速度或转化率改善。

冻结 GLB SHA-256：`e3c5eeb1fa3534707fa45cf74848b2dea20f3997be894bfc787e3a2ceb548c76`。

## 本地运行

使用 Node `^20.19.0 || ^22.13.0 || >=24`；CI 使用 Node 20。npm 命令在 `web/` 内运行：

```sh
cd web
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

输出为 `web/dist/`，同时包含 V2、V3、V4 三份独立报告。页面是纯前端 SPA，无后端、数据库或 API key。

## 维护入口

| 内容 | 仓库内路径 |
| --- | --- |
| 导航、页面顺序和页脚 | `web/src/App.tsx` |
| 四幕文案、加载回退、章节与减少动态 | `web/src/scene/Cinema.tsx` |
| 完整模型、光线、整体拖动和按需绘制 | `web/src/scene/CinematicWorld.tsx` |
| 镜头关键位置、转角与章节时间 | `web/src/scene/cinematicTimeline.ts` |
| 原始课程数据 | `web/src/data/works.ts` |
| 学习路线与关于 Alex | `web/src/ui/FlagshipRoutes.tsx`、`FlagshipAbout.tsx` |
| 排版与动效 | `web/src/styles.css`、`web/src/ui/flagship-sections.css` |

旧 `Stage.tsx`、`Scene.tsx`、`Resume.tsx`、`Works.tsx` 与教程作为历史来源保留，当前入口不再导入。V2/V3 的眨眼、头部或手臂独立运动不是 V4 模型能力。

## Blender 交付

| 文件 | 用途 |
| --- | --- |
| `blender/hamster-v4-clay.blend` | 最终三角化泥塑模型，1,025,000 polygons |
| `blender/hamster-v4-clay-authoring.blend` | 混合拓扑母版，994,602 polygons / 1,025,000 triangles |
| `blender/refine_hamster_v4_clay.py` | 从用户源网格修补、重建材料和导出 |
| `blender/clay_color_regions_v4.py` | 联合源坐标与采样色分区，输出线性调色板 |
| `blender/clay_backpack_v4.py` | 在源坐标中生成贴合坐姿的独立背包 |
| `blender/verify_hamster_v4.py` | 独立读取 GLB 索引与位置，并核验旧资产未变 |
| `blender/verify_hamster_v4_blender.py` | 重开最终 Blender、重新导入 GLB，检查面数与主体拓扑 |
| `web/public/models/hamster-v4-clay.glb` | 网页完整精度模型 |
| `web/public/brand/hamster-v4-clay-poster.png` | 加载与失败回退海报 |

从仓库根目录运行，Blender 路径按环境替换：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/refine_hamster_v4_clay.py
python3 blender/verify_hamster_v4.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/verify_hamster_v4_blender.py
```

精修与 Blender 复核脚本须使用 Blender 的 Python；GLB 二进制核验脚本可用标准 Python。原始模型为 Z-up、+X 朝前；导出归一到 glTF Y-up、+Z 朝前、地面原点，仓鼠本体高约 3.6。`HamsterRoot` 用于整体变换，`ClayBackpack` 为独立背包根节点；不要求或虚构 `Head`、`Eye_L/R`、`Arm_L/R` 关节。颜色辅助脚本使用**原始源模型坐标**，在重网格后须先映射回源点，不能直接传入缩放后的世界坐标。

## 验证、部署与历史

以下脚本从仓库根目录对生产预览运行，实际支持的参数以脚本文件为准：

```sh
SITE_URL=http://127.0.0.1:5175/ node scripts/verify-v4.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/verify-v4-loading.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/verify-v4-rotation.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/verify-v4-report.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/capture-v4.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/verify-route-motion-v4.cjs
SITE_URL=http://127.0.0.1:5175/ node scripts/capture-route-motion-v4.cjs
```

需要 Chrome／Playwright，录屏另需 ffmpeg；支持 `CHROME_PATH`、`PLAYWRIGHT_CORE` 等覆盖。验证静止停绘制、操作恢复、四幕与反向滚动、拖动、原生触摸滚动、减少动态效果和加载失败回退。结果与真实截图、视频保存在 [V4 报告目录](docs/redesign-v4-clay-2026-09-08/)，未完成的检查不视为通过。

[GitHub Pages workflow](.github/workflows/deploy.yml) 在推送 `main` 后构建发布。保留 `base: './'` 与 `import.meta.env.BASE_URL` 的仓库子路径支持。V2 报告位于 `/update-report/`，V3 位于 `/update-report-v3/`，V4 位于 `/update-report-v4/`。最终提交、`v4.0.0` 标签和部署状态见 [发布说明](docs/redesign-v4-clay-2026-09-08/release-notes.md)，以 Actions 记录和在线实际页面为准。

V1–V3 源资产、模型、报告、真实截图和录屏均保留。V3 基线为 `v3.0.0` / `c8784bc`；旧标签 `v1-before-3d-redesign-20260908`、`v2.0.0`、`v3.0.0` 不覆盖。

## 来源与许可

本项目基于 Sen Zheng（SEN）的 [sen-3d-resume](https://github.com/dayinji/sen-3d-resume) 代码二次开发，保留 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。代码采用 MIT；原作者姓名、肖像、模型、简历、作品及品牌素材不在 MIT 授权范围内。用户上传的角色资产、AI 仓鼠洞 / Alex 的品牌、内容与展示素材也不因代码采用 MIT 而自动获得复用授权。第三方资产遵守各自许可。
