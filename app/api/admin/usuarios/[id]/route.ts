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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      matricula: true, cpf: true, regiao: true, department: true, jobTitle: true,
      bio: true, avatar: true, ativo: true, admissaoEm: true,
      buId: true, bu: { select: { id: true, name: true } },
      coordenadorId: true, coordenador: { select: { id: true, name: true } },
      liderId: true, lider: { select: { id: true, name: true } },
      instrutorId: true, instrutor: { select: { id: true, name: true } },
      xp: true, level: true, createdAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const {
    name, email, password, role, matricula, cpf, regiao,
    department, jobTitle, bio, buId, coordenadorId, liderId,
    instrutorId, admissaoEm, ativo,
  } = body

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
  }

  // Check email uniqueness (excluding self)
  const conflict = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), NOT: { id } } })
  if (conflict) return NextResponse.json({ error: 'E-mail já em uso por outro usuário' }, { status: 409 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || 'EMPLOYEE',
    matricula: matricula?.trim() || null,
    cpf: cpf?.trim() || null,
    regiao: regiao?.trim() || null,
    department: department?.trim() || null,
    jobTitle: jobTitle?.trim() || null,
    bio: bio?.trim() || null,
    buId: buId || null,
    coordenadorId: coordenadorId || null,
    liderId: liderId || null,
    instrutorId: instrutorId || null,
    admissaoEm: admissaoEm ? new Date(admissaoEm) : null,
  }

  if (typeof ativo === 'boolean') data.ativo = ativo

  // Only update password if provided
  if (password?.trim()) {
    if (password.trim().length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }
    data.password = await hash(password.trim(), 12)
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, ativo: true },
  })

  return NextResponse.json(user)
}
