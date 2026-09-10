# Feedback Intelligence — Screen & Flow Reference

> **This file is the source of truth for all screens, navigation, states, and interactions.**
> Claude Code MUST read this file before implementing any screen or making any change to flows.
> Every screen listed here must be fully implemented and clickable in the prototype.

---

## Navigation Structure

```
App Shell (Sidebar + Topbar)
├── Campaigns         → page: 'campaigns'  (default)
├── Library (collapsible)
│   ├── Surveys       → page: 'surveys'
│   ├── Themes        → page: 'themes'
│   └── Alerts        → page: 'actions'
└── Program Health    → page: 'health'

Hidden from sidebar nav (reachable via drill-down):
├── Campaign Detail   → page: 'campaign'
├── Survey Detail     → page: 'survey'
├── Theme Detail      → page: 'theme'
├── Alert Detail      → page: 'action'
├── Eligibility Grid  → page: 'rules'
├── Eligibility Detail→ page: 'rule'
├── Delivery Grid     → page: 'dists'
├── Delivery Detail   → page: 'dist'
├── Responses         → page: 'responses'
├── Topics            → page: 'topics'
└── Health Detail     → page: 'health2'
```

### Navigation State (`state.page`)
| Value | Screen | Back destination |
|---|---|---|
| `campaigns` | Programs list (grid) | — (top level) |
| `campaign` | Program detail | `campaigns` |
| `surveys` | Surveys list (grid) | — |
| `survey` | Survey detail | `surveys` |
| `rules` | Eligibility list (grid) | — |
| `rule` | Eligibility detail | `rules` |
| `themes` | Themes list (grid) | — |
| `theme` | Theme detail | `themes` |
| `dists` | Delivery list (grid) | — |
| `dist` | Delivery detail | `dists` |
| `actions` | Alerts list (grid) | — |
| `action` | Alert detail | `actions` |
| `responses` | Responses table | `health` |
| `topics` | Topics (AI taxonomy) | `health` |
| `health` | Program health dashboard | — |
| `health2` | Health detail view | `health` |

### Sidebar Groups
- **Campaigns** → `campaigns` page (active when page=campaigns or page=campaign)
- **Library** → collapsible section; active when page is surveys/survey/themes/theme/actions/action
  - Sub-items: Surveys, Themes, Alerts (each navigates to respective grid)
  - Rules and Delivery live under Library but are NOT shown as sidebar items — reached from campaign detail
- **Program Health** → `health` page; includes a Health2 sub-item when on health pages

---

## 1. Campaigns (Programs) — page: `campaigns`

**Title:** Programs  
**Description:** "A program owns who is asked and when it goes out. It selects a survey, a theme and an action set from the library."

### Grid Columns
| Column | Key | Sortable |
|---|---|---|
| Program | nm | ✓ |
| Status | st | ✓ |
| Survey | sv | — |
| Audience | ru | — |
| Channels | di | — |
| Owner | owner | ✓ |
| Modified | mod | ✓ |
| Actions | — | — |

### Status values
- `live` → Active (success)
- `paused` → Paused (warning)
- `draft` → Draft (neutral)

### Interactions
- **Row click** → navigates to `campaign` detail with that campaign's `id`
- **New program** button → creates new campaign record, immediately navigates to `campaign` detail (new mode)
- **Search** → filters by program name or owner
- **Filter chips** → All / Live / Paused
- **Sort** → click column headers
- **Row kebab menu** (3-dot) → opens inline menu per row:
  - Test program → opens Test Survey Modal
  - Duplicate → creates copy, stays on grid
  - Delete → confirm dialog, removes from list

---

## 2. Campaign Detail — page: `campaign`

**Title:** [Campaign name]  
**Description:** "Pick what to ask, then set who may be asked and when it goes out."

### Two Modes

#### A. Existing Campaign
- Header shows: Status pill, Duplicate, Test program, Discard (greyed unless dirty), Publish changes
- "Publish changes" button is disabled (grey) until edits are made; becomes active (blue) when anything changes
- Discard = revert unsaved changes

#### B. New Campaign (just created)
- No status pill
- Buttons: Cancel, Test program, Publish program
- "Cancel" removes the new record and goes back to campaigns grid

### Accordion Sections (5 sections, collapsible)
Each section has a coloured left-border when active, checkmark when done:

| Section key | Label | Done when |
|---|---|---|
| `pg` | Program name | Name is non-empty |
| `sv` | Survey | A survey is selected |
| `au` | Audience | ≥1 team or skill selected |
| `di` | Delivery | ≥1 channel + ≥1 day selected |
| `ac` | Actions | Always optional |

