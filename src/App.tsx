import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom'
import {
  Bars3Icon,
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Fixtures from './pages/Fixtures'
import NewFixture from './pages/NewFixture'
import NewMatch from './pages/NewMatch'
import Match from './pages/Match'
import Teams from './pages/Teams'
import Matches from './pages/Matches'
import AdminPanel from './pages/AdminPanel'

function AppShell() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const logoSrc = `${import.meta.env.BASE_URL}cricket_playing.png`
  const navItems = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/fixtures', label: 'Fixtures', icon: CalendarDaysIcon },
    { to: '/matches', label: 'Scorecards', icon: ClipboardDocumentListIcon },
    { to: '/teams', label: 'Teams', icon: UserGroupIcon }
  ]
  if (isAdmin) {
    navItems.push({ to: '/admin', label: 'Admin', icon: ShieldCheckIcon })
  }
  const currentPath = location.pathname
  const breadcrumbParts = (() => {
    if (currentPath.startsWith('/match/')) {
      const matchId = currentPath.split('/').at(-1)
      return ['Home', 'Scorecards', matchId ? `Match ${matchId.slice(0, 6)}` : 'Match']
    }

    const breadcrumbMap: Record<string, string[]> = {
      '/': ['Home'],
      '/login': ['Home', 'Login'],
      '/signup': ['Home', 'Sign Up'],
      '/fixtures': ['Home', 'Fixtures'],
      '/new-fixture': ['Home', 'Fixtures', 'New Fixture'],
      '/new-match': ['Home', 'Fixtures', 'Start Match'],
      '/teams': ['Home', 'Teams'],
      '/matches': ['Home', 'Scorecards'],
      '/admin': ['Home', 'Admin']
    }

    return breadcrumbMap[currentPath] ?? ['Home']
  })()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [currentPath])

  return (
    <div
      className="min-h-screen flex flex-col text-slate-900 bg-cover bg-center"
      style={{
        backgroundImage:
          `linear-gradient(rgba(254, 249, 195, 0.95), rgba(240, 253, 244, 0.95)), url('${logoSrc}')`
      }}
    >
      <header className="bg-green-800/95 text-white p-4 shadow-lg backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <Link to="/" className="inline-flex min-w-0 items-center gap-3 text-white">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-yellow-300 bg-white/90 shadow-md">
              <img src={logoSrc} alt="Cricket" className="h-8 w-8 object-contain" />
            </span>
            <span className="text-lg font-semibold leading-tight">Practice Score Card</span>
          </Link>
          <div className="hidden min-w-0 text-right sm:block">
            <p className="text-[11px] uppercase tracking-[0.24em] text-yellow-200/90">Breadcrumb</p>
            <div className="mt-1 flex flex-wrap justify-end gap-1 text-[11px] sm:text-xs">
              {breadcrumbParts.map((part, index) => (
                <span
                  key={`${part}-${index}`}
                  className={`rounded-full px-2 py-1 ${
                    index === breadcrumbParts.length - 1 ? 'bg-yellow-400 text-green-900 font-semibold' : 'bg-white/12 text-white/90'
                  }`}
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2.5 text-white sm:hidden"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        <div className="mt-3 sm:hidden">
          <div className="flex flex-wrap gap-1 text-[11px]">
            {breadcrumbParts.map((part, index) => (
              <span
                key={`${part}-${index}-mobile`}
                className={`rounded-full px-2 py-1 ${
                  index === breadcrumbParts.length - 1 ? 'bg-yellow-400 text-green-900 font-semibold' : 'bg-white/12 text-white/90'
                }`}
              >
                {part}
              </span>
            ))}
          </div>
        </div>
      </header>
      <nav className="hidden z-30 border-b border-green-200 bg-white/95 backdrop-blur-sm sm:block">
        <div className="max-w-4xl mx-auto px-2 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-green-700 text-white' : 'bg-white text-green-800 hover:bg-green-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation overlay"
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[82vw] border-l border-green-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-green-100 px-4 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Menu</p>
                <p className="text-lg font-semibold text-green-900">Navigate</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-green-50 hover:text-green-800"
                aria-label="Close navigation menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2 p-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive ? 'bg-green-700 text-white' : 'bg-slate-50 text-green-900 hover:bg-green-50'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/new-fixture" element={<NewFixture />} />
            <Route path="/new-match" element={<NewMatch />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} />
            <Route path="/match/:id" element={<Match />} />
          </Routes>
        </div>
      </main>
      <footer className="mt-auto bg-green-900/95 text-white p-4 text-center space-y-1">
        <span className="text-sm font-semibold">Sponsored By</span>
        <div>
          <a
            href="https://ncbullscricketclub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-300 hover:text-yellow-200 transition-colors"
          >
            NC Bulls Cricket Club
          </a>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  )
}

export default App
