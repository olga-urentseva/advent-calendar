import { Link } from 'react-router-dom'
import Cloud from './Cloud'
import './styles.css'

export function Header() {
  return (
    <>
      <header className="header">
        <div className="header__content">
          <div className="header__logo">
            <Link to="/" className="header__logo-link">
              <span className="header__logo-icon">🎄</span>
              <span className="header__logo-text">Magic Advent Calendar</span>
            </Link>
          </div>
          <nav className="header__nav">
            <Link to="/create" className="header__nav-link">Create Calendar</Link>
            <Link to="/view" className="header__nav-link">View Calendar</Link>
            <Link to="/about" className="header__nav-link">About</Link>
          </nav>
        </div>
      </header>
      <Cloud />
    </>
  )
}
