const TOKEN_KEY = "skyrim-journal.token"
const ACTIVE_KEY = "skyrim-journal.active"
const SOUND_KEY = "skyrim-journal.sound"

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribePreferences(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function read(key: string): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(key) ?? ""
}

export function getStoredToken(): string {
  return read(TOKEN_KEY)
}

export function getStoredActive(): string | null {
  return read(ACTIVE_KEY) || null
}

export function getStoredSound(): boolean {
  return read(SOUND_KEY) === "on"
}

export function writeStoredToken(token: string) {
  if (typeof window === "undefined") return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
  emit()
}

export function writeStoredActive(id: string | null) {
  if (typeof window === "undefined") return
  if (id) window.localStorage.setItem(ACTIVE_KEY, id)
  else window.localStorage.removeItem(ACTIVE_KEY)
  emit()
}

export function writeStoredSound(on: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off")
  emit()
}

export function serverToken(): string {
  return ""
}

export function serverActive(): string | null {
  return null
}

export function serverSound(): boolean {
  return false
}
