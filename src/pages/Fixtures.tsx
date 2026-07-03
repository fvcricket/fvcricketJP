import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, CalendarIcon, ArrowLeftIcon, UserGroupIcon, PencilIcon, CheckIcon, XMarkIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline'

interface Fixture {
  id: string
  name: string
  date: string
  team1: string
  team2: string
  overs: number
}

interface MatchStatus {
  id: string
  status: 'active' | 'completed' | 'abandoned'
  fixture_id: string
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [matchStatuses, setMatchStatuses] = useState<Record<string, MatchStatus>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editOvers, setEditOvers] = useState(20)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    void fetchFixtures()
  }, [authLoading])

  useEffect(() => {
    const onFocus = () => {
      if (!authLoading) {
        void fetchFixtures()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [authLoading])

  const fetchFixtures = async () => {
    const { data, error: fixturesError } = await supabase.from('fixtures').select('*').order('created_at', { ascending: false })
    if (fixturesError) {
      setError(fixturesError.message || 'Unable to load fixtures')
      return
    }

    const fixtureList = data || []
    setFixtures(fixtureList)
    setError('')

    if (fixtureList.length === 0) {
      setMatchStatuses({})
      return
    }

    const ids = fixtureList.map((f: Fixture) => f.id)
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, status, fixture_id')
      .in('fixture_id', ids)
      .order('created_at', { ascending: false })

    if (matchesError) {
      setError(matchesError.message || 'Unable to load fixture match status')
      return
    }

    // Keep only the most recent match per fixture
    const statusMap: Record<string, MatchStatus> = {}
    for (const match of (matches || []) as MatchStatus[]) {
      if (!statusMap[match.fixture_id]) {
        statusMap[match.fixture_id] = match
      }
    }
    setMatchStatuses(statusMap)
  }

  const startEditing = (fixture: Fixture) => {
    setEditingId(fixture.id)
    setEditName(fixture.name)
    setEditDate(fixture.date)
    setEditOvers(fixture.overs)
    setError('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setError('')
  }

  const saveFixture = async (fixtureId: string) => {
    if (editOvers < 1) {
      setError('Overs must be at least 1')
      return
    }
    if (!editName.trim()) {
      setError('Fixture name is required')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('fixtures')
      .update({ name: editName.trim(), date: editDate, overs: editOvers })
      .eq('id', fixtureId)

    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Unable to update fixture')
      return
    }

    setEditingId(null)
    setError('')
    await fetchFixtures()
  }
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="mb-2 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-3 p-2 rounded-full hover:bg-green-100">
            <ArrowLeftIcon className="h-6 w-6 text-green-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-green-800">Fixtures</h1>
            <p className="text-xs text-slate-500">Choose a fixture and start scoring quickly.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            to={user ? '/new-fixture' : '/login'}
            className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-green-900 px-3 py-2.5 rounded-xl hover:bg-yellow-400 font-semibold text-sm min-h-11"
          >
            <PlusIcon className="h-4 w-4" />
            {user ? 'Add' : 'Sign In'}
          </Link>
          <Link to="/teams" className="inline-flex items-center justify-center gap-2 bg-green-700 text-white px-3 py-2.5 rounded-xl hover:bg-green-600 font-semibold text-sm min-h-11">
            <UserGroupIcon className="h-4 w-4" />
            Teams
          </Link>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="space-y-3">
        {fixtures.map(fixture => (
          <div key={fixture.id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-green-200">
            {editingId === fixture.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Fixture name"
                  className="w-full p-2.5 border border-green-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full p-2.5 border border-green-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Overs per team</label>
                    <input
                      type="number"
                      min={1}
                      value={editOvers}
                      onChange={(e) => setEditOvers(Number(e.target.value))}
                      className="w-full p-2.5 border border-green-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">{fixture.team1} vs {fixture.team2}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void saveFixture(fixture.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 text-sm font-semibold disabled:opacity-60"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-semibold"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center mb-1">
                      <CalendarIcon className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                      <span className="font-semibold text-green-800 truncate">{fixture.name}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{fixture.team1} vs {fixture.team2}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">{fixture.overs} ov</span>
                    {user && (
                      <button
                        onClick={() => startEditing(fixture)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-700"
                        title="Edit fixture"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{new Date(fixture.date).toLocaleDateString()}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {(() => {
                    const ms = matchStatuses[fixture.id]
                    if (!ms) {
                      return (
                        <>
                          <span className="text-[11px] uppercase tracking-wide text-slate-400">No match yet</span>
                          <Link to={`/new-match?fixture=${fixture.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 font-semibold text-sm">
                            <PlayIcon className="h-4 w-4" />
                            Start Match
                          </Link>
                        </>
                      )
                    }
                    if (ms.status === 'active') {
                      return (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-semibold text-yellow-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                            Match in progress
                          </span>
                          <Link to={`/match/${ms.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-yellow-500 text-green-900 hover:bg-yellow-400 font-semibold text-sm">
                            <PlayIcon className="h-4 w-4" />
                            Resume
                          </Link>
                        </>
                      )
                    }
                    // completed or abandoned — view only, no new match
                    return (
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-800">
                          ✓ Match ended
                        </span>
                        <Link to={`/match/${ms.id}`} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm">
                          <EyeIcon className="h-4 w-4" />
                          View
                        </Link>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}