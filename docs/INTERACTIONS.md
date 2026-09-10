# Feedback Management — Complete Interaction Catalogue
# Source: Feedback Management Lean.dc.html
# Extracted: all onClick handlers, sc-if conditions, sc-for loops, modal triggers, navigation calls, toggles

---

## GLOBAL SHELL

### Left-rail Navigation
- `goCampaigns` — navigate to Programs grid (page: 'campaigns')
- `toggleLib` — toggle Library sub-menu open/closed (state: libOpen); chevron rotates 180deg when open
- `si.on` — (sc-for: libSubItems) navigate to sub-page: Surveys | Themes | Alerts
- Library sub-items: Surveys → page 'surveys', Themes → page 'themes', Alerts → page 'actions'
- `goHealth` — navigate to Program Health page (page: 'health')
- `goHealth2` — navigate to Program Health 2 (funnel view) (page: 'health2')

### sc-if conditions on shell
- `navCampaignsActive` — shows active indicator bar on Programs nav item
- `navLibraryActive` — shows active indicator bar on Library nav item
- `libOpen` — shows/hides Library sub-menu items
- `navHealth2Active` — shows active indicator bar on Health 2 nav item

### sc-for on shell
- `libSubItems` — renders Library sub-nav items (Surveys, Themes, Alerts)

### Page header toolbar
- `onPrimary` — primary action button (varies per page; see per-screen below)
- `onSecondary` — secondary action button (varies per page)
- `onTertiary` — tertiary action button (varies per page)
- `onDelete` — delete current record; confirmation may be shown
- `onDiscard` — discard unsaved changes (active only when dirty)
- `goBack` — breadcrumb back navigation (varies: campaigns → campaign, surveys → survey, etc.)
- `crumbs` — breadcrumb links; each has `on` handler to navigate to that level

### sc-if conditions on toolbar
- `hasStatus` — shows status pill in header
- `hasPrimary` — shows primary button
- `hasSecondary` — shows secondary button
- `hasTertiary` — shows tertiary button
- `hasDelete` — shows delete button
- `hasDiscard` — shows discard button
- `hasDivider` — shows divider between action groups
- `pageSub` — shows subtitle text below page title

### Search + filter bar (grid pages)
- `onSearch` — updates search query for current page (filters grid rows live)
- `clearFilters` — resets filter chips and search query for current page
- `filters` (sc-for) — filter chip buttons; each chip has `on` to toggle that filter on/off; toggling same chip twice clears it

### sc-if on grid
- `isGrid` — shows the grid/table panel
- `gridEmpty` — shows empty-state message when no rows match
- `filterDirty` — shows "clear filters" affordance

### Grid row interactions
- `row.on` — click row to navigate to detail page (applies to all grids: campaigns, surveys, themes, actions, rules)
- `c.toggleMenu` / `c.menuOpen` — open/close row action overflow menu (stopPropagation)
- `c.closeMenu` — close overflow menu
- `c.menuItems` (sc-for) — each menu item has `on` handler

### sc-for on grid
- `grid.rows` — renders all data rows
- `grid.cols` — renders column headers (each has `on` for sort; `hc.asc` / `hc.desc` for sort indicators)

---

## PROGRAMS GRID (page: 'campaigns')

### Primary action
- `onPrimary` ("New program") — creates new campaign record with id 'c{n}', pushes to db.campaigns, navigates to campaign detail (page: 'campaign', cstep: 1), sets newCampaignId

### Filter chips
- chips: 'live' | 'paused' — toggle-filter; clicking active chip clears it

### Grid row overflow menu items per row
- "Test program" — opens Test Program modal (testModal: {cid, step:1, simTab:'digital', resultState:'success', transcriptMode:'sample', ratings:{}})
- "Duplicate" — clones campaign record (appends " (copy)", st:'draft'), re-renders grid
- "Delete" — window.confirm, then removes from db.campaigns, re-renders grid

---

## PROGRAM DETAIL (page: 'campaign')

