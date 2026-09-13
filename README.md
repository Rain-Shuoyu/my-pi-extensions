# Pi Extensions

本仓库管理全局 Pi extensions：

- `skill-manager/`：管理 skill 的自动、手动和禁用状态。
- `statusline/`：提供带颜色和上下文进度条的双行状态栏。

## 当前安装方式

Pi 的全局扩展目录通过软链接指向本仓库：

```text
~/.pi/agent/extensions/skill-manager -> ~/pi-extensions/skill-manager
~/.pi/agent/extensions/statusline -> ~/pi-extensions/statusline
```

修改源码后，在 Pi 中执行 `/reload` 即可重新加载。

## Git 操作

```bash
cd ~/pi-extensions
git status
git diff
git add .
git commit -m "describe the change"
git log --oneline
```

需要同步到远程仓库时：

```bash
git remote add origin <url>
git push -u origin main
```

## 新机器安装

```bash
git clone <url> ~/pi-extensions
mkdir -p ~/.pi/agent/extensions
ln -s ~/pi-extensions/skill-manager ~/.pi/agent/extensions/skill-manager
ln -s ~/pi-extensions/statusline ~/.pi/agent/extensions/statusline
```

Pi 运行配置和 skill 状态保留在 `~/.pi/agent/`，不属于本仓库。
