import { Button } from "@/components/ui/button"
import { ChapterRule, CompassMark, Flourish } from "@/components/journal/chrome"
import { Prose } from "@/components/journal/prose"
import { dueSentence, journalProse, priorityKicker } from "@/lib/text"
import type { Objective, Quest } from "@/lib/types"

export function QuestDetail({
  quest,
  pendingId,
  notice,
  onBack,
  onShowMap,
  onToggle,
  onSeal,
  onUnseal,
}: {
  quest: Quest | null
  pendingId: string | null
  notice: string | null
  onBack: () => void
  onShowMap: () => void
  onToggle: (objective: Objective) => void
  onSeal: (quest: Quest) => void
  onUnseal: (quest: Quest) => void
}) {
  if (!quest) {
    return <p className="empty-copy">Choose a quest from the ledger.</p>
  }

  const kicker = priorityKicker(quest.priority)
  const prose = journalProse(quest)
  const due = dueSentence(quest)
  const hasSteps = quest.objectives.some((objective) => !objective.self)
  const allStepsDone = quest.objectives.every((objective) => objective.completed)

  return (
    <div className="detail-column">
      <button type="button" className="back-to-ledger" onClick={onBack}>
        Return to the ledger
      </button>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <div className="quest-title-row">
        <Flourish />
        <h2 className="quest-heading">{quest.plainTitle}</h2>
        <Flourish flip />
      </div>
      <Prose className="quest-prose" text={prose} />
      {due ? (
        <p className="due-line" data-overdue={quest.overdue}>
          {due}
        </p>
      ) : null}
      {quest.labels.length ? (
        <p className="signs-line">Signs: {quest.labels.join(", ")}</p>
      ) : null}
      <ChapterRule>Objectives</ChapterRule>
      <ul className="objective-list">
        {quest.objectives.map((objective) => (
          <li key={objective.id}>
            <button
              type="button"
              className="objective"
              data-done={objective.completed}
              data-overdue={objective.overdue && !objective.completed}
              disabled={pendingId === objective.id || pendingId === quest.id}
              aria-pressed={objective.completed}
              onClick={() => onToggle(objective)}
            >
              <span className="objective-mark" aria-hidden="true">
                <DiamondMarker filled={objective.completed} />
              </span>
              <span>
                <Prose text={objective.content} />
                {objective.dueLabel ? <em className="objective-due"> — {objective.dueLabel}</em> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hasSteps && allStepsDone && !quest.questClosed ? (
        <div className="seal-row">
          <p>Every charge of this quest is fulfilled.</p>
          <Button
            type="button"
            variant="outline"
            className="journal-button"
            disabled={pendingId === quest.id}
            onClick={() => onSeal(quest)}
          >
            Seal this quest
          </Button>
        </div>
      ) : null}
      {quest.questClosed ? (
        <div className="seal-row">
          <p>The quest is fulfilled.</p>
          {hasSteps ? (
            <Button
              type="button"
              variant="outline"
              className="journal-button"
              disabled={pendingId === quest.id}
              onClick={() => onUnseal(quest)}
            >
              Break the seal
            </Button>
          ) : null}
        </div>
      ) : null}
      <button type="button" className="map-link" onClick={onShowMap} disabled={!quest.url}>
        <CompassMark />
        <span>Show on map</span>
      </button>
      {notice ? (
        <p className="notice" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  )
}

function DiamondMarker({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className="diamond objective-diamond" aria-hidden="true">
      <path
        d="M6 1.15 L10.85 6 L6 10.85 L1.15 6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}
