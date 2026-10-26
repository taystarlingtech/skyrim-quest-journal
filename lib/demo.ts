import { buildJournal } from "./quests"
import { shiftISODate, todayISO } from "./tamriel"
import type { JournalData, RawProject, RawSection, RawTask } from "./types"

const ZONE = "America/New_York"

function task(partial: Partial<RawTask> & Pick<RawTask, "id" | "content" | "projectId">): RawTask {
  return {
    description: "",
    sectionId: null,
    parentId: null,
    priority: 1,
    labels: [],
    order: 0,
    completed: false,
    url: null,
    due: null,
    ...partial,
  }
}

export function createDemoJournal(now = new Date()): JournalData {
  const today = todayISO(now, ZONE)
  const yesterday = shiftISODate(today, -1)
  const tomorrow = shiftISODate(today, 1)
  const nextWeek = shiftISODate(today, 6)

  const projects: RawProject[] = [
    { id: "demo-west", name: "The Western Hold", order: 0, inbox: true, parentId: null },
    { id: "demo-prep", name: "Preparations", order: 1, inbox: false, parentId: null },
  ]

  const sections: RawSection[] = [
    { id: "demo-heart", name: "The Heart", projectId: "demo-prep", order: 0 },
    { id: "demo-road", name: "The Road", projectId: "demo-prep", order: 1 },
  ]

  const tasks: RawTask[] = [
    task({
      id: "demo-wizard",
      content: "Speak with the court wizard",
      projectId: "demo-west",
      priority: 4,
      order: 1,
      labels: ["court"],
      due: { date: today, string: "today", isRecurring: false, datetime: null },
      description:
        "The court wizard has written for help. A stone tablet lies in an old barrow north of the city, and he believes the carving maps places where dragons once slept. He wants it read before the jarl's patience thins.",
    }),
    task({
      id: "demo-wizard-tablet",
      content: "Find the buried tablet",
      projectId: "demo-west",
      parentId: "demo-wizard",
      order: 1,
    }),
    task({
      id: "demo-wizard-return",
      content: "Bring the tablet to the wizard",
      projectId: "demo-west",
      parentId: "demo-wizard",
      order: 2,
    }),
    task({
      id: "demo-banner",
      content: "Hang the new banner in the hall",
      projectId: "demo-west",
      order: 2,
    }),
    task({
      id: "demo-wolves",
      content: "Clear the wolves on the north road",
      projectId: "demo-west",
      priority: 3,
      order: 3,
      due: { date: yesterday, string: "yesterday", isRecurring: false, datetime: null },
    }),
    task({
      id: "demo-debt",
      content: "Settle a debt at the tavern",
      projectId: "demo-west",
      priority: 2,
      order: 4,
      labels: ["coin"],
    }),
    task({
      id: "demo-watch",
      content: "Stand the night watch",
      projectId: "demo-west",
      order: 5,
      due: { date: tomorrow, string: "tomorrow", isRecurring: true, datetime: null },
    }),
    task({
      id: "demo-barrow",
      content: "Open the barrow under the hill",
      projectId: "demo-prep",
      sectionId: "demo-heart",
      priority: 2,
      order: 1,
    }),
    task({
      id: "demo-stone",
      content: "Calm the stone creature",
      projectId: "demo-prep",
      sectionId: "demo-heart",
      order: 2,
    }),
    task({
      id: "demo-stone-name",
      content: "Find its name",
      projectId: "demo-prep",
      sectionId: "demo-heart",
      parentId: "demo-stone",
      order: 1,
      completed: true,
    }),
    task({
      id: "demo-stone-speak",
      content: "Speak the name aloud",
      projectId: "demo-prep",
      sectionId: "demo-heart",
      parentId: "demo-stone",
      order: 2,
    }),
    task({
      id: "demo-lessons",
      content: "Finish the lessons left on the desk",
      projectId: "demo-prep",
      sectionId: "demo-road",
      order: 3,
    }),
    task({
      id: "demo-courier",
      content: "Meet the courier at the gate",
      projectId: "demo-prep",
      sectionId: "demo-road",
      order: 4,
    }),
    task({
      id: "demo-restless",
      content: "Quiet the restless dead",
      projectId: "demo-prep",
      priority: 3,
      order: 5,
    }),
    task({
      id: "demo-paladin",
      content: "Seek the lost paladin",
      projectId: "demo-prep",
      priority: 4,
      order: 6,
      due: { date: nextWeek, string: "in 6 days", isRecurring: false, datetime: null },
      description:
        "Last seen on the northern road. The watch left a short note: *bring a cloak*, and do not travel after dark.",
    }),
  ]

  return buildJournal({
    mode: "demo",
    tasks,
    projects,
    sections,
    adventurer: { name: "Traveler", karma: 3200, timezone: ZONE },
    completedToday: 2,
    completedThisMoon: 17,
    now,
  })
}
