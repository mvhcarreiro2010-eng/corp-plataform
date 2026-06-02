import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sessionRole = session.user.role
  const sessionUserId = session.user.id
  const { searchParams } = new URL(req.url)
  const buId = searchParams.get('buId') || undefined

  if (!['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER'].includes(sessionRole)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Determine which user IDs are in scope
  let allowedUserIds: string[] | null = null

  if (!['ADMIN', 'HR', 'MANAGER'].includes(sessionRole)) {
    if (sessionRole === 'COORDINATOR') {
      const lideres = await prisma.user.findMany({ where: { coordenadorId: sessionUserId }, select: { id: true } })
      const liderIds = lideres.map(u => u.id)
      const employees = await prisma.user.findMany({ where: { liderId: { in: liderIds } }, select: { id: true } })
      allowedUserIds = [...liderIds, ...employees.map(u => u.id)]
    } else if (sessionRole === 'LEADER') {
      const liderados = await prisma.user.findMany({ where: { liderId: sessionUserId }, select: { id: true } })
      allowedUserIds = liderados.map(u => u.id)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userWhere: any = { ativo: true }
  if (allowedUserIds) userWhere.id = { in: allowedUserIds }
  if (buId) userWhere.buId = buId

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobTitle: true,
      lastLoginAt: true,
      lastSeenAt: true,
      bu: { select: { name: true } },
      lider: { select: { name: true } },
      _count: {
        select: {
          comments: true,
          postViews: true,
          comunicadoAceites: true,
        },
      },
    },
    orderBy: { lastSeenAt: { sort: 'desc', nulls: 'last' } },
  })

  // Count total comunicados requiring aceite that each user is eligible for
  const comunicadosTotal = await prisma.comunicado.count({
    where: { published: true, requireAceite: true },
  })

  const bus = await prisma.businessUnit.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })

  const now = new Date()

  const result = users.map(u => {
    const seenMs = u.lastSeenAt ? now.getTime() - u.lastSeenAt.getTime() : null
    let status: 'online' | 'away' | 'recent' | 'offline'
    if (seenMs !== null && seenMs < 2 * 60 * 1000) status = 'online'
    else if (seenMs !== null && seenMs < 30 * 60 * 1000) status = 'away'
    else if (seenMs !== null && seenMs < 24 * 60 * 60 * 1000) status = 'recent'
    else status = 'offline'

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      jobTitle: u.jobTitle,
      bu: u.bu?.name ?? null,
      lider: u.lider?.name ?? null,
      lastLoginAt: u.lastLoginAt,
      lastSeenAt: u.lastSeenAt,
      status,
      comments: u._count.comments,
      feedsVistos: u._count.postViews,
      comunicadosAceitos: u._count.comunicadoAceites,
      comunicadosTotal,
    }
  })

  return NextResponse.json({ users: result, bus })
}
