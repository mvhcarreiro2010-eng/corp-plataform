import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/posts/[id]/comments
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: postId } = await params

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, avatar: true, jobTitle: true } },
    },
  })

  return NextResponse.json(comments)
}

// POST /api/posts/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: postId } = await params
  const { content } = await req.json()

  if (!content?.trim()) return NextResponse.json({ error: 'Comentário vazio' }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { content, postId, authorId: session.user.id },
    include: {
      author: { select: { id: true, name: true, avatar: true, jobTitle: true } },
    },
  })

  // +5 XP por comentar
  await prisma.user.update({
    where: { id: session.user.id },
    data: { xp: { increment: 5 } },
  })

  return NextResponse.json(comment, { status: 201 })
}
