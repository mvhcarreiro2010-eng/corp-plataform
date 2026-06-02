import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

// GET /api/wiki — Lista categorias com páginas
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  const userBuId = session.user.buId
  const userRole = session.user.role

  const pageSegFilter = isAdmin ? { published: true } : {
    published: true,
    AND: [
      { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
      { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
    ],
  }

  if (q) {
    const pages = await prisma.wikiPage.findMany({
      where: {
        ...pageSegFilter,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
      },
      take: 20,
    })
    return NextResponse.json({ pages })
  }

  const categories = await prisma.wikiCategory.findMany({
    where: { parentId: null },
    orderBy: { order: 'asc' },
    include: {
      pages: {
        where: pageSegFilter,
        select: { id: true, title: true, slug: true, updatedAt: true },
        orderBy: { title: 'asc' },
      },
      children: {
        include: {
          pages: {
            where: pageSegFilter,
            select: { id: true, title: true, slug: true, updatedAt: true },
            orderBy: { title: 'asc' },
          },
        },
      },
    },
  })

  return NextResponse.json({ categories })
}

// POST /api/wiki — Cria categoria ou página
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allowed = ['ADMIN', 'HR', 'MANAGER']
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()

  if (body.type === 'category') {
    const category = await prisma.wikiCategory.create({
      data: {
        name: body.name,
        slug: slugify(body.name),
        icon: body.icon || '📄',
        color: body.color || '#6366f1',
        parentId: body.parentId || null,
      },
    })
    return NextResponse.json(category, { status: 201 })
  }

  // page
  const page = await prisma.wikiPage.create({
    data: {
      title: body.title,
      slug: slugify(body.title),
      content: body.content,
      excerpt: body.excerpt || body.content.slice(0, 150),
      categoryId: body.categoryId,
      authorId: session.user.id,
    },
  })

  return NextResponse.json(page, { status: 201 })
}
