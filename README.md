# Desktop Pet Maker

一个基于 Electron 的简单桌宠原型，支持：

- 在桌面边缘自动自由走动
- 左键拖拽移动位置
- 右键打开互动菜单
- 吃甜点、看书、休息等动作状态
- 可通过配置文件和素材文件替换桌宠形象
- 支持切换为 Live2D 模型渲染

## 运行

```bash
npm install
npm start
```

## 更换形象

项目已改成资源驱动皮肤系统，直接改 [pet.config.json](pet.config.json) 和 [assets/skins/mocha](assets/skins/mocha) 下的图片即可。

- `skin.mode`: `image` 使用图片形象，`css` 使用原来的 CSS 绘制造型。
- `skin.width` / `skin.height`: 控制桌宠显示尺寸。
- `skin.images.walk`: 散步状态图片。
- `skin.images.dessert`: 吃甜点状态图片。
- `skin.images.book`: 看书状态图片。
- `skin.images.rest`: 休息状态图片。

如果你只有一张立绘，也可以把四个状态都指向同一张透明背景图片。

## Live2D 模式

当前项目已经接入 Live2D 运行时，配置见 [pet.config.json](pet.config.json)。

- `skin.mode: "live2d"` 时会优先加载 Live2D 模型。
- `skin.live2d.model` 指向你的 `.model3.json` 文件。
- `skin.live2d.scale` / `offsetX` / `offsetY` 用来调模型在窗口里的位置和大小。
- `skin.live2d.actions` 可把菜单动作映射到模型的 motion group 或 expression。

首次使用时，你需要把自己的 Cubism 4 模型文件放到 [assets/live2d](assets/live2d) 下。当前配置默认指向 [assets/live2d/haru/haru.model3.json](assets/live2d/haru/haru.model3.json)，如果这个文件不存在，程序会自动回退到静态图片皮肤。

## 说明

- 使用透明无边框置顶窗口模拟桌宠悬浮在桌面上
- 自动行走由主进程控制窗口位置
- 互动动作由渲染进程控制表情、对白和道具显示