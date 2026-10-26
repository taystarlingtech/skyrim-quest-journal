import assert from "node:assert/strict"
import test from "node:test"
import { createDemoJournal } from "./demo"
import {
  adventurerRank,
  buildJournal,
  isQuestOpen,
  sealQuest,
  setObjectiveCompleted,
} from "./quests"
import { pagesBasePath } from "./pages-base"
import { formatTamriel, shiftISODate, startOfZonedDay, todayISO } from "./tamriel"
import { parseProse, plainText, stripEmoji } from "./text"
import type { RawProject, RawTask } from "./types"

const now = new Date("2026-10-22T19:32:00.000Z")
const zone = "America/New_York"

test("formats the Tamriel date for a New York afternoon", () => {
  assert.equal(
    formatTamriel(now, zone),
    "Turdas, 3:32 PM, 22nd of Frostfall, 4E 201",
  )
})

test("finds the start of a New York day", () => {
  assert.equal(todayISO(now, zone), "2026-10-22")
  assert.equal(startOfZonedDay(now, zone).toISOString(), "2026-10-22T04:00:00.000Z")
  assert.equal(shiftISODate("2026-10-01", -1), "2026-09-30")
})

test("uses the repository name as the GitHub Pages base path", () => {
  assert.equal(pagesBasePath({}), "")
  assert.equal(pagesBasePath({ pages: "true", repository: "taylor/skyrim-quest-journal" }), "/skyrim-quest-journal")
  assert.equal(pagesBasePath({ pages: "true", repository: "taylor/taylor.github.io" }), "")
})

test("strips task markup down to readable words", () => {
  assert.equal(plainText("**Buy** [milk](https://example.com) today"), "Buy milk today")
  assert.equal(plainText("Make bed ✓ 🛏️"), "Make bed")
  assert.equal(stripEmoji("House 🔧\nNext line"), "House\nNext line")
  const segments = parseProse("Bring a *cloak*.\nThen wait.")
  assert.deepEqual(
    segments.map((segment) => segment.type),
    ["text", "italic", "text", "break", "text"],
  )
})

test("nests subtasks under quests and keeps overdue work", () => {
  const projects: RawProject[] = [
    { id: "inbox", name: "Inbox", order: 5, inbox: true, parentId: null },
    { id: "work", name: "Court", order: 1, inbox: false, parentId: null },
  ]
  const tasks: RawTask[] = [
    {
      id: "parent",
      content: "Speak with **Farengar**",
      description: "A letter.",
      projectId: "work",
      sectionId: "letters",
      parentId: null,
      priority: 4,
      labels: ["court"],
      order: 2,
      completed: false,
      url: "https://app.todoist.com/app/task/parent",
      due: { date: "2026-10-21", string: "yesterday", isRecurring: false, datetime: null },
    },
    {
      id: "child",
      content: "Find the tablet",
      description: "",
      projectId: "work",
      sectionId: "letters",
      parentId: "parent",
      priority: 1,
      labels: [],
      order: 1,
      completed: false,
      url: null,
      due: null,
    },
    {
      id: "errand",
      content: "Buy milk",
      description: "",
      projectId: "inbox",
      sectionId: null,
      parentId: null,
      priority: 1,
      labels: [],
      order: 1,
      completed: false,
      url: null,
      due: null,
    },
  ]

  const journal = buildJournal({
    mode: "live",
    tasks,
    projects,
    sections: [{ id: "letters", name: "Letters 🎉", projectId: "work", order: 1 }],
    adventurer: { name: "Taylor", karma: 3200, timezone: zone },
    completedToday: 1,
    completedThisMoon: 4,
    now,
  })

  assert.deepEqual(
    journal.quests.map((quest) => quest.id),
    ["errand", "parent"],
  )
  assert.equal(journal.outline[0]?.projectName, "Inbox")
  const parent = journal.quests.find((quest) => quest.id === "parent")
  assert.equal(parent?.plainTitle, "Speak with Farengar")
  assert.equal(parent?.overdue, true)
  assert.equal(parent?.objectives.length, 1)
  assert.equal(parent?.objectives[0]?.self, false)
  assert.equal(journal.outline[1]?.sections[0]?.name, "Letters")
  assert.equal(parent?.sectionName, "Letters")
  assert.equal(journal.stats.openQuests, 2)
  assert.equal(adventurerRank(3200).title, "Adept")
})

test("checking a lone objective seals the quest", () => {
  const journal = createDemoJournal(now)
  const banner = journal.quests.find((quest) => quest.id === "demo-banner")
  assert.ok(banner)
  assert.equal(banner.objectives[0]?.self, true)
  const next = setObjectiveCompleted(journal, banner.id, true)
  const sealed = next.quests.find((quest) => quest.id === "demo-banner")
  assert.equal(sealed?.questClosed, true)
  assert.equal(isQuestOpen(sealed!), false)
  assert.equal(next.stats.openQuests, journal.stats.openQuests - 1)
})

test("finished steps keep the quest open until it is sealed", () => {
  const journal = createDemoJournal(now)
  const tablet = setObjectiveCompleted(journal, "demo-wizard-tablet", true)
  const both = setObjectiveCompleted(tablet, "demo-wizard-return", true)
  const wizard = both.quests.find((quest) => quest.id === "demo-wizard")
  assert.equal(isQuestOpen(wizard!), true)
  assert.equal(both.stats.openQuests, journal.stats.openQuests)
  const sealed = sealQuest(both, "demo-wizard")
  assert.equal(isQuestOpen(sealed.quests.find((quest) => quest.id === "demo-wizard")!), false)
  assert.equal(sealed.stats.openQuests, journal.stats.openQuests - 1)
})

test("sealing a quest with steps marks every objective", () => {
  const journal = createDemoJournal(now)
  const sealed = sealQuest(journal, "demo-wizard")
  const wizard = sealed.quests.find((quest) => quest.id === "demo-wizard")
  assert.equal(wizard?.questClosed, true)
  assert.equal(
    wizard?.objectives.every((objective) => objective.completed),
    true,
  )
})
