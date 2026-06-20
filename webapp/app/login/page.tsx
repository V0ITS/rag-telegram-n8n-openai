'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

declare global {
  interface Window {
    google: any
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleGoogleSignIn = useCallback((response: any) => {
    if (response.credential) {
      setGoogleLoading(true)
      setError('')

      try {
        // Decode JWT token (simple decode, in production verify signature)
        const payload = JSON.parse(atob(response.credential.split('.')[1]))
        
        // Save user info
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('username', payload.name || payload.email.split('@')[0])
        localStorage.setItem('userEmail', payload.email)
        localStorage.setItem('userId', payload.sub)
        localStorage.setItem('loginMethod', 'google')
        localStorage.setItem('userPicture', payload.picture || '')

        // Check if user exists in local storage, if not add them
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const existingUser = users.find((u: any) => u.email === payload.email)
        
        if (!existingUser) {
          const newUser = {
            id: payload.sub,
            username: payload.name || payload.email.split('@')[0],
            email: payload.email,
            loginMethod: 'google',
            createdAt: new Date().toISOString(),
          }
          users.push(newUser)
          localStorage.setItem('users', JSON.stringify(users))
        }

        router.push('/')
      } catch (error: any) {
        setError('Gagal login dengan Google')
        setGoogleLoading(false)
      }
    }
  }, [router])

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      if (isAuthenticated === 'true') {
        router.push('/')
      }
    }

    // Initialize Google Identity Services
    const initializeGoogle = () => {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      
      if (!googleClientId) {
        return
      }

      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
          })
          setGoogleReady(true)

          // Render Google Sign-In button if ref is available
          if (googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
            window.google.accounts.id.renderButton(
              googleButtonRef.current,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
              }
            )
          }
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error)
        }
      }
    }

    // Check if Google script is already loaded
    if (typeof window !== 'undefined') {
      if (window.google && window.google.accounts) {
        initializeGoogle()
      } else {
        // Wait for script to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.accounts) {
            clearInterval(checkGoogle)
            initializeGoogle()
          }
        }, 100)

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkGoogle)
        }, 5000)
      }
    }
  }, [router, handleGoogleSignIn])

  const handleGoogleLogin = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      setError('Google Sign-In belum dikonfigurasi. Silakan hubungi administrator.')
      return
    }
    
    if (!googleReady) {
      setError('Google Sign-In sedang dimuat. Silakan tunggu sebentar dan coba lagi.')
      return
    }

    setGoogleLoading(true)
    setError('')

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        // Method 1: Try to show One Tap prompt (will show popup with account selection)
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            // One Tap not displayed, try alternative method
            // Create and render a button, then trigger it
            const buttonDiv = document.createElement('div')
            buttonDiv.style.position = 'absolute'
            buttonDiv.style.left = '-9999px'
            buttonDiv.style.opacity = '0'
            document.body.appendChild(buttonDiv)

            window.google.accounts.id.renderButton(
              buttonDiv,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
              }
            )

            // Trigger the button click after it renders
            setTimeout(() => {
              const button = buttonDiv.querySelector('div[role="button"]') as HTMLElement
              if (button) {
                button.click()
                setTimeout(() => {
                  if (document.body.contains(buttonDiv)) {
                    document.body.removeChild(buttonDiv)
                  }
                }, 1000)
              } else {
                setError('Gagal memuat tombol Google Sign-In. Silakan refresh halaman.')
                setGoogleLoading(false)
                if (document.body.contains(buttonDiv)) {
                  document.body.removeChild(buttonDiv)
                }
              }
            }, 500)
          } else if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
            // User dismissed One Tap, show button instead
            setGoogleLoading(false)
            // The button is already visible on the page, user can click it
          }
        })
      } catch (error: any) {
        console.error('Google Sign-In error:', error)
        setError('Gagal memuat Google Sign-In. Silakan refresh halaman.')
        setGoogleLoading(false)
      }
    } else {
      setError('Google Sign-In belum dimuat. Silakan refresh halaman dan pastikan NEXT_PUBLIC_GOOGLE_CLIENT_ID sudah dikonfigurasi.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const user = users.find(
        (u: any) => u.username === username && u.password === password
      )

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      if (user) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('username', user.username)
        localStorage.setItem('userEmail', user.email)
        localStorage.setItem('userId', user.id)
        localStorage.setItem('loginMethod', 'password')
        router.push('/')
      } else {
        setError('Username atau password salah')
        setLoading(false)
      }
    } catch (error: any) {
      setError('Terjadi kesalahan saat login')
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            HALO
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
          }}>
            Silakan login untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading || !username.trim() || !password.trim()
                ? '#9ca3af'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !username.trim() || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e5e7eb',
          }}></div>
          <span style={{
            padding: '0 16px',
            color: '#6b7280',
            fontSize: '14px',
          }}>atau</span>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e5e7eb',
          }}></div>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <div style={{ marginBottom: '24px' }}>
            {googleReady ? (
              <div 
                ref={googleButtonRef}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              />
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || !googleReady}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: googleLoading || !googleReady ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
                onMouseOver={(e) => {
                  if (!googleLoading && googleReady) {
                    e.currentTarget.style.background = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Memproses...' : 'Login dengan Google'}
              </button>
            )}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
          }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}>
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

