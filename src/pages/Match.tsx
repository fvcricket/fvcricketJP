import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

interface MatchData {
  id: string
  code: string
  fixture_id: string
  status: 'active' | 'completed' | 'abandoned'
  toss_winner: string
  elected_to_bat: string
  innings1_id?: string | null
  innings2_id?: string | null
  fixture: {
    name: string
    team1: string
    team2: string
    overs: number
    date: string
    created_by?: string
  }
}

interface Player {
  id: string
  name: string
  team?: string | null
}

interface BatterStat {
  playerId: string
  name: string
  runs: number
  balls: number
  fours: number
  sixes: number
  isOut: boolean
  outType: string | null
}

interface BowlerStat {
  playerId: string
  name: string
  balls: number
  runsConceded: number
  wickets: number
}

interface CommentaryEntry {
  ballNumber: number
  overLabel: string
  title: string
  description: string
  isWicket?: boolean
  batsmanId?: string | null
  bowlerId?: string | null
  runs?: number
  extrasType?: 'wide' | 'noball' | null
  extrasRuns?: number
}

interface InningsSnapshot {
  battingTeam: string
  bowlingTeam: string
  totalRuns: number
  wickets: number
  completedOvers: number
  ballsInOver: number
  batterStats: Record<string, BatterStat>
  bowlerStats: Record<string, BowlerStat>
  commentary: CommentaryEntry[]
}

interface SavedInnings {
  id: string
  batting_team: string
  bowling_team: string
  total_runs: number
  wickets: number
  overs: number
  scorecard: Array<{
    player_id: string
    runs: number
    balls: number
    fours: number
    sixes: number
    out_type: string | null
    player?: { name: string }
  }>
  balls: Array<{
    ball_number: number
    commentary: string | null
    is_wicket: boolean | null
  }>
}

interface SavedInningsRow {
  id: string
  batting_team: string
  bowling_team: string
  total_runs: number
  wickets: number
  overs: number
  scorecard: Array<{
    player_id: string
    runs: number
    balls: number
    fours: number
    sixes: number
    out_type: string | null
    player?: Array<{ name: string }> | { name: string } | null
  }>
  balls: Array<{
    ball_number: number
    commentary: string | null
    is_wicket: boolean | null
  }>
}

const OUT_TYPES = ['bowled', 'caught', 'runout', 'lbw', 'stumped']

