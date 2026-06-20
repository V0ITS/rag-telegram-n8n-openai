'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from '../components/ChatInterface'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAuthenticated')
      if (authStatus !== 'true') {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
        setLoading(false)
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'white',
        fontSize: '18px',
      }}>
        Memuat...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s',
          zIndex: 10,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
        }}
      >
        Logout
      </button>
      <ChatInterface />
    </main>
  )
}