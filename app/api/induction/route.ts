import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/induction — Trilha de indução do usuário atual
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const trail = await prisma.inductionTrail.findFirst({
    where: { published: true },
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

  return NextResponse.json(trail)
}

// POST /api/induction/progress — Marca etapa como concluída
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { stepId, score } = await req.json()

  const step = await prisma.inductionStep.findUnique({
    where: { id: stepId },
    select: { xpReward: true },
  })

  const progress = await prisma.inductionProgress.upsert({
    where: { userId_stepId: { userId: session.user.id, stepId } },
    create: { userId: session.user.id, stepId, completed: true, score, completedAt: new Date() },
    update: { completed: true, score, completedAt: new Date() },
  })

  if (step) {
    const xpGain = score && score >= 80 ? step.xpReward + 30 : step.xpReward
    await prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: xpGain } },
    })
  }

  return NextResponse.json(progress)
}
