import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Fixtures from './pages/Fixtures'
import NewFixture from './pages/NewFixture'
import NewMatch from './pages/NewMatch'
import Match from './pages/Match'
import Teams from './pages/Teams'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-yellow-50 text-slate-900">
          <header className="bg-green-800 text-white p-4 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-3 text-white">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow-300 text-green-800 shadow-md">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <span className="text-lg font-semibold">NC Bulls Cricket Club</span>
              </Link>
              <span className="text-sm font-semibold">Sponsored By</span>
            </div>
          </header>
          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/new-fixture" element={<NewFixture />} />
              <Route path="/new-match" element={<NewMatch />} />
              <Route path="/match/:id" element={<Match />} />
            </Routes>
          </main>
          <footer className="bg-green-700 text-white p-4 text-center">
            <a href="https://ncbullscricketclub.com" className="text-yellow-300 hover:text-yellow-200 transition-colors">Visit NC Bulls Cricket Club</a>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
