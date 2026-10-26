"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { CompassMark, Panel, TabBar, type JournalTab } from "@/components/journal/chrome"
import { Landscape } from "@/components/journal/landscape"
import { QuestDetail } from "@/components/journal/quest-detail"
import { QuestList } from "@/components/journal/quest-list"
import { AdventurerPanel, HoldsPanel } from "@/components/journal/stats-panel"
import { SystemForm, SystemGuide } from "@/components/journal/system-panel"
import { createDemoJournal } from "@/lib/demo"
import { fetchJournal, mutateTask } from "@/lib/journal-client"
import {
  getStoredActive,
  getStoredSound,
  getStoredToken,
  serverActive,
  serverSound,
  serverToken,
  subscribePreferences,
  writeStoredActive,
  writeStoredSound,
  writeStoredToken,
} from "@/lib/preferences"
import { isQuestOpen, sealQuest, setObjectiveCompleted, unsealQuest } from "@/lib/quests"
import { playSealSound } from "@/lib/sound"
import { formatTamriel } from "@/lib/tamriel"
import type { JournalData, Objective, Quest } from "@/lib/types"

const DEMO_QUEST = "demo-wizard"
const NO_QUESTS: Quest[] = []

export function Journal() {
  const [tab, setTab] = useState<JournalTab>("quests")
  const [pane, setPane] = useState<"list" | "detail">("list")
  const [data, setData] = useState<JournalData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_QUEST)
  const [sessionActive, setSessionActive] = useState<string | null | undefined>(undefined)
  const [tokenDraft, setTokenDraft] = useState<string | null>(null)
  const [reveal, setReveal] = useState(false)
  const [sessionSeals, setSessionSeals] = useState(0)
  const [now, setNow] = useState<Date | null>(null)
  const token = useSyncExternalStore(subscribePreferences, getStoredToken, serverToken)
  const storedActive = useSyncExternalStore(subscribePreferences, getStoredActive, serverActive)
  const soundOn = useSyncExternalStore(subscribePreferences, getStoredSound, serverSound)
  const activeId = sessionActive === undefined ? storedActive : sessionActive
  const draftValue = tokenDraft ?? token
  const tokenRef = useRef("")
  const dataRef = useRef<JournalData | null>(null)
  const pendingRef = useRef<string | null>(null)

  useEffect(() => {
    tokenRef.current = token
    dataRef.current = data
    pendingRef.current = pendingId
  })

  const say = useCallback((message: string) => {
    setNotice(message)
    window.setTimeout(() => {
      setNotice((current) => (current === message ? null : current))
    }, 4200)
  }, [])

  const applyJournal = useCallback((journal: JournalData) => {
    setData(journal)
    setLoadError(null)
    setSessionSeals(0)
    setSelectedId((current) => {
      if (current && journal.quests.some((quest) => quest.id === current)) return current
      const stored = getStoredActive()
      if (stored && journal.quests.some((quest) => quest.id === stored)) return stored
      if (journal.mode === "demo") return DEMO_QUEST
      return journal.quests[0]?.id ?? null
    })
  }, [])

  const reload = useCallback(
    async (nextToken = tokenRef.current) => {
      setRefreshing(true)
      try {
        const journal = await fetchJournal(nextToken)
        applyJournal(journal)
      } catch (error) {
        const message = error instanceof Error ? error.message : "The courier could not reach Todoist."
        if (dataRef.current?.mode === "live") say(message)
        else setLoadError(message)
      } finally {
        setRefreshing(false)
      }
    },
    [applyJournal, say],
  )

  useEffect(() => {
    let cancel = false
    ;(async () => {
      if (token) {
        await reload(token)
        return
      }
      if (cancel) return
      applyJournal(createDemoJournal(new Date()))
      setRefreshing(false)
    })()

    return () => {
      cancel = true
    }
  }, [applyJournal, reload, token])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    const start = window.setTimeout(() => setNow(new Date()), 0)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(start)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    document.querySelector(`[data-quest-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({
      block: "nearest",
    })
  }, [selectedId, data])

  useEffect(() => {
    const quest = data?.quests.find((entry) => entry.id === selectedId)
    document.title = quest ? `${quest.plainTitle} — Quest Journal` : "Quest Journal"
  }, [data, selectedId])

  const quests = data?.quests ?? NO_QUESTS
  const questById = useMemo(() => new Map(quests.map((quest) => [quest.id, quest])), [quests])
  const selected = selectedId ? questById.get(selectedId) ?? null : null
  const order = useMemo(
    () => data?.outline.flatMap((group) => group.sections.flatMap((section) => section.questIds)) ?? [],
    [data],
  )

  const displayActive =
    activeId && questById.has(activeId) ? activeId : data?.mode === "demo" ? DEMO_QUEST : null

  const showMap = useCallback(() => {
    const quest = dataRef.current?.quests.find((entry) => entry.id === selectedId)
    if (!quest?.url) {
      say("This vision has no place on the map. Bind a Todoist token to open the true task.")
      return
    }
    window.open(quest.url, "_blank", "noopener,noreferrer")
  }, [say, selectedId])

  const toggleActive = useCallback(() => {
    const currentData = dataRef.current
    if (!currentData || !selectedId) return
    setSessionActive((current) => {
      const effective = current === undefined ? storedActive : current
      const resolved =
        effective && currentData.quests.some((quest) => quest.id === effective)
          ? effective
          : currentData.mode === "demo"
            ? DEMO_QUEST
            : null
      const next = resolved === selectedId ? null : selectedId
      if (currentData.mode === "live") writeStoredActive(next)
      return next
    })
  }, [selectedId, storedActive])

  const chooseQuest = useCallback((id: string) => {
    setSelectedId(id)
    if (window.matchMedia("(max-width: 860px)").matches) setPane("detail")
  }, [])

  const changeTab = useCallback((next: JournalTab) => {
    setTab(next)
    if (next === "quests") setPane("list")
  }, [])

  async function runLive(
    quest: Quest,
    optimistic: JournalData,
    request: () => Promise<void>,
    success: string,
    options?: { reloadAfter?: boolean; sealDelta?: number },
  ) {
    const snapshot = data
    if (!snapshot || snapshot.mode === "demo") {
      setData(optimistic)
      if (options?.sealDelta) {
        setSessionSeals((count) => Math.max(0, count + (options.sealDelta ?? 0)))
      }
      if (soundOn) playSealSound()
      say("Practice ink. Todoist is unchanged.")
      return
    }
    setData(optimistic)
    setPendingId(quest.id)
    try {
      await request()
      if (soundOn) playSealSound()
      if (options?.reloadAfter) {
        say(success)
        await reload()
      } else {
        if (options?.sealDelta) setSessionSeals((count) => Math.max(0, count + options.sealDelta!))
        say(success)
      }
    } catch (error) {
      setData(snapshot)
      say(error instanceof Error ? error.message : "The ink would not take.")
    } finally {
      setPendingId(null)
    }
  }

  function toggleObjective(objective: Objective) {
    if (!data || pendingId) return
    const quest = data.quests.find((entry) => entry.objectives.some((item) => item.id === objective.id))
    if (!quest) return
    const completed = !objective.completed
    void runLive(
      quest,
      setObjectiveCompleted(data, objective.id, completed),
      () => mutateTask(tokenRef.current, completed ? "close" : "reopen", objective.id),
      objective.recurring && completed
        ? "The oath renews itself."
        : completed
          ? "Sealed in Todoist."
          : "Restored in Todoist.",
      {
        reloadAfter: Boolean(objective.recurring && completed && data.mode === "live"),
        sealDelta: data.mode === "live" && !objective.recurring ? (completed ? 1 : -1) : 0,
      },
    )
  }

  function seal(quest: Quest) {
    if (!data || pendingId) return
    void runLive(
      quest,
      sealQuest(data, quest.id),
      () => mutateTask(tokenRef.current, "close", quest.id),
      "The quest is sealed in Todoist.",
      { sealDelta: data.mode === "live" ? 1 : 0 },
    )
  }

  function unseal(quest: Quest) {
    if (!data || pendingId) return
    void runLive(
      quest,
      unsealQuest(data, quest.id),
      () => mutateTask(tokenRef.current, "reopen", quest.id),
      "The seal is broken in Todoist.",
      { sealDelta: data.mode === "live" ? -1 : 0 },
    )
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return
      }
      if (event.key === "1") changeTab("quests")
      if (event.key === "2") changeTab("stats")
      if (event.key === "3") changeTab("system")
      if (tab !== "quests" || !data) return

      if (event.key === "Tab") {
        event.preventDefault()
        toggleActive()
        return
      }
      if (event.key === "e" || event.key === "E") {
        event.preventDefault()
        showMap()
        return
      }
      if (event.key === "r" || event.key === "R") {
        if (data.mode === "live" && !pendingRef.current) void reload()
        return
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        if (!order.length) return
        const index = Math.max(0, order.indexOf(selectedId ?? ""))
        const delta = event.key === "ArrowDown" ? 1 : -1
        const next = order[(index + delta + order.length) % order.length]
        if (next) chooseQuest(next)
        return
      }
      if (event.key === "Enter") {
        const onQuestRow = target instanceof HTMLElement && Boolean(target.closest(".quest-row"))
        const onOtherControl =
          target instanceof HTMLElement && Boolean(target.closest("button, a")) && !onQuestRow
        if (onOtherControl) return
        const quest = data.quests.find((entry) => entry.id === selectedId)
        if (!quest) return
        event.preventDefault()
        const next = quest.objectives.find((objective) => !objective.completed)
        if (next) toggleObjective(next)
        else if (isQuestOpen(quest) && quest.objectives.some((objective) => !objective.self)) seal(quest)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return
      if (dataRef.current?.mode !== "live" || pendingRef.current) return
      void reload()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [reload])

  async function bind() {
    const trimmed = draftValue.trim()
    if (trimmed.length < 8) {
      say("That token looks too short to be a Todoist token.")
      return
    }
    setSaving(true)
    try {
      const journal = await fetchJournal(trimmed)
      tokenRef.current = trimmed
      writeStoredToken(trimmed)
      setTokenDraft(null)
      applyJournal(journal)
      setTab("quests")
      setPane("list")
      say("The journal is bound to Todoist.")
    } catch (error) {
      say(error instanceof Error ? error.message : "Todoist refused the token.")
    } finally {
      setSaving(false)
    }
  }

  function forget() {
    tokenRef.current = ""
    writeStoredToken("")
    setTokenDraft(null)
    applyJournal(createDemoJournal(new Date()))
    setTab("quests")
    say("The token is forgotten. The vision returns.")
  }

  function toggleSound() {
    const next = !soundOn
    writeStoredSound(next)
    if (next) playSealSound()
  }

  const zone = data?.adventurer.timezone ?? "America/New_York"
  const bound = Boolean(token)

  return (
    <div className="journal" data-tab={tab} data-mobile-pane={pane}>
      <Landscape />
      <div className="journal-grain" />
      <div className="journal-vignette" />
      <div className="journal-ui">
        <h1 className="sr-only">Quest journal</h1>
        <TabBar tab={tab} onChange={changeTab} />
        <div className="journal-panels">
          <Panel
            label={tab === "quests" ? "Quest ledger" : tab === "stats" ? "Adventurer" : "Binding"}
            className="panel-list"
            footer={
              tab === "quests" && data ? (
                <button
                  type="button"
                  className="read-foot"
                  onClick={() => data.mode === "live" && void reload()}
                  disabled={refreshing || data.mode === "demo"}
                >
                  {refreshing ? "Reading the tablets…" : "R  Read the tablets again"}
                </button>
              ) : null
            }
          >
            {tab === "stats" && data ? (
              <AdventurerPanel data={data} sessionSeals={sessionSeals} />
            ) : null}
            {tab === "system" ? <SystemGuide bound={bound} /> : null}
            {tab === "quests" && loadError && !data ? (
              <div className="empty-copy">
                <p>{loadError}</p>
                <button type="button" className="text-button" onClick={() => void reload()}>
                  Try again
                </button>
              </div>
            ) : null}
            {tab === "quests" && !data && !loadError ? <p className="pages-turn">The pages turn…</p> : null}
            {tab === "quests" && data ? (
              <QuestList
                data={data}
                selectedId={selectedId}
                activeId={displayActive}
                onSelect={chooseQuest}
                onOpenSystem={() => changeTab("system")}
              />
            ) : null}
          </Panel>
          <Panel
            label={tab === "quests" ? "Quest" : tab === "stats" ? "Holds" : "Token"}
            className="panel-detail"
            ornament={
              tab === "quests" ? (
                <button
                  type="button"
                  className="compass"
                  onClick={showMap}
                  disabled={!selected?.url}
                  aria-label="Show on map"
                >
                  <CompassMark />
                </button>
              ) : null
            }
          >
            {tab === "stats" && data ? <HoldsPanel data={data} /> : null}
            {tab === "system" ? (
              <SystemForm
                tokenDraft={draftValue}
                reveal={reveal}
                saving={saving}
                soundOn={soundOn}
                bound={bound}
                canForget={Boolean(token) || Boolean(draftValue.trim())}
                onDraft={setTokenDraft}
                onReveal={() => setReveal((current) => !current)}
                onSubmit={() => void bind()}
                onForget={forget}
                onSound={toggleSound}
                onRefresh={() => void reload()}
              />
            ) : null}
            {tab === "quests" && data ? (
              <QuestDetail
                quest={selected}
                pendingId={pendingId}
                notice={notice}
                onBack={() => setPane("list")}
                onShowMap={showMap}
                onToggle={toggleObjective}
                onSeal={seal}
                onUnseal={unseal}
              />
            ) : null}
            {tab === "quests" && !data ? (
              <p className="pages-turn">{loadError ?? "The pages turn…"}</p>
            ) : null}
          </Panel>
        </div>
        <footer className="journal-footer">
          <div className="hints">
            {tab === "quests" ? (
              <>
                <button type="button" className="hint" onClick={toggleActive}>
                  <kbd>Tab</kbd>
                  <span>Toggle Active</span>
                </button>
                <button type="button" className="hint" onClick={showMap}>
                  <kbd>E</kbd>
                  <span>Show on Map</span>
                </button>
              </>
            ) : (
              <p className="hint-note">1 Quests · 2 General Stats · 3 System</p>
            )}
          </div>
          <time className="tamriel-date" dateTime={now ? now.toISOString() : undefined}>
            {now ? formatTamriel(now, zone) : "\u00a0"}
          </time>
        </footer>
      </div>
    </div>
  )
}
