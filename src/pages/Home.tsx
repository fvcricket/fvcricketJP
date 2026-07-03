import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TrophyIcon, PlusIcon, UserGroupIcon, ArrowRightOnRectangleIcon, ClipboardDocumentListIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  const handleSignOut = async () => {
    setSignOutError('')
    setSigningOut(true)

    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err: any) {
      setSignOutError(err?.message || 'Unable to sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <TrophyIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-green-800 mb-2">Cricket Scorecard</h1>
        <p className="text-slate-600">Manage your practice matches with ease.</p>
      </div>

      <div className="space-y-4">
        <Link to="/fixtures" className="flex items-center justify-center bg-green-700 text-white p-4 rounded-2xl hover:bg-green-600 transition-colors shadow-md min-h-14 font-semibold text-base">
          <UserGroupIcon className="h-6 w-6 mr-3" />
          View Fixtures
        </Link>
        <Link to="/matches" className="flex items-center justify-center bg-white text-green-800 border border-green-200 p-4 rounded-2xl hover:bg-green-50 transition-colors shadow-sm min-h-14 font-semibold text-base">
          <ClipboardDocumentListIcon className="h-6 w-6 mr-3" />
          Resume / Saved Matches
        </Link>
        <Link to="/teams" className="flex items-center justify-center bg-yellow-500 text-green-800 p-4 rounded-2xl hover:bg-yellow-400 transition-colors shadow-md min-h-14 font-semibold text-base">
          <PlusIcon className="h-6 w-6 mr-3" />
          Manage Teams
        </Link>
        <Link to="/new-match" className="flex items-center justify-center bg-green-600 text-white p-4 rounded-2xl hover:bg-green-500 transition-colors shadow-md min-h-14 font-semibold text-base">
          <UserGroupIcon className="h-6 w-6 mr-3" />
          Start New Match
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center justify-center bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-md min-h-14 font-semibold text-base">
            <ShieldCheckIcon className="h-6 w-6 mr-3" />
            Admin Panel
          </Link>
        )}
      </div>

      <div className="text-center">
        {user ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Logged in as {user.email}</p>
            {signOutError && <p className="text-sm text-red-600">{signOutError}</p>}
            <button onClick={handleSignOut} disabled={signingOut} className="flex items-center justify-center text-green-600 hover:text-green-800 mx-auto disabled:opacity-60">
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link to="/login" className="block text-green-600 hover:text-green-800 font-semibold">Sign In</Link>
            <Link to="/signup" className="block text-slate-600 hover:text-slate-800">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  )
}