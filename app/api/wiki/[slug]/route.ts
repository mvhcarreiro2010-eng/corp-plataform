import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const EDITOR_ROLES = ['ADMIN', 'HR', 'MANAGER']

// GET /api/wiki/[slug]
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug } = await params

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  })

  if (!page) return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })

  await prisma.wikiPage.update({ where: { id: page.id }, data: { views: { increment: 1 } } })

  return NextResponse.json(page)
}

// PUT /api/wiki/[slug]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!EDITOR_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { slug } = await params
  const body = await req.json()

  const page = await prisma.wikiPage.findUnique({ where: { slug } })
  if (!page) return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })

  const newSlug = body.title !== page.title ? slugify(body.title) : slug

  const updated = await prisma.wikiPage.update({
    where: { id: page.id },
    data: {
      title: body.title,
      slug: newSlug,
      content: body.content,
      excerpt: body.excerpt || body.content?.replace(/<[^>]+>/g, '').slice(0, 150),
      categoryId: body.categoryId,
      published: body.published ?? page.published,
      tags: body.tags ?? page.tags,
      buIds: body.buIds ?? page.buIds,
      roleFilter: body.roleFilter ?? page.roleFilter,
      userIds: body.userIds ?? page.userIds,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/wiki/[slug]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { slug } = await params
  const page = await prisma.wikiPage.findUnique({ where: { slug } })
  if (!page) return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })

  await prisma.wikiPage.delete({ where: { id: page.id } })
  return NextResponse.json({ ok: true })
}
