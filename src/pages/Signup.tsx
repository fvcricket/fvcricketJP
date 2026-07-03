import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const { requiresEmailConfirmation } = await signUp(normalizedEmail, password)

      if (requiresEmailConfirmation) {
        navigate('/login', {
          state: {
            notice: 'Account created. Please check your email to confirm your account, then sign in.'
          }
        })
        return
      }

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error creating account')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-green-800">Sign Up</h1>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-700 text-center">{success}</p>}
        <button type="submit" className="w-full bg-yellow-500 text-green-800 p-3 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
          Sign Up
        </button>
      </form>
      <p className="text-center mt-4">
        Already have an account? <Link to="/login" className="text-green-600 hover:text-green-800">Sign In</Link>
      </p>
    </div>
  )
}