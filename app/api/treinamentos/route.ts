import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)

  // Get user's turmaIds for filtering
  const userTurmas = await prisma.turmaUser.findMany({
    where: { userId: session.user.id },
    select: { turmaId: true },
  })
  const userTurmaIds = userTurmas.map(t => t.turmaId)

  const where = isAdmin
    ? { published: true }
    : {
        published: true,
        OR: [
          { turmaIds: { isEmpty: true } },
          ...(userTurmaIds.length > 0 ? [{ turmaIds: { hasSome: userTurmaIds } }] : []),
        ],
      }

  const treinamentos = await prisma.treinamentoOnline.findMany({
    where,
    include: {
      _count: { select: { presencas: true } },
      presencas: { where: { userId: session.user.id }, select: { clicou: true, clicadoEm: true } },
    },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(treinamentos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { title, description, url, type, scheduledAt, duracao, turmaIds, roleFilter } = body

  if (!title?.trim() || !url?.trim()) return NextResponse.json({ error: 'Título e URL são obrigatórios' }, { status: 400 })

  const t = await prisma.treinamentoOnline.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      url: url.trim(),
      type: type || 'YOUTUBE',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      duracao: duracao ? Number(duracao) : null,
      turmaIds: turmaIds ?? [],
      roleFilter: roleFilter ?? [],
    },
  })

  return NextResponse.json(t, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...data } = body

  const t = await prisma.treinamentoOnline.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      duracao: data.duracao ? Number(data.duracao) : null,
    },
  })
  return NextResponse.json(t)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await prisma.treinamentoOnline.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
