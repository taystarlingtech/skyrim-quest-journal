import type { JournalData, Quest } from "@/lib/types"
import { formatClock } from "@/lib/tamriel"
import { isQuestOpen } from "@/lib/quests"

export function QuestList({
  data,
  selectedId,
  activeId,
  onSelect,
  onOpenSystem,
}: {
  data: JournalData
  selectedId: string | null
  activeId: string | null
  onSelect: (id: string) => void
  onOpenSystem: () => void
}) {
  const byId = new Map(data.quests.map((quest) => [quest.id, quest]))
  const readAt = formatClock(new Date(data.consultedAt), data.adventurer.timezone)

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
      {data.quests.length === 0 ? (
        <p className="empty-copy">No open quests are written here.</p>
      ) : (
        data.outline.map((group) => (
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
      {active ? <span className="quest-arrow" aria-label="Active quest" /> : null}
    </button>
  )
}
