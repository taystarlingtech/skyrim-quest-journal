# Quest Journal

A personal quest journal for [Todoist](https://todoist.com). It borrows the shape of the quest menu from *The Elder Scrolls V: Skyrim*: a ledger of quests on the left, the tale and its objectives on the right, and a date written in the Tamrielic calendar. Checking an objective completes that task in Todoist.

This is an unofficial fan project. It is not affiliated with Bethesda, ZeniMax, or Doist.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Bind your tasks

The journal opens on a vision — sample quests — until it has a Todoist token. You do not need to paste that token into a chat, and it is never written into the site.

1. In Todoist, open **Settings → Integrations → Developer**.
2. Copy the API token.
3. In the journal, open **System** and choose **Bind journal**.

The token stays in that browser (`localStorage`) and is sent only to Todoist. **Forget token** removes it. Anyone with the token can read and complete your tasks.

## GitHub Pages

Pages has no server, so the journal is a static site and talks to Todoist from the browser. Pushing `main` runs `.github/workflows/pages.yml`, which publishes the `out` folder.

1. Create a public GitHub repository (a free account can serve Pages from a public repo) and push this project to `main`.
2. In the repository, open **Settings → Pages → Build and deployment**, and choose **GitHub Actions**.
3. Open the Pages URL on your phone and bind the token under **System**. It remains on that device until you forget it.

A repository named `username.github.io` is served at the domain root. Any other name is served at `https://username.github.io/<repository>/`.

## How the pages map

| Journal | Todoist |
| --- | --- |
| Hold | Project |
| Quest | Task |
| Objective | Subtask, or the task itself when it has none |
| Seal | Complete task |
| Show on map | Open the task in Todoist |

**General Stats** shows your Todoist name and karma as renown, plus open quests, overdue work, and a count of tasks sealed today and in the last 30 days.

## Keys

On the Quests page:

- **↑ / ↓** move through the ledger
- **Tab** marks the selected quest active
- **E** opens the task in Todoist
- **Enter** seals the next open objective
- **R** reads the tablets again
- **1 / 2 / 3** switch Quests, General Stats, and System

The footer hints are buttons as well.

## Tests

```bash
npm test
```
