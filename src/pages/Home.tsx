import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TrophyIcon, PlusIcon, UserGroupIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <TrophyIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-green-800 mb-2">Cricket Scorecard</h1>
        <p className="text-slate-600">Manage your practice matches with ease.</p>
      </div>

      <div className="space-y-4">
        <Link to="/fixtures" className="flex items-center justify-center bg-green-700 text-white p-4 rounded-lg hover:bg-green-600 transition-colors shadow-md">
          <UserGroupIcon className="h-6 w-6 mr-3" />
          View Fixtures
        </Link>
        <Link to="/teams" className="flex items-center justify-center bg-yellow-500 text-green-800 p-4 rounded-lg hover:bg-yellow-400 transition-colors shadow-md">
          <PlusIcon className="h-6 w-6 mr-3" />
          Manage Teams
        </Link>
        <Link to="/new-match" className="flex items-center justify-center bg-green-600 text-white p-4 rounded-lg hover:bg-green-500 transition-colors shadow-md">
          <UserGroupIcon className="h-6 w-6 mr-3" />
          Start New Match
        </Link>
      </div>

      <div className="text-center">
        {user ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Logged in as {user.email}</p>
            <button onClick={signOut} className="flex items-center justify-center text-green-600 hover:text-green-800 mx-auto">
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              Sign Out
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