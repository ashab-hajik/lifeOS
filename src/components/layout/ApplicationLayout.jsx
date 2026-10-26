import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Command,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Search,
  Sparkles,
} from 'lucide-react';
import { useLife } from '../../context/LifeContext.jsx';
import { Avatar, SearchBar } from '../common/Display.jsx';
import { nav } from '../../utils/navigation.js';
import { cx } from '../../utils/classNames.js';

export function ApplicationLayout({ mobile, setMobile }) {
  const { user, data, notify, signOut } = useLife();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const page = nav.find((item) => item[1] === location.pathname)?.[0] || 'Overview';

  async function handleLogout() {
    try {
      await signOut();
      setMobile(false);
      notify('You have been signed out.');
      navigate('/login', { replace: true });
    } catch (error) {
      notify(error.message || 'Could not sign out. Please try again.');
    }
  }

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', collapsed && 'sidebar-collapsed', mobile && 'sidebar-mobile')}>
        <div className="side-brand">
          <div className="brand-icon"><Command size={18} /></div>
          {!collapsed && <span>life<span className="accent">os</span></span>}
          <button
            className="collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(([name, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobile(false)}
              end={path === '/'}
              className={({ isActive }) => cx('nav-link', isActive && 'active')}
              title={name}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === 'Tasks' && data?.tasks?.filter((task) => task.status !== 'Completed').length > 0 && (
                <em>{data.tasks.filter((task) => task.status !== 'Completed').length}</em>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="focus-card">
            <div className="focus-icon"><Sparkles size={16} /></div>
            {!collapsed && <div><b>Stay in your flow</b><span>Small steps add up.</span></div>}
            <ArrowUpRight size={15} className="focus-arrow" />
          </div>
          <button className="profile-row" onClick={() => navigate('/settings')} title="Account settings">
            <Avatar name={user.fullName} />
            {!collapsed && <>
              <span className="profile-name"><b>{user.fullName}</b><small>Personal workspace</small></span>
              <MoreHorizontal size={17} />
            </>}
          </button>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {mobile && <div className="mobile-scrim" onClick={() => setMobile(false)} />}
      <main className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(!mobile)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{page}</b></div>
          <div className="top-actions">
            <div className="today-pill">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button className="icon-button search-button" onClick={() => setSearch(!search)} title="Search">
              <Search size={18} />
            </button>
            <button className="icon-button notification" title="Notifications" onClick={() => notify('You’re all caught up.')}>
              <span /> <Activity size={18} />
            </button>
            <button className="top-avatar" onClick={() => navigate('/settings')} aria-label="Account settings">
              <Avatar name={user.fullName} />
            </button>
          </div>
        </header>
        {search && <SearchBar close={() => setSearch(false)} />}
        <section className="page-content"><Outlet /></section>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} LifeOS</span>
          <span>Made for a more intentional life <span className="footer-heart">✳</span></span>
        </footer>
      </main>
    </div>
  );
}
