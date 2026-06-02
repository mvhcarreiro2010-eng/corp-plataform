import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userBuId = session.user.buId
  const userRole = session.user.role
  const isAdmin = ['ADMIN', 'HR'].includes(userRole)

  const segFilter = isAdmin ? {} : {
    AND: [
      { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
      { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
    ],
  }

  const posts = await prisma.post.findMany({
    take: 8,
    where: segFilter,
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, content: true, pinned: true, createdAt: true,
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  })

  return NextResponse.json(posts)
}
