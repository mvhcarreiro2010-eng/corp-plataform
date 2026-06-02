import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const items = await prisma.lojaItem.findMany({
    where: { ativo: true },
    include: { _count: { select: { resgates: true } } },
    orderBy: { xpCusto: 'asc' },
  })

  const userXp = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true },
  })

  return NextResponse.json({ items, userXp: userXp?.xp ?? 0 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { name, description, imageUrl, xpCusto, estoque } = await req.json()
  if (!name?.trim() || !xpCusto) return NextResponse.json({ error: 'Nome e custo em XP são obrigatórios' }, { status: 400 })

  const item = await prisma.lojaItem.create({
    data: { name: name.trim(), description: description?.trim() || null, imageUrl: imageUrl || null, xpCusto: Number(xpCusto), estoque: estoque ?? -1 },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, ...data } = await req.json()
  const item = await prisma.lojaItem.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await prisma.lojaItem.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
