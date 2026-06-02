import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['ADMIN', 'HR']

// GET — all trails for admin
export async function GET() {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const trails = await prisma.inductionTrail.findMany({
    include: {
      steps: {
        orderBy: { order: 'asc' },
        include: { quizzes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(trails)
}

// POST — create trail or step or quiz
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'trail') {
    const trail = await prisma.inductionTrail.create({
      data: { title: body.title, description: body.description ?? null, published: false },
      include: { steps: { include: { quizzes: true } } },
    })
    return NextResponse.json(trail, { status: 201 })
  }

  if (body.entity === 'step') {
    const count = await prisma.inductionStep.count({ where: { trailId: body.trailId } })
    const step = await prisma.inductionStep.create({
      data: {
        title: body.title,
        content: body.content ?? '',
        type: body.type ?? 'LESSON',
        order: count,
        xpReward: body.xpReward ?? 50,
        mediaUrl: body.mediaUrl ?? null,
        trailId: body.trailId,
      },
      include: { quizzes: true },
    })
    return NextResponse.json(step, { status: 201 })
  }

  if (body.entity === 'quiz') {
    const quiz = await prisma.inductionQuiz.create({
      data: {
        question: body.question,
        options: body.options,
        answer: body.answer,
        stepId: body.stepId,
      },
    })
    return NextResponse.json(quiz, { status: 201 })
  }

  return NextResponse.json({ error: 'Entidade desconhecida' }, { status: 400 })
}

// PUT — update trail/step/quiz
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'trail') {
    const trail = await prisma.inductionTrail.update({
      where: { id: body.id },
      data: { title: body.title, description: body.description, published: body.published },
    })
    return NextResponse.json(trail)
  }

  if (body.entity === 'step') {
    const step = await prisma.inductionStep.update({
      where: { id: body.id },
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        order: body.order,
        xpReward: body.xpReward,
        mediaUrl: body.mediaUrl ?? null,
      },
      include: { quizzes: true },
    })
    return NextResponse.json(step)
  }

  if (body.entity === 'quiz') {
    const quiz = await prisma.inductionQuiz.update({
      where: { id: body.id },
      data: { question: body.question, options: body.options, answer: body.answer },
    })
    return NextResponse.json(quiz)
  }

  // reorder steps
  if (body.entity === 'reorder') {
    await Promise.all(
      body.steps.map((s: { id: string; order: number }) =>
        prisma.inductionStep.update({ where: { id: s.id }, data: { order: s.order } })
      )
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Entidade desconhecida' }, { status: 400 })
}

// DELETE — trail/step/quiz
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'trail') {
    await prisma.inductionTrail.delete({ where: { id: body.id } })
  } else if (body.entity === 'step') {
    await prisma.inductionStep.delete({ where: { id: body.id } })
  } else if (body.entity === 'quiz') {
    await prisma.inductionQuiz.delete({ where: { id: body.id } })
  }

  return NextResponse.json({ ok: true })
}
