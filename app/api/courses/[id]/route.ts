import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              progress: {
                where: { userId: session.user.id },
                select: { completed: true, score: true },
              },
              quizzes: true,
            },
          },
        },
      },
    },
  })

  if (!course) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  return NextResponse.json(course)
}
