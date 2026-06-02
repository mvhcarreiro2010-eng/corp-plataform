import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  const { searchParams } = new URL(req.url)
  const adminView = searchParams.get('admin') === 'true'

  if (isAdmin && adminView) {
    const comunicados = await prisma.comunicado.findMany({
      include: {
        author: { select: { name: true } },
        _count: { select: { aceites: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(comunicados)
  }

  const userBuId = session.user.buId
  const userRole = session.user.role

  const comunicados = await prisma.comunicado.findMany({
    where: {
      published: true,
      AND: [
        { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
        { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
      ],
    },
    include: {
      aceites: { where: { userId: session.user.id }, select: { aceitadoEm: true } },
    },
    orderBy: [{ urgente: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(comunicados)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { title, content, urgente, requireAceite, buIds, roleFilter, published } = await req.json()
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: 'Título e conteúdo obrigatórios' }, { status: 400 })

  const c = await prisma.comunicado.create({
    data: {
      title: title.trim(), content: content.trim(),
      urgente: urgente ?? false,
      requireAceite: requireAceite ?? false,
      buIds: buIds ?? [], roleFilter: roleFilter ?? [],
      published: published ?? false,
      authorId: session.user.id,
    },
  })
  return NextResponse.json(c, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, ...data } = await req.json()
  const c = await prisma.comunicado.update({ where: { id }, data })
  return NextResponse.json(c)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await prisma.comunicado.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