### Header
- Inline name edit (`onCampName`) — updates c.nm; if not new campaign, sets campDirty:true; shows error border + hint if empty

### Status/breadcrumb
- `crumbs[0].on` (Programs) — goCampaigns

### For NEW campaign (newCampaignId === c.id)
- `onPrimary` ("Publish program") — sets c.st = 'live', clears newCampaignId
- `onSecondary` ("Cancel") — removes campaign from db, clears newCampaignId, navigates to campaigns
- `onTertiary` ("Test program") — opens Test Program modal

### For EXISTING campaign
- `onPrimary` ("Publish changes") — disabled unless campDirty; clears campDirty
- `onSecondary` ("Duplicate") — clones record (appends " (copy)"), navigates to new campaign detail
- `onTertiary` ("Test program") — opens Test Program modal
- `onDiscard` — disabled unless campDirty; restores state from snap, clears campDirty
- `onDelete` — removes campaign from db, navigates to campaigns

### Step wizard tabs
- `v.steps[n].on` — jump to step n (cstep: 1..4)
- Step 1: Survey, Step 2: Audience, Step 3: Delivery, Step 4: Actions
- `onBack` — go to previous step (disabled at step 1)
- `onNext` — go to next step, or at step 4: toggle c.st live/paused

### Section accordion headers (alternative layout to steps)
- `secpgFocus` — activate "Program" section (activeSec: 'pg')
- `secsvFocus` — activate "Survey" section (activeSec: 'sv')
- `secauFocus` — activate "Audience" section (activeSec: 'au')
- `secdiFocus` — activate "Delivery" section (activeSec: 'di')
- `secacFocus` — activate "Actions" section (activeSec: 'ac')

### sc-if conditions (sections done/pending)
- `secpgDone` / `secpgPending` — name non-empty
- `secsvDone` / `secsvPending` — survey assigned
- `secauDone` / `secauPending` — at least one team/skill selected
- `secdiDone` / `secdiPending` — at least one channel + day selected
- `secacDone` / `secacPending` — action set assigned

### Step 1 — Survey selection
- `svPicked` / `svNotPicked` — shows selected-survey card vs. empty picker prompt
- `svOpen` — opens Survey Quick-view panel (svPanelOpen: true, svPanelId: sv.id)
- `onPickSv` — opens Survey picker modal (pick: 'sv', resets svPanelOpen/thFullOpen/svDetailOpen)
- Survey picker modal:
  - `onPickQ` — updates pickQ search text
  - `pickTypeChips[n].on` — filter by 'all' | 'contextual' | 'manual'
  - `pickRows[n].on` — select survey; writes sv to campaign, closes picker
  - `closePick` — close picker modal without saving

### Step 1 — Survey Quick-view Panel (svPanel)
- `closeSvPanel` — close the survey quick-view panel
- `svPanelOnNm` — edit survey name inline
- `pq.del` (sc-for svPanelQs) — delete question from survey in panel
- `svPanelAddBtns[n].on` (sc-for) — add OSAT / ASAT / CSAT / Verbatim question
- `svPanelSave` — close panel (saves inline)
- `svPanelDuplicate` — clone survey, update svPanelId to new id
- `svPanelDelete` — remove survey from db, remove from any campaign, close panel

### Step 1 — Survey Detail panel
- `closeSvDetail` — close detail read-only panel

### Step 1 — Full-screen Theme overlay (opened from Delivery step theme picker)
- `thFullBack` — close overlay, return to program detail
- `thFullOpenCustomise` — open customise pane on overlay (thFullCustomise: true)
- `thFullDuplicate` — clone theme record, set it as active in overlay
- `thFullQTypes[n].on` (sc-for) — switch preview question type (OSAT/ASAT/CSAT/Verbatim)
- `thFullNext` — advance preview to next step (invite → question → thank you)
- `thFullPrev` — go back one preview step
- `thFullReset` — reset preview to step 0 (invite)
- `thFullTogglePlay` — toggle auto-play of the 3-step preview (2.5s/3s/2s intervals)