### Section: Program Name
- Text input for program name
- Red border + error hint if empty
- Helper text: "Shown in the programs list and in reporting."

### Section: Survey (Step 1)
- Shows currently selected survey name and description
- "Change survey" link opens survey picker (inline panel or modal)
- Survey picker shows grid of all surveys; click selects and closes
- Dynamic vs Fixed survey badge shown

### Section: Audience (Step 2)
Mode toggle: **By team** / **By skill** (radio-style segmented control)

**By team mode:**
- Multi-select dropdown: Teams (shows team name + agent count)
- Multi-select dropdown: Groups (optional refinement)
- Min interaction duration field (number input, in minutes)
- Opt-out toggle (On/Off)
- Recency suppression toggle + days input

**By skill mode:**
- Multi-select dropdown: Skills (shows skill name + agent count)
- Same min duration, opt-out, recency fields as above

Agent count summary shown below: "Targeting X agents"

### Section: Delivery (Step 3)
- Multi-select channel chips: Digital, IVR, WhatsApp, SMS, Voice
- Date range: Start date, End date (or "Ongoing" toggle)
- Days of week checkboxes: Mon Tue Wed Thu Fri Sat Sun
- Time window: Start time, End time (or "All day" toggle)
- Reminder toggle + delay dropdown (24h, 48h, 72h)

### Section: Actions (Step 4) — Optional
- Shows selected alert set name (or "None")
- "Change alert" link opens alert picker
- Alert picker shows all action/alert records; click selects

### Wizard Step Indicators
4 numbered steps: Survey (1) → Audience (2) → Delivery (3) → Actions (4)
- Circle: grey = pending, blue = active, green checkmark = complete
- Connecting line: grey = step before not done, green = step before done
- Clicking a step number scrolls/opens that accordion section

### Test Program Modal
Triggered from "Test program" button on both new and existing campaigns.
- Step 1: Channel selector (Digital / IVR / Voice tabs)
- Step 2: Simulate customer flow — shows survey questions as customer would see them
- Step 3: Result preview — shows "Success" / "Opt-out" / "Error" states
- Transcript toggle: sample vs. generated
- Ratings preview (1–5 star or emoji scale per question type)
- Close button (X) + backdrop click closes modal

---

## 3. Surveys — page: `surveys`

**Title:** Surveys  
**Description:** "Channel-agnostic definitions — the questions and their scales, nothing else."

### Filter chips
- All / Dynamic / Fixed

### Grid Columns
| Column | Notes |
|---|---|
| Survey name | Link to detail |
| Type | Dynamic (AI) or Fixed badge |
| Description | Short summary |
| Metrics | CSAT, OSAT, NPS, ASAT, CES, FCR chips |
| Modified | Date |
| Actions | Kebab (Edit, Duplicate, Delete) |

### New survey modal
- "New survey" button opens Create Survey modal
- Two options: **Dynamic (AI-generated)** or **Fixed (manual questions)**
- Dynamic shows: number of questions selector (2–5), topic source toggle (auto/manual)
- Fixed shows: question builder (add/remove/reorder questions)

---

## 4. Survey Detail — page: `survey`

**Title:** [Survey name]

### Two types of survey detail

#### A. Fixed survey
- Survey name input
- Questions list (ordered)
- Each question row shows: Question text, Type (CSAT/OSAT/ASAT/NPS/Verbatim), Scale, Metric
- Add question button (at bottom)
- Drag handles to reorder
- Delete per question

#### B. Dynamic (AI) survey
- Survey name input
- AI badge: "AI-generated questions" 
- Number of questions selector
- Topic source: Auto (from ontology) or Manual (select topics)
- Preview of generated questions (based on settings)
- Regenerate button

### Survey Policy section
- Language setting (English / French / etc.)
- Question slot assignments (which slot = which type)

---

## 5. Eligibility Rules — page: `rules`

**Title:** Eligibility  
**Description:** "Reusable eligibility rules, selectable by any program."

### Grid Columns
| Column | Notes |
|---|---|
| Rule name | Link to detail |
| Scope | Teams / Skills summary |
| Min duration | e.g. "2 min" |
| Opt-out | Yes / No |
| Recency | Days |
| Modified | |
| Used by | Count of programs |

---

## 6. Eligibility Rule Detail — page: `rule`

