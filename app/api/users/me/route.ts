import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/me — Dados do usuário logado (sem campos sensíveis)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      avatar: true, bio: true, jobTitle: true, department: true,
      xp: true, level: true, regiao: true, admissaoEm: true,
      bu: { select: { id: true, name: true } },
      badges: { include: { badge: true } },
      progress: {
        where: { completed: true, lessonId: { not: null } },
        select: { id: true },
      },
      inductionProgress: {
        where: { completed: true },
        select: { id: true },
      },
    },
  })

  return NextResponse.json(user)
}

// PATCH /api/users/me — Atualiza perfil
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, bio, jobTitle, department, avatar } = await req.json()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(department !== undefined && { department }),
      ...(avatar !== undefined && { avatar }),
    },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, jobTitle: true, department: true, xp: true, level: true },
  })

  return NextResponse.json(user)
}
