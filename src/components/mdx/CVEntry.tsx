import type { ReactNode, ReactElement } from 'react'
import Link from 'next/link'
import { CalendarBlank, MapPin, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'

const ENTRY_LINK_CLASS =
  'inline-flex items-center gap-1.5 text-sm font-light text-xmb-fg/70 underline underline-offset-4 decoration-xmb-fg/20 hover:text-xmb-fg/90 hover:decoration-xmb-fg/60 transition-all duration-300'

export interface CVEntryLink {
  label: string
  href: string
}

export interface CVEntryProps {
  /** Role, workshop, or talk title. */
  title: string
  /** Employer, organization, or event name. */
  org: string
  /** Pre-formatted, rendered verbatim — e.g. "May 2024 – Present". */
  dateRange: string
  location?: string
  /** Turns the org name into an external link. */
  orgHref?: string
  /** Labeled links; "/"-prefixed hrefs render via next/link, others as external anchors. */
  links?: CVEntryLink[]
  /** Description bullets, authored as a markdown list in cv.mdx. */
  children?: ReactNode
}

export function CVEntry({
  title,
  org,
  dateRange,
  location,
  orgHref,
  links,
  children,
}: CVEntryProps): ReactElement {
  return (
    <article className="my-10 border-l-2 border-xmb-fg/15 pl-6 md:pl-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-6">
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-light text-xmb-fg/90 tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-base md:text-lg font-extralight text-xmb-fg/60">
            {orgHref ? (
              <a
                href={orgHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 decoration-xmb-fg/20 hover:decoration-xmb-fg/60 transition-all duration-300"
              >
                {org}
              </a>
            ) : (
              org
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-row flex-wrap gap-x-5 gap-y-1 text-xs font-mono uppercase tracking-widest text-xmb-fg/40 md:flex-col md:items-end md:gap-1">
          <span className="inline-flex items-center gap-2">
            <CalendarBlank size={14} weight="duotone" aria-hidden />
            {dateRange}
          </span>
          {location && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} weight="duotone" aria-hidden />
              {location}
            </span>
          )}
        </div>
      </div>

      {/* Bullets flow through the global mdx ul/li map; the overrides drop the
          trailing margin and step the type down for CV density. */}
      {children && (
        <div className="mt-5 [&>ul]:mb-0 [&>ul]:space-y-2 [&>ul]:text-base [&>p]:mb-0 [&>p]:text-base">
          {children}
        </div>
      )}

      {links && links.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-xmb-fg/30">
            Links
          </span>
          {links.map(({ label, href }) =>
            href.startsWith('/') ? (
              <Link key={href} href={href} className={ENTRY_LINK_CLASS}>
                {label}
              </Link>
            ) : (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={ENTRY_LINK_CLASS}
              >
                {label}
                <ArrowUpRight size={13} weight="bold" aria-hidden />
              </a>
            )
          )}
        </div>
      )}
    </article>
  )
}