- Rule name input
- Mode: By Team / By Skill
- Team/Skill multi-select (same UI as campaign audience section)
- Min interaction duration
- Opt-out toggle
- Recency toggle + days
- "Used by" list (programs using this rule)

---

## 7. Themes — page: `themes`

**Title:** Themes  
**Description:** "Themes are created per channel. Each one owns how questions look on that channel and every message the customer reads."

### Filter chips
- All / Chat / WhatsApp / IVR / SMS / Web

### Grid: Card layout (not table)
Each card shows:
- Channel icon + name
- Theme name
- Preview of invitation message text
- Language
- Last modified

---

## 8. Theme Detail — page: `theme`

**Title:** [Channel] — [Theme name]

### Sections
- **Invitation** — message sent to customer to start survey
- **Opt-out** — message shown if customer opts out
- **Thank you** — closing message after completion
- **Reminder** — follow-up message if not responded

### Per-message editor
- Rich text / plain text toggle
- Character counter
- Variable insertion (e.g. `{{agent_name}}`, `{{contact_id}}`)

### Side panel
- Preview of how message appears on that channel (Chat bubble / SMS / Email format)

---

## 9. Delivery — page: `dists`

**Title:** Delivery  
**Description:** "Reusable profiles: which channels carry the invitation, in what order, within which window."

### Grid Columns
| Column | Notes |
|---|---|
| Profile name | Link to detail |
| Channels | Channel badges |
| Priority | Channel order |
| Window | e.g. "09:00–19:00" |
| Modified | |

---

## 10. Delivery Detail — page: `dist`

- Profile name input
- Channel list (ordered, drag to reorder)
- Per channel: window override, fallback enabled/disabled
- Global window settings

---

## 11. Alerts — page: `actions`

**Title:** Alerts  
**Description:** "Who gets told when a response needs attention. Notification only — nothing is resolved automatically."

### Grid Columns
| Column | Notes |
|---|---|
| Alert set name | Link |
| Trigger | Score threshold or Topic match |
| Notify supervisor | Yes / No |
| Channels | Email / In-app badges |
| Cap | Max notifications/day |
| Modified | |

---

## 12. Alert Detail — page: `action`

**Title:** [Alert set name]

### Trigger section
- Trigger type: **Score** or **Topic**
- Score trigger: threshold ≤ N (1–5 scale)
- Topic trigger: multi-select from topic list

### Notification section
- Notify supervisor toggle
- Extra recipients (email input)
- Channels: Email checkbox, In-app checkbox
- Daily cap (number input)

---

## 13. Program Health — page: `health`

**Title:** Program health  
**Description:** "How each program is scoring, how much of the operation is answering, and what is moving the numbers."

### Channel filter chips
- All channels / Web / IVR / Chat / WhatsApp / SMS

### KPI Summary cards (top row)
| KPI | Description |
|---|---|
| Interactions | Total interactions in range |
| Surveys sent | Invitations delivered |
| Responses | Completed surveys |
| Answer rate | % of invitations answered |
| Declined | % opted out |
| Verbatim coverage | % with text response |

### Response breakdown
- Answered / Declined / No response — donut chart or progress bars
- Click "Answered" → navigates to `responses` page
- Click "Topics" → navigates to `topics` page

### Per-program health table
Each live program row shows: Program name, Score (avg), Trend (up/down), Responses count, Answer rate

### Date range control
- 7d / 14d / 30d / 90d tabs

---

## 14. Health Detail — page: `health2`

Detailed breakdown view for a specific program within health.
- KPI sparklines per metric
- Score over time chart (line)
- Channel breakdown (bar)
- Topic distribution

---

## 15. Responses — page: `responses`

**Title:** Responses  
**Description:** "One row per answered survey. Question type, channel and handling are first-class dimensions."

### Filters (top bar)
- Program (dropdown)
- Channel (dropdown)
- Handler: All / AI / Human
- Metric: CSAT / OSAT / ASAT / NPS / CES / FCR
- Date range

### Table Columns
| Column | Notes |
|---|---|
| ID | Response ID |
| Score | Numeric + color (VU score rules: ≥76 green, 50–75 amber, <50 red) |
| Raw | "4 of 5" |
| Program | Campaign name |
| Channel | Chat / IVR / Voice / WhatsApp / SMS |
| Handler | AI / Human icon + name |
| Topic | AI-detected topic |
| Time ago | "2h ago" |
| Duration | Interaction duration |

