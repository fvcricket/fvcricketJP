import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-green-800">Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-500 transition-colors font-semibold">
          Sign In
        </button>
      </form>
      <p className="text-center mt-4">
        Don't have an account? <Link to="/signup" className="text-green-600 hover:text-green-800">Sign Up</Link>
      </p>
    </div>
  )
}