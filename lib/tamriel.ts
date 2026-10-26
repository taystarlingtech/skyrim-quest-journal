const WEEKDAYS: Record<string, string> = {
  Sun: "Sundas",
  Mon: "Morndas",
  Tue: "Tirdas",
  Wed: "Middas",
  Thu: "Turdas",
  Fri: "Fredas",
  Sat: "Loredas",
}

const MONTHS = [
  "Morning Star",
  "Sun's Dawn",
  "First Seed",
  "Rain's Hand",
  "Second Seed",
  "Mid Year",
  "Sun's Height",
  "Last Seed",
  "Hearthfire",
  "Frostfall",
  "Sun's Dusk",
  "Evening Star",
]

export function ordinal(day: number): string {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

export function todayISO(now: Date, timeZone: string): string {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const match = formatted.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/)
  if (!match) return formatted
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
}

export function shiftISODate(iso: string, days: number): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  const shifted = new Date(Date.UTC(year || 1970, (month || 1) - 1, (day || 1) + days))
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const d = String(shifted.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatTamrielDateOnly(isoDate: string): string {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate
  const month = Number(match[2])
  const day = Number(match[3])
  const name = MONTHS[month - 1] ?? "Frostfall"
  return `${ordinal(day)} of ${name}`
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((entry) => entry.type === type)?.value ?? ""
}

export function formatTamriel(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date)

  const weekday = WEEKDAYS[part(parts, "weekday").slice(0, 3)] ?? part(parts, "weekday")
  const monthIndex = Number(part(parts, "month")) - 1
  const month = MONTHS[monthIndex] ?? "Frostfall"
  const day = Number(part(parts, "day"))
  const hour = part(parts, "hour")
  const minute = part(parts, "minute").padStart(2, "0")
  const period = part(parts, "dayPeriod").replace(/\./g, "").toUpperCase()

  return `${weekday}, ${hour}:${minute} ${period}, ${ordinal(day)} of ${month}, 4E 201`
}

export function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(part(parts, type) || "0")
  const asUTC = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    pick("hour") % 24,
    pick("minute"),
    pick("second"),
  )
  return asUTC - date.getTime()
}

export function startOfZonedDay(now: Date, timeZone: string): Date {
  const iso = todayISO(now, timeZone)
  const utcMidnight = new Date(`${iso}T00:00:00.000Z`)
  const start = new Date(utcMidnight.getTime() - timeZoneOffsetMs(utcMidnight, timeZone))
  if (todayISO(start, timeZone) !== iso) {
    return new Date(utcMidnight.getTime() - timeZoneOffsetMs(start, timeZone))
  }
  return start
}

export function zonedWindows(now: Date, timeZone: string): {
  since: string
  until: string
  moonSince: string
} {
  return {
    since: startOfZonedDay(now, timeZone).toISOString(),
    until: now.toISOString(),
    moonSince: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
