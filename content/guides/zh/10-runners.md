# 10 · 执行端：在另一台电脑或服务器上干活

**执行端（runner）** 是装在另一台电脑或服务器上的一个小程序。配对后，Bot 可以在那台机器的文件夹里读写文件、运行命令，而大脑（模型调用、聊天记录、权限判定）仍在你这台电脑上。

适合：代码和数据在一台常开的机器或服务器上，或者需要在 Windows / Linux 上跑命令。

本页内容：

- [安装执行端](#安装执行端)
- [配对](#配对)
- [让话题在执行端文件夹里工作](#让话题在执行端文件夹里工作)
- [执行端上的命令和审批](#执行端上的命令和审批)
- [管理和撤销](#管理和撤销)
- [命令行参考](#命令行参考)

## 安装执行端

从官网 [pibot.space](https://pibot.space) 下载执行端安装包。执行端版本号和桌面 Pi Bot 一致。

| 系统 | 形式 | 说明 |
|---|---|---|
| Windows | 安装程序 `.exe`（按用户安装，不需要管理员） | 托盘程序；把 `pibot` 命令加进用户 PATH；开始菜单有配对和状态入口；安装时可选「登录时自动启动」 |
| macOS | 托盘程序 | 菜单栏里可以看状态、配对、打开日志、退出 |
| Linux | `.deb` / `.rpm` | 命令行程序，装到 `/opt/pibot-runner`，命令为 `pibot`；需要 `bubblewrap` 和 `socat` |

Linux 上让执行端随用户登录常驻：

```sh
systemctl --user enable --now pibot-runner
```

> 截图待补：Windows / macOS 执行端托盘菜单。

## 配对

配对通过中继交换一次性配对码，之后两端端到端加密通信；能在同一局域网直连时会自动直连。

**在电脑上（Pi Bot）：**

1. 打开 设置 › 设备。
2. 打开「允许已配对设备连接」。开关下方说明了中继能看到什么（IP、连接时间、帧大小和在线状态，只转发端到端加密的数据，不保存聊天）。
3. 点「添加设备」›「另一台电脑 / 服务器」。

![添加设备](../images/zh/devices-add-menu.png)

**在执行端那台机器上：**

4. 复制电脑显示的配对码。在执行端托盘点「配对…」后粘贴，或运行 `pibot runner pair "<配对码>"`。码 10 分钟有效，只能用一次；「换一个」或收起卡片会让旧码作废。可以加 `--name "构建机"` 起名。
5. 自建中继地址已包含在码的 `@` 后，执行端自动使用并记住，无需另填。旧执行端仍可运行 `pibot runner pair` 显示本机码，再在电脑点「改为输入」。

![添加执行端](../images/zh/devices-add-runner.png)

配对成功后，执行端出现在 设置 › 设备 的「执行端」列表里，显示在线状态和连接方式（直连 · 局域网 / 直连 · 打洞 / 经中继）。两端必须用同一个中继（默认是官方中继）。

## 让话题在执行端文件夹里工作

有两种方式：

- **自己选**：点聊天顶部的文件夹名 ›「选择执行端上的文件夹…」，逐级浏览执行端上的文件夹，点「用这个文件夹」。执行端离线时这一项不可选。
- **Bot 提议**：Bot 发现要在执行端上做时，会发一张「… 提议换到执行端上工作」的卡片，写明目标执行端和文件夹。点「换过去」后，这个话题从下一条消息起在那个文件夹里工作（只读参考和追加的可写文件夹会清空）；点「不换」什么都不变。

执行端不能把它自己的数据目录、系统目录或磁盘根目录交给 Bot，请选下面的项目文件夹。一个话题的主文件夹和只读参考必须在同一台设备上。群聊也可以把群的文件夹设到执行端上。

## 执行端上的命令和审批

Bot 在执行端上跑命令、读写文件，和在本机一样经过你这台电脑上的权限判定和审批，审批卡上会标出是哪台执行端。

- **Linux / macOS 执行端**：命令在执行端的隔离环境里运行（Linux 需要 `bubblewrap`、`socat`，缺少时 Pi Bot 会提示安装命令）。
- **Windows 执行端**：Windows 上的命令没有系统隔离，每条命令都要你逐条批准。

执行端离线时，正在等它的步骤会失败并说明原因；等它重新连接，或改用本机文件夹。

## 管理和撤销

在 设置 › 设备 点一个执行端，可以改名、查看它能给 Bot 用的能力、撤销配对。

- **撤销配对**：撤销后这台执行端无法再连接。
- 如果执行端当时离线，撤销通知送不到，可以选「仍然移除」：本机信任立刻撤销，它无法再连接；执行端上仍保留自己的配对文件，到那台机器上运行 `pibot runner revoke` 清掉。

## 运行方式

**Windows / macOS（托盘）**：安装后托盘程序会启动执行端；菜单里可以看状态、配对、打开日志、退出。退出时托盘会先让执行端停止并等它退出；如果执行端已经不响应，托盘会核对进程后直接结束它，再退出。

**Linux（命令行）**：

```sh
pibot runner start                 # 前台运行，Ctrl+C 停止
pibot runner start --daemon        # 后台运行
pibot runner install-service       # 写入 systemd 用户服务（不立刻启动）
systemctl --user enable --now pibot-runner
loginctl enable-linger "$USER"     # 可选：退出登录后也保持运行
```

执行端的设备密钥优先存在系统的凭据存储里（macOS 钥匙串、Windows、Linux 的 Secret Service）。没有图形会话的 Linux 服务器上没有 Secret Service 时，改存成加密文件，需要一个口令：

- 交互运行时会提示输入口令。
- 后台或 systemd 运行时，把口令写进 `~/.config/pibot-runner/env`（权限设为 600）：

  ```sh
  mkdir -p ~/.config/pibot-runner
  printf 'PIBOT_RUNNER_PASSPHRASE=%s\n' '你的口令' > ~/.config/pibot-runner/env
  chmod 600 ~/.config/pibot-runner/env
  ```

  没给口令时执行端会停在 `passphrase_required`。

服务器有固定地址时，可以用 `--listen <IP:端口>`（可重复）让桌面直接连过来，少走中继。

## 使用自建中继

电脑给码，粘贴即可。码里包含已校验的中继地址，配对后会记住。若显式传 `--relay` 且与码不同会报错；无后缀的码沿用 `--relay` / 环境变量 / 官方中继。旧方式可用 `pibot runner pair --relay wss://relay.example.com`。

## 状态、日志和常见问题

- `pibot runner status` 看是否在运行、是否已配对、连接方式；加 `--json` 给脚本用。
- 数据和日志目录：macOS `~/Library/Application Support/Pi Bot Runner`；Windows `%LOCALAPPDATA%\Pi Bot Runner`；Linux `~/.local/share/pibot-runner`（或 `$XDG_DATA_HOME/pibot-runner`）。日志在其中的 `logs/<日期>.log`，托盘菜单的「打开日志」直接打开这个文件夹。
- 桌面显示执行端离线：先确认两端用的是同一个中继；再看执行端日志里有没有 `connection_failed`。
- `passphrase_required`：见上面的口令说明。
- 想换到另一台电脑配对：先在原来的 Pi Bot 里移除，再在执行端运行 `pibot runner pair`。

## 从源码运行

开源仓库里可以不打包直接运行（需要 Node，版本见仓库的 `.nvmrc`，以及 pnpm）：

```sh
pnpm install
node apps/runner/bin/pibot.mjs runner pair --data-dir ./runner-data
node apps/runner/bin/pibot.mjs runner start --data-dir ./runner-data
pnpm runner:package               # 打出当前平台的执行端安装包
```

## 命令行参考

```text
pibot runner start [--daemon] [--listen <IP:端口>]   启动（Linux 可用 --daemon 后台运行）
pibot runner stop                                   停止
pibot runner status [--json]                        查看状态
pibot runner pair [<code>] [--name <设备名>] [--relay <wss://…>]   生成一次性配对码
pibot runner revoke                                 删除本机的配对
pibot runner tray                                   启动托盘程序（Windows / macOS）
pibot runner install-service / uninstall-service    安装 / 卸载 Linux systemd 用户服务
pibot --version                                     版本号
```

环境变量：`PIBOT_DATA_DIR` 指定执行端数据目录；`PIBOT_RUNNER_RELAY` 指定中继（默认官方 `wss://relay.pibot.space`）；`PIBOT_RUNNER_PASSPHRASE` 用于无图形界面启动时解密本机凭据文件。
