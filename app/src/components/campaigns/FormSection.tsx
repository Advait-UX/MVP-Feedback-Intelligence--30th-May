/**
 * FormSection — collapsible accordion-style form section.
 *
 * Matches the `.form-section` / `.form-section-head` / `.form-section-body`
 * CSS classes used in prototype.html, so the global stylesheet applies
 * the open/collapsed transitions automatically.
 *
 * Props
 *   num          — section number shown in the left badge circle
 *   title        — bold heading text
 *   sub          — optional subtitle below the heading
 *   defaultOpen  — whether the section starts expanded (default true)
 *   complete     — adds a "complete" class to the header (green check state)
 *   id           — optional id for scroll-to anchoring
 *   children     — body content
 */

import React, { useState } from 'react'

interface FormSectionProps {
  num: number | string
  title: string
  sub?: string
  defaultOpen?: boolean
  complete?: boolean
  id?: string
  children: React.ReactNode
}

export function FormSection({
  num,
  title,
  sub,
  defaultOpen = true,
  complete,
  id,
  children,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`form-section ${open ? '' : 'collapsed'}`} id={id}>
      <header
        className={`form-section-head ${complete ? 'complete' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="step-num">{num}</span>
        <div>
          <h3>{title}</h3>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
        <svg className="chev" viewBox="0 0 16 16">
          <path
            d="M3.5 6 8 10.5 12.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  )
}

export default FormSection
