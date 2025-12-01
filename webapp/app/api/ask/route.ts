import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Pertanyaan harus berupa string' },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
      'http://localhost:5678/webhook/webapp-qa'

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      answer: data.answer || data.message || data.response || data,
      success: true,
    })
  } catch (error: any) {
    console.error('Error calling n8n webhook:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Gagal menghubungi n8n webhook',
        success: false 
      },
      { status: 500 }
    )
  }
}

