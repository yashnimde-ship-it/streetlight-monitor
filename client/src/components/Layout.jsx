import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/lights', label: 'Streetlights', icon: 'list' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/maintenance', label: 'Maintenance', icon: 'wrench' },
  { to: '/reports', label: 'Reports', icon: 'report' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-[1500] flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 print:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="rounded-lg bg-amber-500 p-1.5 text-slate-900">
            <Icon name="bulb" className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-white">StreetLight</p>
            <p className="text-xs text-slate-400">Monitor</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-amber-400' : 'hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-xs text-slate-500">Churchgate → Virar · IDEA Lab-V</p>
      </aside>

      {open && (
        <div className="fixed inset-0 z-[1400] bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-[1300] flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8 print:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <div className="flex-1" />
          <span className="hidden text-sm text-slate-600 sm:block">{user?.name}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            <Icon name="logout" className="h-4 w-4" />
            Log out
          </button>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-8">
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
