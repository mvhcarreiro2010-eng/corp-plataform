import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { tentativaId, respostas, fechadaPorTrapa } = await req.json()
  // respostas: { [questaoId]: answerIndex }

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

  // Calculate score
  const questoes = await prisma.questao.findMany({
    where: { id: { in: tentativa.questoesIds } },
    select: { id: true, answer: true, enunciado: true, options: true },
  })

  let acertos = 0
  const gabarito: Record<string, { correta: number; marcada: number | null; acertou: boolean; enunciado: string; options: string[] }> = {}

  for (const q of questoes) {
    const marcada = respostas[q.id] !== undefined ? Number(respostas[q.id]) : null
    const acertou = marcada === q.answer
    if (acertou) acertos++
    gabarito[q.id] = { correta: q.answer, marcada, acertou, enunciado: q.enunciado, options: q.options }
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
