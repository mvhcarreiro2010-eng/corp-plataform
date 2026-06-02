import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (!['ADMIN', 'HR'].includes(session.user.role as string)) return null
  return session
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const turmas = await prisma.turma.findMany({
    include: {
      _count: { select: { users: true } },
      users: { include: { user: { select: { id: true, name: true, email: true, role: true, bu: { select: { name: true } } } } } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(turmas)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { name, descricao } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const turma = await prisma.turma.create({ data: { name: name.trim(), descricao: descricao?.trim() || null } })
  return NextResponse.json(turma, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, name, descricao, addUserIds, removeUserIds } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  if (name !== undefined) {
    await prisma.turma.update({ where: { id }, data: { name: name.trim(), descricao: descricao?.trim() || null } })
  }

  if (addUserIds?.length) {
    await prisma.turmaUser.createMany({
      data: addUserIds.map((uid: string) => ({ turmaId: id, userId: uid })),
      skipDuplicates: true,
    })
  }

  if (removeUserIds?.length) {
    await prisma.turmaUser.deleteMany({
      where: { turmaId: id, userId: { in: removeUserIds } },
    })
  }

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true } },
      users: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  })
  return NextResponse.json(turma)
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.turma.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
