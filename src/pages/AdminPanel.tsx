import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, TrashIcon, FunnelIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth, type UserRole } from '../contexts/AuthContext'

interface MatchItem {
  id: string
  code: string
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  fixture: {
    name: string
    team1: string
    team2: string
  }
}

interface ProfileItem {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, role, isAdmin, isSuperAdmin } = useAuth()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MatchItem['status']>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    void Promise.all([fetchMatches(), fetchProfiles()]).finally(() => setLoading(false))
  }, [])

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('id, code, status, created_at, fixture:fixtures(name, team1, team2)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message || 'Unable to load scorecards')
      return
    }

    setMatches((data as unknown as MatchItem[]) || [])
  }

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message || 'Unable to load user roles')
      return
    }

    setProfiles(((data || []) as ProfileItem[]).map((profile) => ({
      ...profile,
      role: profile.role || 'user'
    })))
  }

  const updateUserRole = async (targetUserId: string, nextRole: UserRole) => {
    if (!isAdmin) {
      setError('Only admin or superadmin can update roles')
      return
    }

    const current = profiles.find((profile) => profile.id === targetUserId)
    if (!current) return

    if (!isSuperAdmin && current.role === 'superadmin') {
      setError('Only superadmin can edit another superadmin role')
      return
    }

    if (!isSuperAdmin && nextRole === 'superadmin') {
      setError('Only superadmin can assign superadmin role')
      return
    }

    setUpdatingUserId(targetUserId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', targetUserId)

    if (error) {
      setError(error.message || 'Unable to update user role')
      setUpdatingUserId('')
      return
    }

    setProfiles((prev) => prev.map((profile) => (profile.id === targetUserId ? { ...profile, role: nextRole } : profile)))
    setUpdatingUserId('')
  }

  const deleteMatch = async (matchId: string) => {
    if (!isAdmin) {
      setError('Only admin or superadmin can delete scorecards')
      return
    }

    const confirmed = window.confirm('Delete this scorecard? This cannot be undone.')
    if (!confirmed) return

    setDeletingId(matchId)
    const { error } = await supabase.from('matches').delete().eq('id', matchId)

    if (error) {
      setError(error.message || 'Unable to delete scorecard')
      setDeletingId('')
      return
    }

    setError('')
    await fetchMatches()
    setDeletingId('')
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredMatches = matches.filter((match) => {
    const statusMatches = statusFilter === 'all' || match.status === statusFilter
    if (!statusMatches) return false

    if (!normalizedSearch) return true

    const haystack = [
      match.code,
      match.status,
      match.fixture?.name,
      match.fixture?.team1,
      match.fixture?.team2
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  const activeCount = matches.filter((match) => match.status === 'active').length
  const completedCount = matches.filter((match) => match.status === 'completed').length

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
            <ArrowLeftIcon className="h-5 w-5 text-green-700" />
          </button>
          <h1 className="text-2xl font-bold text-green-900">Admin Scorecard Panel</h1>
        </div>
        <p className="text-red-600">Only admin and superadmin can access this panel.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-900">Admin Scorecard Panel</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Matches</p>
          <p className="mt-1 text-2xl font-bold text-green-900">{matches.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{completedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-800 font-semibold">
          <FunnelIcon className="h-5 w-5" />
          Manage Scorecards
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <label className="relative block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by fixture, team or code"
              className="w-full rounded-xl border border-green-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-green-500"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | MatchItem['status'])}
            className="rounded-xl border border-green-200 px-4 py-3 text-sm outline-none focus:border-green-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-green-900 font-semibold">Manage User Roles</h2>
          <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-1">Your role: {role}</span>
        </div>
        <div className="space-y-2">
          {profiles.length === 0 && !loading && <p className="text-sm text-slate-500">No users found.</p>}
          {profiles.map((profile) => {
            const isSelf = profile.id === user?.id
            const disableRoleChange =
              updatingUserId === profile.id ||
              (!isSuperAdmin && profile.role === 'superadmin') ||
              (!isSuperAdmin && isSelf)

            return (
              <div key={profile.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800">{profile.full_name || profile.email}</p>
                  <p className="text-xs text-slate-500">{profile.email}</p>
                </div>
                <select
                  value={profile.role}
                  disabled={disableRoleChange}
                  onChange={(e) => void updateUserRole(profile.id, e.target.value as UserRole)}
                  className="rounded-xl border border-green-200 px-3 py-2 text-sm outline-none focus:border-green-500 disabled:opacity-60"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  {isSuperAdmin && <option value="superadmin">superadmin</option>}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-slate-600">Loading scorecards...</p>}

      <div className="space-y-3">
        {!loading && filteredMatches.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-green-200 p-5 text-sm text-slate-500 text-center">
            No scorecards matched the current filter.
          </div>
        )}

        {filteredMatches.map((match) => (
          <div key={match.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">{match.fixture?.name || 'Practice Match'}</p>
              <p className="text-sm text-slate-600">{match.fixture?.team1} vs {match.fixture?.team2}</p>
              <p className="text-xs text-slate-500">Code: {match.code} | Status: {match.status}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/match/${match.id}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 text-sm font-semibold"
              >
                <EyeIcon className="h-4 w-4" />
                Open
              </Link>
              <button
                onClick={() => deleteMatch(match.id)}
                disabled={deletingId === match.id}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-sm font-semibold disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {deletingId === match.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
