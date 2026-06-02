import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (!['ADMIN', 'HR'].includes(session.user.role as string)) return null
  return session
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const buId = searchParams.get('buId')
  const role = searchParams.get('role')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (buId) where.buId = buId
  if (role) where.role = role
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { matricula: { contains: search, mode: 'insensitive' } },
  ]

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true, matricula: true, cpf: true,
      regiao: true, department: true, jobTitle: true, createdAt: true,
      bu: { select: { id: true, name: true } },
      coordenador: { select: { id: true, name: true } },
      lider: { select: { id: true, name: true } },
      instrutor: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await req.json()
  const { name, email, password, role, matricula, cpf, regiao, department, jobTitle, buId, coordenadorId, liderId, instrutorId } = body

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

  const hashed = await hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: role || 'EMPLOYEE',
      matricula: matricula?.trim() || null,
      cpf: cpf?.trim() || null,
      regiao: regiao?.trim() || null,
      department: department?.trim() || null,
      jobTitle: jobTitle?.trim() || null,
      buId: buId || null,
      coordenadorId: coordenadorId || null,
      liderId: liderId || null,
      instrutorId: instrutorId || null,
    },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