export default function Match() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [match, setMatch] = useState<MatchData | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [savedInnings, setSavedInnings] = useState<SavedInnings[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard' | 'commentary'>('live')

  const [inningsNumber, setInningsNumber] = useState<1 | 2>(1)
  const [currentBattingTeam, setCurrentBattingTeam] = useState('')
  const [currentBowlingTeam, setCurrentBowlingTeam] = useState('')
  const [firstInnings, setFirstInnings] = useState<InningsSnapshot | null>(null)
  const [matchEnded, setMatchEnded] = useState(false)

  const [strikerId, setStrikerId] = useState('')
  const [nonStrikerId, setNonStrikerId] = useState('')
  const [bowlerId, setBowlerId] = useState('')

  const [wicketPlayerId, setWicketPlayerId] = useState('')
  const [outType, setOutType] = useState('bowled')

  const [totalRuns, setTotalRuns] = useState(0)
  const [wickets, setWickets] = useState(0)
  const [completedOvers, setCompletedOvers] = useState(0)
  const [ballsInOver, setBallsInOver] = useState(0)

  const [batterStats, setBatterStats] = useState<Record<string, BatterStat>>({})
  const [bowlerStats, setBowlerStats] = useState<Record<string, BowlerStat>>({})
  const [currentOverEvents, setCurrentOverEvents] = useState<string[]>([])
  const [commentaryEntries, setCommentaryEntries] = useState<CommentaryEntry[]>([])
  const [extraRunsValue, setExtraRunsValue] = useState(0)
  const [inningsClosed, setInningsClosed] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    void initialize()
  }, [id])

  useEffect(() => {
    if (!match || matchEnded || inningsClosed || match.status === 'completed') return

    const oversLimitReached = completedOvers >= match.fixture.overs && ballsInOver === 0
    const allOut = wickets >= 10

    if (oversLimitReached || allOut) {
      endInnings()
    }
  }, [completedOvers, ballsInOver, wickets, match, matchEnded, inningsClosed])

  const battingPlayers = useMemo(() => players.filter((player) => player.team === currentBattingTeam), [players, currentBattingTeam])
  const bowlingPlayers = useMemo(() => players.filter((player) => player.team === currentBowlingTeam), [players, currentBowlingTeam])

  const initialize = async () => {
    const [matchRes, playersRes] = await Promise.all([
      supabase.from('matches').select('*, fixture:fixtures(*)').eq('id', id).single(),
      supabase.from('players').select('*').order('name')
    ])

    if (matchRes.error) {
      setError(matchRes.error.message || 'Unable to load match')
      setLoading(false)
      return
    }

    if (playersRes.error) {
      setError(playersRes.error.message || 'Unable to load players')
      setLoading(false)
      return
    }

    const loadedMatch = matchRes.data as MatchData
    setMatch(loadedMatch)
    setPlayers(playersRes.data || [])

    const firstBattingTeam =
      loadedMatch.elected_to_bat === 'bat'
        ? loadedMatch.toss_winner
        : loadedMatch.toss_winner === loadedMatch.fixture.team1
          ? loadedMatch.fixture.team2
          : loadedMatch.fixture.team1
    const firstBowlingTeam =
      firstBattingTeam === loadedMatch.fixture.team1 ? loadedMatch.fixture.team2 : loadedMatch.fixture.team1

    setCurrentBattingTeam(firstBattingTeam)
    setCurrentBowlingTeam(firstBowlingTeam)

    if (loadedMatch.status === 'completed' || loadedMatch.innings1_id || loadedMatch.innings2_id) {
      await loadSavedInnings(loadedMatch)
      setMatchEnded(loadedMatch.status === 'completed')
    }

    setLoading(false)
  }

  const loadSavedInnings = async (loadedMatch: MatchData) => {
    const { data, error } = await supabase
      .from('innings')
      .select('id, batting_team, bowling_team, total_runs, wickets, overs, scorecard(player_id, runs, balls, fours, sixes, out_type, player:players!scorecard_player_id_fkey(name)), balls(ball_number, commentary, is_wicket)')
      .eq('match_id', loadedMatch.id)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message || 'Unable to load saved scorecard')
      return
    }

    const innings = ((data || []) as SavedInningsRow[]).map((innings) => ({
      ...innings,
      scorecard: innings.scorecard.map((row) => ({
        ...row,
        player: Array.isArray(row.player) ? row.player[0] : row.player ?? undefined
      }))
    }))
    setSavedInnings(innings)
  }

  const ensureBatterStat = (player: Player): BatterStat => {
    return batterStats[player.id] ?? {
      playerId: player.id,
      name: player.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      outType: null
    }
  }

  const ensureBowlerStat = (player: Player): BowlerStat => {
    return bowlerStats[player.id] ?? {
      playerId: player.id,
      name: player.name,
      balls: 0,
      runsConceded: 0,
      wickets: 0
    }
  }

  const swapStrike = () => {
    setStrikerId(nonStrikerId)
    setNonStrikerId(strikerId)
  }

  const getBallNumber = () => completedOvers + (ballsInOver + 1) / 10

  const addCommentary = (entry: CommentaryEntry) => {
    setCommentaryEntries((prev) => [...prev, entry])
  }

  const recordBall = (batRuns: number, extraType?: 'wide' | 'noball', extraRuns = 0) => {
    if (matchEnded || inningsClosed || match?.status === 'completed') return

    if (!strikerId || !bowlerId) {
      setError('Select striker and bowler before scoring')
      return
    }

    const striker = battingPlayers.find((player) => player.id === strikerId)
    const bowler = bowlingPlayers.find((player) => player.id === bowlerId)

    if (!striker || !bowler) {
      setError('Selected players are invalid for this innings')
      return
    }

    setError('')
    setSaveMessage('')

    const isLegal = !extraType
    const totalBallRuns = batRuns + extraRuns
    const ballNumber = getBallNumber()
    const overLabel = `${completedOvers}.${ballsInOver + (isLegal ? 1 : 0)}`

    setTotalRuns((prev) => prev + totalBallRuns)

    const strikerStat = ensureBatterStat(striker)
    setBatterStats((prev) => ({
      ...prev,
      [striker.id]: {
        ...strikerStat,
        runs: strikerStat.runs + batRuns,
        balls: strikerStat.balls + (isLegal ? 1 : 0),
        fours: strikerStat.fours + (batRuns === 4 ? 1 : 0),
        sixes: strikerStat.sixes + (batRuns === 6 ? 1 : 0)
      }
    }))

    const bowlerStat = ensureBowlerStat(bowler)
    setBowlerStats((prev) => ({
      ...prev,
      [bowler.id]: {
        ...bowlerStat,
        balls: bowlerStat.balls + (isLegal ? 1 : 0),
        runsConceded: bowlerStat.runsConceded + totalBallRuns
      }
    }))

    const title = extraType ? `${extraType === 'wide' ? 'Wide' : 'No Ball'} +${totalBallRuns}` : `${batRuns} run${batRuns === 1 ? '' : 's'}`
    const description = `${bowler.name} to ${striker.name}: ${extraType ? `${extraType === 'wide' ? 'wide' : 'no ball'} plus ${batRuns} additional run${batRuns === 1 ? '' : 's'} (${totalBallRuns} total)` : `${batRuns} run${batRuns === 1 ? '' : 's'}`}`
    addCommentary({
      ballNumber,
      overLabel,
      title,
      description,
      batsmanId: striker.id,
      bowlerId: bowler.id,
      runs: batRuns,
      extrasType: extraType ?? null,
      extrasRuns: extraType ? extraRuns : 0
    })

    setCurrentOverEvents((prev) => [...prev, extraType ? `${extraType === 'wide' ? 'Wd' : 'Nb'}+${totalBallRuns}` : `${batRuns}`].slice(-6))

    if (isLegal) {
      setBallsInOver((prev) => {
        const next = prev + 1
        if (next >= 6) {
          setCompletedOvers((overs) => overs + 1)
          setCurrentOverEvents([])
          setBowlerId('')
          if (batRuns % 2 === 1) {
            swapStrike()
          }
          return 0
        }
        return next
      })
    }

    if (batRuns % 2 === 1) {
      swapStrike()
    }

    if (extraType) {
      setExtraRunsValue(0)
    }
  }

  const recordWicket = () => {
    if (matchEnded || inningsClosed || match?.status === 'completed') return

    if (!wicketPlayerId || !bowlerId) {
      setError('Select dismissed player and bowler')
      return
    }

    const dismissed = battingPlayers.find((player) => player.id === wicketPlayerId)
    const bowler = bowlingPlayers.find((player) => player.id === bowlerId)

    if (!dismissed || !bowler) {
      setError('Unable to record wicket for selected players')
      return
    }

    const current = ensureBatterStat(dismissed)
    setBatterStats((prev) => ({
      ...prev,
      [dismissed.id]: {
        ...current,
        isOut: true,
        outType
      }
    }))

    const bowlerCurrent = ensureBowlerStat(bowler)
    setBowlerStats((prev) => ({
      ...prev,
      [bowler.id]: {
        ...bowlerCurrent,
        wickets: bowlerCurrent.wickets + 1
      }
    }))

    const ballNumber = getBallNumber()
    const overLabel = `${completedOvers}.${ballsInOver + 1}`
    addCommentary({
      ballNumber,
      overLabel,
      title: 'Wicket',
      description: `${bowler.name} gets ${dismissed.name} out by ${outType}`,
      isWicket: true,
      batsmanId: dismissed.id,
      bowlerId: bowler.id,
      runs: 0,
      extrasType: null,
      extrasRuns: 0
    })

    setWickets((prev) => prev + 1)
    setCurrentOverEvents((prev) => [...prev, 'W'].slice(-6))

    if (wicketPlayerId === strikerId) setStrikerId('')
    if (wicketPlayerId === nonStrikerId) setNonStrikerId('')

    setWicketPlayerId('')
    setSaveMessage('')
    setError('')
  }

  const buildCurrentInningsSnapshot = (): InningsSnapshot => ({
    battingTeam: currentBattingTeam,
    bowlingTeam: currentBowlingTeam,
    totalRuns,
    wickets,
    completedOvers,
    ballsInOver,
    batterStats,
    bowlerStats,
    commentary: commentaryEntries
  })

  const resetInningsState = () => {
    setStrikerId('')
    setNonStrikerId('')
    setBowlerId('')
    setWicketPlayerId('')
    setTotalRuns(0)
    setWickets(0)
    setCompletedOvers(0)
    setBallsInOver(0)
    setBatterStats({})
    setBowlerStats({})
    setCurrentOverEvents([])
    setCommentaryEntries([])
    setOutType('bowled')
    setExtraRunsValue(0)
    setInningsClosed(false)
  }

  const endInnings = () => {
    if (matchEnded || inningsClosed || match?.status === 'completed') return

    if (inningsNumber === 1) {
      const snapshot = buildCurrentInningsSnapshot()
      setFirstInnings(snapshot)
      setInningsNumber(2)
      setCurrentBattingTeam(snapshot.bowlingTeam)
      setCurrentBowlingTeam(snapshot.battingTeam)
      resetInningsState()
      setSaveMessage('Innings 1 ended. Innings 2 started.')
      return
    }

    setInningsClosed(true)
    setSaveMessage('Second innings finished. End the match to save the final scorecard.')
  }

  const endMatch = () => {
    if (inningsNumber === 1) {
      setError('End innings 1 first before ending match')
      return
    }
    setMatchEnded(true)
    setInningsClosed(true)
    setSaveMessage('Match ended. Save score card now.')
  }

  const persistScorecard = async () => {
    if (!match) return

    setSaving(true)
    setError('')
    setSaveMessage('')

    const { data: existingInnings } = await supabase.from('innings').select('id').eq('match_id', match.id)
    if (existingInnings && existingInnings.length > 0) {
      const { error: deleteExistingError } = await supabase.from('innings').delete().eq('match_id', match.id)
      if (deleteExistingError) {
        setSaving(false)
        setError(deleteExistingError.message || 'Unable to refresh saved scorecard')
        return
      }
    }

    const inningsToSave: InningsSnapshot[] = []
    if (firstInnings) inningsToSave.push(firstInnings)
    inningsToSave.push(buildCurrentInningsSnapshot())

    const inningsIds: string[] = []

    for (const innings of inningsToSave) {
      const oversValue = Number(`${innings.completedOvers}.${innings.ballsInOver}`)

      const { data: inningsData, error: inningsError } = await supabase
        .from('innings')
        .insert({
          match_id: match.id,
          batting_team: innings.battingTeam,
          bowling_team: innings.bowlingTeam,
          total_runs: innings.totalRuns,
          wickets: innings.wickets,
          overs: oversValue
        })
        .select('id')
        .single()

      if (inningsError || !inningsData) {
        setSaving(false)
        setError(inningsError?.message || 'Unable to save innings')
        return
      }

      inningsIds.push(inningsData.id)

      const batterRows = Object.values(innings.batterStats)
        .filter((row) => row.runs > 0 || row.balls > 0 || row.isOut)
        .map((row) => ({
          innings_id: inningsData.id,
          player_id: row.playerId,
          runs: row.runs,
          balls: row.balls,
          fours: row.fours,
          sixes: row.sixes,
          out_type: row.isOut ? row.outType : 'notout'
        }))

      if (batterRows.length > 0) {
        const { error: scorecardError } = await supabase.from('scorecard').insert(batterRows)
        if (scorecardError) {
          setSaving(false)
          setError(scorecardError.message || 'Unable to save batting scorecard')
          return
        }
      }

      const ballsRows = innings.commentary.map((entry) => ({
        innings_id: inningsData.id,
        batsman_id: entry.batsmanId ?? null,
        bowler_id: entry.bowlerId ?? null,
        runs: entry.runs ?? 0,
        extras_type: entry.extrasType ?? null,
        extras_runs: entry.extrasRuns ?? 0,
        is_wicket: entry.isWicket ?? false,
        commentary: entry.description,
        ball_number: entry.ballNumber
      }))

      if (ballsRows.length > 0) {
        const { error: ballsError } = await supabase.from('balls').insert(ballsRows)
        if (ballsError) {
          setSaving(false)
          setError(ballsError.message || 'Unable to save commentary')
          return
        }
      }
    }

    const { error: matchUpdateError } = await supabase
      .from('matches')
      .update({
        status: matchEnded ? 'completed' : 'active',
        innings1_id: inningsIds[0] ?? null,
        innings2_id: inningsIds[1] ?? null
      })
      .eq('id', match.id)

    if (matchUpdateError) {
      setSaving(false)
      setError(matchUpdateError.message || 'Unable to update match status')
      return
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('matches').delete().eq('status', 'completed').lt('updated_at', sevenDaysAgo)

    await initialize()
    setSaving(false)
    setSaveMessage('score card saved')
  }

  if (loading) return <div className="text-center text-slate-600">Loading match...</div>
  if (error && !match) return <div className="text-center text-red-600">{error}</div>
  if (!match) return <div className="text-center text-slate-600">Match not found.</div>

  const oversLimitLabel = `${completedOvers}.${ballsInOver} / ${match.fixture.overs}.0`

  const renderLiveBattingTable = () => (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
      <h3 className="font-semibold text-green-900 mb-3">{currentBattingTeam} Batting</h3>
      <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500 px-2 pb-2 border-b border-slate-200">
        <div className="col-span-2">Player</div>
        <div className="text-center">Runs</div>
        <div className="text-center">Balls</div>
        <div className="text-center">4s/6s</div>
        <div className="text-right">Dismissed</div>
      </div>
      <div className="space-y-2 mt-2">
        {battingPlayers.map((player) => {
          const stat = batterStats[player.id] ?? {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            outType: null
          }
          const marker = player.id === strikerId ? '*' : player.id === nonStrikerId ? '^' : ''
          return (
            <div key={player.id} className="grid grid-cols-6 gap-2 text-sm p-2 rounded-lg bg-slate-50">
              <div className="col-span-2 truncate text-slate-800 font-medium">{player.name} {marker}</div>
              <div className="text-center">{stat.runs}</div>
              <div className="text-center">{stat.balls}</div>
              <div className="text-center">{stat.fours}/{stat.sixes}</div>
              <div className="text-right text-xs text-slate-500">{stat.isOut ? stat.outType : 'No'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderLiveBowlingTable = () => (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
      <h3 className="font-semibold text-green-900 mb-3">{currentBowlingTeam} Bowling</h3>
      <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-slate-500 px-2 pb-2 border-b border-slate-200">
        <div className="col-span-2">Player</div>
        <div className="text-center">Overs</div>
        <div className="text-center">Runs</div>
        <div className="text-right">Wkts</div>
      </div>
      <div className="space-y-2 mt-2">
        {bowlingPlayers.map((player) => {
          const stat = bowlerStats[player.id] ?? { balls: 0, runsConceded: 0, wickets: 0 }
          const overs = `${Math.floor(stat.balls / 6)}.${stat.balls % 6}`
          return (
            <div key={player.id} className="grid grid-cols-5 gap-2 text-sm p-2 rounded-lg bg-slate-50">
              <div className="col-span-2 truncate text-slate-800 font-medium">{player.name} {player.id === bowlerId ? '(current)' : ''}</div>
              <div className="text-center">{overs}</div>
              <div className="text-center">{stat.runsConceded}</div>
              <div className="text-right">{stat.wickets}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSavedBattingTable = (innings: SavedInnings) => (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
      <h3 className="font-semibold text-green-900 mb-3">{innings.batting_team} Batting</h3>
      <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500 px-2 pb-2 border-b border-slate-200">
        <div className="col-span-2">Player</div>
        <div className="text-center">Runs</div>
        <div className="text-center">Balls</div>
        <div className="text-center">4s/6s</div>
        <div className="text-right">Dismissed</div>
      </div>
      <div className="space-y-2 mt-2">
        {innings.scorecard.map((row, index) => (
          <div key={`${innings.id}-${row.player_id}-${index}`} className="grid grid-cols-6 gap-2 text-sm p-2 rounded-lg bg-slate-50">
            <div className="col-span-2 truncate text-slate-800 font-medium">{row.player?.name || 'Player'}</div>
            <div className="text-center">{row.runs}</div>
            <div className="text-center">{row.balls}</div>
            <div className="text-center">{row.fours}/{row.sixes}</div>
            <div className="text-right text-xs text-slate-500">{row.out_type && row.out_type !== 'notout' ? row.out_type : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCommentary = (entries: CommentaryEntry[]) => (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-slate-500">No commentary yet.</p>}
        {entries.map((entry, index) => (
          <div key={`${entry.ballNumber}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-semibold ${entry.isWicket ? 'text-red-600' : 'text-green-800'}`}>{entry.title}</span>
              <span className="text-xs text-slate-500">Over {entry.overLabel}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow-sm hover:bg-green-100">
          <ArrowLeftIcon className="h-5 w-5 text-green-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-green-900">{match.fixture.name}</h1>
          <p className="text-xs text-slate-600">Match Code: {match.code}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">{match.status === 'completed' ? 'Saved Match' : `Innings ${inningsNumber} - Batting`}</p>
            <h2 className="text-2xl font-bold text-green-900">{currentBattingTeam || savedInnings[0]?.batting_team || match.fixture.team1}</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-green-800">{match.status === 'completed' && savedInnings.length > 0 ? `${savedInnings.at(-1)?.total_runs ?? 0}/${savedInnings.at(-1)?.wickets ?? 0}` : `${totalRuns}/${wickets}`}</p>
            <p className="text-sm text-slate-500">Overs: {match.status === 'completed' && savedInnings.length > 0 ? savedInnings.at(-1)?.overs : `${completedOvers}.${ballsInOver}`}</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-600">Toss: {match.toss_winner} elected to {match.elected_to_bat}</div>
      </div>

      <div className="grid grid-cols-3 bg-white rounded-2xl border border-green-100 overflow-hidden">
        <button onClick={() => setActiveTab('live')} className={`p-3 text-sm font-semibold ${activeTab === 'live' ? 'bg-green-700 text-white' : 'bg-white text-green-800'}`}>Current Score</button>
        <button onClick={() => setActiveTab('scorecard')} className={`p-3 text-sm font-semibold ${activeTab === 'scorecard' ? 'bg-green-700 text-white' : 'bg-white text-green-800'}`}>Scorecard</button>
        <button onClick={() => setActiveTab('commentary')} className={`p-3 text-sm font-semibold ${activeTab === 'commentary' ? 'bg-green-700 text-white' : 'bg-white text-green-800'}`}>Commentary</button>
      </div>

      {activeTab === 'live' && match.status !== 'completed' && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-4">
          <div className="text-xs font-medium text-slate-500">Current Over: {oversLimitLabel}</div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select value={strikerId} onChange={(e) => setStrikerId(e.target.value)} className="flex-1 p-3 border border-green-300 rounded-xl">
                <option value="">Select striker</option>
                {battingPlayers.filter((p) => !batterStats[p.id]?.isOut || p.id === strikerId).map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 min-w-20 text-right">Striker</span>
            </div>

            <div className="flex items-center gap-2">
              <select value={nonStrikerId} onChange={(e) => setNonStrikerId(e.target.value)} className="flex-1 p-3 border border-green-300 rounded-xl">
                <option value="">Select non-striker</option>
                {battingPlayers.filter((p) => !batterStats[p.id]?.isOut || p.id === nonStrikerId).map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 min-w-20 text-right">Non-striker</span>
            </div>

            <div className="flex items-center gap-2">
              <select value={bowlerId} onChange={(e) => setBowlerId(e.target.value)} className="flex-1 p-3 border border-green-300 rounded-xl">
                <option value="">Select bowler ({currentBowlingTeam})</option>
                {bowlingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
              <span className="text-xs text-slate-400 min-w-20 text-right">Bowler</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button key={run} onClick={() => recordBall(run)} disabled={matchEnded} className="bg-green-700 text-white p-3 rounded-xl font-bold hover:bg-green-600 disabled:opacity-50">{run}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => recordBall(extraRunsValue, 'wide', 1)} disabled={matchEnded || inningsClosed} className="bg-yellow-500 text-green-900 p-3 rounded-xl font-semibold hover:bg-yellow-400 disabled:opacity-50">Wide + {extraRunsValue + 1}</button>
            <button onClick={() => recordBall(extraRunsValue, 'noball', 1)} disabled={matchEnded || inningsClosed} className="bg-yellow-500 text-green-900 p-3 rounded-xl font-semibold hover:bg-yellow-400 disabled:opacity-50">No Ball + {extraRunsValue + 1}</button>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-green-900">Additional runs for wide / no ball</p>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-green-900">{extraRunsValue}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {[0, 1, 2, 3, 4, 5, 6].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExtraRunsValue(value)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${extraRunsValue === value ? 'bg-green-700 text-white' : 'bg-white text-green-900 border border-green-200'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-red-200 rounded-xl p-3 bg-red-50 space-y-2">
            <p className="text-sm font-semibold text-red-700">Record Wicket</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={wicketPlayerId} onChange={(e) => setWicketPlayerId(e.target.value)} className="w-full p-3 border border-red-200 rounded-xl">
                <option value="">Dismissed batsman</option>
                {[strikerId, nonStrikerId].filter(Boolean).map((pid) => {
                  const p = battingPlayers.find((x) => x.id === pid)
                  if (!p) return null
                  return <option key={p.id} value={p.id}>{p.name}</option>
                })}
              </select>
              <select value={outType} onChange={(e) => setOutType(e.target.value)} className="w-full p-3 border border-red-200 rounded-xl">
                {OUT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <button onClick={recordWicket} disabled={matchEnded || inningsClosed} className="w-full bg-red-600 text-white p-3 rounded-xl font-semibold hover:bg-red-500 disabled:opacity-50">Wicket</button>
          </div>

          <div className="text-xs text-slate-500">Current over events: {currentOverEvents.length ? currentOverEvents.join(' | ') : 'No balls yet'}</div>
          {renderLiveBattingTable()}
          {renderLiveBowlingTable()}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={endInnings} disabled={matchEnded || inningsClosed} className="bg-slate-800 text-white p-3 rounded-xl font-semibold hover:bg-slate-700 disabled:opacity-50">End Innings</button>
            <button onClick={endMatch} disabled={inningsNumber === 1 || matchEnded} className="bg-red-700 text-white p-3 rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50">End Match</button>
          </div>
        </div>
      )}

      {activeTab === 'live' && match.status === 'completed' && savedInnings.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 space-y-3">
          {savedInnings.map((innings) => (
            <div key={innings.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{innings.batting_team} vs {innings.bowling_team}</p>
                  <p className="font-semibold text-green-900">{innings.total_runs}/{innings.wickets}</p>
                </div>
                <span className="text-sm text-slate-500">Overs {innings.overs}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'scorecard' && (
        <div className="space-y-4">
          {savedInnings.length > 0 ? (
            savedInnings.map((innings) => renderSavedBattingTable(innings))
          ) : (
            <>
              {firstInnings && renderLiveBattingTable()}
              {renderLiveBattingTable()}
              {renderLiveBowlingTable()}
            </>
          )}
        </div>
      )}

      {activeTab === 'commentary' && (
        <div className="space-y-4">
          {savedInnings.length > 0 ? (
            savedInnings.map((innings) => (
              <div key={innings.id} className="space-y-3">
                <h3 className="text-sm font-semibold text-green-900">{innings.batting_team} innings commentary</h3>
                {renderCommentary(
                  innings.balls.map((ball) => ({
                    ballNumber: ball.ball_number,
                    overLabel: ball.ball_number.toFixed(1),
                    title: ball.is_wicket ? 'Wicket' : 'Ball update',
                    description: ball.commentary || 'Ball recorded',
                    isWicket: Boolean(ball.is_wicket)
                  }))
                )}
              </div>
            ))
          ) : (
            renderCommentary(commentaryEntries)
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-center">{error}</p>}
      {saveMessage && <p className="text-green-700 text-center font-medium">{saveMessage}</p>}

      {match.status !== 'completed' && (
        <button onClick={persistScorecard} disabled={saving} className="w-full bg-green-800 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-60 font-semibold">
          {saving ? 'Saving...' : 'Save Scorecard'}
        </button>
      )}
    </div>
  )
}
