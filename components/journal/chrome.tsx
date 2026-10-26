import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Diamond({ filled = false, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("diamond", className)} aria-hidden="true">
      <path
        d="M6 1.15 L10.85 6 L6 10.85 L1.15 6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}

export function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 92 18"
      className={flip ? "flourish is-flip" : "flourish"}
      aria-hidden="true"
    >
      <path d="M6 9 H68" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M68 9 L76 4.2 L84 9 L76 13.8 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M10 9 H4 M10 6.4 L5.5 9 L10 11.6" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  )
}

export function ChapterRule({ children }: { children?: ReactNode }) {
  return (
    <div className="chapter-rule">
      <span className="chapter-line" />
      {children ? <span className="chapter-label">{children}</span> : <Diamond />}
      <span className="chapter-line" />
    </div>
  )
}

export function CompassMark() {
  return (
    <svg viewBox="0 0 64 64" className="compass-svg" aria-hidden="true">
      <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M32 8 L37 30 L32 26 L27 30 Z" fill="currentColor" />
      <path d="M32 56 L27 34 L32 38 L37 34 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="2.1" fill="currentColor" />
    </svg>
  )
}

export function Panel({
  label,
  className,
  children,
  footer,
  ornament,
}: {
  label: string
  className?: string
  children: ReactNode
  footer?: ReactNode
  ornament?: ReactNode
}) {
  return (
    <section className={cn("panel", className)} aria-label={label}>
      {ornament}
      <div className="panel-body scroll">{children}</div>
      {footer ? <div className="panel-foot">{footer}</div> : null}
    </section>
  )
}

const TABS = [
  { id: "quests", label: "Quests" },
  { id: "stats", label: "General Stats" },
  { id: "system", label: "System" },
] as const

export type JournalTab = (typeof TABS)[number]["id"]

export function TabBar({
  tab,
  onChange,
}: {
  tab: JournalTab
  onChange: (tab: JournalTab) => void
}) {
  return (
    <nav className="tab-bar" aria-label="Journal sections">
      <span className="tab-line" />
      {TABS.map((entry, index) => (
        <span className="tab-slot" key={entry.id}>
          {index > 0 ? <span className="tab-line tab-line-short" /> : null}
          <button
            type="button"
            className="tab"
            data-active={tab === entry.id}
            aria-current={tab === entry.id ? "page" : undefined}
            onClick={() => onChange(entry.id)}
          >
            <Diamond />
            <span>{entry.label}</span>
          </button>
        </span>
      ))}
      <span className="tab-line" />
    </nav>
  )
}
