import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

function UserLogin() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')

  // Forgot password fields
  const [verificationAnswer, setVerificationAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const redirectMessage = location.state?.message
  const redirectTo = location.state?.from || '/'

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const isRegister = mode === 'register'
      const endpoint = isRegister ? '/api/users/register' : '/api/users/login'
      const payload = isRegister
        ? { phone: phone.trim(), password, teamName: teamName.trim() }
        : { phone: phone.trim(), password }

      const { data } = await axios.post(`${apiUrl}${endpoint}`, payload)
      localStorage.setItem('userInfo', JSON.stringify(data))
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!phone.trim()) {
      setError('Please enter your registered phone number')
      return
    }

    if (!verificationAnswer.trim()) {
      setError('Please enter your Team Name or Registration ID for verification')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)

    try {
      const { data } = await axios.post(`${apiUrl}/api/users/reset-password`, {
        phone: phone.trim(),
        verificationAnswer: verificationAnswer.trim(),
        newPassword,
      })

      setSuccessMsg(data.message || 'Password reset successfully! Logging you in...')

      // Save user session and auto redirect
      if (data.user?.token) {
        localStorage.setItem('userInfo', JSON.stringify(data.user))
        setTimeout(() => {
          navigate(redirectTo, { replace: true })
        }, 1500)
      } else {
        setTimeout(() => {
          setMode('login')
          setPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setVerificationAnswer('')
          setSuccessMsg('Password updated! Please enter your new password to login.')
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your details or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
  }

  return (
    <div className="login-container fade-in">
      <div className="login-box">
        {/* Header */}
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="login-icon">
            {mode === 'forgot' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1.5"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
          <h1 style={{ marginBottom: '0.4rem' }}>
            {mode === 'register' && 'Create Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {mode === 'register' && 'Register to book match slots & view room credentials'}
            {mode === 'login' && 'Login to access your wallet, team & booked slots'}
            {mode === 'forgot' && 'Verify your account details to set a new password'}
          </p>
        </div>

        {/* Redirect notice from protected actions */}
        {redirectMessage && !error && !successMsg && (
          <div style={{
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '10px',
            padding: '0.8rem 1rem',
            marginBottom: '1.25rem',
            color: '#c084fc',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>{redirectMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            color: '#4ade80',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' ? (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="reset-phone">Registered Phone Number</label>
              <input
                id="reset-phone"
                type="tel"
                placeholder="Enter your registered phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label htmlFor="reset-verification" style={{ margin: 0 }}>
                  Team Name, Player ID or WhatsApp Number
                </label>
                <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: 600 }}>Security Check</span>
              </div>
              <input
                id="reset-verification"
                type="text"
                placeholder="e.g. Team Name, #1024, or WhatsApp number"
                value={verificationAnswer}
                onChange={(e) => setVerificationAnswer(e.target.value)}
                required
                autoComplete="off"
              />
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', lineHeight: '1.4' }}>
                Enter the <strong>Team Name</strong>, <strong>Player ID</strong> (e.g. #1024), or registered <strong>WhatsApp Number</strong> linked to this account.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="reset-new-password">New Password</label>
              <input
                id="reset-new-password"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Verifying & Updating...
                </>
              ) : (
                'SET NEW PASSWORD'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'color 0.2s',
                }}
              >
                ← Back to Login
              </button>
            </div>

            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#64748b',
            }}>
              Can't remember your details?{' '}
              <a
                href="https://wa.me/919999999999?text=Hello%20Rising%20Esports%20Admin,%20I%20forgot%20my%20password%20and%20need%20help%20recovering%20my%20account."
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#22c55e', fontWeight: 700, textDecoration: 'none' }}
              >
                WhatsApp Admin
              </a>
            </div>
          </form>
        ) : (
          /* ── LOGIN / REGISTER FORM ── */
          <form onSubmit={handleAuthSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="teamName">Team Name <span className="optional">(optional)</span></label>
                <input
                  id="teamName"
                  type="text"
                  placeholder="Enter your team name (e.g. Team Soul)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoComplete="organization"
                />
              </div>
            )}

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a78bfa',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.2s',
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                placeholder={mode === 'register' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  {mode === 'register' ? 'Creating Account...' : 'Logging in...'}
                </>
              ) : (
                mode === 'register' ? 'Create Account' : 'Login'
              )}
            </button>
          </form>
        )}

        {/* Bottom Toggle Between Login & Register */}
        {mode !== 'forgot' && (
          <div className="login-toggle">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Login' : 'Register'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserLogin
