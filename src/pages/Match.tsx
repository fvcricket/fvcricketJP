import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

interface Match {
  id: string
  code: string
  toss_winner: string
  elected_to_bat: string
  fixture: {
    name: string
    team1: string
    team2: string
    overs: number
  }
}

interface Player {
  id: string
  name: string
  team?: string
}

export default function Match() {
  const { id } = useParams()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentBowler, setCurrentBowler] = useState('')
  const [currentOver, setCurrentOver] = useState(1)
  const [ballsInOver, setBallsInOver] = useState(0)
  const [totalRuns, setTotalRuns] = useState(0)
  const [wickets] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchMatch()
    fetchPlayers()
  }, [id])

  const fetchMatch = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*, fixture:fixtures(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Match fetch error:', error)
      setError(error.message || 'Unable to load match')
      setLoading(false)
      return
    }

    setMatch(data)
    setLoading(false)
  }

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*')
    if (error) {
      console.error('Players fetch error:', error)
      setError(error.message || 'Unable to load players')
      setLoading(false)
      return
    }
    setPlayers(data || [])
  }

  const recordRun = async (runs: number, extras: string = '', extraRuns: number = 0) => {
    const isLegal = extras !== 'wide' && extras !== 'noball'
    
    setTotalRuns(prev => prev + runs + extraRuns)
    
    if (isLegal) {
      setBallsInOver(prev => {
        const newBalls = prev + 1
        if (newBalls >= 6) {
          // End of over
          setCurrentOver(prevOver => prevOver + 1)
          setCurrentBowler('') // Require new bowler
          return 0
        }
        return newBalls
      })
    }
    
    // TODO: Save ball to database
    console.log('Ball recorded:', { runs, extras, extraRuns, isLegal })
  }

  if (loading) return <div className="text-center text-slate-600">Loading match...</div>
  if (error) return <div className="text-center text-red-600">{error}</div>
  if (!match) return <div className="text-center text-slate-600">Match not found.</div>

  const battingTeam = match.elected_to_bat === 'bat' ? match.toss_winner : 
                     (match.toss_winner === match.fixture.team1 ? match.fixture.team2 : match.fixture.team1)
  const bowlingTeam = battingTeam === match.fixture.team1 ? match.fixture.team2 : match.fixture.team1

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">{match.fixture.name}</h1>
      </div>
      <p className="text-center text-slate-600 mb-4">Match Code: {match.code}</p>
      <p className="text-center text-sm text-slate-500 mb-4">
        {match.toss_winner} won toss and elected to {match.elected_to_bat}
      </p>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-green-200">
        <h2 className="text-lg font-semibold mb-4 text-green-800">
          {battingTeam} - {totalRuns}/{wickets} ({currentOver - 1}.{ballsInOver} overs)
        </h2>
        
        {!currentBowler && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Bowler</label>
            <select
              value={currentBowler}
              onChange={(e) => setCurrentBowler(e.target.value)}
              className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose bowler from {bowlingTeam}</option>
              {players.filter(player => player.team === bowlingTeam).map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[0,1,2,3,4,6].map(run => (
            <button
              key={run}
              onClick={() => recordRun(run)}
              disabled={!currentBowler}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-500 font-bold text-lg transition-colors disabled:opacity-50"
            >
              {run}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <button 
            className="w-full bg-yellow-500 text-green-800 p-3 rounded-lg hover:bg-yellow-400 font-semibold transition-colors"
            onClick={() => recordRun(0, 'wide', 1)}
            disabled={!currentBowler}
          >
            Wide +1
          </button>
          <button 
            className="w-full bg-yellow-500 text-green-800 p-3 rounded-lg hover:bg-yellow-400 font-semibold transition-colors"
            onClick={() => recordRun(0, 'noball', 1)}
            disabled={!currentBowler}
          >
            No Ball +1
          </button>
        </div>
      </div>
    </div>
  )
}