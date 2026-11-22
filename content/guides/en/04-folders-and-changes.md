# 4 · Working folders and changes

Bots read and write files and run commands in a **working folder**. Each topic has its own folder, and every change can be reviewed line by line, commented on, discarded or committed in the **changes panel**.

On this page:

- [Choose a working folder](#choose-a-working-folder)
- [Writable folders and read-only references](#writable-folders-and-read-only-references)
- [Automatic check commands](#automatic-check-commands)
- [The changes panel](#the-changes-panel)
- [Independent review by another Bot](#independent-review-by-another-bot)
- [Commit](#commit)
- [Git](#git)
- [Separate workspaces](#separate-workspaces)
- [Where deliverables go](#where-deliverables-go)

## Choose a working folder

A new topic starts in the **Bot's own folder** (for groups, **The group's own folder**). To have the Bot work in your project:

1. Click the folder name at the top of the chat (for example "Bot's own folder").
2. In **Folders of this chat**, choose:
   - **Choose another folder…**: pick an existing folder as the main folder.
   - **New folder…**: create an empty folder.
   - **Recently used**: folders used before; switch back in one click, or **Add as read-only reference**.
3. The folder name now shows at the top of the chat.

![Folder menu](../images/en/folder-menu.png)

In a new topic you can change the folder any time before the first message. Folders belong to topics, so different topics of the same Bot can work in different projects.

If you paired a runner (another computer or server), the menu also has **Choose a folder on a runner…**; see [10 · Runners](10-runners.md).

## Writable folders and read-only references

![Add read-only references from the working-folder menu](../images/en/folder-menu.png)

A topic can use several folders:

- **Main folder**: read and write (still within your permissions).
- **Add writable folder…**: another folder the Bot may write, for example when frontend and backend live in two repositories.
- **Add read-only reference…**: the Bot can read but not change it; good for material, designs or other projects.

The main folder and read-only references must be on the same device.

## Automatic check commands

The lower part of the folder menu is **Automatic check commands** (tests, type checks and so on; one per line, up to 3). The first time a Bot finishes changing code in a folder, it looks at the project files and proposes commands; they're saved once you confirm. After that the Bot runs them automatically after changing code; if they fail, the output goes back to the Bot to fix, and after a few rounds without passing it stops and asks you to look. The commands still go through the Run commands permission.

You can also click **Set commands** to write your own, or choose **Don't check this folder**. Commands are stored on the folder and shared by every chat and Bot working in it.

## The changes panel

When a Bot changes files, the **Changes** button at the top of the chat shows a count. Click it to open the panel.

![Changes panel](../images/en/changes-panel.png)

- **Which changes**: **Uncommitted** (everything not yet committed in the folder), **This turn** (what this run changed), **History** (the latest 50 commits).
- **File list**: each file is marked added, modified or deleted with line counts; generated and dependency files are folded separately, since they rarely need line-by-line review. You can filter files and switch the layout.
- **Line by line**: click a file to see its diff.

![Diff](../images/en/changes-diff.png)

In the diff you can:

- **Comment**: click a line number, or hover a line and click "+"; Shift-click another line to select a range; the comment button at the top comments on the whole file. Comments are collected and sent to the Bot together.
- **Discard block**: undo one block of changes.
- **Expand**: show unchanged lines above, or **Show all**.

## Independent review by another Bot

The top of the changes panel has an **Ask … to review** button. Reviews are read-only: the reviewer only sees these changes and the folder, and can't edit files or run commands that change anything.

The arrow next to the button chooses the reviewer:

![Choose who reviews](../images/en/review-picker.png)

- The list recommends a Bot on a different model or with the Code Reviewer role; if there's none you can **Create** a code reviewer right there.
- The Bot that wrote the code can also review in a fresh read-only context, though it may miss its own mistakes.
- With **Remember** checked, this Bot's code goes to the chosen reviewer from now on.

The review result arrives as a message in the chat, listing the problems found (security, bugs, suggestions) and what wasn't covered; the panel shows the review status and offers **Review again**.

## Commit

If the working folder is a Git repository, you can commit from the changes panel:

1. Write a **Commit message**, or click **Let … write it** to have the Bot draft one from the changes.
2. Check the files to include (all by default).
3. Click **Commit**.

![Commit message](../images/en/commit-message.png)

Afterwards the panel shows that nothing is uncommitted, plus the current commit:

![Commit done](../images/en/commit-done.png)

Notes:

- Committing here doesn't run the repository's pre-commit checks (Git hooks). Commit in a terminal if you need them.
- The commit uses the author from your computer's Git configuration.
- Push, branches and pull requests are done with Git or GitHub.
- If a background command is still running in this folder, stop it before committing.

## Git

Seeing all uncommitted changes, discarding and committing, and running several group steps at the same time all need Git.

- **Windows**: the installer includes Git, unpacked the first time it's needed; nothing else to install.
- **macOS and Linux**: when the computer has no Git, a **Pi Bot needs to install Git** card appears where a feature needs it (the changes panel, parallel group steps), with why, what it does and where it goes. After you click **Install**: on macOS, Apple's Command Line Developer Tools installer opens, where you click **Install**; on Linux, the detected system package manager installs it (the card shows the exact command) and the system asks for an administrator password. Git goes to a system location every program can use. This runs outside the sandbox, only after you click **Install**, and is written to the Log.
- **Not now** skips it: the changes panel shows only each turn's changes, and parallel group steps take turns.
- If the install fails, the card says why; click **Try again**, or install it yourself as the card suggests and click **Check again**.

## Separate workspaces

**Separate workspaces** at the top of the changes panel creates a separate workspace for a Git project, so the Bot can work there without touching the main project, and integrate the result back afterwards. Integration only takes committed work; uncommitted files in the main project or the workspace need handling first. On macOS, group development steps that run at the same time use separate workspaces automatically; on Windows and Linux, and without Git, they take turns in the group's folder instead (see [6 · Group chats](06-groups.md#tasks-panel-and-plans)).

## Where deliverables go

Reports, change notes and other deliverables a Bot writes go under `.pibot/out/` in the working folder, one subfolder per task, for example `.pibot/out/contact-section/`.
