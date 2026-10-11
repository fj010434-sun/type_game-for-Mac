<p align="center"><img src="docs/icon.png" width="128" alt="键盘小警察图标"></p>

# 键盘小警察 · Keyboard Cop

[中文](#中文说明) · [English](#english)

![抓到小偷](docs/screenshot-catch.png)

## 中文说明

给孩子练习键盘指法的 macOS 小游戏。小偷抢走了宝石，孩子每敲对一个字母，小警察就往前追一步；连击越多跑得越快，追上就能抓住小偷！

### 玩法
- **3D 城市街道追逐**：three.js 渲染，有阳光阴影、楼房、红绿灯、路边停车。
- **指法提示**：屏幕下方的键盘按手指分颜色，下一个要按的键会闪，并提示「用左手食指按 F」。
- **8 个关卡**：基准键、加上 G H、上排键、下排键、全部字母、英文单词、拼音音节、数字键。
- **3 档速度**：🐢 慢慢跑（每分钟约 15 个字就能追上）、🐇 一般快、🚀 飞毛腿。
- **反馈**：10 连击加速、按错小偷会嘲笑并拉开距离、抓到后撒彩纸和 1–3 星评价，每关记录最好成绩。
- **声音**：按键音、脚步声、抓捕音效，加一首轻快的背景音乐（右上角 🔊 可关闭）。

操作：`←` `→` 选关卡，`1` `2` `3` 选速度，`Enter` 开始，`Esc` 暂停，`⌘F` 全屏。

![菜单](docs/screenshot-menu.png)

### 从源码构建
需要 macOS 13.3 及以上和 Xcode 命令行工具（`xcode-select --install`）。

```bash
./build.sh            # 生成 dist/键盘小警察.app
./build.sh --install  # 同时安装到 /Applications
```

应用是本地 ad-hoc 签名，未经 Apple 公证。首次打开如被拦截，可在「系统设置 → 隐私与安全性」中选择「仍要打开」。

### 修改游戏
- `web/game.js`：关卡、词库、难度、界面和声音。比如在 `LESSONS` 里加一组课本单词。
- `web/world.js`：3D 街道、角色和镜头。
- `App/main.swift`：Mac 窗口外壳（WKWebView，通过 `app://` 加载 `web/` 目录）。

想在浏览器里边改边看，可以运行 `python3 devserver.py`，然后打开 http://localhost:8765 。

## English

A small macOS typing game for kids. A thief has stolen a gem. Every correct key moves the little cop forward, combos make him sprint, and when he catches up the thief is caught.

- 3D chase through a city street (three.js), with colour-coded on-screen keyboard and finger hints
- 8 lessons (home row → full alphabet → English words → pinyin → numbers) and 3 thief speeds
- Combo boosts, star ratings, best-score memory, sound effects and background music

Build with `./build.sh --install` (macOS 13.3+, Xcode command line tools). Gameplay lives in `web/game.js`, the 3D world in `web/world.js`, and the native shell in `App/main.swift`.

## 致谢 / Credits
- 3D 模型与音效：[Kenney](https://kenney.nl)（CC0 1.0，见 `web/assets/KENNEY-LICENSE.txt`）——Mini Characters、City Kit (Commercial / Roads)、Car Kit、Interface Sounds、Impact Sounds
- 3D 引擎：[three.js](https://threejs.org) r170（MIT，见 `web/vendor/three/LICENSE`）
