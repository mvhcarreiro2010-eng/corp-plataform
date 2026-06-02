import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const av = await prisma.avaliacao.findUnique({
    where: { id },
    include: { _count: { select: { questoes: true } } },
  })
  if (!av) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json(av)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const av = await prisma.avaliacao.update({
    where: { id },
    data: {
      title: body.title?.trim(),
      description: body.description?.trim() || null,
      questoesExibir: body.questoesExibir,
      tempoPorQuestao: body.tempoPorQuestao || null,
      tempoTotal: body.tempoTotal || null,
      maxTentativas: body.maxTentativas,
      published: body.published,
      buIds: body.buIds,
      roleFilter: body.roleFilter,
    },
  })

  return NextResponse.json(av)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  await prisma.avaliacao.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