### Step 1 — Theme Detail panel (thDetail, from Delivery section theme row "View")
- `closeThDetail` — close detail panel
- `openThCustomise` — show customise pane on panel
- `closeThCustomise` — hide customise pane
- `saveThCustomise` — save customise pane (closes it)
- `dupTheme` — duplicate theme (closes panel)

### Step 2 — Audience targeting
- `agModeTg` — switch targeting mode to Teams/Groups
- `agModeSk` — switch targeting mode to Skills
- `onDdTeams` — open/close Teams multi-select dropdown
- `onDdSkills` — open/close Skills multi-select dropdown
- `ddClose` — close any open dropdown
- `agTeams[n].on` (sc-for) — toggle team selection (toggleIn)
- `agSkills[n].on` (sc-for) — toggle skill selection (toggleIn)
- `onTgMin` — update minimum interaction length (number input)
- `onOptOut` — toggle opt-out suppression on/off
- `onRecency` — toggle recency suppression on/off
- `onRecDays` — update recency suppression days (number input)

### sc-if conditions on Audience step
- `agIsTg` — shows Teams/Groups targeting UI
- `agIsSk` — shows Skills targeting UI
- `ddTeams` — shows teams dropdown
- `ddSkills` — shows skills dropdown
- `ddAny` — shows backdrop to close any dropdown
- `recOn` — shows recency days input

### Step 3 — Delivery/Schedule
- `schChans[n].on` (sc-for) — toggle channel selection (Digital/IVR/Web/etc.)
- `onSchStart` — update start date text input
- `onSchEnd` — update end date text input
- `onSchOngoing` — toggle Ongoing/End date toggle
- `onSchAllDay` — toggle All-day/Timed window toggle
- `onSchStartTime` — update start time
- `onSchEndTime` — update end time
- `schDays[n].on` (sc-for) — toggle surveying day Mon–Sun
- `onSchRem` — toggle reminder on/off
- `onSchRemDelay` — select reminder delay (select: 24h / 48h / 72h)
- `schThemes[n].on` (sc-for) — change theme selection for a channel (select dropdown)
- `schThemes[n].open` (sc-for) — open full-screen theme overlay for that channel/theme

### sc-if conditions on Delivery step
- `schThemesEmpty` — shows "select a channel first" message when no channels selected
- `dwOngoingOn` / `dwAllDayOn` — toggle states for ongoing/all-day

### Step 4 — Actions
- `onPickAc` — opens Action Set picker modal (pick: 'ac')
- `acPicked` / `acNotPicked` — shows selected action set card vs. empty prompt
- `acRefOpen` — navigate to action detail page for the selected action set

### sc-if conditions per step
- `stepIsSv` / `stepIsRu` / `stepIsDi` / `stepIsAc` — shows each step panel
- `svPanelOpen` — shows survey quick-view panel
- `svDetailOpen` — shows survey detail read-only panel
- `thFullOpen` — shows full-screen theme overlay
- `thDetailOpen` — shows theme detail panel
- `pickOpen` — shows picker modal

---

## SURVEYS GRID (page: 'surveys')

### Primary action
- `onPrimary` ("New survey") — calls openCreate(), shows Create modal

### Filter chips
- chips: 'dyn' (Contextual) | 'fix' (Manual)

### Create modal (createOpen, createIsSurvey)
- `methods[n].on` (sc-for) — select creation method: 'dyn' (Contextual) or 'man' (Manual)
- `onCreate` — create survey record, navigate to survey detail; for 'dyn': kind='dyn'; for 'man': kind='fix'
- `cancelCreate` — close modal without creating

### Grid row overflow menu items
- "Duplicate survey" — clones survey record (appends " (copy)"), re-renders grid
- "Delete" — window.confirm, removes from db.surveys

---

## SURVEY DETAIL (page: 'survey')

### Header
- Inline name edit (`onSvName`) — updates s.nm; if existing survey, sets svDirty:true + snapshot

