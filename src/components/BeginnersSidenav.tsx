import { NavLink } from 'react-router-dom'
import type { Tutorial } from '../pages/beginners/tutorials'

const stepLinkClass = ({ isActive }: { isActive: boolean }) =>
  `beginners-sidenav__link${isActive ? ' beginners-sidenav__link--active' : ''}`

type BeginnersSidenavProps = {
  sectionTitle: string
  indexTo: string
  indexLabel: string
  tutorials: Tutorial[]
  crossLink?: { to: string; label: string }
}

export function BeginnersSidenav({
  sectionTitle,
  indexTo,
  indexLabel,
  tutorials,
  crossLink,
}: BeginnersSidenavProps) {
  return (
    <aside className="beginners-sidenav" aria-label={`${sectionTitle} navigation`}>
      <p className="beginners-sidenav__title">{sectionTitle}</p>
      <NavLink to={indexTo} className={stepLinkClass} end>
        {indexLabel}
      </NavLink>
      {tutorials.map((t) => (
        <NavLink key={t.id} to={`/beginners/${t.id}`} className={stepLinkClass}>
          {t.title}
        </NavLink>
      ))}
      {crossLink ? (
        <NavLink to={crossLink.to} className={stepLinkClass} end>
          {crossLink.label}
        </NavLink>
      ) : null}
    </aside>
  )
}
