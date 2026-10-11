# 警察衣柜与成长系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作精美的十部位换装样板，在用户认可样板后完成抓捕经验、物品解锁、衣柜和本机存档。

**Architecture:** 模块化人物与现有 Kenney 骨架共用动画；外观目录、成长规则、角色组装、衣柜交互分别独立。游戏结算调用幂等奖励接口，游戏世界和衣柜共用角色组装逻辑。先交付人物样板供视觉验收，再完成游戏闭环。

**Tech Stack:** 原生 JavaScript ES modules、Three.js r170、Python 标准库资产处理、Node 内置测试、Playwright/Chrome、Swift/AppKit/WKWebView。

**Spec:** `docs/superpowers/specs/2026-10-11-wardrobe-progression-design.md`（用户已确认）。

## Global Constraints

- 支持 macOS 13.3+；所有资源离线打包，不增加账号和联网依赖。
- 保持当前 Kenney 低多边形风格、人物比例和自然明亮的光照。
- 十个分类，每类两种精制部件；帽子另有“不戴帽子”。
- 三个现有警察形象不重新上锁；换装不改变打字规则、追捕速度或星级标准。
- 成功抓捕经验 20–35，失败不增加、不扣除；同一局仅发放一次；自动演示模式不发放。
- 等级累计经验门槛为 0、60、150、280、450、660；解锁对应关系以 Spec 表格为准。
- 原 kc-best 和 kc-settings 数据不被成长模块重写。
- 用户认可人物样板后再扩充物品、接入完整成长闭环；素材不合格时明确报告，不能以粗糙拼接交付。
- 未经用户要求不推送、不发布，不替换 /Applications 中的应用。

## Review Focus

1. 两种脸型、帽子和发型组合：没有双重五官、悬浮部件或帽外穿出的头发，保留合理的侧发。
2. 奖励边界、重复结算和演示：准确率按实际比例计算，重复调用零增量，演示不改变存档。
3. 旧存档、未知物品、损坏数据和存储失败：游戏可启动，基础人物可用，写入失败明确提示。
4. 未解锁试穿、取消和预设：预览不污染已保存搭配，预设不偷偷解锁其中的单件。
5. 原生 WebKit、最小窗口和反复开关衣柜：键盘仍可用，按钮可达，渲染资源不持续增长。

---

## Task 1：模块化人物与可运行的视觉样板

**Files:**
- Create: `scripts/build_wardrobe_assets.py`
- Create: `web/assets/wardrobe/parts.json`、`web/assets/wardrobe/README.md` 及必要模型资源
- Create: `web/wardrobe-catalog.mjs`、`web/wardrobe-character.js`
- Create: `web/wardrobe-sample.html`、`web/wardrobe-sample.js`
- Create: `tests/wardrobe-assets.py`、`tests/wardrobe-sample.cjs`
- Modify: `web/world.js`（仅新增组装接口，不改变现有预设行为）

**Interfaces:**
- Catalog exports: `CATEGORIES`、`ITEMS`、`DEFAULT_OUTFIT`、`compatibilityIssues(outfit)`；物品结构 `{id, category, label, requiredXP, resource, compatibility}`；搭配是十分类到物品 ID 的映射。
- `createWardrobeCharacter(baseGLTF, outfit)` 返回与当前 `makeCharacter` 一致的 `{root, model, mixer, actions, head, torso}`，并包含 `dispose()`。
- `applyOutfit(character, outfit)` 替换对应部件，不改变原骨架、动画列表和角色尺度。
- `compatibilityIssues(outfit)` 返回可显示原因的数组；空数组表示已支持的组合。

