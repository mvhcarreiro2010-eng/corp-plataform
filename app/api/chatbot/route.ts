import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// POST /api/chatbot
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { messages } = await req.json()

  // Guard against abuse: max 20 messages, each max 1000 chars
  if (!Array.isArray(messages) || messages.length > 20) {
    return NextResponse.json({ error: 'Limite de mensagens excedido' }, { status: 400 })
  }
  const sanitized = messages
    .filter((m: { role: string; content: string }) =>
      typeof m.role === 'string' && typeof m.content === 'string')
    .map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, 1000),
    }))

  // Se não tiver a API key, retorna resposta padrão
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: 'O chatbot IA está em configuração. Por favor, adicione a chave ANTHROPIC_API_KEY no arquivo .env. Por enquanto, consulte a Wiki para dúvidas ou entre em contato com o RH.',
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `Você é o assistente virtual da CorpHub, uma plataforma corporativa de aprendizado e comunicação.
Responda sempre em português brasileiro de forma amigável, clara e concisa.
Você pode ajudar com:
- Dúvidas sobre a plataforma (Feed, Wiki, Comunidade, Aprendizado, Indução)
- Orientações sobre processos da empresa
- Como navegar e usar as funcionalidades
- Informações gerais sobre treinamentos e cursos

Se não souber responder, oriente o colaborador a consultar a Wiki ou entrar em contato com o RH.
Mantenha respostas curtas (máximo 3-4 parágrafos).`,
        messages: sanitized,
      }),
    })

    const data = await response.json()
    return NextResponse.json({ content: data.content[0].text })
  } catch (error) {
    return NextResponse.json({
      content: 'Desculpe, não consegui processar sua mensagem. Tente novamente ou consulte a Wiki.',
    })
  }
}
