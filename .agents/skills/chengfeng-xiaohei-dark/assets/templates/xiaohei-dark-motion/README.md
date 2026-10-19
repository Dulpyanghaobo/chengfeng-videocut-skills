# 暗黑动作模板（fork 改编）

原创工帽工人、深石墨舞台、浅色轮廓与少量琥珀动作色。隐喻为两个同规模工厂：工人松手投单，输入抵达后齿轮响应，处理后输出；上方间歇，下方持续。

`index.html` 是十秒独立示例，不含原声、字幕或真实设备证据；7B 与工厂订单数没有数量换算。不要把固定工厂版式套到所有题材。

- `worker-prototype.svg/png`：编码前角色三姿态设计。
- `prototype-state-a/b.svg/png`：编码前具体构图，虚线仅标记字幕安全区，不进入动画。
- `theme.mjs`：单一颜色源；`motion.mjs`：可测试的时间状态；`scene.mjs`：分层 SVG 绘制与 GSAP 暂停时间线。
- `preview.png`、`preview-mid.png`：实际浏览器渲染截图；`review.json`：实际检查范围与结论。
- `vendor/gsap.min.js`：上游随包 GSAP，保持原字节与许可；见 Skill 的 `UPSTREAM-NOTICE.md`。

用本地 HTTP 服务打开本目录。普通预览默认暂停；点击播放或拖动时间条。`?t=3` 定位，`?static=1` 查看结尾，`?embed=1` 仅显示 9:16 舞台。不要直接用 file:// 打开 ES modules。

导出时调用 `window.renderAt(seconds)`，可倒回、重复定位。示例另有 `videocut:seek` 时间接收点，默认嵌入不自播；这不是工作台接入验收。接入实际口播须替换 `motion.mjs` 的示例时刻为真实 cue，并核验层长、字幕、项目和提供方接口。

复用时复制整个目录，内含 LICENSE、NOTICE.md、UPSTREAM-NOTICE.md，须随输出保留。现有白底模板未修改。
