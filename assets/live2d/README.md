# Live2D 模型目录

把你的 Cubism 4 模型放在这个目录下，例如：

```text
assets/live2d/haru/
  haru.model3.json
  haru.moc3
  textures/
  motions/
  expressions/
```

然后把 [pet.config.json](pet.config.json) 里的 `skin.live2d.model` 改成对应的 `.model3.json` 路径。

如果 motion group 名称不是 `Idle`，或者 expression 数量不同，也要同步修改 `skin.live2d.actions`。