### For NEW survey (newSurveyId === s.id)
- `onPrimary` ("Publish") — marks s._isNew = false, clears newSurveyId
- `onSecondary` ("Cancel") — removes survey, navigates to surveys grid

### For EXISTING survey
- `onPrimary` ("Publish changes") — disabled unless svDirty; clears svDirty
- `onSecondary` ("Duplicate") — clones record, navigates to new survey detail
- `onDelete` ("Delete survey") — removes survey, navigates to surveys grid
- `onDiscard` — restores from svSnap (name + questions), clears svDirty

### Contextual survey (dyn) — questions card
- `onDdLangs` — open/close language multi-select dropdown
- `langOpts[n].on` (sc-for, inside ddLangs) — toggle language on/off (toggleIn on policy langs)
- `onFb` — select fallback language (select dropdown)
- `polQs[n].pq.del` (sc-for) — delete question from policy
- `polQs[n].pq.onSc` (sc-for) — change scale for question (1–5 only)
- `addQs[n].on` (sc-for) — add OSAT / ASAT / CSAT / Verbatim question to policy

### sc-if conditions on contextual survey
- `polQsEmpty` — shows "add your first question" empty state
- `ddLangs` — shows language dropdown

### Manual survey (fix) — start tabs (shown when no questions)
- `svStartTabs[n].on` (sc-for) — switch start mode: 'ai' (Draft with AI) | 'tpl' (Template) | 'imp' (Import)
- `svStartShow` — shows start-mode tabs when question list is empty

### Manual survey — AI generation tab
- `onAiPrompt` — update AI prompt text
- `aiExamples[n].on` (sc-for) — fill prompt with example text
- `onGenerate` — generate questions from prompt (simulated: parses prompt keywords, creates question records); disabled if prompt < 12 chars; label changes to "Regenerate" if questions already exist

### Manual survey — Template tab
- `svTpls[n].on` (sc-for) — apply template (replaces question list); templates: Post-contact CSAT, OSAT, Agent quality check, All three scores

### Manual survey — Import tab
- `onImpText` — update import textarea
- `onImport` — parse pasted questions (one per line, strips numbering, guesses types), replace question list; disabled if < 10 chars

### Manual survey — questions list
- `fixQs[n].q.onText` (sc-for) — edit question wording
- `fixQs[n].q.onTy` (sc-for) — change question type (OSAT/ASAT/CSAT/Verbatim)
- `fixQs[n].q.onSc` (sc-for) — change scale (1–5 only)
- `fixQs[n].q.onDel` (sc-for) — delete question
- `fixQs[n].q.onUp` (sc-for) — move question up
- `fixQs[n].q.onDown` (sc-for) — move question down
- `addQuestion` — add new blank CSAT question
- `addQs[n].on` (sc-for) — add typed question (OSAT/ASAT/CSAT/Verbatim) with default wording

### sc-if conditions on manual survey
- `svStartShow` — hides question list, shows creation mode tabs when empty
- `svTplsShow` — shows template cards when Template tab active
- `svStartIsImp` — shows import textarea panel
- `fixEmpty` / `fixHasQs` — empty state vs. question list
- `isAiSurvey` — shows AI generation panel at top

---

## THEMES GRID (page: 'themes')

### Primary action
- `onPrimary` ("New theme") — opens create modal; creates theme record, navigates to theme detail

### Filter chips
- none defined for themes grid beyond search

### Grid row overflow menu items
- (standard: Duplicate, Delete)

---

## THEME DETAIL (page: 'theme')

### Header
- `onPrimary` ("Save changes") — saves, re-renders
- `onSecondary` ("Duplicate") — clones theme record
- `onDelete` ("Delete") — removes theme

### Customise pane (themeShowEditor)
- `themeGroups[n].grp.fields[n]` (sc-for) — each field has `on` (change handler)
- Field types: isText, isSelect, isToggle

### sc-if conditions on theme detail
- `thDetailOpen` — theme detail panel open
- `thDetailCustomise` — customise panel open
- `thDetailSys` / `thDetailNotSys` — system default vs. user theme (system = read-only fields)
- `themeLocked` / `distEditable` — lock/edit states
- `themeShowEditor` — shows editor pane