- [ ] Step 1：先写资产和浏览器样板测试。资产测试验证服装部件保留合法的 joint 索引和归一化权重；组装后头部、服装和脚部非空，动画没有非有限坐标。浏览器测试验证替换发型/脸型后旧部件消失，所有十分类可操作，原三种警察仍正常显示。
- [ ] Step 2：运行 `python3 tests/wardrobe-assets.py` 和 `node tests/wardrobe-sample.cjs`，确认因缺少模块化人物和样板失败，记录失败原因。
- [ ] Step 3：检查原 GLB 的坐标、joint 权重、UV 和连通网格；生成具名可替换部件，保留服装连接边界和关节权重。无法安全拆分的头部/五官必须整体重制成适配原骨架的新部件，不能在旧五官上覆盖新五官。记录来源、分类规则和资产验证结果。
- [ ] Step 4：实现上述 Catalog 与 Character 接口；帽内发型使用明确的兼容变体，服装有真实轮廓/细节差异。共享静态几何/材质；自有资源可清理，不释放原预设共用资源。
- [ ] Step 5：制作样板页面：十分类按钮、全身/面部视角、人物旋转、站立/跑步、三个现有预设对照，并能在三种现有场景查看人物。使用真实组装结果，不能用生成图片替代运行画面。
- [ ] Step 6：重跑资产/样板测试。将所有帽子×发型×脸型组合以及两种五官组合拍摄近景，检查每一项五官位置、穿模和接缝；抽查服装全部八种搭配的站立、跑步和转身姿势。
- [ ] Step 7：对三个场景分别检查追逐与抓获近景，保存关键截图到 `docs/wardrobe-review/`。若原素材无法达到标准，保留检查证据，报告具体限制，不继续用劣质模型接入成长系统。
- [ ] Step 8：运行 `git diff --check`，本地提交 `feat: add modular police wardrobe sample`；向用户展示可运行样板与截图，等待人物视觉验收。**这是已确认 Spec 的视觉验收点；未获认可不进入 Task 2。**

## Task 2：成长规则、解锁与可靠存档

**Files:**
- Create: `web/progression.mjs`
- Create: `tests/progression.test.mjs`
- Consumes: Task 1 的 `ITEMS`、`DEFAULT_OUTFIT`、`compatibilityIssues(outfit)`。

**Interfaces:**
- `captureReward({win, correct, wrong, maxCombo, demo})` 返回 `{total, accuracyBonus, comboBonus}`。
- `levelForXP(xp)` 返回 `{level, currentThreshold, nextThreshold}`，最高等级 `nextThreshold=null`。
- `normalizeProgress(raw)` 返回 `{version:1, xp, unlocked, outfit, awardedRounds}`，解锁由有效 XP 重算。
- `awardCapture(progress, roundId, stats)` 返回 `{progress, reward, newlyUnlocked, changed}`，同局或演示 `changed=false`。
- `loadProgress(storage)`、`saveProgress(storage, progress)`：key 固定 `kc-progress-v1`；保存返回 `{ok,error}`，失败不抛到游戏主循环。
- `canEquip(outfit, progress)` 返回 `{ok,reasons}`。

- [ ] Step 1：写测试并运行 `node --test tests/progression.test.mjs`；确认功能缺失导致失败。精确断言：89/100→20、90/100→25、96/100→25、97/100→30；连击20额外5；失败/演示→0；重复局奖励零增量；从50到85跨过60解锁对应两物品；从140到175只解锁应达到的门槛。
- [ ] Step 2：实现奖励和等级接口；拒绝非有限、负数及不合法统计值。最高等级不出现除零进度。
- [ ] Step 3：扩充并先运行存档测试：null、损坏 JSON、NaN/负经验、未知物品、伪造未解锁搭配回退；老 settings/best 不变；存储抛错返回失败；局标识列表最多100个。
- [ ] Step 4：实现校验、存储和幂等结算。缺失单部位仅回退该部位，未解锁和不兼容穿搭回到有效基础款。验证试穿未解锁部件不能穿戴，预设使用不会修改 XP/解锁。
- [ ] Step 5：完整运行 `node --test tests/progression.test.mjs`，本地提交 `feat: add capture experience and wardrobe unlocks`。

## Task 3：衣柜交互与同源 3D 预览

**Files:**
- Create: `web/wardrobe-ui.js`、`web/wardrobe.css`
- Create: `tests/wardrobe-ui.cjs`
- Modify: `web/index.html`、`web/game.js`、`web/world.js`
- Consumes: Task 1 Character/Catalog 与 Task 2 Progress 接口。

**Interfaces:**
- `createWardrobeUI({container, progress, onSave, onCancel})` 返回 `{open(progress), close(), resize(), dispose()}`。
- UI 维护 draft；`onSave(outfit)` 只接收已解锁、兼容的搭配；`onCancel()` 不提交任何外观变化。
- `World.setCustomOutfit(outfit)` 使用同一 `createWardrobeCharacter`，菜单“我的警察”与原三预设共存。

