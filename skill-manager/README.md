# Pi Global Skill Manager

全局管理 Pi skill 的激活策略。

## 安装

本目录位于 `~/.pi/agent/extensions/skill-manager/`，Pi 会自动发现其中的 `index.ts`。重启 Pi 后执行：

```text
/skills
```

## 三种状态

- `自动激活`：模型可以根据任务自动激活。
- `仅手动激活`：不会自动激活，但可以使用 `/skill:name`。
- `完全禁止`：自动和手动调用都会被拒绝。

回车选择 skill 后进入状态选择；也可以使用搜索入口。配置保存于：

```text
~/.pi/agent/skill-manager.json
```

未写入配置的 skill 默认是“自动激活”。保存后执行 `/reload`。已经写入当前会话上下文的 skill 无法被追溯删除，必要时请新建会话。
