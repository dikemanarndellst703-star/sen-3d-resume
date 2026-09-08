# V3 版本记录

本次版本：`v3.0.0`。开发分支：`codex/flagship-v3-million`，由 V2 `v2.0.0` / `4c8c4f9` 开始。

## 独立提交

| 提交 | 内容 |
| --- | --- |
| `b65c52d` | 原创百万面 Blender 模型、可编辑母版、完整 GLB、海报、同机位对照与独立几何验证 |
| `e483e40` | 四幕滚动镜头、全文版式、横向路线、鼠标与触屏操作、减少动态、加载回退与浏览器脚本 |
| `v3.0.0` 指向的最终提交 | 对比报告、真实截图/录屏、基线校验、验收记录与维护文档 |

最终完整源码以 [v3.0.0 标签](https://github.com/dikemanarndellst703-star/sen-3d-resume/tree/v3.0.0) 为准。模型的网页交付是 1,018,268 个三角面、26,347,280 bytes；SHA-256：`1a1a2eb1bf9a1f82bcbe03ec3c05ca3615c46c457388ed63180e6abd725074af`。

## 验收范围

- TypeScript、ESLint、Vite 生产构建。
- 四章定位、反向滚动、隐藏章节不可聚焦、拖动与取消拖动。
- 1440、1365、1024、390、320px 页面宽度；实际触控事件在画布上仍能纵向滚动。
- 实时切换系统减少动态模式，静止画布两次像素相同，主动旋转后画布改变。
- 模型网络失败和禁用 WebGL 均显示真实海报、保留学习入口；慢加载显示海报与进度。
- 两种桌面尺寸的八幅路线画面、方向键/Home/End/Tab；手机顺序阅读；全部 16 课程、五段经历和 15 个要点。
- 47.25 秒真实 Chrome 录屏，使用原始时间戳，没有时间压缩；最终模型与录屏元数据的 hash 一致。

相关证据：`verification.json`、`loading-fallback-qa.json`、`lower-sections-qa.json`、`build-verification.json`、`after/capture-metadata.json`、`model-asset-verification.json`、`model-blender-verification.json`。

当前完整 3D 模块约 963 kB（gzip 267 kB），Vite 给出常规 chunk 大小提示；场景已独立懒加载。百万面 GLB 为约 25.13 MiB，移动端和网络加载成本高于 V2；不宣称所有真机均达到固定帧率。真实手机硬件和 Safari 未做实机验证。

## 发布与回看

沿用仓库 [GitHub Pages Actions](https://github.com/dikemanarndellst703-star/sen-3d-resume/actions/workflows/deploy.yml)，`main` 更新后由 workflow 构建发布。部署成功和线上检查结果另存于本地 `版本留档/v3.0.0/deployment-verification.json`，避免为了写入自身提交 hash 而移动发布标签。

- [当前站点](https://dikemanarndellst703-star.github.io/sen-3d-resume/)
- [V3 画面与动效对比报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report-v3/)
- [V2 历史报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report/)
- [V2 完整源码标签](https://github.com/dikemanarndellst703-star/sen-3d-resume/tree/v2.0.0)

回看旧代码可 checkout 旧标签，或使用工作目录外层 `版本留档/` 的完整源码 ZIP 与展示报告 ZIP。旧模型、旧报告、截图与视频没有覆盖；`baseline-preservation.json` 记录 V2 截图和视频的逐文件一致性。
