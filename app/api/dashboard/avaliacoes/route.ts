import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/avaliacoes?avaliacaoId=&buId=&role=&userId=
// Returns tentativas with filters, respecting hierarchy
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sessionRole = session.user.role
  const sessionUserId = session.user.id
  const { searchParams } = new URL(req.url)

  const avaliacaoId = searchParams.get('avaliacaoId') || undefined
  const buId = searchParams.get('buId') || undefined
  const filterRole = searchParams.get('role') || undefined
  const userId = searchParams.get('userId') || undefined

  // Determine hierarchy scope
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
    } else {
      allowedUserIds = [sessionUserId]
    }
  }

  // Build user filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userWhere: any = {}
  if (allowedUserIds) userWhere.id = { in: allowedUserIds }
  if (buId) userWhere.buId = buId
  if (filterRole) userWhere.role = filterRole

  const matchingUsers = Object.keys(userWhere).length > 0
    ? await prisma.user.findMany({ where: userWhere, select: { id: true } })
    : null

  const tentativas = await prisma.tentativa.findMany({
    where: {
      ...(avaliacaoId && { avaliacaoId }),
      ...(userId && { userId }),
      ...(matchingUsers && !userId && { userId: { in: matchingUsers.map(u => u.id) } }),
      finalizadaEm: { not: null },
    },
    include: {
      user: { select: { id: true, name: true, email: true, matricula: true, role: true, bu: { select: { name: true } } } },
      avaliacao: { select: { id: true, title: true, questoesExibir: true, testeRapido: true } },
    },
    orderBy: { finalizadaEm: 'desc' },
    take: 500,
  })

  // Also return list of avaliacoes for filter dropdown
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { published: true },
    select: { id: true, title: true, testeRapido: true },
    orderBy: { title: 'asc' },
  })

  const bus = await prisma.businessUnit.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })

  return NextResponse.json({ tentativas, avaliacoes, bus })
}
