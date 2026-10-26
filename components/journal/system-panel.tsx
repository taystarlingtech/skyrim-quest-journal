import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SystemGuide({ bound }: { bound: boolean }) {
  return (
    <div className="system-copy">
      <h2 className="sheet-title">The binding</h2>
      <p>
        Your Todoist tasks become the quests in this journal. Each project is a hold. Each task is
        a quest, and its subtasks are the objectives you can check off. Checking an objective
        completes that task in Todoist.
      </p>
      <p>
        Find the token in Todoist under Settings, then Integrations, then Developer. The token stays
        in this browser and is sent only to Todoist. This site does not keep a copy.
      </p>
      <p>
        <a
          href="https://app.todoist.com/app/settings/integrations/developer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the developer settings
        </a>
      </p>
      <p>
        {bound
          ? "The journal is bound on this device."
          : "The pages ahead stay a vision until a token is bound."}
      </p>
    </div>
  )
}

export function SystemForm({
  tokenDraft,
  reveal,
  saving,
  soundOn,
  bound,
  canForget,
  onDraft,
  onReveal,
  onSubmit,
  onForget,
  onSound,
  onRefresh,
}: {
  tokenDraft: string
  reveal: boolean
  saving: boolean
  soundOn: boolean
  bound: boolean
  canForget: boolean
  onDraft: (value: string) => void
  onReveal: () => void
  onSubmit: () => void
  onForget: () => void
  onSound: () => void
  onRefresh: () => void
}) {
  return (
    <form
      className="system-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <h2 className="sheet-title">Todoist token</h2>
      <label htmlFor="todoist-token">Inscribe the token</label>
      <div className="token-row">
        <Input
          id="todoist-token"
          className="journal-input"
          type={reveal ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={tokenDraft}
          placeholder="Paste the token here"
          onChange={(event) => onDraft(event.target.value)}
        />
        <Button type="button" variant="outline" className="journal-button" onClick={onReveal}>
          {reveal ? "Hide" : "Show"}
        </Button>
      </div>
      <p className="field-note">
        The token stays in this browser. This journal sends it only to Todoist.
      </p>
      <div className="form-actions">
        <Button type="submit" variant="outline" className="journal-button" disabled={saving}>
          {saving ? "Binding…" : "Bind journal"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="journal-button"
          onClick={onForget}
          disabled={!canForget}
        >
          Forget token
        </Button>
        <Button
          type="button"
          variant="outline"
          className="journal-button"
          onClick={onRefresh}
          disabled={!bound || saving}
        >
          Read the tablets
        </Button>
      </div>
      <Button type="button" variant="outline" className="journal-button" onClick={onSound}>
        {soundOn ? "Journal sounds: on" : "Journal sounds: silent"}
      </Button>
    </form>
  )
}
