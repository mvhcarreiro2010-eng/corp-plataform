import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cats = await prisma.wikiCategory.findMany({
    orderBy: [{ parentId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, icon: true, color: true, parentId: true, slug: true },
  })

  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const cat = await prisma.wikiCategory.create({
    data: {
      name: body.name,
      slug: slugify(body.name),
      icon: body.icon ?? '📁',
      color: body.color ?? '#6366f1',
      parentId: body.parentId ?? null,
    },
  })
  return NextResponse.json(cat, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const cat = await prisma.wikiCategory.update({
    where: { id: body.id },
    data: {
      name: body.name,
      icon: body.icon,
      color: body.color,
      parentId: body.parentId ?? null,
    },
  })
  return NextResponse.json(cat)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await prisma.wikiCategory.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