---

## ELIGIBILITY RULES GRID (page: 'rules')

### Primary action
- `onPrimary` ("New eligibility rule") — creates rule record, navigates to rule detail (page: 'rule')

### Grid row
- `row.on` — navigate to rule detail

---

## ELIGIBILITY RULE DETAIL (page: 'rule')

### Header
- `onPrimary` ("Save") — forceUpdate
- `onSecondary` ("Duplicate") — clones rule record
- `onDelete` — removes rule, navigates to rules grid

### Targeting mode
- `agModeTg` — switch to Teams mode
- `agModeSk` — switch to Skills mode
- `onDdTeams` / `onDdSkills` — open/close team/skill dropdowns
- `ddClose` — close dropdown
- `agTeams[n].on` / `agSkills[n].on` (sc-for) — toggle team/skill selection

### Suppression settings
- `onOptOut` — toggle opt-out suppression
- `onRecency` — toggle recency suppression
- `onRecDays` — update recency days

---

## DELIVERY PROFILES GRID (page: 'dists')

### Primary action
- `onPrimary` ("New delivery profile") — creates dist record, navigates to dist detail

### Grid row
- `row.on` — navigate to dist detail

---

## DELIVERY PROFILE DETAIL (page: 'dist')

### Header
- `onPrimary` ("Save") — saves
- `onSecondary` ("Duplicate") — clones record
- `onDelete` — removes, navigates to dists grid

### sc-if conditions
- `distEditable` / `distLocked` — system default (locked) vs user profile (editable)
- `dmHasText` / `dmHasOptLabel` / `dmNone` — message mode states

---

## ALERTS GRID (page: 'actions')

### Primary action
- `onPrimary` ("Set New Alert") — creates action record (tType:'score', thr:2), navigates to action detail

### Grid row
- `row.on` — navigate to action detail

---

## ALERT DETAIL (page: 'action')

### Header
- Inline name edit (`onAcName`) — updates a0.nm; shows error border + hint if empty
- `onPrimary` ("Save action set") — forceUpdate (saves inline state)
- `onSecondary` ("Duplicate") — clones record, navigates to new action detail
- `onDelete` — removes action, navigates to actions grid

### Trigger type
- `acTypes[n].on` (sc-for) — select trigger type: 'score' (By score) | 'none' (Never)
- `onAcThr` — update score threshold (number input)
- `onAcTopicsDd` — open/close Topics multi-select dropdown
- `acTopicRows[n].on` (sc-for) — toggle topic selection (for tType:'topic')
- `ddClose` — close dropdown

### Notification settings
- `onAcSup` — toggle "notify supervisor" on/off
- `onAcExtra` — edit additional recipients text
- `acChannels[n].on` (sc-for) — toggle notification channel: Email | In-app
- `onAcCap` — update alert cap per day (number input)

### sc-if conditions
- `acIsScore` — shows score threshold input
- `acIsTopic` — shows topic multi-select
- `acIsNone` — shows "no notification" state
- `acNotifies` — shows notification recipients section
- `acTopicsOpen` — shows topics dropdown

---

## RESPONSES (page: 'responses')

### Range chips
- `rangeChips[n].on` (sc-for) — select time range: 24h | 7d | 30d | 90d

### Filter dropdowns
- `rsFilters[n].fl.onToggle` (sc-for) — open/close a filter dropdown (Handling | Question type)
- `rsFilters[n].fl.opts[n].on` (sc-for) — select a filter option; closes dropdown
- `rsFilters[n].fl.onClear` — clear that filter (stopPropagation); resets to 'all'
- `ddClose` — close any dropdown

### Search
- `onRsQuery` — update keyword filter (fq)
- `onRsQueryClear` — clear keyword filter

### sc-if conditions
- `rsHasQuery` — shows clear button in search
- `rsFiltered` — shows "clear all filters" affordance
- `rsEmpty` — shows empty state
- `rsDrawer` — shows response detail drawer

