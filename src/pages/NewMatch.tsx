import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Fixture {
  id: string
  name: string
  team1: string
  team2: string
}

export default function NewMatch() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [selectedFixture, setSelectedFixture] = useState<string>('')
  const [tossWinner, setTossWinner] = useState('')
  const [electedToBat, setElectedToBat] = useState('')
  const [team1PlayerName, setTeam1PlayerName] = useState('')
  const [team2PlayerName, setTeam2PlayerName] = useState('')
  const [team1Players, setTeam1Players] = useState<string[]>([])
  const [team2Players, setTeam2Players] = useState<string[]>([])
  const [existingTeam1Players, setExistingTeam1Players] = useState<string[]>([])
  const [existingTeam2Players, setExistingTeam2Players] = useState<string[]>([])
  const [error, setError] = useState('')
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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

  useEffect(() => {
    const fixtureId = searchParams.get('fixture')
    if (fixtureId) {
      setSelectedFixture(fixtureId)
    }
  }, [searchParams])

  useEffect(() => {
    const selected = fixtures.find((fixture) => fixture.id === selectedFixture)
    if (!selected) {
      setExistingTeam1Players([])
      setExistingTeam2Players([])
      return
    }

    void fetchExistingPlayers(selected.team1, selected.team2)
  }, [selectedFixture, fixtures])

  const fetchFixtures = async () => {
    const { data, error } = await supabase.from('fixtures').select('*')
    if (error) {
      setError(error.message || 'Unable to load fixtures')
      return
    }

    setFixtures(data || [])
    setError('')
  }

  const fetchExistingPlayers = async (team1Name: string, team2Name: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('name, team')
      .in('team', [team1Name, team2Name])
      .order('name')

    if (error) {
      setError(error.message || 'Unable to load existing players')
      return
    }

    const rows = data || []
    setExistingTeam1Players(rows.filter((player) => player.team === team1Name).map((player) => player.name))
    setExistingTeam2Players(rows.filter((player) => player.team === team2Name).map((player) => player.name))
  }

  const startMatch = async () => {
    if (!selectedFixture || !tossWinner || !electedToBat) {
      setError('Please select fixture, toss winner, and batting choice.')
      return
    }

    if (!user) {
      setError('You must be signed in to start a match. Please sign in and try again.')
      return
    }

    const { data: existingActive, error: existingActiveError } = await supabase
      .from('matches')
      .select('id')
      .eq('fixture_id', selectedFixture)
      .eq('status', 'active')
      .limit(1)

    if (existingActiveError) {
      setError(existingActiveError.message || 'Unable to validate active match')
      return
    }

    if (existingActive && existingActive.length > 0) {
      setError('This fixture already has an active scorecard. Resuming existing match.')
      navigate(`/match/${existingActive[0].id}`)
      return
    }

    const fixture = fixtures.find(f => f.id === selectedFixture)
    if (!fixture) {
      setError('Selected fixture not found.')
      return
    }

    setError('')

    const uniqueTeam1Players = team1Players.filter((playerName) => !existingTeam1Players.includes(playerName))
    const uniqueTeam2Players = team2Players.filter((playerName) => !existingTeam2Players.includes(playerName))

    const playerInserts = [
      ...uniqueTeam1Players.map(playerName => ({ name: playerName, team: fixture.team1 })),
      ...uniqueTeam2Players.map(playerName => ({ name: playerName, team: fixture.team2 }))
    ]

    if (playerInserts.length > 0) {
      const { error: playerError } = await supabase.from('players').insert(playerInserts)
      if (playerError) {
        console.error('Player insert error:', playerError)
        setError(playerError.message || 'Unable to save team players')
        return
      }
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data, error } = await supabase
      .from('matches')
      .insert({
        fixture_id: selectedFixture,
        code,
        current_scorer: user.id,
        toss_winner: tossWinner,
        elected_to_bat: electedToBat
      })
      .select('*')

    if (error) {
      console.error('Match creation error:', error)
      setError(error.message || 'Unable to start match')
      return
    }

    const match = Array.isArray(data) ? data[0] : data
    if (!match || !match.id) {
      setError('Could not start match. Please try again.')
      return
    }

    navigate(`/match/${match.id}`)
  }

  const selectedFixtureData = fixtures.find(f => f.id === selectedFixture)

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Start New Match</h1>
      </div>
      <div className="space-y-4 bg-white rounded-2xl border border-green-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-green-900">Fixture</p>
          <Link
            to={user ? '/new-fixture' : '/login'}
            className="inline-flex items-center gap-1 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-yellow-400"
          >
            <PlusIcon className="h-4 w-4" />
            New Fixture
          </Link>
        </div>

        {fixtures.length === 0 && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 space-y-2">
            <p className="text-sm text-yellow-900">No fixtures found. Create a fixture before starting a match.</p>
            <Link
              to={user ? '/new-fixture' : '/login'}
              className="inline-flex items-center justify-center w-full rounded-xl bg-green-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
            >
              {user ? 'Create Fixture' : 'Sign In To Create Fixture'}
            </Link>
          </div>
        )}

        <select
          value={selectedFixture}
          onChange={(e) => setSelectedFixture(e.target.value)}
          className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
          disabled={fixtures.length === 0}
        >
          <option value="">Select a fixture</option>
          {fixtures.map(fixture => (
            <option key={fixture.id} value={fixture.id}>
              {fixture.name} - {fixture.team1} vs {fixture.team2}
            </option>
          ))}
        </select>

        {selectedFixtureData && (
          <>
            <select
              value={tossWinner}
              onChange={(e) => setTossWinner(e.target.value)}
              className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
            >
              <option value="">Toss won by</option>
              <option value={selectedFixtureData.team1}>{selectedFixtureData.team1}</option>
              <option value={selectedFixtureData.team2}>{selectedFixtureData.team2}</option>
            </select>

            <select
              value={electedToBat}
              onChange={(e) => setElectedToBat(e.target.value)}
              className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
            >
              <option value="">Elected to</option>
              <option value="bat">Bat</option>
              <option value="bowl">Bowl</option>
            </select>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <h2 className="text-sm font-semibold text-green-800 mb-2">Add players to each team (optional)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{selectedFixtureData.team1} players</label>
                  {existingTeam1Players.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {existingTeam1Players.map((player) => (
                        <span key={player} className="bg-white border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                          {player}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={team1PlayerName}
                      onChange={(e) => setTeam1PlayerName(e.target.value)}
                      className="flex-1 p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!team1PlayerName.trim()) return
                        setTeam1Players(prev => [...prev, team1PlayerName.trim()])
                        setTeam1PlayerName('')
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {team1Players.map((player, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{selectedFixtureData.team2} players</label>
                  {existingTeam2Players.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {existingTeam2Players.map((player) => (
                        <span key={player} className="bg-white border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                          {player}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={team2PlayerName}
                      onChange={(e) => setTeam2PlayerName(e.target.value)}
                      className="flex-1 p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!team2PlayerName.trim()) return
                        setTeam2Players(prev => [...prev, team2PlayerName.trim()])
                        setTeam2PlayerName('')
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 font-semibold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {team2Players.map((player, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {player}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!user && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            You must be <Link to="/login" className="font-semibold underline">signed in</Link> to start a match.
          </div>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button
          onClick={startMatch}
          disabled={!selectedFixture || !tossWinner || !electedToBat || !user}
          className="w-full bg-yellow-500 text-green-800 p-3.5 rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
        >
          Start Match
        </button>
      </div>
    </div>
  )
}