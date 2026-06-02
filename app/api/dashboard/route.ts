import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role

  // Determine which users to report on based on role
  let targetUserIds: string[] | null = null // null = all (ADMIN/HR)

  if (role === 'COORDINATOR') {
    const coordenados = await prisma.user.findMany({ where: { coordenadorId: userId }, select: { id: true } })
    targetUserIds = coordenados.map(u => u.id)
  } else if (role === 'LEADER') {
    const liderados = await prisma.user.findMany({ where: { liderId: userId }, select: { id: true } })
    targetUserIds = liderados.map(u => u.id)
  } else if (role === 'INSTRUCTOR') {
    const alunos = await prisma.user.findMany({ where: { instrutorId: userId }, select: { id: true } })
    targetUserIds = alunos.map(u => u.id)
  } else if (!['ADMIN', 'HR', 'MANAGER'].includes(role)) {
    // Regular employee — only their own data
    targetUserIds = [userId]
  }

  const userFilter = targetUserIds ? { userId: { in: targetUserIds } } : {}
  const userIdList = targetUserIds

  // --- Courses ---
  const totalCourses = await prisma.course.count({ where: { published: true } })
  const courseProgress = await prisma.progress.findMany({
    where: { ...userFilter, courseId: { not: null }, lessonId: null },
    select: { userId: true, completed: true },
  })
  const completedCourses = courseProgress.filter(p => p.completed).length
  const inProgressCourses = courseProgress.filter(p => !p.completed).length

  // Total users in scope
  const totalUsers = userIdList
    ? userIdList.length
    : await prisma.user.count()

  // --- Assessments ---
  const tentativas = await prisma.tentativa.findMany({
    where: { ...userFilter, finalizadaEm: { not: null } },
    select: { userId: true, nota: true, acertos: true },
  })
  const avgNota = tentativas.length > 0
    ? tentativas.reduce((s, t) => s + (t.nota ?? 0), 0) / tentativas.length
    : null
  const aprovados = tentativas.filter(t => (t.nota ?? 0) >= 6).length
  const reprovados = tentativas.length - aprovados

  // --- Induction ---
  const totalSteps = await prisma.inductionStep.count()
  const completedSteps = await prisma.inductionProgress.count({
    where: { ...userFilter, completed: true },
  })

  // --- Per-user table (for ADMIN/HR/MANAGER/COORDINATOR/LEADER/INSTRUCTOR) ---
  let users: {
    id: string; name: string; role: string; bu: { name: string } | null
    _count: { tentativas: number }
    lider: { name: string } | null
    coordenador: { name: string } | null
  }[] = []

  if (['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER', 'INSTRUCTOR'].includes(role)) {
    users = await prisma.user.findMany({
      where: userIdList ? { id: { in: userIdList } } : undefined,
      select: {
        id: true, name: true, role: true,
        bu: { select: { name: true } },
        lider: { select: { name: true } },
        coordenador: { select: { name: true } },
        _count: { select: { tentativas: true } },
      },
      orderBy: { name: 'asc' },
      take: 100,
    })
  }

  return NextResponse.json({
    scope: role,
    totalUsers,
    courses: { total: totalCourses, completed: completedCourses, inProgress: inProgressCourses },
    assessments: { total: tentativas.length, avgNota, aprovados, reprovados },
    induction: { totalSteps, completedSteps },
    users,
  })
}
