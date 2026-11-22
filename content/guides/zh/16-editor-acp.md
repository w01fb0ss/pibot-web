# 16 · 在编辑器里用 Pi Bot（ACP）

支持 [Agent Client Protocol（ACP）](https://agentclientprotocol.com) 的编辑器（如 Zed）可以直接用 Pi Bot 的 Bot 干活：编辑器里发的话由 Pi Bot 的 Bot 处理，命令执行和审批仍走 Pi Bot 在这台电脑上的权限。

反过来，把电脑上的 Codex、Claude Agent 等编程助手作为 Bot 加进 Pi Bot，见 [2 · Bot 与角色](02-bots-and-roles.md#外部-agent)。

## 连接

1. 先打开桌面 Pi Bot（ACP 连接的是正在运行的应用，不会另开一个）。
2. 在编辑器的 ACP agent 配置里，把命令设为 Pi Bot 本体加 `--acp`：
   - macOS：`"/Applications/Pi Bot.app/Contents/MacOS/Pi Bot" --acp`
   - Linux：安装目录里的 `pi-bot --acp`（已实现，尚未实机验证）
   - Windows：暂不支持连接到运行中的应用，会返回 `attach_unsupported_platform`。

常见返回：`app_not_running`（Pi Bot 没开）、`acp_busy`（已经有另一个编辑器连着）、`version_mismatch`（编辑器调用的不是正在运行的那个版本）。

## 选 Bot

编辑器的「模式」列表就是你的 Bot（和群）。新会话默认用 设置 里指定的 ACP 默认 Bot；在编辑器里切换模式就换成另一个 Bot。每个 Bot 用自己的工作文件夹、权限和记忆。

## 在编辑器里切换模型和思考强度

会话的设置项里有三项（编辑器一般显示在模型选择处）：

| 设置项 | 作用 |
|---|---|
| Model | 这个 Bot 用的模型。和在 Bot 设置里切换一样，Bot 的其他话题也会跟着变。 |
| Thinking | 这个 Bot 的思考强度：关 / 低 / 中 / 高，只列出当前模型支持的档位；模型不支持思考时不显示。 |
| Pi Bot default model | 全局默认模型（设置 › 模型），没有单独指定模型的 Bot 都用它。换默认模型时，原来的思考强度如果新模型支持就保留，否则换成新模型能用的档位。 |

下拉里只有已经配置好的厂商的模型。群会话不提供这些设置项（群里每个成员用自己的模型）。

## 开发模式

在开源仓库里可以用 `node apps/cli/bin/pibot.mjs acp` 连接同一 checkout 构建出的桌面应用；`acp --data <目录>` 是独占的开发数据目录，凭据明文保存，只用于开发和脚本检查。详见 `apps/cli/README.md`。
