# V4 泥塑角色精修报告

打开 [index.html](index.html) 可离线展示。样式和脚本内置，图片、滑动对比及本地视频不依赖网络。源文件链接需要完整仓库；GitHub 链接需要联网。

本版沿用户上传的坐姿 GLB 精修，移除融合小龙虾、重建连续头冠、整理扫描起伏和烘焙色斑，制作哑光彩泥与贴身小背包。原始 GLB 为 501,070 三角面、16,039,824 bytes，未覆盖。

最终 Blender 实际多边形和网页 GLB 均为 **1,025,000 个三角面**；完整 GLB **29,364,716 bytes**。统计见 [model-stats.json](model-stats.json)，独立二进制核验见 [model-asset-verification.json](model-asset-verification.json)，保存源与重导入核验见 [model-blender-verification.json](model-blender-verification.json)。面数和字节数不是帧率或转化率指标。

- `source-inspection/`：上传 GLB 的原始正反面、头顶和材质检查。
- `before/`：已发布 V3 的真实网页画面及原始交互录屏。
- `after/`：V4 最终模型、真实桌面和手机截图、未加速交互录屏。
- `renders/`：最终七个角度的高分辨率模型渲染。
- `iterations/`、`draft/`：修补与颜色迭代记录，明确标记不通过的轮次，不作为最终交付。
- `verification.json`、`loading-fallback-qa.json`：生产构建的交互、原生触摸滚动、减少动态、空闲绘制和加载回退验收。
- `report-qa.json`：在线构建及离线 HTML 的图片、视频、键盘对比与手机排版检查。
- `release-notes.md`：版本提交、标签与发布留档方式。

V3 的 [原报告](../redesign-v3-2026-09-08/index.html) 和发布提交 `c8784bc` / `v3.0.0` 保留。V1–V3 的模型、报告、截图和视频均未覆盖。
