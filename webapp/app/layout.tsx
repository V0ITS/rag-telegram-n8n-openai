import React from 'react'
import './globals.css'
import Script from 'next/script'

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
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}