# Pi Startup Page

全局 Pi 启动页扩展，替换默认 Header，显示块状 Banner、已发现的 extension，以及策略为自动激活的 skill。

- 每个 extension 和 skill 独占一行。
- 列表按名称排序。
- 长列表会根据终端高度截断并显示剩余数量。
- `quietStartup: true` 关闭 Pi 内置的 `[Skills]` / `[Extensions]` 摘要，避免重复显示。
- `/builtin-header` 恢复 Pi 内置启动页。
- `/reload` 重新加载扩展。

全局加载路径：

```text
~/.pi/agent/extensions/startup-page -> ~/pi-extensions/startup-page
```
