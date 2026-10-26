import { buildJournal } from "./quests"
import { zonedWindows } from "./tamriel"
import type { Due, JournalData, RawProject, RawSection, RawTask } from "./types"

const BASES = ["https://api.todoist.com/api/v1", "https://api.todoist.com/rest/v2"]
const HOME_ZONE = "America/New_York"

export class TodoistError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "TodoistError"
    this.status = status
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function pageOf(data: unknown): { items: unknown[]; cursor: string | null } {
  if (Array.isArray(data)) return { items: data, cursor: null }
  const record = asRecord(data)
  if (!record) return { items: [], cursor: null }
  const items = [record.results, record.items, record.tasks, record.projects, record.sections].find(
    Array.isArray,
  ) as unknown[] | undefined
  return { items: items ?? [], cursor: str(record.next_cursor) }
}

async function todoistFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  let last: Response | null = null
  for (const base of BASES) {
    const response = await fetch(`${base}/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    })
    if (response.status === 404 && base === BASES[0]) {
      last = response
      continue
    }
    return response
  }
  if (!last) throw new TodoistError(502, "Todoist did not answer.")
  return last
}

async function readError(response: Response): Promise<string> {
  try {
    const data = asRecord(await response.json())
    const message = str(data?.error) ?? str(data?.error_tag)
    if (message && message.length < 180 && !/bearer|token/i.test(message)) return message
  } catch {
    // Empty and non-JSON bodies are normal for some Todoist responses.
  }
  return ""
}

async function todoistGetAll(
  token: string,
  path: string,
  params?: Record<string, string>,
): Promise<unknown[]> {
  const items: unknown[] = []
  let cursor: string | null = null

  for (let page = 0; page < 30; page += 1) {
    const query = new URLSearchParams(params)
    query.set("limit", "200")
    if (cursor) query.set("cursor", cursor)
    const response = await todoistFetch(token, `${path}?${query.toString()}`)
    if (!response.ok) {
      const detail = await readError(response)
      throw new TodoistError(response.status, detail || `Todoist returned ${response.status}.`)
    }
    const body = await response.json()
    const next = pageOf(body)
    items.push(...next.items)
    if (!next.cursor || next.cursor === cursor) break
    cursor = next.cursor
  }

  return items
}

function normalizeDue(value: unknown): Due | null {
  const due = asRecord(value)
  if (!due) return null
  const date = str(due.date)
  if (!date) return null
  return {
    date,
    string: str(due.string) ?? date,
    isRecurring: Boolean(due.is_recurring ?? due.isRecurring),
    datetime: str(due.datetime),
  }
}

export function normalizeTask(value: unknown): RawTask | null {
  const task = asRecord(value)
  if (!task) return null
  const id = str(task.id)
  if (!id) return null
  const labels = Array.isArray(task.labels)
    ? task.labels.filter((label): label is string => typeof label === "string")
    : []
  const priority = Number(task.priority ?? 1)

  return {
    id,
    content: typeof task.content === "string" ? task.content : "",
    description: typeof task.description === "string" ? task.description : "",
    projectId: str(task.project_id) ?? str(task.projectId) ?? "inbox",
    sectionId: str(task.section_id) ?? str(task.sectionId),
    parentId: str(task.parent_id) ?? str(task.parentId),
    priority: priority >= 1 && priority <= 4 ? priority : 1,
    labels,
    order: Number(task.child_order ?? task.order ?? 0) || 0,
    completed: Boolean(task.checked ?? task.is_completed ?? task.isCompleted),
    url: str(task.url) ?? `https://app.todoist.com/app/task/${encodeURIComponent(id)}`,
    due: normalizeDue(task.due),
  }
}

function normalizeProject(value: unknown): RawProject | null {
  const project = asRecord(value)
  if (!project) return null
  const id = str(project.id)
  if (!id) return null
  return {
    id,
    name: str(project.name) ?? "Untitled hold",
    order: Number(project.child_order ?? project.order ?? 0) || 0,
    inbox: Boolean(project.is_inbox_project ?? project.is_inbox ?? project.inbox),
    parentId: str(project.parent_id) ?? str(project.parentId),
  }
}

