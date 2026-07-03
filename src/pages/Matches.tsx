import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CalendarIcon, PlayIcon, ClipboardDocumentListIcon, TrashIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface MatchItem {
  id: string
  code: string
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  current_scorer?: string | null
  fixture: {
    name: string
    team1: string
    team2: string
    overs: number
  }
}

export default function Matches() {
  const navigate = useNavigate()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  useEffect(() => {
    if (authLoading) return
    void fetchMatches()
  }, [authLoading])

  useEffect(() => {
    const onFocus = () => {
      if (!authLoading) {
        void fetchMatches()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [authLoading])

  const fetchMatches = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('id, code, status, created_at, current_scorer, fixture:fixtures(name, team1, team2, overs)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message || 'Unable to load matches')
      setLoading(false)
      return
    }

    setMatches((data as unknown as MatchItem[]) || [])
    setLoading(false)
  }

  const canDeleteMatch = (match: MatchItem) => {
    if (!user) return false
    return isAdmin || match.current_scorer === user.id
  }

  const deleteMatch = async (matchId: string) => {
    const confirmed = window.confirm('Delete this match and scorecard? This cannot be undone.')
    if (!confirmed) return

    setDeletingId(matchId)
    const { error } = await supabase.from('matches').delete().eq('id', matchId)
    if (error) {
      setError(error.message || 'Unable to delete match')
      setDeletingId('')
      return
    }

    setError('')
    setDeletingId('')
    await fetchMatches()
  }

  const activeMatches = matches.filter((item) => item.status === 'active')
  const savedMatches = matches.filter((item) => item.status === 'completed')

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-900">Saved And Resume Matches</h1>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-slate-600">Loading matches...</p>}

      <section className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-800 font-semibold">
          <PlayIcon className="h-5 w-5" />
          Active Matches (Resume)
        </div>

        {activeMatches.length === 0 && <p className="text-sm text-slate-500">No active matches to resume.</p>}

        {activeMatches.map((match) => (
          <div key={match.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{match.fixture?.name || 'Practice Match'}</p>
                <p className="text-sm text-slate-600">{match.fixture?.team1} vs {match.fixture?.team2}</p>
                <p className="text-xs text-slate-500">Code: {match.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/match/${match.id}`} className="px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 font-medium">
                  Resume
                </Link>
                {canDeleteMatch(match) && (
                  <button
                    onClick={() => void deleteMatch(match.id)}
                    disabled={deletingId === match.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deletingId === match.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-800 font-semibold">
          <ClipboardDocumentListIcon className="h-5 w-5" />
          Saved Scorecards
        </div>

        {savedMatches.length === 0 && <p className="text-sm text-slate-500">No saved scorecards yet.</p>}

        {savedMatches.map((match) => (
          <div key={match.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{match.fixture?.name || 'Practice Match'}</p>
                <p className="text-sm text-slate-600">{match.fixture?.team1} vs {match.fixture?.team2}</p>
                <div className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(match.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/match/${match.id}`} className="px-4 py-2 rounded-xl bg-yellow-500 text-green-900 hover:bg-yellow-400 font-medium">
                  View
                </Link>
                {canDeleteMatch(match) && (
                  <button
                    onClick={() => void deleteMatch(match.id)}
                    disabled={deletingId === match.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deletingId === match.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
