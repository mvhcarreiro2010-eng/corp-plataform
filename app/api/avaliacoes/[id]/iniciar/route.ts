import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const av = await prisma.avaliacao.findUnique({
    where: { id },
    include: { questoes: true },
  })
  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  if (!av || (!av.published && !isAdmin)) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })

  // Check attempt limit (admins bypass for testing)
  if (!isAdmin) {
    const tentativas = await prisma.tentativa.findMany({
      where: { userId: session.user.id, avaliacaoId: id, finalizadaEm: { not: null } },
    })
    if (tentativas.length >= av.maxTentativas) {
      return NextResponse.json({ error: 'Limite de tentativas atingido' }, { status: 403 })
    }
  }

  // Check for open (unfinished) attempt
  const open = await prisma.tentativa.findFirst({
    where: { userId: session.user.id, avaliacaoId: id, finalizadaEm: null },
  })
  if (open) {
    // Return existing questions (without answers)
    const questoes = await prisma.questao.findMany({
      where: { id: { in: open.questoesIds } },
      select: { id: true, tipo: true, enunciado: true, options: true, ordem: true },
    })
    const ordered = open.questoesIds.map(qid => questoes.find(q => q.id === qid)).filter(Boolean)
    return NextResponse.json({
      tentativaId: open.id,
      questoes: ordered,
      tempoPorQuestao: av.tempoPorQuestao,
      tempoTotal: av.tempoTotal,
      iniciadaEm: open.iniciadaEm,
    })
  }

  // Shuffle and pick questions
  const shuffled = [...av.questoes].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, Math.min(av.questoesExibir, shuffled.length))

  const tentativa = await prisma.tentativa.create({
    data: {
      userId: session.user.id,
      avaliacaoId: id,
      questoesIds: picked.map(q => q.id),
    },
  })

  // Return questions WITHOUT the answer/answers fields
  const questoesSemGabarito = picked.map(q => ({
    id: q.id,
    tipo: q.tipo,
    enunciado: q.enunciado,
    options: q.options,
    ordem: q.ordem,
  }))

  return NextResponse.json({
    tentativaId: tentativa.id,
    questoes: questoesSemGabarito,
    tempoPorQuestao: av.tempoPorQuestao,
    tempoTotal: av.tempoTotal,
    iniciadaEm: tentativa.iniciadaEm,
  })
}
