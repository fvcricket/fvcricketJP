import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchFixtures()
  }, [])

  useEffect(() => {
    const fixtureId = searchParams.get('fixture')
    if (fixtureId) {
      setSelectedFixture(fixtureId)
    }
  }, [searchParams])

  const fetchFixtures = async () => {
    const { data } = await supabase.from('fixtures').select('*')
    setFixtures(data || [])
  }

  const startMatch = async () => {
    if (!selectedFixture || !tossWinner || !electedToBat || !user) {
      setError('Please select fixture, toss winner, and batting choice.')
      return
    }

    const fixture = fixtures.find(f => f.id === selectedFixture)
    if (!fixture) {
      setError('Selected fixture not found.')
      return
    }

    setError('')

    const playerInserts = [
      ...team1Players.map(playerName => ({ name: playerName, team: fixture.team1, created_by: user.id })),
      ...team2Players.map(playerName => ({ name: playerName, team: fixture.team2, created_by: user.id }))
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
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Start New Match</h1>
      </div>
      <div className="space-y-4">
        <select
          value={selectedFixture}
          onChange={(e) => setSelectedFixture(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Toss won by</option>
              <option value={selectedFixtureData.team1}>{selectedFixtureData.team1}</option>
              <option value={selectedFixtureData.team2}>{selectedFixtureData.team2}</option>
            </select>

            <select
              value={electedToBat}
              onChange={(e) => setElectedToBat(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Elected to</option>
              <option value="bat">Bat</option>
              <option value="bowl">Bowl</option>
            </select>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h2 className="text-sm font-semibold text-green-800 mb-2">Add players to each team (optional)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{selectedFixtureData.team1} players</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={team1PlayerName}
                      onChange={(e) => setTeam1PlayerName(e.target.value)}
                      className="flex-1 p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!team1PlayerName.trim()) return
                        setTeam1Players(prev => [...prev, team1PlayerName.trim()])
                        setTeam1PlayerName('')
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 font-semibold"
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Player name"
                      value={team2PlayerName}
                      onChange={(e) => setTeam2PlayerName(e.target.value)}
                      className="flex-1 p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!team2PlayerName.trim()) return
                        setTeam2Players(prev => [...prev, team2PlayerName.trim()])
                        setTeam2PlayerName('')
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 font-semibold"
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

        {error && <p className="text-red-500 text-center">{error}</p>}
        <button
          onClick={startMatch}
          disabled={!selectedFixture || !tossWinner || !electedToBat}
          className="w-full bg-yellow-500 text-green-800 p-3 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Start Match
        </button>
      </div>
    </div>
  )
}