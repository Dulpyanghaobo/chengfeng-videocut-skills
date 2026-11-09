---
name: adas-series-intro
description: 复用辅助驾驶系列的标准开头1，制作同价购车、两年升级分化、公开论文、芯片感知算法执行四维与S/A/B/C/D五档框架的竖屏二维动画。
---

# 辅助驾驶系列标准开头 1

这是 `common` 的独立动画资源 Skill，可供配画面任务引用；不创建剪辑工程或替代 Studio。用户要求这个固定开头时直接复用，不必重新搭场景。适用范围是本模板的十句语义，其他叙事另作场景。

以本文件目录为 `<模板>`。默认 1080×1920 / 60fps / 16.333秒，节奏来自用户提供的字幕；第一句未给起点，按 0 秒处理。核心文件：

- [assets/config.json](assets/config.json)：十句字幕、起止秒数、颜色、字幕开关。每条 cue 绑定一处语义；调整时间时保持连续并覆盖整段。
- [assets/scene.js](assets/scene.js)：单一纯帧 SVG 渲染函数，所有运动来自相对秒数；浏览器和导出共用。无品牌示意车、硬件边界、流动网络和矩阵都是二维原创图形。
- [references/storyboard.md](references/storyboard.md)：逐段动作、截图使用依据与事实边界。

先复制 `assets/` 到本次项目，再按实际字幕校准 config。保留公共模板的默认文稿；只改本次副本。渲染本次配置：

```sh
node "<模板>/scripts/check.cjs"
node "<模板>/scripts/render.mjs" --config "<本次目录>/config.json" --out "<本次目录>/output"
```

渲染复用同仓 `automotive-video/node_modules` 中的 `@resvg/resvg-js`，还需 FFmpeg/FFprobe 在 PATH。缺少时说明依赖，不自动改变插件安装。`--width 540 --fps 30` 可快速预览；默认产出高清静音动画 MP4、实际解码抽帧、联系表与 `verification.json`。MP4 不带透明通道。查看抽帧后如实记录视觉结论；无音频就不声称听感通过。

`index.html` 是被动模块，接收 `videocut:seek` 的相对 `time`（秒），也暴露 `window.ready` / `window.seekTo(time)`，不自播。HTTP 提供复制后的目录即可预览固定帧；相同时间任意顺序 seek 应得到相同画面。

接入真实剪辑工程前，使用当前已安装的 `chengfeng-visual` / 工作台 Skill 的就绪检查、Product readback、cue 绑定与审核合同；将实际字幕的相对时间写入本次 config，再通过原生接口添加模块。已剪辑、字幕或层时长改变后，重新校准 config；模板不会根据 `duration` 自动拉伸，也不会根据旁白猜 cue。没有真实项目时只交付独立动画，不伪造 `visuals.json`、revision 或确认。

保留深色底、青蓝/琥珀对照与四维颜色体系，优先修改配置。连续动作承担含义：上路继续前进、下路遇硬件边界、文献扫读、四维运转、五档分级填充。保持“可能受限”的条件表述；论文默认仅为标注过的文献示意，五档填充是框架，均不是真实测试或车企评分。需要具体车型或真实论文时，先提供/核验素材及出处再替换；不要复刻截图的手机、评论、头像和平台界面。