### AI Ask
- `onAsk` / `onAskKey` (Enter) — submit AI question; resolves to pre-defined answers by keyword match
- `askChips[n].on` (sc-for) — pre-fill question and immediately resolve answer
- `onAskDismiss` — dismiss answer panel
- `onAskApply` — apply recommended filter from answer (navigates to responses, applies fq + rng)

### sc-if conditions on AI Ask
- `askHasAnswer` — shows answer panel
- `askHasHandoff` — shows "apply filter" handoff button

### Response table rows
- `row.on` (sc-for rsGrid.rows) — open response detail drawer (rsOpen: r.id)

### Response detail drawer
- `onRsClose` — close drawer (rsOpen: null)
- `rsPrevOn` — navigate to previous response in filtered order
- `rsNextOn` — navigate to next response in filtered order
- Keyboard shortcuts: j / ArrowDown (next), k / ArrowUp (prev), Escape (close) — wired via componentDidMount

### sc-if on drawer
- `dwHasVb` — shows verbatim text in drawer
- `rsDrawer` — shows/hides drawer

---

## PROGRAM HEALTH (page: 'health')

### Range chips
- `rangeChips[n].on` (sc-for) — select time range: 24h | 7d | 30d | 90d

### Channel chips
- `hChChips[n].on` (sc-for) — filter by channel: All | Web | IVR | Chat | WhatsApp | SMS

### AI Ask (same as Responses page)
- `onAsk` / `askChips[n].on` / `onAskDismiss` / `onAskApply`
- When on health page: onAskApply may filter this page (sets hCh + rng) instead of navigating to responses

### Program rows
- `hProgRows[n].on` (sc-for) — navigate to responses filtered to that program (fq: p.nm)

### Shortcut links
- `hProgMore` — navigate to campaigns grid
- `hTopicsMore` — navigate to topics page
- `hActionMore` — navigate to actions grid

### Topic rows
- `hTopics[n].on` (sc-for) — navigate to responses filtered to first word of topic name

---

## PROGRAM HEALTH 2 / FUNNEL VIEW (page: 'health2')

### Filter bar
- `h2Filters[n].on` (sc-for) — placeholder filters (Jul range, Programs, Channels, Categories) — `on: function(){}` (no-op in prototype)

### Group tabs
- `h2GroupTabs[n].on` (sc-for) — switch table grouping: Program | Channel | Topic (state: h2Group)

### "Why not sent" toggle
- `h2ToggleWns` — toggle "why not sent" details panel open/closed (state: h2WnsOpen)

### Drill-down
- `h2Rows[n].on` (sc-for) — drill into program detail (state: h2DrillId + h2DrillQt)
- `v.h2DrillBack` — return from drill-down (state: h2DrillId: null)

### sc-if conditions
- `h2ShowMain` — shows main funnel view
- `h2ShowDrill` — shows program drill-down view
- `row.showChips` — shows program type chips in row (only when grouping by program)

---

## TOPICS (page: 'topics')

### Range chips
- `rangeChips[n].on` (sc-for) — select time range

### Primary action
- `onPrimary` ("Review pending rules") — opens pending-rules review panel (tpRev: true)

### Topic table rows
- `t.on` / `t.onOpen` (sc-for tpRows) — navigate to Program Health filtered to first word of topic
- `t.onApprove` (sc-for tpRows) — approve topic rule (t.appr = true); stopPropagation

### Topic scatter plot dots
- `t.open` / `t.on` (sc-for tpPlot) — navigate to Program Health filtered to topic (same as table row)

### Pending rules review panel (tpRevOpen)
- `closeTpRev` — close review panel
- `onApproveAll` — approve all pending topics (t.appr = true for all), close panel
- `p.onApprove` (sc-for tpRevRows) — approve individual topic rule
- `p.onReject` (sc-for tpRevRows) — reject + remove topic from db

