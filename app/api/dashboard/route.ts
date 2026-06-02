import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function tempoDeCasaDias(admissaoEm: Date | null): number | null {
  if (!admissaoEm) return null
  return Math.floor((Date.now() - admissaoEm.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  // Determine which users to report on based on hierarchy
  // ADMIN/HR/MANAGER: all users
  // COORDINATOR: their líderes + employees linked to those líderes
  // LEADER: their direct employees (liderados)
  // EMPLOYEE/INSTRUCTOR/EDITOR: own data only
  let targetUserIds: string[] | null = null

  if (role === 'COORDINATOR') {
    // Gets leaders under this coordinator + their employees
    const lideres = await prisma.user.findMany({ where: { coordenadorId: userId }, select: { id: true } })
    const liderIds = lideres.map(u => u.id)
    const employees = await prisma.user.findMany({ where: { liderId: { in: liderIds } }, select: { id: true } })
    targetUserIds = [...liderIds, ...employees.map(u => u.id)]
  } else if (role === 'LEADER') {
    const liderados = await prisma.user.findMany({ where: { liderId: userId }, select: { id: true } })
    targetUserIds = liderados.map(u => u.id)
  } else if (!['ADMIN', 'HR', 'MANAGER'].includes(role)) {
    targetUserIds = [userId]
  }

  const userFilter = targetUserIds ? { userId: { in: targetUserIds } } : {}
  const userIdList = targetUserIds

  // --- Stats ---
  const totalCourses = await prisma.course.count({ where: { published: true } })
  const courseProgress = await prisma.progress.findMany({
    where: { ...userFilter, courseId: { not: null }, lessonId: null },
    select: { userId: true, completed: true },
  })
  const completedCourses = courseProgress.filter(p => p.completed).length
  const inProgressCourses = courseProgress.filter(p => !p.completed).length

  const totalUsers = userIdList
    ? userIdList.length
    : await prisma.user.count({ where: { ativo: true } })

  const tentativas = await prisma.tentativa.findMany({
    where: { ...userFilter, finalizadaEm: { not: null } },
    select: { userId: true, nota: true },
  })
  const avgNota = tentativas.length > 0
    ? tentativas.reduce((s, t) => s + (t.nota ?? 0), 0) / tentativas.length
    : null
  const aprovados = tentativas.filter(t => (t.nota ?? 0) >= 6).length
  const reprovados = tentativas.length - aprovados

  const totalSteps = await prisma.inductionStep.count()
  const completedSteps = await prisma.inductionProgress.count({ where: { ...userFilter, completed: true } })

  // --- Per-user table with tempo de casa ---
  let users: {
    id: string; name: string; role: string; admissaoEm: Date | null
    bu: { name: string } | null; lider: { name: string } | null; coordenador: { name: string } | null
    _count: { tentativas: number }
  }[] = []

  if (['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER'].includes(role)) {
    users = await prisma.user.findMany({
      where: userIdList ? { id: { in: userIdList }, ativo: true } : { ativo: true },
      select: {
        id: true, name: true, role: true, admissaoEm: true,
        bu: { select: { name: true } },
        lider: { select: { name: true } },
        coordenador: { select: { name: true } },
        _count: { select: { tentativas: true } },
      },
      orderBy: { name: 'asc' },
      take: 200,
    })
  }

  const usersWithTempo = users.map(u => ({
    ...u,
    admissaoEm: u.admissaoEm?.toISOString() ?? null,
    tempoDeCasaDias: tempoDeCasaDias(u.admissaoEm),
  }))

  return NextResponse.json({
    scope: role,
    totalUsers,
    courses: { total: totalCourses, completed: completedCourses, inProgress: inProgressCourses },
    assessments: { total: tentativas.length, avgNota, aprovados, reprovados },
    induction: { totalSteps, completedSteps },
    users: usersWithTempo,
  })
}
