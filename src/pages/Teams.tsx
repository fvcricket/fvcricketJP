import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Team {
  id: string
  name: string
}

interface Player {
  id: string
  name: string
  team: string | null
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teamName, setTeamName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [teamsRes, playersRes] = await Promise.all([
      supabase.from('teams').select('id, name').order('name'),
      supabase.from('players').select('id, name, team').order('created_at', { ascending: false })
    ])

    if (teamsRes.error || playersRes.error) {
      setError(teamsRes.error?.message || playersRes.error?.message || 'Unable to load data')
      setLoading(false)
      return
    }

    setTeams(teamsRes.data || [])
    setPlayers(playersRes.data || [])

    if (!selectedTeam && teamsRes.data && teamsRes.data.length > 0) {
      setSelectedTeam(teamsRes.data[0].name)
    }

    setLoading(false)
  }

  const playersByTeam = useMemo(() => {
    const map: Record<string, Player[]> = {}
    for (const team of teams) {
      map[team.name] = players.filter((p) => p.team === team.name)
    }
    return map
  }, [players, teams])

  const addTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Please sign in to manage teams')
      return
    }

    const name = teamName.trim()
    if (!name) return

    const { error } = await supabase.from('teams').insert({
      name,
      created_by: user.id
    })

    if (error) {
      setError(error.message || 'Unable to add team')
      return
    }

    setTeamName('')
    setError('')
    await fetchData()
    setSelectedTeam(name)
  }

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('Please sign in to manage players')
      return
    }

    const name = playerName.trim()
    if (!name || !selectedTeam) return

    const { error } = await supabase.from('players').insert({
      name,
      team: selectedTeam,
      created_by: user.id
    })

    if (error) {
      setError(error.message || 'Unable to add player')
      return
    }

    setPlayerName('')
    setError('')
    await fetchData()
  }

  const removePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) {
      setError(error.message || 'Unable to remove player')
      return
    }
    setError('')
    await fetchData()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Teams And Players</h1>
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-green-800">Create Team</h2>
          <form onSubmit={addTeam} className="space-y-3">
            <input
              type="text"
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            />
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-green-700 text-white p-3.5 rounded-xl hover:bg-green-600 font-semibold text-base">
              <PlusIcon className="h-5 w-5" />
              Add Team
            </button>
          </form>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.name)}
                className={`w-full text-left p-3.5 rounded-xl border ${selectedTeam === team.name ? 'bg-green-100 border-green-400 text-green-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                {team.name}
              </button>
            ))}
            {!loading && teams.length === 0 && (
              <p className="text-sm text-slate-500">No teams yet. Add your first team.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-green-800">Add Player To Team</h2>
          <form onSubmit={addPlayer} className="space-y-3">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>{team.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3.5 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500"
              required
            />
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-yellow-500 text-green-900 p-3.5 rounded-xl hover:bg-yellow-400 font-semibold text-base">
              <PlusIcon className="h-5 w-5" />
              Add Player
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {selectedTeam && (playersByTeam[selectedTeam] || []).map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">{player.name}</span>
                <button onClick={() => removePlayer(player.id)} className="text-red-500 hover:text-red-700" title="Remove player">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            {selectedTeam && (playersByTeam[selectedTeam] || []).length === 0 && (
              <p className="text-sm text-slate-500">No players for this team yet.</p>
            )}
          </div>
        </div>
      </div>

      <Link to="/new-fixture" className="block text-center bg-green-700 text-white p-3.5 rounded-xl hover:bg-green-600 font-semibold text-base">
        Continue To Create Fixture
      </Link>
    </div>
  )
}
