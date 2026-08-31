import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { requestOtp, verifyOtp } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { token, signIn } = useAuth()
  const location = useLocation()
  const redirect = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (token) return <Navigate to={redirect} replace />

  async function onRequestOtp(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await requestOtp(email.trim())
      setMessage(res.message)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const session = await verifyOtp(email.trim(), code.trim())
      signIn(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Service Board</h1>
        <p className="muted">Staff sign-in with your Elizade Connect email.</p>

        {step === 'email' ? (
          <form onSubmit={onRequestOtp}>
            <label>
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@elizade.com"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify}>
            {message && <p className="info">{message}</p>}
            <label>
              One-time code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button type="button" className="ghost" onClick={() => setStep('email')}>
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
