export type Segment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "break" }

const PROSE =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+|\n)/g

function cleanHref(href: string): string {
  return href.replace(/[.,);]+$/g, "")
}

export function parseProse(input: string): Segment[] {
  const segments: Segment[] = []
  const source = input.replace(/\r\n/g, "\n")
  let last = 0

  for (const match of source.matchAll(PROSE)) {
    const index = match.index ?? 0
    if (index > last) segments.push({ type: "text", text: source.slice(last, index) })
    const token = match[0]
    if (token === "\n") {
      segments.push({ type: "break" })
    } else if (token.startsWith("**")) {
      segments.push({ type: "bold", text: token.slice(2, -2) })
    } else if (token.startsWith("*")) {
      segments.push({ type: "italic", text: token.slice(1, -1) })
    } else if (token.startsWith("[")) {
      const href = match[3]
      if (href) segments.push({ type: "link", text: match[2] || href, href })
    } else if (token.startsWith("http://") || token.startsWith("https://")) {
      const href = cleanHref(token)
      segments.push({ type: "link", text: href, href })
    } else {
      segments.push({ type: "text", text: token })
    }
    last = index + token.length
  }

  if (last < source.length) segments.push({ type: "text", text: source.slice(last) })
  return segments
}

export function stripEmoji(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/[\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function plainText(input: string): string {
  return stripEmoji(
    input
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/[`_]/g, ""),
  ).replace(/\s+/g, " ").trim()
}

export function journalProse(quest: {
  description: string
  projectName: string
  plainTitle: string
  priority: number
  labels: string[]
}): string {
  const written = stripEmoji(quest.description)
  if (written) return written

  const lines = [`A deed recorded in ${quest.projectName}. ${quest.plainTitle}.`]
  if (quest.priority === 4) lines.push("It is marked as a matter of legend.")
  else if (quest.priority === 3) lines.push("It presses harder than an ordinary errand.")
  else if (quest.priority === 2) lines.push("It is worth a bit of haste.")
  if (quest.labels.length) lines.push(`Signs upon the page: ${quest.labels.join(", ")}.`)
  return lines.join(" ")
}

export function priorityKicker(priority: number): string | null {
  if (priority === 4) return "Matter of legend"
  if (priority === 3) return "Pressing"
  if (priority === 2) return "Worth haste"
  return null
}

export function dueSentence(quest: {
  due: { date: string; string: string; isRecurring: boolean } | null
  overdue: boolean
}): string | null {
  if (!quest.due) return null
  const when = formatDatePhrase(quest.due.date)
  const phrase = stripEmoji(quest.due.string) || "the marked day"
  if (quest.due.isRecurring) {
    return `This oath renews (${phrase}) — next on the ${when}.`
  }
  if (quest.overdue) return `This was due ${phrase} — the ${when}.`
  return `Expected ${phrase} — the ${when}.`
}

function formatDatePhrase(isoDate: string): string {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return isoDate
  const months = [
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
  const month = months[Number(match[2]) - 1] ?? "Frostfall"
  const day = Number(match[3])
  const mod100 = day % 100
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th"
  return `${day}${suffix} of ${month}`
}
