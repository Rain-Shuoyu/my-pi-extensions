# Pretty Statusline

全局 Pi footer 扩展，显示两行可读状态：

```text
↑ 347k  ↓ 27k    Requests 7.1M · Cache hit 99.4% · $0.612
Context usage  ████████████░░░░░░░░  55.1% / 272k       gpt-5.6-luna · medium
```

输入 token 为红色，输出 token 为绿色。上下文进度条在 80% 和 95% 处分别变为黄色和红色。扩展路径为 `~/.pi/agent/extensions/statusline/`，重启 Pi 或执行 `/reload` 后生效。
