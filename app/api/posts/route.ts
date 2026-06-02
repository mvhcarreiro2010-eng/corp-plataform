import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/posts — Lista posts do feed
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = 10

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  const userBuId = session.user.buId
  const userRole = session.user.role

  const segFilter = isAdmin ? {} : {
    AND: [
      { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
      { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
    ],
  }

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: segFilter,
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, limit) : posts
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ posts: items, nextCursor })
}

// POST /api/posts — Cria novo post
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['ADMIN', 'HR', 'EDITOR']
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { content, mediaUrl, mediaType, pinned, buIds, roleFilter } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 })

  const post = await prisma.post.create({
    data: {
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      pinned: pinned ?? false,
      buIds: buIds ?? [],
      roleFilter: roleFilter ?? [],
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, avatar: true, jobTitle: true, role: true } },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return NextResponse.json(post, { status: 201 })
}
