# 14 · FAQ and troubleshooting

On this page:

- [Models and keys](#models-and-keys)
- [Folders and commands](#folders-and-commands)
- [Approvals](#approvals)
- [Routines](#routines)
- [Runners and the phone](#runners-and-the-phone)
- [Other](#other)

## About Pi Bot

**What is Pi Bot?**
Pi Bot is a multi-agent desktop app that runs on your own computer. It supports macOS, Windows, and Linux. Bots can work together in a group, handle files, review code changes, and run routines. The desktop app works on its own, with optional Android and Runner pairing. See [Download Pi Bot](/download/) and [Multi-Bot group chats and handoffs](/guides/group-context/).

**Can Pi Bot work entirely offline?**
Configure Ollama on the same computer to keep model requests on that machine. Features that use the internet, such as web search and connected external apps, still need a network connection. See [Configure Ollama and local models](/guides/models-and-keys/#local-models-and-custom-gateways) and [Where your data goes](/guides/privacy-and-security/).

## Download and installation

**Which installer should I choose?**
Choose an installer from the [download page](/en/download/). On a Mac, use Apple menu → About This Mac to check whether it uses Apple silicon or Intel. Choose EXE for Windows, AppImage for Linux, and APK for Android. Install a Runner on a computer that will only execute delegated work.

**macOS says it cannot verify Pi Bot. What should I do?**
Apple has not notarized the macOS v0.0.1 release. If you downloaded it from this site and choose to proceed, try opening it first, then select Open Anyway under System Settings → Privacy & Security. See the [installation notes](/en/download/).

**What do I need to set up on first launch?**
Choose a working model. Onboarding offers OpenRouter, a ChatGPT plan, local Ollama, and your own API key. See [installation and first launch](/en/guides/getting-started/) and [model connection troubleshooting](/en/guides/models-and-keys/#troubleshoot-a-model-connection).

## Models and keys

**Save & test fails and says the key is invalid.**
Check that you copied the whole key (no extra spaces), that it belongs to this provider, and that the account still has balance or quota. A key just created in the provider's console can take a moment to become active. Paste the new key and **Save & test** again.

**Pi Bot can't reach the model provider.**
If your network needs a proxy, turn on **Use proxy** in Settings › General › Network proxy, enter the address and click **Test connection**. Pi Bot doesn't read the system proxy.

**My ChatGPT plan says "Usage limit reached".**
The plan's allowance is used up for now. Manage usage in ChatGPT, or save an API key in Settings › Models & API keys › OpenAI and switch the Bot to a model from the **OpenAI** group.

**The work receipt shows the cost as "Unknown".**
Some providers and custom gateways don't publish pricing, so Pi Bot doesn't estimate and shows how many requests had no pricing.

## Folders and commands

**The Bot says it can't read or write a folder.**
By default Bots read and write only in the topic's working folder. Files outside it ask first; for regular use, make it the main folder, **Add writable folder…** or **Add read-only reference…** from the folder menu at the top of the chat (see [4 · Working folders and changes](04-folders-and-changes.md)). Files in read-only references can't be changed.

**The Bot can't run commands.**
Check in order:

1. Is Run commands set to **Never** in Settings › Permissions (or on this Bot's Permissions tab)?
2. Is there an unanswered approval card in the chat (a count on **Inbox**)?
3. Linux: are `bubblewrap` and `socat` installed? When they're missing the Bot shows the install command; install and retry.
4. The sandbox blocked the command: the Bot explains why and can ask you to confirm running it once outside the sandbox. With **Strict sandbox** on, that option isn't offered.
5. Windows: every command needs your approval and can't be set to Always, because Windows doesn't support command isolation yet.

**I can't open the local preview server.**
Background commands Bots start can only listen on 127.0.0.1. Use **Open … in Bot browser** on the background command card, or open the address from the card in your own browser.

## Approvals

**An approval card says it expired.**
Approvals in a chat pause the task after 10 minutes without an answer; routine approvals are denied automatically after 24 hours. Send a message to let the Bot continue, or use **Run now** on the routine.

**I clicked Always allow and want to take it back.**
Review and revoke it on the Permissions tab of that Bot's profile.

## Routines

**A routine didn't run on time.**

- The computer was asleep: Settings › Routines › **Tasks missed while the computer sleeps** decides what happens (catch up, skip or ask).
- Pi Bot was quit completely: routines stop by default. Choose **After you quit Pi Bot: Keep running schedules** in Settings › Routines, or **Background only** in Settings › General › Startup so Pi Bot starts in the background when you sign in.
- **Pause after 7 days away** is on and you haven't opened Pi Bot for more than 7 days.
- The routine is disabled: check the switch on its card on the Routines page.

**A routine is stuck waiting for me.**
It's waiting for an approval. Handle it in the Inbox, or add **Preauthorizations for this routine**.

## Runners and the phone

**A runner shows as offline.**

- Make sure the machine is on and the runner is running: `pibot runner status`. On Linux you can also run `systemctl --user status pibot-runner`.
- Both ends must use the same relay, and **Allow paired devices to connect** must be on on the computer.
- The runner reconnects by itself when the network is back. While it's offline you can't pick its folders and steps waiting for it fail; retry once it's online, or switch to a local folder.

**The pairing code is invalid.**
Codes expire after 10 minutes and work once. Run `pibot runner pair` again on the runner and copy the whole code.

**The phone keeps showing "Computer offline".**
The computer must be on with Pi Bot running (closing the window is fine, quitting completely isn't), and **Allow paired devices to connect** must be on in Settings › Devices. If the phone uses a VPN, let Pi Bot bypass it, otherwise only the relay path works. Android battery saving can cut background connections: set the app's Battery setting to Unrestricted, or turn on **Stay connected**.

**A Bot doesn't reply while the computer is offline.**
That Bot doesn't have offline replies on, or its model can't run on the phone (subscription sign-ins, cloud provider credentials and custom request headers stay on the computer). Check on the computer under Settings › Devices › this phone › **When this computer is offline**.

## Other

**How do I change the language or use dark mode?**
Switch them right in your avatar menu, or in Settings › General › Language & appearance. The language setting changes menus and buttons only; Bots reply in the language you write to them in.

**Is Pi Bot still running after I close the window?**
Yes. It keeps running in the tray / menu bar and routines keep running. To quit completely, use **Quit completely** in the tray menu.

**Pi Bot says the system secret store is unavailable.**
Pi Bot encrypts keys with the system secret store. On Linux that needs a running keyring service (such as GNOME Keyring or KWallet); make sure you're in a desktop session, then restart Pi Bot.
