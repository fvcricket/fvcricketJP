import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewFixture() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [overs, setOvers] = useState(20)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const addTeam1Player = () => {
    const player = team1PlayerName.trim()
    if (!player) return
    setTeam1Players(prev => [...prev, player])
    setTeam1PlayerName('')
  }

  const addTeam2Player = () => {
    const player = team2PlayerName.trim()
    if (!player) return
    setTeam2Players(prev => [...prev, player])
    setTeam2PlayerName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to create fixtures')
      return
    }

    if (!team1 || !team2) {
      setError('Please select both teams for the fixture')
      return
    }

    if (team1 === team2) {
      setError('Team 1 and Team 2 must be different')
      return
    }

    if (overs < 1) {
      setError('Overs must be at least 1')
      return
    }

    try {
      const { data: fixtureData, error: fixtureError } = await supabase
        .from('fixtures')
        .insert({
          name,
          date,
          team1,
          team2,
          overs,
          created_by: user.id
        })
        .select()
        .single()

      if (fixtureError) {
        console.error('Fixture creation error:', fixtureError)
        setError(fixtureError.message || 'Error creating fixture')
        return
      }

      const playerInserts = [
        ...team1Players.map(playerName => ({ name: playerName, team: team1, created_by: user.id })),
        ...team2Players.map(playerName => ({ name: playerName, team: team2, created_by: user.id }))
      ]

      if (playerInserts.length > 0) {
        const { error: playerError } = await supabase.from('players').insert(playerInserts)
        if (playerError) {
          console.error('Player insert error:', playerError)
          setError(playerError.message || 'Error adding players')
          return
        }
      }

      if (!fixtureData) {
        setError('Fixture created but unable to load data')
        return
      }

      navigate('/fixtures')
    } catch (err: any) {
      console.error('Fixture creation unexpected error:', err)
      setError(err?.message || 'Error creating fixture')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/fixtures')} className="mr-4 p-2 rounded-full hover:bg-green-100">
          <ArrowLeftIcon className="h-6 w-6 text-green-600" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Add New Fixture</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Fixture Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        <select
          value={team1}
          onChange={(e) => setTeam1(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">Select Team 1</option>
          {teams.map(team => (
            <option key={team.id} value={team.name}>{team.name}</option>
          ))}
        </select>

        <select
          value={team2}
          onChange={(e) => setTeam2(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">Select Team 2</option>
          {teams.map(team => (
            <option key={team.id} value={team.name}>{team.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Overs per team"
          value={overs}
          onChange={(e) => setOvers(Number(e.target.value))}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          min="1"
          required
        />
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button type="submit" className="w-full bg-yellow-500 text-green-800 p-3 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
          Create Fixture
        </button>
      </form>
    </div>
  )
}