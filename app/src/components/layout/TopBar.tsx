import { useRef, useState, useEffect } from 'react'
import {
  HelpCircle, Bell, ChevronDown,
  Shield, UserCog, MessageSquare, Sparkles,
  Bot, GitBranch, Zap, Workflow,
  Network, Headphones, User, Layers, KeyRound,
  CalendarClock, Target, ClipboardCheck, TrendingUp, GraduationCap, MessageCircle, Compass, ScanSearch,
  Play, LayoutDashboard, PieChart, FileBarChart, Activity, Search, Brain,
  History, MessageSquareText, Globe, Plug, Link2, BookOpen,
} from 'lucide-react'
import { AnimatedSmile } from '../AnimatedSmile'

type App = { label: string; icon: typeof Shield; bg: string }
type Group = { tint: string; apps: App[] }

const GROUPS: Group[] = [
  {
    tint: 'rgba(142,214,238,0.5)',
    apps: [
      { label: 'Admin', icon: Shield, bg: 'rgba(142,214,238,0.5)' },
      { label: 'Supervisor', icon: UserCog, bg: 'rgba(142,214,238,0.5)' },
      { label: 'Message Center', icon: MessageSquare, bg: 'rgba(142,214,238,0.5)' },
      { label: 'AI Studio', icon: Sparkles, bg: 'rgba(142,214,238,0.5)' },
    ],
  },
  {
    tint: 'rgba(171,156,237,0.5)',
    apps: [
      { label: 'Cogingy AI', icon: Bot, bg: 'rgba(171,156,237,0.5)' },
      { label: 'Agent Integration', icon: GitBranch, bg: 'rgba(171,156,237,0.5)' },
      { label: 'WFI', icon: Zap, bg: 'rgba(171,156,237,0.5)' },
      { label: 'Neva Studio', icon: Workflow, bg: 'rgba(171,156,237,0.5)' },
    ],
  },
  {
    tint: 'rgba(255,205,131,0.5)',
    apps: [
      { label: 'ACD', icon: Network, bg: 'rgba(255,205,131,0.5)' },
      { label: 'Agent', icon: Headphones, bg: 'rgba(255,205,131,0.5)' },
      { label: 'MAX', icon: User, bg: 'rgba(255,205,131,0.5)' },
      { label: 'Studio', icon: Layers, bg: 'rgba(255,205,131,0.5)' },
      { label: 'Studio Authentication', icon: KeyRound, bg: 'rgba(255,205,131,0.5)' },
    ],
  },
  {
    tint: 'rgba(149,221,155,0.5)',
    apps: [
      { label: 'Workforce Management', icon: CalendarClock, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Enhanced Strategic Planner', icon: Target, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Quality Management', icon: ClipboardCheck, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Feedback Intelligence', icon: MessageSquareText, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Performance Management', icon: TrendingUp, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Coaching', icon: GraduationCap, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Interaction Hub', icon: MessageCircle, bg: 'rgba(149,221,155,0.5)' },
      { label: 'My Zone', icon: Compass, bg: 'rgba(149,221,155,0.5)' },
      { label: 'Desktop Discovery', icon: ScanSearch, bg: 'rgba(149,221,155,0.5)' },
    ],
  },
  {
    tint: 'rgba(251,182,182,0.5)',
    apps: [
      { label: 'Actions', icon: Play, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Dashboard', icon: LayoutDashboard, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Analytics', icon: PieChart, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Reporting', icon: FileBarChart, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Metric', icon: Activity, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Self-Service Analytics', icon: Search, bg: 'rgba(251,182,182,0.5)' },
      { label: 'Enlighten XO', icon: Brain, bg: 'rgba(251,182,182,0.5)' },
    ],
  },
  {
    tint: 'rgba(198,205,209,0.5)',
    apps: [
      { label: 'Performance Management (legacy)', icon: History, bg: 'rgba(198,205,209,0.5)' },
      { label: 'Digital', icon: Globe, bg: 'rgba(198,205,209,0.5)' },
      { label: 'Adapters', icon: Plug, bg: 'rgba(198,205,209,0.5)' },
      { label: 'Connections Hub', icon: Link2, bg: 'rgba(198,205,209,0.5)' },
      { label: 'Guide', icon: BookOpen, bg: 'rgba(198,205,209,0.5)' },
    ],
  },
]

interface TopBarProps {
  onAppSwitch?: (appLabel: string) => void
  /** Label shown in the app-switcher pill (defaults to "Feedback Intelligence"). */
  appName?: string
}

export function TopBar({ onAppSwitch, appName = 'Feedback Management' }: TopBarProps = {}) {
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setAppSwitcherOpen(false)
      }
    }
    if (appSwitcherOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [appSwitcherOpen])

  function handleToggle() {
    if (!appSwitcherOpen && headerRef.current) {
      const headerRect = headerRef.current.getBoundingClientRect()
      // Align top with bottom of header + body gap (8px padding)
      const top = headerRect.bottom + 8
      // Align left with body padding (8px from viewport edge)
      const left = 8
      setDropdownPos({ top, left })
    }
    setAppSwitcherOpen(o => !o)
  }

  return (
    <header ref={headerRef} className="flex h-12 items-center justify-between px-4 pt-1 flex-shrink-0 w-full" style={{ background: 'rgb(243, 245, 246)' }}>
      {/* Left: logo + app name — clicking opens the App Menu */}
      <div ref={switcherRef} className="relative flex items-center">
        <button
          onClick={handleToggle}
          className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-accent transition-colors"
        >
          <AnimatedSmile size={20} className="block flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">{appName}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${appSwitcherOpen ? 'rotate-180' : ''}`} />
        </button>

        {appSwitcherOpen && (
          <div
            className="fixed z-50 flex flex-col w-[320px] rounded-xl border border-black/[0.16] bg-white overflow-hidden"
            style={{
              boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
              top: dropdownPos.top,
              left: dropdownPos.left,
              maxHeight: `calc(100vh - ${dropdownPos.top + 8}px)`,
            }}
          >
            {/* Scrollable app list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {GROUPS.map((group, gi) => (
                <div key={gi} className="flex flex-col gap-1">
                  {group.apps.map(app => {
                    const Icon = app.icon
                    return (
                      <button
                        key={app.label}
                        onClick={() => {
                          setAppSwitcherOpen(false)
                          onAppSwitch?.(app.label)
                        }}
                        className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-black/[0.04] transition-colors text-left"
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
                          style={{ backgroundColor: app.bg }}
                        >
                          <Icon className="h-3.5 w-3.5 text-[#1f2937]" strokeWidth={1.75} />
                        </span>
                        <span
                          className="text-[13px] font-medium truncate"
                          style={{ color: 'rgba(0,0,0,0.8)', lineHeight: '18px' }}
                        >
                          {app.label}
                        </span>
                      </button>
                    )
                  })}
                  {gi < GROUPS.length - 1 && <div className="h-px bg-black/[0.08] my-1" />}
                </div>
              ))}
            </div>

            {/* CXone footer */}
            <div className="flex items-center justify-center h-16 border-t border-black/[0.1] flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold tracking-tight text-[#0F172A]">NiCE</span>
                <span className="flex items-center px-1.5 py-0.5 rounded-md bg-[#126bce] text-white text-[10px] font-bold tracking-wide">
                  CX<span className="bg-white text-[#126bce] rounded-sm px-0.5 ml-0.5">one</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
            5
          </span>
        </button>

        <div className="ml-1 flex items-center gap-1 cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground select-none">
            JS
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