### sc-if conditions
- `tpRevOpen` — shows review panel
- `tpRevEmpty` — shows "all clear" state in review panel
- `t.pending` (sc-for tpRows) — shows "needs review" badge on row
- `t.ai` / `t.isAi` — AI-generated indicator

---

## TEST PROGRAM MODAL (testModalOpen)

### Backdrop
- `tmBackdropClose` — click outside modal to close (sets testModal: null)
- `tmStopProp` — stop propagation on modal box click (prevents backdrop close)

### Header
- `tmClose` — X button to close modal

### Stepper
- `tmSteps` (sc-for) — display only; no click interaction on steps themselves

### Step 1 — Program Check
- `tmPrimary` ("Continue →") — advance to step 2

### Step 2 — Transcript
- `tmSelectSample` — select "Use sample transcript" option
- `tmSelectUpload` — select "Upload your own transcript" option
- `tmPrimary` ("Run Simulation →") — advance to step 3

### Step 3 — Simulation
- `tmSimDigital` — switch simulation preview tab to Digital
- `tmSimIVR` — switch simulation preview tab to IVR
- `tmSimQuestions[n].sq.options[n].on` (sc-for) — select a rating (1–5) for a scored question in digital sim
- `tmSimQuestions[n].sq.ivrOptions[n].on` (sc-for) — select a rating for IVR sim
- `tmPrimary` ("See Result →") — advance to step 4

### Step 4 — Result
- `tmResultSuccess` — switch result view to "Success" tab
- `tmResultFailed` — switch result view to "Failed" tab
- `tmPrimary` ("Activate Programme →") — if resultState='success': sets c.st='live', closes modal; if failed: disabled/no-op
- `tmBack` — go back one step (available steps 2–3)
- `tmRerun` — reset to step 1 (available at step 4)

### sc-if conditions
- `testModalOpen` — shows/hides entire modal overlay
- `tmStep1` / `tmStep2` / `tmStep3` / `tmStep4` — shows each step body
- `tmHasQuestions` / `tmNoQuestions` — survey has/lacks questions in step 1 check
- `tmTranscriptSample` / `tmTranscriptUpload` — which transcript option is selected
- `tmSimIsDigital` / `tmSimIsIVR` — which simulation tab is active
- `tmIsSuccess` / `tmIsFailed` — which result tab is active
- `tmShowBack` / `tmShowCancel` / `tmShowRerun` — footer button visibility
- `tmPrimaryLabel` — changes per step
- `sq.isScale` / `sq.isVerbatim` — shows rating buttons vs. text notice
- `sq.logOk` / `sq.logWarn` — shows pass/warn indicator on question row

---

## sc-for MASTER LIST (all lists rendered dynamically)

