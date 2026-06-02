import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      _count: { select: { modules: true } },
      progress: {
        where: { userId: session.user.id, courseId: { not: null }, lessonId: null },
        select: { completed: true },
      },
      modules: {
        include: {
          _count: { select: { lessons: true } },
          lessons: {
            select: {
              id: true,
              progress: {
                where: { userId: session.user.id, completed: true },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  const enriched = courses.map((c) => {
    const totalLessons = c.modules.reduce((s: number, m: typeof c.modules[0]) => s + m._count.lessons, 0)
    const completedLessons = c.modules.reduce(
      (s: number, m: typeof c.modules[0]) => s + m.lessons.filter((l: typeof m.lessons[0]) => l.progress.length > 0).length,
      0
    )
    return { ...c, totalLessons, completedLessons }
  })

  return NextResponse.json(enriched)
}
