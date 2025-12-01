'use client'

import React, { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage.content }),
      })

      const data = await response.json()
      
      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.answer || data.message || 'Tidak ada jawaban'
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Terjadi kesalahan')
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Gagal menghubungi n8n webhook'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px 16px 0 0',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          RAG WebApp - n8n + OpenAI
        </h1>
        <p style={{ fontSize: '14px', opacity: 0.9 }}>
          Tanyakan apapun, akan diproses melalui n8n webhook ke OpenAI
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            marginTop: '100px',
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              👋 Selamat Datang!
            </p>
            <p>Mulai dengan mengetik pertanyaan Anda di bawah</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f3f4f6',
              color: msg.role === 'user' ? 'white' : '#1f2937',
              wordWrap: 'break-word',
            }}
          >
            {msg.content}
          </div>
        ))}
        
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#f3f4f6',
            color: '#6b7280',
          }}>
            Memproses...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pertanyaan Anda..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 24px',
            background: loading || !input.trim()
              ? '#9ca3af'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Kirim
        </button>
      </form>
    </div>
  )
}