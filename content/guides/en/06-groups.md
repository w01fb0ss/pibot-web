# 6 · Group chats

Put several Bots in one group and a **coordinator** hands out the work: a Bot you @mention answers directly, the coordinator takes other messages and splits bigger jobs into a plan for the members. Groups use more model capacity (several Bots may process each message); most tasks only need a chat with one Bot.

On this page:

- [Create a group chat](#create-a-group-chat)
- [Giving work to a group](#giving-work-to-a-group)
- [Tasks panel and plans](#tasks-panel-and-plans)
- [Group profile and settings](#group-profile-and-settings)

## Create a group chat

1. Click "+" at the top of the sidebar › **New group chat** (⌘2 / Ctrl+2).
2. Pick a **group template**, or choose members yourself:
   - Templates: Content Studio, Lean Dev Team, Dev Squad, Growth Team, Product Team, Research Group, Study Group. You preview a template first; it then creates its Bots (with the default model and role permissions) and the group, and the coordinator posts a welcome message.
   - Your own: choose 2 to 6 Bots. Image Bots can be members; the coordinator must be a text Bot.
3. Enter the **Group name** and choose the **Coordinator**.
4. Click **Create group chat**.

![New group chat](../images/en/group-new.png)

A group also has its own working folder, **The group's own folder** by default. Click the folder name at the top of the chat to use your project folder instead (only the main folder is writable; references are read-only):

![Group folder](../images/en/group-folder.png)

## Giving work to a group

- Say what you need and the coordinator decides who does it, or @mention a member to have it answer directly.
- Groups have **Execute / Plan only** too. Let everyone analyse with Plan only, then click **Switch to execution**.
- The top of the group shows "Automatic rounds: N / 4": when Bots have replied to each other that many times, they stop and wait for you. You can also turn on **Pause automatic conversation**.
- Each member's run can be stopped on its own ("Stop this run by …").

![Group chat](../images/en/group-chat.png)

## Tasks panel and plans

Click **Tasks** at the top of the group to open the tasks panel:

![Tasks panel](../images/en/group-tasks.png)

- **Main tasks** and **Child tasks**: who is doing what, and whether it's in progress or waiting for you.
- **Finished tasks**.
- **Usage this time**: tools, model requests, run time and cost across all runs in this round (with a note when some requests have no pricing).
- **Group plan history**: earlier execution plans.

For complex work the coordinator first posts an **Execution plan** card: who does each step, which steps depend on which, which can run at the same time, the deliverables, and an estimated cost. Click **Start** to run it, or **Modify** to say what to change and send it back to the coordinator. Serial steps run in the group's main folder; parallel development tasks each use a separate workspace and are merged after the coordinator's review and your permission approval.

A plan whose steps all passed can be saved with **Save as a reusable plan** on its completion message and run again directly.

## Group profile and settings

Click the group name to open its profile panel, with Profile, Topics, Skills, Permissions and Settings tabs.

![Group profile](../images/en/group-info.png)

- **Group name**, **Coordinator**, **Automatic round limit**, **Announcement** (saved when you leave the box).
- **Members**: see members and add another Bot. Members' private chats are unaffected.
- **Used folders**, **Run limits (including the cost cap)**.
- **Skills**: a group can have its own skill list.
- **Permissions**: a group has its own permission scope, which can only narrow members' permissions, never widen them.
- **Archive**: stops the group's tasks and keeps chats and files; restore it from Archived in the sidebar.

## Example: hand off research to a writing Bot

1. Create a group with a coordinator, a researcher, and a writing Bot. Select the working folder for deliverables.
2. Start in Plan only. Say: “Have the researcher record findings and sources from the three documents in research.md. Have the writing Bot use that file to produce draft.md. Propose a plan with writing dependent on research.”
3. Check the assignees, dependencies, and paths on the plan card. Start the plan and open Tasks to follow each step.
4. When research finishes, open research.md and check the sources. If writing is still waiting, see whether the previous step needs review or approval.
5. Open draft.md from the group result. To supply missing information, quote the relevant result in the group and explain what to add.
