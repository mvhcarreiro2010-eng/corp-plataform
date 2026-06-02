import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildSegFilter } from '@/lib/segmentation'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)

  const segFilter = isAdmin
    ? { testeRapido: false }
    : { published: true, testeRapido: false, ...buildSegFilter(session.user) }

  const avaliacoes = await prisma.avaliacao.findMany({
    where: segFilter,
    include: {
      _count: { select: { questoes: true } },
      tentativas: { where: { userId: session.user.id }, select: { id: true, nota: true, finalizadaEm: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(avaliacoes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { title, description, questoesExibir, tempoPorQuestao, tempoTotal, maxTentativas, buIds, roleFilter, userIds, tags, testeRapido } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const av = await prisma.avaliacao.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      questoesExibir: questoesExibir ?? 10,
      tempoPorQuestao: tempoPorQuestao || null,
      tempoTotal: tempoTotal || null,
      maxTentativas: maxTentativas ?? 1,
      buIds: buIds ?? [],
      roleFilter: roleFilter ?? [],
      userIds: userIds ?? [],
      tags: tags ?? [],
      testeRapido: testeRapido ?? false,
    },
  })

  return NextResponse.json(av, { status: 201 })
}
