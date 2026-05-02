import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, CalendarIcon, PlayIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

interface MatchItem {
  id: string
  code: string
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  fixture: {
    name: string
    team1: string
    team2: string
    overs: number
  }
}

export default function Matches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchMatches()
  }, [])

  const fetchMatches = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('matches')
      .select('id, code, status, created_at, fixture:fixtures(name, team1, team2, overs)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message || 'Unable to load matches')
      setLoading(false)
      return
    }

    setMatches((data as unknown as MatchItem[]) || [])
    setLoading(false)
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
              <Link to={`/match/${match.id}`} className="px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 font-medium">
                Resume
              </Link>
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
              <Link to={`/match/${match.id}`} className="px-4 py-2 rounded-xl bg-yellow-500 text-green-900 hover:bg-yellow-400 font-medium">
                View
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