function normalizeSection(value: unknown): RawSection | null {
  const section = asRecord(value)
  if (!section) return null
  const id = str(section.id)
  const projectId = str(section.project_id) ?? str(section.projectId)
  if (!id || !projectId) return null
  return {
    id,
    name: str(section.name) ?? "Unfiled",
    projectId,
    order: Number(section.section_order ?? section.order ?? 0) || 0,
  }
}

async function fetchAdventurer(token: string): Promise<JournalData["adventurer"] | null> {
  try {
    const response = await fetch("https://api.todoist.com/api/v1/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sync_token: "*", resource_types: ["user"] }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return null
    const data = asRecord(await response.json())
    const user = asRecord(data?.user) ?? data
    if (!user) return null
    const tzInfo = user.tz_info ?? user.tzInfo
    const timezone =
      typeof tzInfo === "string"
        ? tzInfo
        : str(asRecord(tzInfo)?.timezone) ?? HOME_ZONE
    const karma = typeof user.karma === "number" ? user.karma : null
    return {
      name: str(user.full_name) ?? str(user.fullName) ?? str(user.name) ?? "Adventurer",
      karma,
      timezone,
    }
  } catch {
    return null
  }
}

async function countCompleted(token: string, since: string, until: string): Promise<number | null> {
  try {
    const items = await todoistGetAll(token, "tasks/completed/by_completion_date", { since, until })
    return items.length
  } catch (error) {
    if (error instanceof TodoistError && [400, 404, 410].includes(error.status)) return null
    return null
  }
}

export function publicTodoistMessage(error: TodoistError): string {
  if (error.status === 401 || error.status === 403) {
    return "Todoist refused the token. Open System and bind a fresh one."
  }
  if (error.status === 404) return "Todoist could not find that deed."
  if (error.status === 429) return "The couriers are resting. Try again in a moment."
  if (error.message && !/bearer|token/i.test(error.message)) return error.message
  return "The courier could not reach Todoist."
}

export async function loadJournal(token: string, now = new Date()): Promise<JournalData> {
  const adventurer = (await fetchAdventurer(token)) ?? {
    name: "Adventurer",
    karma: null,
    timezone: HOME_ZONE,
  }
  const windows = zonedWindows(now, adventurer.timezone || HOME_ZONE)
  const [taskRows, projectRows, sectionRows, completedToday, completedThisMoon] = await Promise.all([
    todoistGetAll(token, "tasks"),
    todoistGetAll(token, "projects"),
    todoistGetAll(token, "sections").catch(() => [] as unknown[]),
    countCompleted(token, windows.since, windows.until),
    countCompleted(token, windows.moonSince, windows.until),
  ])

  return buildJournal({
    mode: "live",
    tasks: taskRows.map(normalizeTask).filter((task): task is RawTask => task !== null),
    projects: projectRows
      .map(normalizeProject)
      .filter((project): project is RawProject => project !== null),
    sections: sectionRows
      .map(normalizeSection)
      .filter((section): section is RawSection => section !== null),
    adventurer,
    completedToday,
    completedThisMoon,
    now,
  })
}

const TASK_ID = /^[A-Za-z0-9_-]{1,64}$/

export async function setTaskCompleted(token: string, taskId: string, completed: boolean): Promise<void> {
  if (!TASK_ID.test(taskId)) throw new TodoistError(400, "That deed could not be named.")
  const action = completed ? "close" : "reopen"
  const response = await todoistFetch(token, `tasks/${encodeURIComponent(taskId)}/${action}`, {
    method: "POST",
  })
  if (response.status === 204 || response.status === 200) return
  const detail = await readError(response)
  throw new TodoistError(response.status, detail || `Todoist returned ${response.status}.`)
}
