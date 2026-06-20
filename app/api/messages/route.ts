import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function canAccessChannel(userId: string, userRole: string, channelId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { where: { userId }, select: { userId: true } } },
  })
  if (!channel) return false
  if (channel.type === 'PUBLIC') return true
  if (['ADMIN', 'HR'].includes(userRole)) return true
  return channel.members.length > 0
}

// GET /api/messages?channelId=...
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const channelId = new URL(req.url).searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId obrigatório' }, { status: 400 })

  if (!await canAccessChannel(session.user.id, session.user.role, channelId)) {
    return NextResponse.json({ error: 'Sem acesso a este canal' }, { status: 403 })
  }

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

  if (!await canAccessChannel(session.user.id, session.user.role, channelId)) {
    return NextResponse.json({ error: 'Sem acesso a este canal' }, { status: 403 })
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Mensagem muito longa (máx 2000 caracteres)' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: { content: content.trim(), channelId, userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
    },
  })

  return NextResponse.json(message, { status: 201 })
}
