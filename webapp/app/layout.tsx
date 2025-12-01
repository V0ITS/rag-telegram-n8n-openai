import React from 'react'
import './globals.css'

export const metadata = {
  title: 'RAG WebApp - n8n + OpenAI',
  description: 'WebApp untuk bertanya menggunakan n8n dan OpenAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}