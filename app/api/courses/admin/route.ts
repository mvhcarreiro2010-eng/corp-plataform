import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_ROLES = ['ADMIN', 'HR']

// GET — all courses for admin
export async function GET() {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const courses = await prisma.course.findMany({
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { orderBy: { order: 'asc' }, include: { quizzes: true } },
        },
      },
      _count: { select: { progress: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(courses)
}

// POST — create course, module, lesson, or quiz
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'course') {
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description ?? '',
        thumbnail: body.thumbnail ?? null,
        xpReward: body.xpReward ?? 100,
        published: false,
      },
      include: { modules: { include: { lessons: { include: { quizzes: true } } } }, _count: { select: { progress: true } } },
    })
    return NextResponse.json(course, { status: 201 })
  }

  if (body.entity === 'module') {
    const count = await prisma.module.count({ where: { courseId: body.courseId } })
    const mod = await prisma.module.create({
      data: { title: body.title, order: count, courseId: body.courseId },
      include: { lessons: { include: { quizzes: true } } },
    })
    return NextResponse.json(mod, { status: 201 })
  }

  if (body.entity === 'lesson') {
    const count = await prisma.lesson.count({ where: { moduleId: body.moduleId } })
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        type: body.type ?? 'TEXT',
        content: body.content ?? null,
        videoUrl: body.videoUrl ?? null,
        order: count,
        xpReward: body.xpReward ?? 20,
        duration: body.duration ?? null,
        moduleId: body.moduleId,
      },
      include: { quizzes: true },
    })
    return NextResponse.json(lesson, { status: 201 })
  }

  if (body.entity === 'quiz') {
    const quiz = await prisma.quiz.create({
      data: { question: body.question, options: body.options, answer: body.answer, lessonId: body.lessonId },
    })
    return NextResponse.json(quiz, { status: 201 })
  }

  return NextResponse.json({ error: 'Entidade desconhecida' }, { status: 400 })
}

// PUT — update course/module/lesson/quiz
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'course') {
    const course = await prisma.course.update({
      where: { id: body.id },
      data: { title: body.title, description: body.description, thumbnail: body.thumbnail, xpReward: body.xpReward, published: body.published },
    })
    return NextResponse.json(course)
  }

  if (body.entity === 'module') {
    const mod = await prisma.module.update({
      where: { id: body.id },
      data: { title: body.title, order: body.order },
    })
    return NextResponse.json(mod)
  }

  if (body.entity === 'lesson') {
    const lesson = await prisma.lesson.update({
      where: { id: body.id },
      data: {
        title: body.title,
        type: body.type,
        content: body.content,
        videoUrl: body.videoUrl ?? null,
        order: body.order,
        xpReward: body.xpReward,
        duration: body.duration ?? null,
      },
    })
    return NextResponse.json(lesson)
  }

  if (body.entity === 'quiz') {
    const quiz = await prisma.quiz.update({
      where: { id: body.id },
      data: { question: body.question, options: body.options, answer: body.answer },
    })
    return NextResponse.json(quiz)
  }

  if (body.entity === 'reorder-lessons') {
    await Promise.all(body.lessons.map((l: { id: string; order: number }) =>
      prisma.lesson.update({ where: { id: l.id }, data: { order: l.order } })
    ))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Entidade desconhecida' }, { status: 400 })
}

// DELETE — course/module/lesson/quiz
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || !ADMIN_ROLES.includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  if (body.entity === 'course') await prisma.course.delete({ where: { id: body.id } })
  else if (body.entity === 'module') await prisma.module.delete({ where: { id: body.id } })
  else if (body.entity === 'lesson') await prisma.lesson.delete({ where: { id: body.id } })
  else if (body.entity === 'quiz') await prisma.quiz.delete({ where: { id: body.id } })

  return NextResponse.json({ ok: true })
}
