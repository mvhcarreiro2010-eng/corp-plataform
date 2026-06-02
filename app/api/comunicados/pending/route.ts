import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Returns urgent published comunicados that require aceite and user hasn't aceited yet
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userBuId = session.user.buId
  const userRole = session.user.role

  const pending = await prisma.comunicado.findMany({
    where: {
      published: true,
      urgente: true,
      requireAceite: true,
      AND: [
        { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
        { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
        { aceites: { none: { userId: session.user.id } } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(pending)
}
