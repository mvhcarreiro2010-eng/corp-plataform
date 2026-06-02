import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/posts/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const post = await prisma.post.update({
    where: { id },
    data: {
      content: body.content,
      mediaUrl: body.mediaUrl ?? null,
      mediaType: body.mediaType ?? null,
      pinned: body.pinned ?? false,
      ...(body.buIds !== undefined && { buIds: body.buIds }),
      ...(body.roleFilter !== undefined && { roleFilter: body.roleFilter }),
      ...(body.userIds !== undefined && { userIds: body.userIds }),
    },
    include: {
      author: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return NextResponse.json(post)
}

// DELETE /api/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
