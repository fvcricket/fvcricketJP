import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="mr-4 p-2 rounded-full hover:bg-green-100">
            <ArrowLeftIcon className="h-6 w-6 text-green-600" />
          </button>
          <h1 className="text-2xl font-bold text-green-800">Fixtures</h1>
        </div>
        <div className="flex gap-2">
          {user && (
            <Link to="/new-fixture" className="flex items-center bg-yellow-500 text-green-800 px-4 py-2 rounded-lg hover:bg-yellow-400">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Fixture
            </Link>
          )}
          <Link to="/teams" className="flex items-center bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Manage Teams
          </Link>
        </div>
      </div>
      <div className="space-y-4">
        {fixtures.map(fixture => (
          <div key={fixture.id} className="bg-white p-4 rounded-lg shadow-md border border-green-200">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-semibold text-green-800">{fixture.name}</span>
            </div>
            <p className="text-slate-600">{fixture.team1} vs {fixture.team2}</p>
            <p className="text-sm text-slate-500">{new Date(fixture.date).toLocaleDateString()} - {fixture.overs} overs</p>
            <Link to={`/new-match?fixture=${fixture.id}`} className="mt-2 inline-block text-green-600 hover:text-green-800">Start Match</Link>
          </div>
        ))}
      </div>
    </div>
  )
}