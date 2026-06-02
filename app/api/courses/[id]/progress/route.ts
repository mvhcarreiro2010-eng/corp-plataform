import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/courses/[id]/progress — Marca lição como concluída
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: courseId } = await params
  const { lessonId, score } = await req.json()

  // Busca a lição para saber o XP
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { xpReward: true },
  })

  const progress = await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: {
      userId: session.user.id,
      lessonId,
      courseId,
      completed: true,
      score: score ?? null,
      completedAt: new Date(),
    },
    update: { completed: true, score: score ?? null, completedAt: new Date() },
  })

  // Adiciona XP ao usuário
  if (lesson) {
    const xpGain = score && score >= 80 ? lesson.xpReward + 30 : lesson.xpReward
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: xpGain } },
      select: { xp: true, level: true },
    })

    // Verifica level up
    const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
    const newLevel = thresholds.findIndex((t) => user.xp < t) - 1
    if (newLevel > user.level) {
      await prisma.user.update({ where: { id: session.user.id }, data: { level: newLevel } })
    }
  }

  return NextResponse.json(progress)
}
