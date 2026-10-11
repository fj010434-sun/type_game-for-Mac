# 1.1.0 发布验收

2026-10-11。版本1.1.0，构建号2。

发布前新跑全套回归通过：4项Python素材检查、21项Node单元测试、10组浏览器回归（含2700个服装动作采样、36种头部组合、新素材20轮资源稳定及解锁边界）。

通用构建包含arm64和x86_64；签名校验通过。83个打包网页文件与源码哈希一致。ZIP重新解压后全部应用文件与构建一致，签名仍有效，中英文README与源码一致。

原生Apple Silicon运行本次发布构建，新装备真实按键抓捕24正确、0错误，经验1550→1585，装备保留，脚本错误为空，图形上下文未丢失。Intel只完成编译，未做Intel设备运行测试。

抓捕读回：
```json
{
  "xp": 1585,
  "outfit": {
    "hat": "hat-beret",
    "hair": "hair-curly",
    "face": "face-angular",
    "eyes": "eyes-focused",
    "brows": "brows-bold",
    "nose": "nose-bridge",
    "mouth": "mouth-grin",
    "shirt": "shirt-vest",
    "pants": "pants-knee",
    "shoes": "shoes-tactical"
  },
  "scene": "city",
  "officer": "custom",
  "copVisible": true,
  "state": "caught",
  "idx": 1,
  "line": "ddf lj;k ss sk;f ddf kjd;",
  "correct": 24,
  "wrong": 0,
  "gap": 1.4,
  "sfx": 16,
  "audio": "running",
  "errors": [],
  "visibility": "visible",
  "focused": true,
  "contextLost": false
}
```

ZIP SHA256：`2cf8cbdd7732919901b08ca57cdab105658167b07efe77672757d0d0f87f84cc`。
