import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { tentativaId, respostas, fechadaPorTrapa } = await req.json()

  const tentativa = await prisma.tentativa.findUnique({
    where: { id: tentativaId },
    include: { avaliacao: true },
  })

  if (!tentativa || tentativa.userId !== session.user.id) {
    return NextResponse.json({ error: 'Tentativa inválida' }, { status: 403 })
  }
  if (tentativa.finalizadaEm) {
    return NextResponse.json({ error: 'Já finalizada' }, { status: 409 })
  }

  const questoes = await prisma.questao.findMany({
    where: { id: { in: tentativa.questoesIds } },
    select: { id: true, tipo: true, answer: true, answers: true, enunciado: true, options: true, gabarito: true },
  })

  let acertos = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gabarito: Record<string, any> = {}

  for (const q of questoes) {
    const raw = respostas[q.id]
    let acertou = false

    switch (q.tipo) {
      case 'MULTIPLA_ESCOLHA':
      case 'VERDADEIRO_FALSO':
        acertou = raw !== undefined && raw !== null && Number(raw) === q.answer
        break
      case 'MULTIPLA_RESPOSTA': {
        const selected: number[] = Array.isArray(raw) ? [...raw].map(Number).sort((a, b) => a - b) : []
        const correct: number[] = [...q.answers].sort((a, b) => a - b)
        acertou = JSON.stringify(selected) === JSON.stringify(correct)
        break
      }
      case 'TEXTO_LIVRE':
        acertou = typeof raw === 'string' && raw.trim().length > 0
        break
    }

    if (acertou) acertos++
    gabarito[q.id] = {
      tipo: q.tipo,
      enunciado: q.enunciado,
      options: q.options,
      acertou,
      correta: q.answer,
      corretas: q.answers,
      marcada: q.tipo === 'MULTIPLA_RESPOSTA' ? undefined : (raw !== undefined ? raw : null),
      marcadas: q.tipo === 'MULTIPLA_RESPOSTA' ? (Array.isArray(raw) ? raw : []) : undefined,
      textoMarcado: q.tipo === 'TEXTO_LIVRE' ? (typeof raw === 'string' ? raw : '') : undefined,
      gabaritoRef: q.tipo === 'TEXTO_LIVRE' ? q.gabarito : undefined,
    }
  }

  const total = questoes.length
  const nota = total > 0 ? (acertos / total) * 10 : 0

  const updated = await prisma.tentativa.update({
    where: { id: tentativaId },
    data: {
      respostas,
      nota,
      acertos,
      fechadaPorTrapa: fechadaPorTrapa ?? false,
      finalizadaEm: new Date(),
    },
  })

  return NextResponse.json({ nota: updated.nota, acertos, total, gabarito })
}
