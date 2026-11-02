export type TestScenario = 'new' | 'existing' | 'inprog' | 'ready'

const SCENARIOS: { id: TestScenario; label: string }[] = [
  { id: 'new', label: 'New program' },
  { id: 'existing', label: 'Existing program' },
  { id: 'inprog', label: 'In progress · 7' },
  { id: 'ready', label: 'Ready to decide' },
]

interface ScenarioSwitcherProps {
  value: TestScenario
  onChange: (scenario: TestScenario) => void
  /** Scenarios to offer; defaults to all. */
  options?: TestScenario[]
}

/** Lets a tester jump between canned program states while a test flow is embedded in the shell's top bar. */
export function ScenarioSwitcher({ value, onChange, options }: ScenarioSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Scenario"
      className="flex items-center gap-0.5 rounded-full p-1"
      style={{ background: 'var(--lyra-color-bg-surface-shell)', border: '1px solid var(--lyra-color-border-subtle)' }}
    >
      <span className="text-xs px-2" style={{ color: 'var(--lyra-color-fg-secondary)', font: '500 12px/16px var(--font-sans)' }}>
        Scenario
      </span>
      {SCENARIOS.filter(s => !options || options.includes(s.id)).map(s => {
        const active = value === s.id
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className="h-7 whitespace-nowrap rounded-full px-3 transition-colors"
            style={active
              ? {
                  background: 'var(--lyra-color-bg-surface-base)',
                  color: 'var(--lyra-color-fg-active-strong)',
                  boxShadow: 'var(--sol-effect-shadowsm), 0 0 0 1px var(--lyra-color-border-subtle)',
                  font: '500 12px/16px var(--font-sans)',
                }
              : { color: 'var(--lyra-color-fg-secondary)', font: '400 12px/16px var(--font-sans)' }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
