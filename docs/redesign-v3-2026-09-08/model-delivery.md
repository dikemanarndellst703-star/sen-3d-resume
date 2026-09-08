# V3 百万面 Blender 模型交付

## 实际交付精度

最终 `blender/hamster-v3.blend` 的角色网格已**实际应用三角化**，包含 **1,018,268 个多边形（全部为三角面）**。默认网页加载的 `web/public/models/hamster-v3.glb` 同样包含 **1,018,268 个真实三角面**，不是渲染时细分估计数，也不是低模替代物。

同时保留 `blender/hamster-v3-authoring.blend` 四边形母版：503,769 个原始多边形，对应同一曲面精度的 1,018,268 个三角面。源生成脚本可重新编辑参数并重建。两份 `.blend` 的可见几何精度一致；区别是最终版已把多边形显式转换成网页采用的三角面。

数值和文件 SHA-256 以 `model-stats.json`、`model-asset-verification.json` 为准。后者独立解析导出 GLB 的索引 accessor，未依赖 Blender 的面数陈述。`model-blender-verification.json` 进一步记录：从磁盘重新打开最终 `.blend`、清空场景再导入最终 GLB，双方都实测为 1,018,268 个三角面，角色高度均约 3.6。

## 重新建模内容

- 头部：收窄顶部、加厚双颊和下脸，重建眼窝和口鼻部曲面；更大的椭圆眼睛、深咖啡瞳孔和细虹膜边界。奶油区域和珊瑚腮红均为顶点色。
- 短绒：高密度曲面承载真实的低幅随机几何起伏，额头有贴服的极短毛簇。微细节存入 GLB 顶点，浏览器和 Blender 均可见。
- 耳朵：连续杯形外耳、内凹耳窝、下部耳褶；减少原模型的独立平面耳内衬感。
- 眼镜：圆角方形黑色镜框、边缘倒角亮线、镜腿、黄铜铰链和带槽微螺丝。
- 身体：更丰满的梨形躯干、圆厚手臂、分指/分趾、指甲和细小指节纹。
- 背包：圆角软包、提手、背带、缝线、口袋针脚、双排交错拉链齿和拉链环。

## 视觉迭代留痕

`model-renders/v3-first-pass.png` 为实际首版渲染。检查时发现短绒起伏有明显规则重复、眼睛虹膜边缘过粗、耳褶突出。因此第二版降低并随机化微起伏、收窄虹膜，并减轻耳褶厚度。背包特写随后发现肩带与包体的锚点偏离，最终修正了连接位置、拉链齿扁平度和手指甲片厚度；同时让手臂曲线从躯干内部起始，消除肩部悬空感。`model-renders/v3-backpack-before-anchor-fix.png` 保留修正前的背包特写。

`model-renders/v3-final-portrait.png` 为最终模型渲染；另外交付正面、面部特写、背包特写以及 V2/V3 相同摄影机/灯光/角色高度的对比图。所有这些图片来自 Blender 几何渲染，没有使用图像生成来替代实际建模结果。

## 节点与坐标

导出为 glTF Y 上、面向 +Z；整体地面原点，高约 3.6000 单位。`HamsterRoot`、`Head`、`Eye_L`、`Eye_R`、`Arm_L`、`Arm_R` 保留。眼睛 glTF 本地 Y 轴缩放用于眨眼；头部与手臂拥有各自旋转枢轴。

14 个 PBR 材质；顶点色和真实几何细节，无外部纹理依赖。GLB 26,347,280 bytes（约 26.35 MB / 25.13 MiB），默认完整加载。百万面提高了资源下载和 GPU 绘制成本，实际页面表现应以浏览器验收为准，不能将面数增加直接陈述为帧率提升。

## 可复现验证

在项目根目录运行：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_hamster_v3.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/render_hamster_v3_details.py
python3 blender/verify_hamster_v3.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python blender/verify_hamster_v3_blender.py
```

`HAMSTER_DRAFT=1` 只降低离线渲染分辨率和采样数；生成的几何精度仍然完整。

V1/V2 模型、GLB 及原报告均保留。验证脚本检查之前四个角色源资产在 Git 中没有发生修改，并记录各自 SHA-256。
