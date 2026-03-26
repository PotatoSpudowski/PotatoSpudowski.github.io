import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="logo" title="Home">
          <img src="/potato.svg" alt="Potato" className="potato-icon" />
        </Link>
        <div className="nav-links">
          <Link
            to="/articles"
            className={`nav-link${pathname.startsWith('/articles') ? ' active' : ''}`}
          >
            Articles
          </Link>
        </div>
      </div>
    </nav>
  )
}
