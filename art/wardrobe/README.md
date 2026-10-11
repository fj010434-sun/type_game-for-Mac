# 制服三维素材与完整制作源

原始人物与动作来自 Kenney Mini Characters（CC0）。新增制服为项目原创造型，保持原人物比例与七骨骼结构。

- `duty.blend` / `jacket.blend` / `traffic.blend`：完整可编辑人物，含领带、拉链、肩章、裤袋、袖口、鞋靴及五官。包含原始 32 个动作。第三套含贝雷帽、卷发、棱角脸、反光马甲、护膝与高帮靴。
- `duty.glb` / `jacket.glb` / `traffic.glb`：由游戏实际装配器导出的完整人物。所有刚性配件保留骨骼父子关系，衣服使用原骨骼权重。
- `base-meshes.blend` 与 `*-body.glb`：基础上衣、露出皮肤、裤子和鞋的制作中间文件，不是完整制服。
- `asset-manifest.json`：单位、坐标轴、骨骼、面数与材质说明。导出用 PBR 近似游戏 Lambert 材质，外部查看器的灯光效果不等同于游戏。
- 游戏实际读取 `web/assets/wardrobe/uniforms.json`，由同一基础制作脚本生成；细节和头部由 `web/wardrobe-character.js` 装配，完整 GLB 导出始终从这份装配器读取，避免两套制作源失配。

复现：启动项目本地预览服务器，然后在仓库根目录依次执行：

```sh
BLENDER_BIN=/Users/sunyifeng/.codex/tools/blender-4.5.3/Blender.app/Contents/MacOS/Blender
"$BLENDER_BIN" --background --python-exit-code 1 --python scripts/build_uniform_samples.py
BASE_URL=http://127.0.0.1:18765 node scripts/export_uniform_samples.cjs
"$BLENDER_BIN" --background --python-exit-code 1 --python scripts/import_uniform_delivery.py
python3 tests/uniform-assets.py
```

制作方法参考 `blender-image-to-3d`（MIT）：https://github.com/majidmanzarpour/blender-game-skills 。使用其轮廓优先、相同骨骼、极限姿势和回读验收方法；针对既有游戏缩减高模、烘焙和物理布料阶段。未新增肘膝骨骼、动画或实时布料模拟。
