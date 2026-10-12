import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NavBar.css';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Chevron() {
  return (
    <svg className="nv-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Nav() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(null); // 'create' | 'user' | 'mobile' | null
  const [logoutError, setLogoutError] = useState('');
  const rootRef = useRef(null);

  // close any open menu on navigation, outside click or Escape
  useEffect(() => { setMenu(null); }, [location.pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await axios.post(`${BACKEND_URL}/logout`, {}, { withCredentials: true });
      setUser(null);
      setMenu(null);
      navigate('/login');
    } catch {
      setLogoutError('Could not log out. Please try again.');
    }
  };

  const toggle = (name) => setMenu((m) => (m === name ? null : name));
  const initials = `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase() || '?';
  const isAdmin = user?.role === 'admin';
  const linkClass = ({ isActive }) => `nv-link${isActive ? ' active' : ''}`;

  return (
    <header className="nv" ref={rootRef}>
      <div className="nv-inner">
        <Link to="/" className="nv-brand" aria-label="CodeArena home">
          <img src="/logo.png" alt="" />
          <span>Code<b>Arena</b></span>
        </Link>

        {user && (
          <nav className="nv-links" aria-label="Main">
            <NavLink to="/problems" className={linkClass}>Problems</NavLink>
            <NavLink to="/contests" className={linkClass}>Contests</NavLink>
          </nav>
        )}

        <div className="nv-spacer" />

        <div className="nv-right">
          {user ? (
            <>
              {isAdmin && (
                <div className="nv-dd">
                  <button className="nv-btn nv-btn-ghost" onClick={() => toggle('create')} aria-expanded={menu === 'create'} aria-haspopup="menu">
                    + Create <Chevron />
                  </button>
                  {menu === 'create' && (
                    <div className="nv-menu" role="menu">
                      <Link role="menuitem" to="/problems/new">New problem</Link>
                      <Link role="menuitem" to="/contests/new">New contest</Link>
                    </div>
                  )}
                </div>
              )}

              <div className="nv-dd">
                <button className="nv-user" onClick={() => toggle('user')} aria-expanded={menu === 'user'} aria-haspopup="menu" aria-label="Account menu">
                  <span className="nv-avatar">{initials}</span>
                  <span className="nv-username">{user.firstname}</span>
                  <Chevron />
                </button>
                {menu === 'user' && (
                  <div className="nv-menu nv-menu-right" role="menu">
                    <div className="nv-menu-head">
                      <strong>{user.firstname} {user.lastname}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link role="menuitem" to="/profile">My profile</Link>
                    <button role="menuitem" onClick={handleLogout}>Log out</button>
                    {logoutError && <p className="nv-menu-error" role="alert">{logoutError}</p>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nv-btn nv-btn-ghost">Log in</Link>
              <Link to="/signup" className="nv-btn nv-btn-primary">Sign up</Link>
            </>
          )}

          {user && (
            <button className="nv-burger" onClick={() => toggle('mobile')} aria-expanded={menu === 'mobile'} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
          )}
        </div>
      </div>

      {user && menu === 'mobile' && (
        <div className="nv-mobile">
          <NavLink to="/problems" className={linkClass}>Problems</NavLink>
          <NavLink to="/contests" className={linkClass}>Contests</NavLink>
          <NavLink to="/profile" className={linkClass}>My profile</NavLink>
          {isAdmin && (
            <>
              <NavLink to="/problems/new" className={linkClass}>New problem</NavLink>
              <NavLink to="/contests/new" className={linkClass}>New contest</NavLink>
            </>
          )}
          <button className="nv-link" onClick={handleLogout}>Log out</button>
          {logoutError && <p className="nv-menu-error" role="alert">{logoutError}</p>}
        </div>
      )}
    </header>
  );
}

export default Nav;
