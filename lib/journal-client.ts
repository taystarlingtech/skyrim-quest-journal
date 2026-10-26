import { loadJournal, publicTodoistMessage, setTaskCompleted, TodoistError } from "./todoist-server"
import type { JournalData } from "./types"

function journalError(error: unknown): Error {
  if (error instanceof TodoistError) return new Error(publicTodoistMessage(error))
  if (error instanceof Error && error.message && !/bearer|token/i.test(error.message)) {
    return error
  }
  return new Error("The courier could not reach Todoist.")
}

export async function fetchJournal(token: string): Promise<JournalData> {
  const trimmed = token.trim()
  if (!trimmed) throw new Error("Bind a Todoist token in the System menu.")
  try {
    return await loadJournal(trimmed)
  } catch (error) {
    throw journalError(error)
  }
}

export async function mutateTask(
  token: string,
  op: "close" | "reopen",
  taskId: string,
): Promise<void> {
  try {
    await setTaskCompleted(token.trim(), taskId, op === "close")
  } catch (error) {
    throw journalError(error)
  }
}
