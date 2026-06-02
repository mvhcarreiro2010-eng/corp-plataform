import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/channels
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = session.user.id
  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)

  const channels = await prisma.channel.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { type: 'PUBLIC' },
            { type: 'PRIVATE', members: { some: { userId } } },
          ],
        },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { messages: true, members: true } },
    },
  })

  return NextResponse.json(channels)
}
