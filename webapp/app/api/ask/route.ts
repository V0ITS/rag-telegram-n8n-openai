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

    // Prefer server-side webhook config (safe for secrets) and fall back to public or hard-coded default
    const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
      process.env.N8N_CLOUDFLARE_URL || 'https://REPLACE_ME_WEBHOOK_DOMAIN/webhook/ddf353bb-cce0-4891-bcf8-296e64308dc9'

    // helper to POST and parse body/text for debugging
    async function postTo(url: string) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const text = await res.text().catch(() => '')
      let json: any = null
      try { json = text ? JSON.parse(text) : null } catch (_) { json = text }
      return { res, text, json }
    }

    // Try primary webhook
    let attempt = await postTo(webhookUrl)

    // If webhook is not registered (404), try the test URL (/webhook-test/...) as fallback
    if (attempt.res.status === 404 && /not registered/i.test(attempt.text || '')) {
      const fallback = webhookUrl.includes('/webhook/')
        ? webhookUrl.replace('/webhook/', '/webhook-test/')
        : webhookUrl
      console.warn('Primary webhook 404 not registered, retrying with test webhook:', fallback)
      attempt = await postTo(fallback)
    }

    if (!attempt.res.ok) {
      throw new Error(`n8n webhook error: ${attempt.res.status} ${attempt.res.statusText} - ${attempt.text}`)
    }

    const data = attempt.json || attempt.text

    return NextResponse.json({
      answer: data?.answer || data?.message || data?.response || data,
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

