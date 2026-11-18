# 16 · Using Pi Bot from your editor (ACP)

Editors that speak the [Agent Client Protocol (ACP)](https://agentclientprotocol.com), such as Zed, can put Pi Bot's Bots to work: what you type in the editor is handled by a Pi Bot Bot, and commands and approvals still go through Pi Bot's permissions on this computer.

## Connect

1. Open the desktop Pi Bot first (ACP connects to the running app; it does not start another one).
2. In the editor's ACP agent settings, set the command to the Pi Bot app with `--acp`:
   - macOS: `"/Applications/Pi Bot.app/Contents/MacOS/Pi Bot" --acp`
   - Linux: `pi-bot --acp` in the install folder (implemented, not yet verified on a real machine)
   - Windows: connecting to the running app is not supported yet and returns `attach_unsupported_platform`.

Common answers: `app_not_running` (Pi Bot is not open), `acp_busy` (another editor is already connected), `version_mismatch` (the editor started a different version from the one running).

## Choose a Bot

The editor's **mode** list is your Bots (and groups). A new session uses the ACP default Bot from Settings; switching the mode in the editor switches to another Bot. Each Bot keeps its own working folders, permissions and memory.

## Switch the model and thinking level from the editor

A session offers three settings (editors usually show them at the model picker):

| Setting | What it does |
|---|---|
| Model | The model this Bot uses. Same as switching it in the Bot's settings, so the Bot's other topics follow. |
| Thinking | This Bot's thinking level: Off / Low / Medium / High, listing only the levels the current model supports; hidden when the model has no thinking. |
| Pi Bot default model | The app-wide default model (Settings › Models), used by every Bot without its own model. When the default changes, the current thinking level is kept if the new model supports it, otherwise a level the new model can use is chosen. |

The lists only contain models of providers you have set up. Group sessions do not offer these settings (each member uses its own model).

## Development mode

In the open-source repository, `node apps/cli/bin/pibot.mjs acp` connects to a desktop app built from the same checkout; `acp --data <folder>` uses a private development data folder with credentials stored in plain text, for development and scripted checks only. See `apps/cli/README.md`.
