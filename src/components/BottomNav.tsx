import { NavLink } from 'react-router-dom'
import { IconBook, IconHome, IconLeaf, IconMap, IconSearch } from './Icons'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/" end className={linkClass}>
        <IconHome />
        <span>Home</span>
      </NavLink>
      <NavLink to="/plants" className={linkClass}>
        <IconSearch />
        <span>PlantMe</span>
      </NavLink>
      <NavLink to="/weed" className={linkClass}>
        <IconLeaf />
        <span>Weeds</span>
      </NavLink>
      <NavLink to="/map" className={linkClass}>
        <IconMap />
        <span>Map</span>
      </NavLink>
      <NavLink to="/learn" className={linkClass}>
        <IconBook />
        <span>Learn</span>
      </NavLink>
    </nav>
  )
}
