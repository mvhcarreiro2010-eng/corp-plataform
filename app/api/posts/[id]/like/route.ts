import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[id]/like — Curtir/descurtir
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: postId } = await params

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  await prisma.like.create({ data: { postId, userId: session.user.id } })

  // +5 XP por comentar/curtir
  await prisma.user.update({
    where: { id: session.user.id },
    data: { xp: { increment: 2 } },
  })

  return NextResponse.json({ liked: true })
}
