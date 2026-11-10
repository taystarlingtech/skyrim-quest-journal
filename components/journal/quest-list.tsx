import type { JournalData, Quest } from "@/lib/types"
import { formatClock } from "@/lib/tamriel"
import { isQuestOpen, questInLedger, type LedgerFilter } from "@/lib/quests"

const FILTERS: { id: LedgerFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "today", label: "Today" },
  { id: "done", label: "Fulfilled" },
]

export function QuestList({
  data,
  selectedId,
  activeId,
  filter,
  now,
  onFilter,
  onSelect,
  onOpenSystem,
}: {
  data: JournalData
  selectedId: string | null
  activeId: string | null
  filter: LedgerFilter
  now: Date
  onFilter: (filter: LedgerFilter) => void
  onSelect: (id: string) => void
  onOpenSystem: () => void
}) {
  const byId = new Map(data.quests.map((quest) => [quest.id, quest]))
  const zone = data.adventurer.timezone
  const readAt = formatClock(new Date(data.consultedAt), zone)
  const visible = data.outline
    .map((group) => ({
      ...group,
      sections: group.sections
        .map((section) => ({
          ...section,
          questIds: section.questIds.filter((id) => {
            const quest = byId.get(id)
            return quest ? questInLedger(quest, filter, now, zone) : false
          }),
        }))
        .filter((section) => section.questIds.length > 0),
    }))
    .filter((group) => group.sections.length > 0)
  const shown = visible.reduce((count, group) => count + group.sections.reduce((sum, section) => sum + section.questIds.length, 0), 0)

  return (
    <>
      {data.mode === "demo" ? (
        <p className="vision-note">
          These deeds are a vision. Inscribe a Todoist token in{" "}
          <button type="button" onClick={onOpenSystem}>
            System
          </button>{" "}
          to bind your own tasks.
        </p>
      ) : null}
      <div className="ledger-filters" role="tablist" aria-label="Which quests to show">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="ledger-filter"
            role="tab"
            aria-selected={filter === entry.id}
            data-active={filter === entry.id}
            onClick={() => onFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {shown === 0 ? (
        <p className="empty-copy">
          {filter === "today"
            ? "Nothing is due today, and nothing is late."
            : filter === "done"
              ? "No fulfilled quests are still on this page. A checked deed leaves the open ledger."
              : "No open quests are written here."}
        </p>
      ) : (
        visible.map((group) => (
          <section key={group.projectId} className="hold">
            <h2 className="project-header">{group.projectName}</h2>
            {group.sections.map((section) => (
              <div key={section.id ?? `${group.projectId}-loose`}>
                {section.name ? <h3 className="section-header">{section.name}</h3> : null}
                <ul className="quest-list">
                  {section.questIds.map((id) => {
                    const quest = byId.get(id)
                    if (!quest) return null
                    return (
                      <li key={id}>
                        <QuestRow
                          quest={quest}
                          selected={quest.id === selectedId}
                          active={quest.id === activeId}
                          onSelect={onSelect}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
      <p className="read-line">Last read at {readAt}</p>
    </>
  )
}

function QuestRow({
  quest,
  selected,
  active,
  onSelect,
}: {
  quest: Quest
  selected: boolean
  active: boolean
  onSelect: (id: string) => void
}) {
  const open = isQuestOpen(quest)
  return (
    <button
      type="button"
      className="quest-row"
      data-quest-id={quest.id}
      data-selected={selected}
      data-done={!open}
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(quest.id)}
    >
      <span className="quest-name">{quest.plainTitle}</span>
      {active ? <span className="quest-arrow" aria-label="Tracked quest" /> : null}
    </button>
  )
}
