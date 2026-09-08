# 仓鼠向导 V2 · 模型交付与对比

2026-09-08，使用 Blender 5.2.1 LTS 真实生成并渲染。新角色为原创参数化网格；未使用旧角色网格生成新模型。

## 可见的变化

| 部位 | V2 更新 |
| --- | --- |
| 头与脸 | 连续头壳，细调眼窝、颊囊和口鼻体积，柔和奶油脸与腮红顶点色 |
| 眼镜 | 有截面厚度的圆角方框，完整鼻梁、镜腿与香槟色铰链 |
| 眼睛 | 独立巧克力色光亮眼珠，大小高光随眼珠运动 |
| 五官 | 小心形鼻、双瓣笑嘴、短胡须、细眉、耳内褶皱 |
| 身体 | 梨形躯干、渐变奶油肚皮、圆润手爪、三枚脚趾和小指甲 |
| 角色细节 | 可可色小背包、软肩带、金属扣与珊瑚色学习徽章 |
| 动作能力 | 头、双眼、双臂可独立控制，为转头、眨眼和挥手提供真实部件 |

## 资产测量

以下由 GLB 结构与 Blender 网格直接统计，未将文件变小等同于帧率提升。

| 指标 | 旧版 `ai-hamster.glb` | 新版 `hamster-v2.glb` |
| --- | ---: | ---: |
| GLB 字节数 | 16,039,824 | 1,895,128 |
| 三角面 | 501,070 | 93,696 |
| Mesh 数 | 1 | 20 |
| 材质数 | 1 | 11 |
| 角色节点 | 单一整体网格 | 头、眼、肩部独立枢轴 |

GLB 文件体积减少 **88.2%**，三角面减少 **81.3%**。新角色将几何预算用于明确的五官、轮廓和可互动部件。独立部件增加绘制次数，因此整体性能仍须结合网页场景实测。

## 前端节点契约

glTF 坐标：Y 向上，+Z 朝前，原点在地面。角色宽 2.25、高 3.59、深约 1.77 单位。

| 节点 | glTF 位置 | 使用方式 |
| --- | --- | --- |
| `HamsterRoot` | `(0, 0, 0)` | 整体位移、缩放与轻微摆动 |
| `Head` | `(0, 1.98, 0)` | 脖颈枢轴，`rotation.y` 转头，`rotation.x` 点头 |
| `Eye_L` | 相对 Head `(0.39, 0.70, 0.684)` | 轻微眼球运动；`scale.y` 眨眼 |
| `Eye_R` | 相对 Head `(-0.39, 0.70, 0.684)` | 同上 |
| `Arm_L` | `(0.71, 1.66, -0.005)` | `rotation.z` 正方向向外抬手 |
| `Arm_R` | `(-0.71, 1.66, -0.005)` | `rotation.z` 负方向向外抬手 |

眼镜、耳朵、口鼻均归于 `Head`；每只眼球高光是对应眼球的子节点。双臂有独立肩部枢轴，手爪归于各自手臂。文件不包含必须播放的动作剪辑，前端可直接采用阻尼动画，并支持减少动态效果。

## 文件与复现

- `blender/build_hamster_v2.py`：建模脚本与展示场景定义。
- `blender/hamster-v2.blend`：可编辑源文件，内含模型、PBR 材质、柔光灯与相机。
- `web/public/models/hamster-v2.glb`：运行时模型，仅角色，不含灯光与相机。
- `web/public/brand/hamster-v2-poster.png`：1400 × 1600 透明模型展示图，可作 WebGL 回退。
- `model-render.png`：同一展示图的报告副本。
- `model-v1-studio.png`、`model-v2-studio.png`：相同相机和灯光的旧新模型对比，均归一化为 3.59 单位高。
- `model-stats.json`：最终模型统计与坐标信息。
- `blender/render_model_comparison.py`：对比图复现脚本。

在项目根目录执行：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_hamster_v2.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_model_comparison.py
```

为控制绘制次数，同材质静态部件按父枢轴合并。可在 Blender 编辑模式按松散部件拆分；保留的交互节点无需拆分即可使用。皮肤采用顶点色，模型没有外部纹理依赖。

## 验证与留痕

已执行真实 Blender 构建、GLB 导出、Cycles 渲染与人工视觉检查。修整了镜框闭环法线接缝、腹部网格折线与奶油色边界。脚本内校验三角面少于 120,000、GLB 少于 8 MB；最终结果通过。

旧版 `web/public/models/ai-hamster.glb` 和 `blender/sen.blend` 均未改写、删除。对比脚本只读取旧 GLB，渲染结果另存。
