import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildSegFilter } from '@/lib/segmentation'

// GET /api/induction — Trilha de indução + treinamentos convocados
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)

  const trailFilter = isAdmin ? { published: true } : {
    published: true,
    ...buildSegFilter(session.user),
  }

  // Get user's admission date and turmas for milestone calculations
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      admissaoEm: true,
      turmas: { select: { turmaId: true } },
    },
  })

  const userTurmaIds = userData?.turmas.map(t => t.turmaId) ?? []

  const trail = await prisma.inductionTrail.findFirst({
    where: trailFilter,
    include: {
      steps: {
        orderBy: { order: 'asc' },
        include: {
          quizzes: true,
          progress: {
            where: { userId: session.user.id },
            select: { completed: true, score: true },
          },
        },
      },
    },
  })

  // Get convocated trainings for user's turmas
  const convocados = userTurmaIds.length > 0
    ? await prisma.treinamentoOnline.findMany({
        where: {
          published: true,
          turmaIds: { hasSome: userTurmaIds },
        },
        include: {
          presencas: { where: { userId: session.user.id }, select: { clicou: true, clicadoEm: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      })
    : []

  // Compute milestone unlock dates for steps with diasDesbloquear
  const admissaoEm = userData?.admissaoEm ?? null
  const stepsWithDates = trail?.steps.map(step => {
    if (step.diasDesbloquear === null || step.diasDesbloquear === undefined) {
      return { ...step, unlockDate: null, isUnlocked: true }
    }
    if (!admissaoEm) {
      return { ...step, unlockDate: null, isUnlocked: false }
    }
    const unlockDate = new Date(admissaoEm.getTime() + step.diasDesbloquear * 24 * 60 * 60 * 1000)
    return { ...step, unlockDate: unlockDate.toISOString(), isUnlocked: new Date() >= unlockDate }
  }) ?? []

  return NextResponse.json({
    trail: trail ? { ...trail, steps: stepsWithDates } : null,
    convocados,
    admissaoEm: admissaoEm?.toISOString() ?? null,
  })
}

// POST /api/induction/progress — Marca etapa como concluída
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { stepId, score } = await req.json()

  const step = await prisma.inductionStep.findUnique({
    where: { id: stepId },
    select: { xpReward: true, diasDesbloquear: true },
  })

  // For milestone steps, verify it's actually unlocked
  if (step?.diasDesbloquear !== null && step?.diasDesbloquear !== undefined) {
    const userData = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admissaoEm: true } })
    if (!userData?.admissaoEm) return NextResponse.json({ error: 'Data de admissão não cadastrada' }, { status: 403 })
    const unlockDate = new Date(userData.admissaoEm.getTime() + step.diasDesbloquear * 24 * 60 * 60 * 1000)
    if (new Date() < unlockDate) return NextResponse.json({ error: 'Etapa ainda bloqueada' }, { status: 403 })
  }

  const progress = await prisma.inductionProgress.upsert({
    where: { userId_stepId: { userId: session.user.id, stepId } },
    create: { userId: session.user.id, stepId, completed: true, score, completedAt: new Date() },
    update: { completed: true, score, completedAt: new Date() },
  })

  if (step) {
    // Milestone steps get bonus XP
    const milestoneBonus = step.diasDesbloquear !== null ? 100 : 0
    const quizBonus = score && score >= 80 ? 30 : 0
    const xpGain = step.xpReward + milestoneBonus + quizBonus
    await prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: xpGain } },
    })
  }

  return NextResponse.json(progress)
}
