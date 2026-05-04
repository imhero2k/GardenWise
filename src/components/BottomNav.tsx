import { Link, NavLink } from 'react-router-dom'
import { IconBook, IconHome, IconLeaf, IconMap, IconPlanner, IconSearch, IconSprout } from './Icons'
import logoImg from '../assets/logo.png'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`

const homeLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkClass({ isActive })} bottom-nav__link--home`

type MenuItem = { to: string; label: string }

const WEED_MENU: MenuItem[] = [
  { to: '/weed#top-weeds', label: 'Top weeds' },
  { to: '/weed#weed-checker', label: 'Weed checker' },
  { to: '/weed#prohibited', label: 'State prohibited weeds' },
  { to: '/weed#rules', label: 'General rules' },
  { to: '/weed#disposal', label: 'Disposal guide' },
]

const BEGINNER_MENU: MenuItem[] = [
  { to: '/beginners#your-space', label: 'Read your garden' },
  { to: '/beginners#plan-small', label: 'Start small' },
  { to: '/beginners#planting', label: 'Plant & mulch' },
  { to: '/beginners#watering', label: 'Watering' },
  { to: '/beginners#ongoing-care', label: 'Ongoing care' },
]

const LEARN_MENU: MenuItem[] = [
  { to: '/learn#native', label: 'Native plants 101' },
  { to: '/learn#invasive', label: 'Weeds 101 (invasive plants)' },
]

function NavMenu({ items }: { items: MenuItem[] }) {
  return (
    <div className="bottom-nav__menu" role="menu">
      {items.map((it) => (
        <Link key={it.to} to={it.to} className="bottom-nav__menu-item" role="menuitem">
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
      </div>
    </nav>
  )
}
