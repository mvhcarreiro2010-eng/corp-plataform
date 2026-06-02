import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (!['ADMIN', 'HR'].includes(session.user.role as string)) return null
  return session
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const bus = await prisma.businessUnit.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(bus)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { name, region } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const bu = await prisma.businessUnit.create({ data: { name: name.trim(), region: region?.trim() || null } })
  return NextResponse.json(bu, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, name, region } = await req.json()
  if (!id || !name?.trim()) return NextResponse.json({ error: 'ID e nome obrigatórios' }, { status: 400 })

  const bu = await prisma.businessUnit.update({ where: { id }, data: { name: name.trim(), region: region?.trim() || null } })
  return NextResponse.json(bu)
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.businessUnit.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
