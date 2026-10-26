import type {
  JournalData,
  JournalStats,
  Objective,
  OutlineGroup,
  Quest,
  RawProject,
  RawSection,
  RawTask,
} from "./types"
import { plainText, stripEmoji } from "./text"
import { todayISO } from "./tamriel"

export type BuildInput = {
  mode: "live" | "demo"
  tasks: RawTask[]
  projects: RawProject[]
  sections: RawSection[]
  adventurer: JournalData["adventurer"]
  completedToday: number | null
  completedThisMoon: number | null
  now: Date
  consultedAt?: string
}

export function isOverdue(
  due: RawTask["due"],
  now: Date,
  timeZone: string,
): boolean {
  if (!due) return false
  if (due.datetime) {
    const instant = Date.parse(due.datetime)
    if (!Number.isNaN(instant)) return instant < now.getTime()
  }
  const day = due.date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  return day < todayISO(now, timeZone)
}

export function isQuestOpen(quest: Quest): boolean {
  if (quest.questClosed) return false
  // A parent task stays open in Todoist after its subtasks are checked.
  if (quest.objectives.some((objective) => objective.self)) {
    return quest.objectives.some((objective) => !objective.completed)
  }
  return true
}

export function adventurerRank(karma: number | null): { level: number; title: string } {
  if (karma == null) return { level: 1, title: "Unproven" }
  const ranks = [
    { min: 50000, level: 81, title: "Dragonborn" },
    { min: 20000, level: 62, title: "Grandmaster" },
    { min: 10000, level: 48, title: "Master" },
    { min: 5000, level: 32, title: "Expert" },
    { min: 2500, level: 20, title: "Adept" },
    { min: 500, level: 8, title: "Apprentice" },
  ]
  return ranks.find((rank) => karma >= rank.min) ?? { level: 1, title: "Novice" }
}

export function deriveStats(quests: Quest[]): JournalStats {
  const open = quests.filter(isQuestOpen)
  const byProject = new Map<string, number>()
  const byPriority = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
  ])
  let openObjectives = 0
  let overdue = 0

  for (const quest of open) {
    byProject.set(quest.projectName, (byProject.get(quest.projectName) ?? 0) + 1)
    const priority = quest.priority >= 1 && quest.priority <= 4 ? quest.priority : 1
    byPriority.set(priority, (byPriority.get(priority) ?? 0) + 1)
    openObjectives += quest.objectives.filter((objective) => !objective.completed).length
    if (quest.overdue) overdue += 1
  }

  const labels: Record<number, string> = {
    1: "Common",
    2: "Notable",
    3: "Pressing",
    4: "Legend",
  }

  return {
    openQuests: open.length,
    openObjectives,
    overdue,
    byProject: [...byProject.entries()]
      .map(([name, count]) => ({ name, open: count }))
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name)),
    byPriority: [4, 3, 2, 1].map((priority) => ({
      priority,
      label: labels[priority] ?? "Common",
      count: byPriority.get(priority) ?? 0,
    })),
  }
}

function findRoot(task: RawTask, byId: Map<string, RawTask>): RawTask {
  let current = task
  const seen = new Set<string>()
  while (current.parentId && byId.has(current.parentId) && !seen.has(current.id)) {
    seen.add(current.id)
    const parent = byId.get(current.parentId)
    if (!parent) break
    current = parent
  }
  return current
}

function projectDisplayName(project: RawProject, byId: Map<string, RawProject>): string {
  const own = stripEmoji(project.name) || "Hold"
  if (!project.parentId) return own
  const parent = byId.get(project.parentId)
  if (!parent || parent.id === project.id) return own
  return `${projectDisplayName(parent, byId)} · ${own}`
}

function refresh(data: JournalData, quests: Quest[]): JournalData {
  return { ...data, quests, stats: deriveStats(quests) }
}

export function setObjectiveCompleted(
  data: JournalData,
  objectiveId: string,
  completed: boolean,
): JournalData {
  const quests = data.quests.map((quest) => {
    let touched = false
    let selfCompleted: boolean | null = null
    const objectives = quest.objectives.map((objective) => {
      if (objective.id !== objectiveId) return objective
      touched = true
      if (objective.self) selfCompleted = completed
      return { ...objective, completed }
    })
    if (!touched) return quest
    return {
      ...quest,
      objectives,
      questClosed: selfCompleted == null ? quest.questClosed : selfCompleted,
    }
  })
  return refresh(data, quests)
}

export function sealQuest(data: JournalData, questId: string): JournalData {
  const quests = data.quests.map((quest) => {
    if (quest.id !== questId) return quest
    return {
      ...quest,
      questClosed: true,
      objectives: quest.objectives.map((objective) => ({ ...objective, completed: true })),
    }
  })
  return refresh(data, quests)
}

export function unsealQuest(data: JournalData, questId: string): JournalData {
  const quests = data.quests.map((quest) => {
    if (quest.id !== questId) return quest
    return {
      ...quest,
      questClosed: false,
      objectives: quest.objectives.map((objective) =>
        objective.self ? { ...objective, completed: false } : objective,
      ),
    }
  })
  return refresh(data, quests)
}

