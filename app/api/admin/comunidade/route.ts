import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['ADMIN', 'HR']

export async function GET() {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const channels = await prisma.channel.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { messages: true, members: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, bu: { select: { name: true } } } } },
      },
    },
  })

  return NextResponse.json(channels)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { name, description, icon, type, userIds, turmaId } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  let memberUserIds: string[] = userIds ?? []

  if (turmaId) {
    const turmaUsers = await prisma.turmaUser.findMany({ where: { turmaId }, select: { userId: true } })
    memberUserIds = [...new Set([...memberUserIds, ...turmaUsers.map(u => u.userId)])]
  }

  const channel = await prisma.channel.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon || null,
      type: type ?? 'PUBLIC',
      members: memberUserIds.length > 0
        ? { create: memberUserIds.map(uid => ({ userId: uid })) }
        : undefined,
    },
    include: {
      _count: { select: { messages: true, members: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, bu: { select: { name: true } } } } },
      },
    },
  })

  return NextResponse.json(channel, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, name, description, icon, type, addUserIds, removeUserIds, addTurmaId } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  let bulkAddIds: string[] = addUserIds ?? []

  if (addTurmaId) {
    const turmaUsers = await prisma.turmaUser.findMany({ where: { turmaId: addTurmaId }, select: { userId: true } })
    bulkAddIds = [...new Set([...bulkAddIds, ...turmaUsers.map(u => u.userId)])]
  }

  await prisma.$transaction(async (tx) => {
    if (name !== undefined || description !== undefined || icon !== undefined || type !== undefined) {
      await tx.channel.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(icon !== undefined && { icon: icon || null }),
          ...(type !== undefined && { type }),
        },
      })
    }

    if (bulkAddIds.length > 0) {
      await Promise.all(
        bulkAddIds.map(uid =>
          tx.channelMember.upsert({
            where: { channelId_userId: { channelId: id, userId: uid } },
            create: { channelId: id, userId: uid },
            update: {},
          })
        )
      )
    }

    if (removeUserIds?.length > 0) {
      await tx.channelMember.deleteMany({
        where: { channelId: id, userId: { in: removeUserIds } },
      })
    }
  })

  const updated = await prisma.channel.findUnique({
    where: { id },
    include: {
      _count: { select: { messages: true, members: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, bu: { select: { name: true } } } } },
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await prisma.channel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
