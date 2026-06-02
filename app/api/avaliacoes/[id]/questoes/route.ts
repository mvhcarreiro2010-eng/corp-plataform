import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const questoes = await prisma.questao.findMany({
    where: { avaliacaoId: id },
    orderBy: { ordem: 'asc' },
  })
  return NextResponse.json(questoes)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const { tipo = 'MULTIPLA_ESCOLHA', enunciado, options, answer, answers, gabarito, ordem } = await req.json()

  if (!enunciado?.trim()) return NextResponse.json({ error: 'Enunciado obrigatório' }, { status: 400 })

  const q = await prisma.questao.create({
    data: {
      tipo,
      enunciado: enunciado.trim(),
      options: options ?? [],
      answer: answer ?? 0,
      answers: answers ?? [],
      gabarito: gabarito ?? null,
      ordem: ordem ?? 0,
      avaliacaoId: id,
    },
  })
  return NextResponse.json(q, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await params
  const { id: questaoId, tipo, enunciado, options, answer, answers, gabarito, ordem } = await req.json()
  const q = await prisma.questao.update({
    where: { id: questaoId },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(enunciado !== undefined && { enunciado: enunciado.trim() }),
      ...(options !== undefined && { options }),
      ...(answer !== undefined && { answer }),
      ...(answers !== undefined && { answers }),
      ...(gabarito !== undefined && { gabarito }),
      ...(ordem !== undefined && { ordem }),
    },
  })
  return NextResponse.json(q)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await params
  const { id: questaoId } = await req.json()
  await prisma.questao.delete({ where: { id: questaoId } })
  return NextResponse.json({ ok: true })
}
