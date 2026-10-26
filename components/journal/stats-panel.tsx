import { adventurerRank } from "@/lib/quests"
import type { JournalData } from "@/lib/types"

export function AdventurerPanel({
  data,
  sessionSeals,
}: {
  data: JournalData
  sessionSeals: number
}) {
  const rank = adventurerRank(data.adventurer.karma)
  const today = data.completedToday
  const moon = data.completedThisMoon
  const sealedToday = today == null ? sessionSeals : today + sessionSeals
  const sealedMoon = moon == null ? null : moon + sessionSeals

  return (
    <div className="stats-sheet">
      {data.mode === "demo" ? (
        <p className="vision-note">These figures belong to the vision.</p>
      ) : null}
      <div className="level-block">
        <p className="adventurer-name">{data.adventurer.name}</p>
        <p className="rank-title">{rank.title}</p>
        <p className="level-number">{rank.level}</p>
        <p className="level-caption">Level</p>
      </div>
      <dl className="stat-list">
        <div className="stat-row">
          <dt>Renown</dt>
          <dd>
            {data.adventurer.karma == null
              ? "—"
              : data.adventurer.karma.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="stat-row">
          <dt>Open quests</dt>
          <dd>{data.stats.openQuests}</dd>
        </div>
        <div className="stat-row">
          <dt>Open objectives</dt>
          <dd>{data.stats.openObjectives}</dd>
        </div>
        <div className="stat-row">
          <dt>Overdue</dt>
          <dd>{data.stats.overdue}</dd>
        </div>
        <div className="stat-row">
          <dt>{today == null ? "Sealed this sitting" : "Sealed today"}</dt>
          <dd>{sealedToday}</dd>
        </div>
        {sealedMoon != null ? (
          <div className="stat-row">
            <dt>Sealed this moon</dt>
            <dd>{sealedMoon}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export function HoldsPanel({ data }: { data: JournalData }) {
  const max = Math.max(1, ...data.stats.byProject.map((hold) => hold.open))
  return (
    <div className="stats-sheet">
      <h2 className="sheet-title">Holds</h2>
      {data.stats.byProject.length === 0 ? (
        <p className="empty-copy">No holds are waiting on you.</p>
      ) : (
        <ul className="skill-list">
          {data.stats.byProject.map((hold) => (
            <li key={hold.name} className="skill">
              <span className="skill-name">{hold.name}</span>
              <span className="skill-count">{hold.open}</span>
              <span className="skill-track" aria-hidden="true">
                <span className="skill-fill" style={{ width: `${(hold.open / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <h2 className="sheet-title sheet-title-spaced">Pressing matters</h2>
      <ul className="skill-list">
        {data.stats.byPriority.map((row) => {
          const maxPriority = Math.max(1, ...data.stats.byPriority.map((item) => item.count))
          return (
            <li key={row.priority} className="skill">
              <span className="skill-name">{row.label}</span>
              <span className="skill-count">{row.count}</span>
              <span className="skill-track" aria-hidden="true">
                <span
                  className="skill-fill"
                  style={{ width: `${(row.count / maxPriority) * 100}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
