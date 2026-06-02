import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/channels
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const channels = await prisma.channel.findMany({
    where: { type: 'PUBLIC' },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { messages: true } },
    },
  })

  return NextResponse.json(channels)
}
