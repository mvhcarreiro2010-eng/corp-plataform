import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages?channelId=...
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const channelId = new URL(req.url).searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId obrigatório' }, { status: 400 })

  const messages = await prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: {
      user: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
    },
  })

  return NextResponse.json(messages)
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { content, channelId } = await req.json()
  if (!content?.trim() || !channelId) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: { content, channelId, userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
    },
  })

  return NextResponse.json(message, { status: 201 })
}
