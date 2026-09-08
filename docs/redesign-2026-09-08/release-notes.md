# AI 仓鼠洞 V2.0.0 · 版本说明

日期：2026-09-08。项目：`dikemanarndellst703-star/sen-3d-resume`。

## 体验与报告

- [网页](https://dikemanarndellst703-star.github.io/sen-3d-resume/)
- [可分享的画面与动效对比报告](https://dikemanarndellst703-star.github.io/sen-3d-resume/update-report/)
- [V2.0.0 版本源码](https://github.com/dikemanarndellst703-star/sen-3d-resume/tree/v2.0.0)
- [GitHub Pages 构建与部署记录](https://github.com/dikemanarndellst703-star/sen-3d-resume/actions/workflows/deploy.yml)

`main` 使用原有 GitHub Actions 工作流，执行 npm ci、TypeScript 检查、Vite 构建，再发布 GitHub Pages。构建会将本报告与图片、视频复制到 `update-report/`。具体部署执行状态以对应提交的 Actions 记录为准。

## 留痕

| 节点 | 标识 | 保存内容 |
|---|---|---|
| 改版前源代码 | `d44d71ee9809357a1be50da1c42d989d36d7df4a` | 原站完整源码与原模型 |
| 旧版标签 | `v1-before-3d-redesign-20260908` | 永久指向改版前提交 |
| 证据提交 | `0c68a24` | 旧版截图、真实交互视频、审计与捕获脚本 |
| 建模提交 | `371e00c` | 原创新模型、Blender 源、建模脚本、材质与统计、同摄影模型对比 |
| 网页提交 | `1177761` | 探索舱、角色互动、路线切换、可访问性、报告发布构建 |
| 改版分支 | `codex/hamster-exploration-v2` | 网页、交互、文档与验证的完整开发历史 |
| 新版标签 | `v2.0.0` | 本次最终源代码与展示材料 |

原始 `ai-hamster.glb`、`sen.blend`、`LICENSE` 和 `NOTICE` 均保留。本地 `版本留档/v1-d44d71e/` 还保留独立源 ZIP、可运行旧站和 SHA-256 清单，不需要撤销新版才能回看旧版。

## 本次完成

- 用 Blender 从头制作眼镜仓鼠：头、双眼、双臂可独立控制，新增眼镜铰链、脸颊、口鼻、胡须、耳内、脚趾、背包和学习徽章。
- 重构环形探索舱、双层基座与悬浮学习道具；日夜灯光可切换。
- 增加指针转头、眨眼、摸摸后的弹跳挥手、转身观察背包；连续输入有冷却，离屏暂停后不会重放旧动作。
- 原生滚动镜头；五项 Alex 经历按需展开；四条路线主动选择，保留原 16 个学习内容链接。
- 3D 代码按需分块，离屏停止渲染；系统减少动态偏好可实时生效；GLB 网络失败时显示真实 Blender 展示图，CTA 保持可用。
- 网页对比报告可离线打开、拖动看新旧画面、播放两版真实动效；同一摄影条件下比较新旧模型。

## 验证与实际边界

`npm run build`、`npm run lint` 已通过。浏览器检查详见 [verification.json](verification.json)，捕获信息见 [新版截图与视频记录](after/capture-metadata.json)。

- Chrome 152 生产构建检查；1440×1000、1024×768、390×844、320×740 均无水平溢出。
- 五项经历、15 个经历要点、原资历、四条路线/16 个内容入口已核对。
- 检查了按钮反馈、重复输入、日夜状态、方向键/Home/End/快速 Tab 的焦点、动态减少动画偏好、离屏返回、模型请求失败回退。
- 新模型 1,895,128 bytes / 93,696 三角面；旧模型 16,039,824 bytes / 501,070 三角面。体积减少 88.2%，三角面减少 81.3%。独立部件增加绘制调用，这些数值不等于实测帧率提升。
- 3D 分块约 903 KB（gzip 约 246 KB），Vite 仍提示大分块；它被独立加载，主文案和导航不被全屏加载页挡住。没有加入外部 HDR 或字体下载依赖。
- 未进行实体手机、Safari 或弱网设备的完整性能测试；未声称所有设备固定 60 FPS。

## 回看与回退

独立查看旧源码，不改变当前目录：

```sh
git worktree add --detach ../ai-hamster-v1-review v1-before-3d-redesign-20260908
```

完整旧站也可以直接在本地归档的 `site/` 目录通过 HTTP 服务查看。若需要恢复线上版本，可由旧标签重新构建和部署，或创建明确的回退提交；不需要重写 Git 历史。
