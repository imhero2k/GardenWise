import type { ReactNode, MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { scrollPageToTop } from '../lib/scroll'

/** Footer link to a full page (no hash). Always lands at the top of the target page. */
export function FooterPageLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (to.includes('#')) return

    e.preventDefault()
    const samePath = location.pathname === to
    navigate(to, { replace: samePath })
    requestAnimationFrame(() => scrollPageToTop())
  }

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
