import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, CalendarIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface Fixture {
  id: string
  name: string
  date: string
  team1: string
  team2: string
  overs: number
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFixtures()
  }, [])

  const fetchFixtures = async () => {
    const { data } = await supabase.from('fixtures').select('*')
    setFixtures(data || [])
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
          {user && (
            <Link to="/new-fixture" className="inline-flex items-center justify-center gap-2 bg-yellow-500 text-green-900 px-3 py-2.5 rounded-xl hover:bg-yellow-400 font-semibold text-sm min-h-11">
              <PlusIcon className="h-4 w-4" />
              Add
            </Link>
          )}
          <Link to="/teams" className="inline-flex items-center justify-center gap-2 bg-green-700 text-white px-3 py-2.5 rounded-xl hover:bg-green-600 font-semibold text-sm min-h-11">
            <UserGroupIcon className="h-4 w-4" />
            Teams
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        {fixtures.map(fixture => (
          <div key={fixture.id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-green-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center mb-1">
                  <CalendarIcon className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                  <span className="font-semibold text-green-800 truncate">{fixture.name}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">{fixture.team1} vs {fixture.team2}</p>
              </div>
              <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">{fixture.overs} ov</span>
            </div>
            <p className="text-xs text-slate-500">{new Date(fixture.date).toLocaleDateString()}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">Ready to start</span>
              <Link to={`/new-match?fixture=${fixture.id}`} className="inline-flex items-center px-3 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 font-semibold text-sm">Start Match</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}