- [ ] Step 1：先写并运行 UI 测试，验证锁定物品可试穿但保存禁用；改变两个部位后取消/按Esc不会改变存档；有效保存后刷新仍存在；切回经典预设仍免费。
- [ ] Step 2：实现衣柜入口、等级进度、十类物品卡、解锁门槛提示、试穿标识、旋转/全身/近景/动画控制和保存取消。实际预览来自 Character 模块，旋转控制支持键盘。
- [ ] Step 3：为衣柜增加独立状态，主游戏 keydown 在衣柜状态只处理必要快捷键，不能全局 preventDefault 阻止 Tab 或按钮操作。打开时暂停追捕；第一版入口只在菜单，关闭回到菜单。
- [ ] Step 4：处理初始化/预览失败和存储失败，在界面显示具体状态；写入失败保留当前会话外观并提示未保存。关闭衣柜暂停预览循环，再次打开复用或清理资源。
- [ ] Step 5：测试 960×620 和1280×800 下按钮可达、近景清楚。反复打开/关闭20次，检查没有重复 canvas/事件订阅、角色累计或持续增加的渲染资源。
- [ ] Step 6：重跑 UI 和样板测试，检查五个 Review Focus 对应行为，本地提交 `feat: add interactive police wardrobe`。

## Task 4：抓捕结算与成长展示闭环

**Files:**
- Modify: `web/game.js`、`web/index.html`、`web/wardrobe.css`
- Create: `tests/wardrobe-game.cjs`
- Consumes: `awardCapture`、`saveProgress`、`levelForXP`、UI/World 接口。

- [ ] Step 1：先写端到端测试：实际键盘完成抓捕后经验增加20–35；结果页反复返回不追加；重试新局可奖励；失败不奖励；demo自动抓捕不写经验；跨门槛新物品可保存穿戴。
- [ ] Step 2：运行 `node tests/wardrobe-game.cjs`，确认尚未接入经验而失败。
- [ ] Step 3：每次开始生成新的 roundId。showResult 成功时调用幂等结算并保存；失败不发放。演示标记必须在 startGame/快进之前确定。保存错误只影响持久化提示，不阻断结果页。
- [ ] Step 4：展示基础、准确率、连击经验明细、等级进度和集中解锁提示，不删改当前成绩指标。菜单根据当前存档更新衣柜进度和“我的警察”卡。
- [ ] Step 5：完整运行成长单元测试和所有浏览器测试（渲染测试串行执行，避免并行 GPU 初始化超时）。本地提交 `feat: connect wardrobe progression to chase results`。

## Task 5：交付和原生验证

**Files:**
- Modify: `README.md`、`App/main.swift`（仅扩展开发自检，如有必要）
- Create: `docs/wardrobe-review/verification.md` 和最终效果截图。

- [ ] Step 1：复核 Spec 逐项覆盖，填写样板视觉确认、自动化、浏览器、原生、Intel实机、安装、远端发布的独立状态。
- [ ] Step 2：串行运行 `python3 tests/wardrobe-assets.py`、`node --test tests/progression.test.mjs`、`node tests/wardrobe-sample.cjs`、`node tests/wardrobe-ui.cjs`、`node tests/wardrobe-game.cjs`、`node tests/customization.cjs`、`node tests/scene-combinations.cjs`；报告所有失败，不修改已有测试以迁就实现。
- [ ] Step 3：运行 `./build.sh`、`codesign --verify --deep --strict 'dist/键盘小警察.app'`，核对 arm64/x86_64 二进制和所有人物资源已打包。
- [ ] Step 4：在最终 WKWebView 应用中打开衣柜，真实操作试穿/保存/取消，并用实际键盘追捕。自检按状态等待加载/倒计时完成，设置有界超时，不能仅凭固定延时或代码阅读认定成功。
- [ ] Step 5：保存原生画面和状态证据，复查五官、帽发、衣服接缝与抓获镜头；若窗口截图空白，核对 WKWebView 快照和实际状态，不忽略问题。
- [ ] Step 6：运行 `git diff --check`，本地提交文档与验证记录，提供可运行新版、截图和验证结果。保留用户是否替换已安装应用、是否推送/发布的授权边界。

## 执行记录

2026-10-11：用户明确要求写好计划后连续实施至测试完成，覆盖下述中途视觉暂停。Tasks 1–5 已实现并完成素材、单元、浏览器、通用 App 构建、签名和 Apple 芯片原生验证。实际结果及 Intel 实机、安装和发布边界见 [验证记录](../../wardrobe-review/verification.md)。

## 执行方式与停点

建议在当前会话由主代理直接执行，任务之间按接口顺序推进；无需并行子代理。计划审阅后先执行 Task 1，达到真实可运行样板并让用户验收人物视觉；用户认可后按 Task 2–5 完成系统。若人物资产质量或动画兼容性不达标，返回 Task 1 修正，不以功能测试通过替代视觉验收。
