import type { MouseEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BEGINNER_RESOURCES_HASH,
  BEGINNER_RESOURCES_PATH,
  scrollToBeginnerResources,
} from '../lib/beginnerResourcesNav'
import {
  IconAbout,
  IconBook,
  IconHome,
  IconLeaf,
  IconMap,
  IconPlanner,
  IconSearch,
  IconSprout,
} from './Icons'
import logoImg from '../assets/logo.png'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`

const homeLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkClass({ isActive })} bottom-nav__link--home`

type MenuItem = { to: string; label: string }

const WEED_MENU: MenuItem[] = [
  { to: '/weed#weed-checker', label: 'Plant identifier' },
  { to: '/weed#top-weeds', label: 'Top weeds' },
  { to: '/weed#rules', label: 'General rules' },
  { to: '/weed#disposal', label: 'Disposal guide' },
  { to: '/weed#prohibited', label: 'State prohibited weeds' },
]

const BEGINNER_MENU: MenuItem[] = [
  { to: '/beginners/your-space', label: 'Read your garden' },
  { to: '/beginners/establish-potted', label: 'Establish potted plant' },
  { to: '/beginners/mulching', label: 'Mulching guide' },
  { to: '/beginners/watering-guide', label: 'Watering guide' },
  { to: '/beginners/attract-birds', label: 'Attracting birds' },
  { to: '/beginners/attract-insects', label: 'Attracting insects' },
  { to: '/beginners/attract-small-mammals', label: 'Attracting small mammals' },
  { to: BEGINNER_RESOURCES_PATH, label: 'More help & resources' },
]

const LEARN_MENU: MenuItem[] = [
  { to: '/learn#native', label: 'Native plants 101' },
  { to: '/learn#environmental-weeds', label: 'Weeds 101 (environmental weeds)' },
]

function NavMenu({ items }: { items: MenuItem[] }) {
  const location = useLocation()
  const navigate = useNavigate()

  const onItemClick = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (to !== BEGINNER_RESOURCES_PATH || location.pathname !== '/beginners') return
    e.preventDefault()
    if (location.hash.replace(/^#/, '') !== BEGINNER_RESOURCES_HASH) {
      navigate({ pathname: '/beginners', hash: BEGINNER_RESOURCES_HASH })
    }
    requestAnimationFrame(() => scrollToBeginnerResources())
  }

  return (
    <div className="bottom-nav__menu" role="menu">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="bottom-nav__menu-item"
          role="menuitem"
          onClick={onItemClick(it.to)}
        >
          {it.label}
        </Link>
      ))}
    </div>
  )
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav__inner">
        <NavLink to="/" end className={homeLinkClass}>
          <img src={logoImg} alt="" className="bottom-nav__logo" aria-hidden="true" />
          <span className="bottom-nav__brand">RootVio</span>
          <IconHome />
          <span>Home</span>
        </NavLink>
        <div className="bottom-nav__right" aria-label="Primary links">
          <NavLink to="/plants" className={linkClass}>
            <IconSearch />
            <span>PlantMe</span>
          </NavLink>
          <div className="bottom-nav__item bottom-nav__item--has-menu">
            <NavLink to="/weed" className={linkClass}>
              <IconLeaf />
              <span>Weeds</span>
            </NavLink>
            <NavMenu items={WEED_MENU} />
          </div>
          <NavLink to="/planner" className={linkClass}>
            <IconPlanner />
            <span>Planner</span>
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            <IconMap />
            <span>Map</span>
          </NavLink>
          <div className="bottom-nav__item bottom-nav__item--has-menu">
            <NavLink to="/beginners" className={linkClass} title="Beginner gardening tutorials">
              <IconSprout />
              <span>Basics</span>
            </NavLink>
            <NavMenu items={BEGINNER_MENU} />
          </div>
          <div className="bottom-nav__item bottom-nav__item--has-menu">
            <NavLink to="/learn" className={linkClass}>
              <IconBook />
              <span>Learn</span>
            </NavLink>
            <NavMenu items={LEARN_MENU} />
          </div>
          <NavLink to="/about" className={linkClass}>
            <IconAbout />
            <span>About</span>
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
