# AI 仓鼠洞 V3 视觉与交互升级报告

直接打开 [index.html](index.html) 展示。HTML 的样式、脚本均内置，无外部字体或 CDN 依赖。保持 `before/`、`after/`、`model-renders/` 和 `references/` 原有相对位置，即可离线查看图片、播放视频和拖动对比。外部官网、GitHub 链接需要联网；`../../` 开头的源文件链接要求保留完整仓库结构。

## 展示顺序

1. 首屏对比滑块：V2 与 V3 均为 1440 × 1000 的真实浏览器截图，支持鼠标和键盘。
2. 四幕画廊：初见银白全身、看见深色面部、探索背包环绕、出发回到全景。
3. 百万面模型：真实 Blender 渲染和 GLB 独立统计。
4. 双视频：V2 与 V3 真实操作流程，可分别或同时从起点播放。流程不同，不作逐帧比较。
5. 学习路线与手机：四整屏横向叙事、手机自然纵向展开和系统减少动态效果。
6. 官方参考和原始验证记录。

## 模型统计口径

- 默认 `hamster-v3.glb`：1,018,268 个真实三角面，26,347,280 bytes。
- 最终 `hamster-v3.blend`：1,018,268 个三角多边形。
- `hamster-v3-authoring.blend`：503,769 个原始多边形；与最终三角化版本几何精度一致。
- 最终字节数、顶点数与 SHA-256 以 [model-stats.json](model-stats.json) 和 [model-asset-verification.json](model-asset-verification.json) 为准。
- 从磁盘重新打开 Blender 并重新导入 GLB 的结果见 [model-blender-verification.json](model-blender-verification.json)。

面数和文件体积不能等同于帧率、加载速度或转化率。该报告不作未经测量的性能承诺。

## 留痕

`before/` 是 V2.0.0 基线画面和完整录屏；V1→V2 原报告 `docs/redesign-2026-09-08/` 保持原样。`after/` 是本次真实网页捕获，`capture-metadata.json` 记录动作顺序和环境；约 47.25 秒的 V3 视频按 Chrome 原始时间戳编码，未加速。

`model-renders/` 是 Blender 真正渲染的几何图，包括首版、修订、最终正面、特写及同摄影条件的两代模型。`references/` 保存小米和南孚官网六张截图、滚动测量与研究限制；参考素材只用于注明来源的研究展示。

最终网页检查见 [verification.json](verification.json)、[lower-sections-qa.json](lower-sections-qa.json)。提交、标签、上线状态和回退依据见 [release-notes.md](release-notes.md)，以发布阶段写入的记录为准。
