'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      if (isAuthenticated === 'true') {
        router.push('/')
      }
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username tidak boleh kosong')
      return false
    }
    if (formData.username.length < 3) {
      setError('Username minimal 3 karakter')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email tidak boleh kosong')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Format email tidak valid')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const existingUser = users.find(
        (u: any) => u.username === formData.username || u.email === formData.email
      )

      if (existingUser) {
        setError('Username atau email sudah terdaftar')
        setLoading(false)
        return
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        username: formData.username,
        email: formData.email,
        password: formData.password, // In production, hash this password
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))

      // Auto login after registration
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('username', formData.username)
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userId', newUser.id)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      router.push('/')
    } catch (error: any) {
      setError('Terjadi kesalahan saat registrasi')
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
            Daftar Akun
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
          }}>
            Buat akun baru untuk mulai menggunakan
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
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Masukkan username"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error && !formData.username ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error && !formData.email ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password (min. 6 karakter)"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error && formData.password.length < 6 ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
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
              Konfirmasi Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Konfirmasi password"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: error && formData.password !== formData.confirmPassword ? '2px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
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
            disabled={loading || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: loading || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()
                ? '#9ca3af'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !formData.username.trim() || !formData.email.trim() || !formData.password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
          }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}>
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