### Row click → Response detail panel (slide-in drawer)
- Full question text
- Verbatim text (if any)
- Agent name + queue
- Interaction ID (inv-XXXXX)
- Channel + handler
- Timeline

---

## 16. Topics — page: `topics`

**Title:** Topics  
**Description:** "One taxonomy for the whole tenant. Topics are detected by AI from verbatims."  
**AI badge:** shown (AI-powered feature)

### Layout
- Topic tree / list on left
- Topic detail + sample verbatims on right

### Interactions
- Expand/collapse topic groups
- Click topic → shows sample verbatims for that topic
- Approve / Reject classification rule buttons
- Add custom topic button

---

## App-wide Modals

### Test Survey Modal
- Triggered from: Campaign detail "Test program" button, Campaign grid row kebab "Test program"
- Steps: 1 (Channel select) → 2 (Customer simulation) → 3 (Result preview)
- Tabs: Digital / IVR / Voice
- Shows survey questions as customer sees them
- Result states: Success / Opt-out / Error
- Close: X button or backdrop click

### Create Survey Modal
- Triggered from: Surveys grid "New survey" button
- Type selection: Dynamic vs Fixed
- Dynamic options: question count, topic source
- Fixed options: manual question builder

### Confirm Delete Dialog
- Standard browser confirm() or custom modal
- Triggered by Delete actions across all grids and details

---

## Shared UI Patterns

### Grid shell (all list pages)
- Page title + subtitle
- Breadcrumb trail
- Search input (left)
- Primary action button (right)
- Filter chips row
- Sort-able column headers
- Row hover + click states
- Empty state when no results

### Detail shell (all detail pages)
- Breadcrumb (e.g. Programs > Billing recovery Q3)
- Status pill (existing records only)
- Action bar: Delete | Discard | Secondary | Tertiary | Primary
- Primary = "Publish changes" (disabled until dirty)
- Discard = greyed until dirty, red text when dirty
- "Used by" side panel (shows programs using this library item)

### Sidebar
- Logo/product name area (top)
- Nav items with active state (blue bg, bold)
- Library section: collapsible with chevron; sub-items indent
- Active state: `--lyra-color-bg-active-moderate` bg, `--lyra-color-fg-active-strong` text, 500 weight

### Topbar (56px)
- App shell bg: `--lyra-color-bg-surface-shell`
- Breadcrumbs or page context
- User avatar / settings (right)

---

## Data Model Summary

| Entity | State key | DB key |
|---|---|---|
| Campaigns/Programs | `state.camp` (edits) | `db.campaigns` |
| Surveys | — | `db.surveys` |
| Eligibility Rules | — | `db.rules` |
| Themes | — | `db.lf` |
| Delivery profiles | — | `db.dist` |
| Alert sets | — | `db.actions` |
| Responses | — | `db.responses` |

---

## State Variables

| Variable | Type | Purpose |
|---|---|---|
| `page` | string | Current screen |
| `id` | string\|null | Selected record ID |
| `cstep` | number (1–4) | Campaign wizard step |
| `createOpen` | bool | Create modal open |
| `activeSec` | string | Active accordion section in campaign detail |
| `campDirty` | bool | Unsaved changes in campaign detail |
| `newCampaignId` | string | Tracks newly created campaign (new mode) |
| `libOpen` | bool | Library sidebar section expanded |
| `dd` | string\|null | Open dropdown key |
| `gridMenu` | string\|null | Open kebab menu row ID |
| `testModal` | object\|null | Test survey modal state |
| `hCh` | string | Health page channel filter |
| `rng` | number | Health date range (days: 7/14/30/90) |
| `fh/fs/fm/fq` | strings | Response page filters |
| `rt` | string | Response tab (a=all) |

---

## VU Score Color Rules

| Range | Text token | Background token |
|---|---|---|
| 76–100 | `--lyra-color-status-success-strong` | `--lyra-color-status-success-subtle` |
| 50–75 | `--lyra-color-status-warning-strong` | `--lyra-color-status-warning-subtle` |
| 0–49 | `--lyra-color-status-critical-strong` | `--lyra-color-status-critical-subtle` |
| No data | `--lyra-slate-400` | transparent |

## Response Rate Progress Bar Colors

| Range | Color token |
|---|---|
| ≥ 60% | `--lyra-color-status-success-strong` |
| ≥ 40% | `--lyra-color-status-warning-strong` |
| < 40% | `--lyra-color-status-critical-strong` |

---

> **Every screen above must be wired and clickable. If a screen is not reachable via the prototype, it is incomplete.**