export function buildJournal(input: BuildInput): JournalData {
  const byId = new Map(input.tasks.map((task) => [task.id, task]))
  const roots = new Map<string, RawTask>()
  const children = new Map<string, RawTask[]>()

  for (const task of input.tasks) {
    const root = findRoot(task, byId)
    if (root.id === task.id) {
      roots.set(task.id, task)
      continue
    }
    const list = children.get(root.id) ?? []
    list.push(task)
    children.set(root.id, list)
  }

  const projectById = new Map(input.projects.map((project) => [project.id, project]))
  const sectionById = new Map(input.sections.map((section) => [section.id, section]))
  const zone = input.adventurer.timezone
  const quests: Quest[] = []

  for (const task of roots.values()) {
    const project = projectById.get(task.projectId)
    const section = task.sectionId ? sectionById.get(task.sectionId) : undefined
    const kids = (children.get(task.id) ?? [])
      .slice()
      .sort((a, b) => a.order - b.order || a.content.localeCompare(b.content))

    const objectives: Objective[] = kids.length
      ? kids.map((child) => ({
          id: child.id,
          content: stripEmoji(child.content) || "Unnamed objective",
          plain: plainText(child.content) || "Unnamed objective",
          completed: child.completed,
          recurring: Boolean(child.due?.isRecurring),
          self: false,
          dueLabel: child.due?.string ? stripEmoji(child.due.string) : null,
          overdue: isOverdue(child.due, input.now, zone),
        }))
      : [
          {
            id: task.id,
            content: stripEmoji(task.content) || "See this done",
            plain: plainText(task.content) || "See this done",
            completed: task.completed,
            recurring: Boolean(task.due?.isRecurring),
            self: true,
            dueLabel: null,
            overdue: false,
          },
        ]

    const priority = task.priority >= 1 && task.priority <= 4 ? task.priority : 1
    quests.push({
      id: task.id,
      content: stripEmoji(task.content) || "Unnamed deed",
      plainTitle: plainText(task.content) || "Unnamed deed",
      description: task.description,
      projectId: project?.id ?? (task.projectId || "lost"),
      projectName: project ? projectDisplayName(project, projectById) : "Other Deeds",
      sectionId: section?.id ?? task.sectionId,
      sectionName: section
        ? stripEmoji(section.name) || "Unfiled"
        : task.sectionId
          ? "Unfiled"
          : null,
      priority,
      labels: task.labels.map((label) => stripEmoji(label)).filter(Boolean),
      due: task.due,
      overdue:
        isOverdue(task.due, input.now, zone) || objectives.some((objective) => objective.overdue),
      url: task.url,
      order: task.order,
      objectives,
      questClosed: task.completed,
    })
  }

  quests.sort((a, b) => a.order - b.order || a.plainTitle.localeCompare(b.plainTitle))

  const projects = [...input.projects]
  const known = new Set(projects.map((project) => project.id))
  for (const quest of quests) {
    if (known.has(quest.projectId)) continue
    projects.push({
      id: quest.projectId,
      name: quest.projectName,
      order: 10_000,
      inbox: false,
      parentId: null,
    })
    known.add(quest.projectId)
  }

  projects.sort((a, b) => {
    if (a.inbox !== b.inbox) return a.inbox ? -1 : 1
    return a.order - b.order || a.name.localeCompare(b.name)
  })

  const outline: OutlineGroup[] = []
  for (const project of projects) {
    const inProject = quests.filter((quest) => quest.projectId === project.id)
    if (!inProject.length) continue

    const blocks: OutlineGroup["sections"] = []
    const used = new Set<string>()
    const loose = inProject.filter((quest) => !quest.sectionId)
    if (loose.length) {
      blocks.push({ id: null, name: null, questIds: loose.map((quest) => quest.id) })
      for (const quest of loose) used.add(quest.id)
    }

    const sections = input.sections
      .filter((section) => section.projectId === project.id)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

    for (const section of sections) {
      const rows = inProject.filter((quest) => quest.sectionId === section.id)
      if (!rows.length) continue
      blocks.push({
        id: section.id,
        name: stripEmoji(section.name) || "Unfiled",
        questIds: rows.map((quest) => quest.id),
      })
      for (const quest of rows) used.add(quest.id)
    }

    const rest = inProject.filter((quest) => !used.has(quest.id))
    const leftovers = new Map<string, string[]>()
    for (const quest of rest) {
      const name = quest.sectionName ?? "Unfiled"
      const ids = leftovers.get(name) ?? []
      ids.push(quest.id)
      leftovers.set(name, ids)
    }
    for (const [name, questIds] of leftovers) {
      blocks.push({ id: name, name, questIds })
    }

    outline.push({
      projectId: project.id,
      projectName: projectDisplayName(project, projectById),
      sections: blocks,
    })
  }

  return {
    mode: input.mode,
    adventurer: input.adventurer,
    quests,
    outline,
    stats: deriveStats(quests),
    completedToday: input.completedToday,
    completedThisMoon: input.completedThisMoon,
    consultedAt: input.consultedAt ?? input.now.toISOString(),
  }
}