| Variable | Used on screen | Content |
|---|---|---|
| libSubItems | Shell nav | Library sub-nav items |
| libTabs | Library pages | Surveys / Themes / Alerts tabs |
| crumbs | All pages | Breadcrumb links |
| filters | Grid pages | Filter chips |
| rangeChips | Responses, Health, Topics | Time-range chips |
| grid.cols | All grids | Sortable column headers |
| grid.rows / r.cells | All grids | Data rows and cells |
| c.menuItems | Grid rows | Row action overflow menu items |
| c.tags / cl.tags | Grid cells | Tag/badge chips in cells |
| steps | Campaign detail | Step wizard tabs |
| schChans | Campaign delivery | Channel checkboxes |
| schDays | Campaign delivery | Day-of-week checkboxes |
| schThemes | Campaign delivery | Per-channel theme selectors |
| agTeams | Campaign audience | Team checkboxes in dropdown |
| agSkills | Campaign audience | Skills checkboxes in dropdown |
| agGroups | Campaign audience | Group checkboxes in dropdown |
| methods | Survey create modal | Creation method cards (Contextual/Manual) |
| svStartTabs | Survey detail | Creation start tabs (AI/Template/Import) |
| svTpls | Survey detail | Template cards |
| addQs | Survey detail | Add question type buttons |
| polQs | Contextual survey | Dynamic questions list |
| fixQs | Manual survey | Fixed questions list |
| langOpts | Contextual survey | Language checkboxes |
| aiExamples | Manual survey AI tab | Example prompt chips |
| svPanelQs | Survey quick-view panel | Questions list in panel |
| svPanelAddBtns | Survey quick-view panel | Add question buttons |
| svPanelUsedBy | Survey quick-view panel | Programs using survey |
| thFullQTypes | Theme full-screen overlay | Question type tabs |
| thFullStepDots | Theme full-screen overlay | Preview step dots |
| thFullPreviewBtns | Theme full-screen overlay | 1–5 rating preview buttons |
| thFullGroups / grp.fields | Theme full-screen overlay | Field groups in editor |
| thDetailQTypes | Theme detail panel | Question type rows |
| thDetailGroups / grp.fields | Theme detail panel | Field groups in customise pane |
| thDetailMsg | Theme detail panel | Message fields |
| themeGroups / grp.fields | Theme detail page | Editor field groups |
| acTypes | Alert detail | Trigger type selector chips |
| acTopicRows | Alert detail | Topics multi-select list |
| acChannels | Alert detail | Notification channel toggles |
| rsFilters | Responses | Filter dropdown controls |
| rsGrid.cols / rsGrid.rows | Responses | Response table |
| dwFacts | Response drawer | Metadata key-value rows |
| dwDays | Response drawer | Scheduling days |
| askChips | Responses, Health | AI question suggestion chips |
| hChChips | Program Health | Channel filter chips |
| hProgRows | Program Health | Program score table rows |
| hTopics | Program Health | Top 5 topics |
| hStack | Program Health | Funnel breakdown bars |
| hMetrics | Program Health | KPI metric cards |
| h2Filters | Health 2 | Filter pills |
| h2GroupTabs | Health 2 | Grouping tabs |
| h2Kpis / h2DrillKpis | Health 2 | Funnel KPI nodes |
| h2Rows / h2DrillRows | Health 2 | Table rows (program/channel/topic) |
| tpRows | Topics | Topic table rows |
| tpPlot | Topics | Scatter plot dots |
| tpStats | Topics | Summary stat cards |
| tpRevRows | Topics | Pending rules review rows |
| tmSteps | Test modal | Step indicator |
| tmQuestions / tmSimQuestions / tmResultRows | Test modal | Question cards in each step |
| tmChannels | Test modal | Channel tags in step 1 |
| tmFixCards | Test modal | Failure fix cards in result |
| tmFixCards | Test modal | IVR failure guidance cards |
| usedBy | Detail pages | "Used by" program list |
| sideMeta | Detail pages with side column | Metadata key-value pairs |
| subChips | Detail pages | Sub-tab chips |
| chGroups | Survey/Theme detail | Channel group sections |
| distReadOnly | Delivery detail | Read-only field rows |
| dmModes | Delivery detail | Message mode options |

---

## NAVIGATION MAP

```
campaigns  ←→  campaign (detail)
campaigns  ←→  surveys (via Library nav)
surveys    ←→  survey (detail)
themes     ←→  theme (detail)
actions    ←→  action (detail)
rules      ←→  rule (detail)  [not in left nav; accessed from campaign detail]
dists      ←→  dist (detail)  [not in left nav; accessed from campaign detail]
campaign   →   theme full-screen overlay (thFullOpen)
responses  ←→  health  (crumb links, Ask AI handoff)
topics     →   health  (clicking topic row/dot)
health     →   responses (clicking program row, topic, Ask AI apply)
health     →   campaigns (hProgMore)
health     →   topics (hTopicsMore)
health     →   actions (hActionMore)
health2    →   health2 drill-down (clicking program row)
```

### Back-navigation map (goBack)
```
campaign  → campaigns
survey    → surveys
surveys   → campaigns (via crumb)
theme     → themes
themes    → campaigns (via crumb)
action    → actions
actions   → campaigns (via crumb)
dist      → dists
dists     → campaigns (via crumb)
responses → health
topics    → health
```
