import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Team {
  id: string
  name: string
}

export default function NewFixture() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [overs, setOvers] = useState(20)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('id, name').order('name')
    if (error) {
      setError(error.message || 'Unable to load teams')
      setLoading(false)
      return
    }

    setTeams(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to create fixtures')
      return
    }

    if (!team1 || !team2) {
      setError('Please select both teams')
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

    const { error: insertError } = await supabase.from('fixtures').insert({
      name,
      date,
      team1,
      team2,
      overs,
      created_by: user.id
    })

    if (insertError) {
      setError(insertError.message || 'Error creating fixture')
      return
    }

    navigate('/fixtures')
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/fixtures')} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Create Fixture</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-green-100 p-4">
        {loading ? (
          <p className="text-slate-600">Loading teams...</p>
        ) : teams.length < 2 ? (
          <div className="space-y-3">
            <p className="text-slate-700">Add at least 2 teams before creating a fixture.</p>
            <Link to="/teams" className="inline-flex items-center justify-center w-full bg-green-700 text-white p-3 rounded-xl hover:bg-green-600">
              Go To Team Management
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Fixture name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />

            <select
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Team 1</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>{team.name}</option>
              ))}
            </select>

            <select
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Team 2</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>{team.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Overs per team"
              value={overs}
              onChange={(e) => setOvers(Number(e.target.value))}
              className="w-full p-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
              required
            />

            {error && <p className="text-red-500 text-center">{error}</p>}

            <button type="submit" className="w-full bg-yellow-500 text-green-900 p-3 rounded-xl hover:bg-yellow-400 transition-colors font-semibold">
              Create Fixture
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
