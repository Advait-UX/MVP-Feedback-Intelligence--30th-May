import { useMemo, useState } from 'react'
import {
  ListPageHeader, SearchInput, GridPanel, GridToolbar, RowKebabMenu,
  TableShell, Th, Td, EmptyRow,
} from '@/components/feedback-management/ListPagePrimitives'

type Alert = {
  id: string
  name: string
  trigger: string
  notifies: string
  usedBy: string
  modified: string
}

const ALERTS: Alert[] = [
  {
    id: 'detractor-billing',
    name: 'Detractor alert — billing',
    trigger: 'By score',
    notifies: "the agent's supervisor · billing-leads@nice.com",
    usedBy: '1 program',
    modified: '22 Jul 2026',
  },
  {
    id: 'notify-team-lead',
    name: 'Notify team lead',
    trigger: 'By score',
    notifies: "the agent's supervisor",
    usedBy: '1 program',
    modified: '04 Jun 2026',
  },
  {
    id: 'no-notification',
    name: 'No notification',
    trigger: 'No notification',
    notifies: 'nobody',
    usedBy: '0 programs',
    modified: '11 Jan 2026',
  },
]

export function AlertsListPage() {
  const [search, setSearch] = useState('')

  const rows = useMemo(
    () => ALERTS.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--lyra-color-bg-surface-base)' }}>
      <ListPageHeader title="Alerts" breadcrumb="Library" actionLabel="Set new alert" />
      <div className="flex-1 overflow-auto" style={{ background: 'var(--lyra-color-bg-surface-base)', padding: 'var(--space-7)' }}>
        <p style={{ margin: '0 0 var(--space-7)', font: '400 14px/20px var(--font-sans)', color: 'var(--lyra-color-fg-default)', maxWidth: 640 }}>
          Who gets told when a response needs attention. Reusable sets, selectable by any program. Notification only — nothing is resolved automatically.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search alerts" />
        </div>

        <GridPanel>
        <GridToolbar label="Alerts" shown={rows.length} total={ALERTS.length} />
        <TableShell>
          <thead>
            <tr>
              <Th>Alert name</Th>
              <Th>Trigger</Th>
              <Th>Notifies</Th>
              <Th>Used by</Th>
              <Th>Modified</Th>
              <Th align="right" width={40}>{''}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={6} message="No alerts match your search." />}
            {rows.map(a => (
              <tr
                key={a.id}
                style={{ borderBottom: '1px solid var(--lyra-color-border-subtle)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--lyra-color-state-bg-hover-opacity)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <Td><span style={{ fontWeight: 500, color: 'var(--lyra-color-fg-link)' }}>{a.name}</span></Td>
                <Td>{a.trigger}</Td>
                <Td>{a.notifies}</Td>
                <Td>{a.usedBy}</Td>
                <Td>{a.modified}</Td>
                <Td align="right"><RowKebabMenu /></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        </GridPanel>
      </div>
    </div>
  )
}
