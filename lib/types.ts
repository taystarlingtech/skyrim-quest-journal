export type Due = {
  date: string
  string: string
  isRecurring: boolean
  datetime: string | null
}

export type RawTask = {
  id: string
  content: string
  description: string
  projectId: string
  sectionId: string | null
  parentId: string | null
  priority: number
  labels: string[]
  order: number
  completed: boolean
  url: string | null
  due: Due | null
}

export type RawProject = {
  id: string
  name: string
  order: number
  inbox: boolean
  parentId: string | null
}

export type RawSection = {
  id: string
  name: string
  projectId: string
  order: number
}

export type Objective = {
  id: string
  content: string
  plain: string
  completed: boolean
  recurring: boolean
  self: boolean
  dueLabel: string | null
  overdue: boolean
}

export type Quest = {
  id: string
  content: string
  plainTitle: string
  description: string
  projectId: string
  projectName: string
  sectionId: string | null
  sectionName: string | null
  priority: number
  labels: string[]
  due: Due | null
  overdue: boolean
  url: string | null
  order: number
  objectives: Objective[]
  questClosed: boolean
}

export type OutlineSection = {
  id: string | null
  name: string | null
  questIds: string[]
}

export type OutlineGroup = {
  projectId: string
  projectName: string
  sections: OutlineSection[]
}

export type JournalStats = {
  openQuests: number
  openObjectives: number
  overdue: number
  byProject: { name: string; open: number }[]
  byPriority: { priority: number; label: string; count: number }[]
}

export type Adventurer = {
  name: string
  karma: number | null
  timezone: string
}

export type JournalData = {
  mode: "live" | "demo"
  adventurer: Adventurer
  quests: Quest[]
  outline: OutlineGroup[]
  stats: JournalStats
  completedToday: number | null
  completedThisMoon: number | null
  consultedAt: string
}
