import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ wiki: [], courses: [], avaliacoes: [], tagSuggestions: [] })

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  const userBuId = session.user.buId
  const userRole = session.user.role

  const seg = isAdmin ? {} : {
    AND: [
      { OR: [{ buIds: { isEmpty: true } }, ...(userBuId ? [{ buIds: { has: userBuId } }] : [])] },
      { OR: [{ roleFilter: { isEmpty: true } }, { roleFilter: { has: userRole } }] },
    ],
  }

  const textOr = [
    { title: { contains: q, mode: 'insensitive' as const } },
    { tags: { hasSome: [q.toLowerCase()] } },
  ]

  const [wiki, courses, avaliacoes] = await Promise.all([
    prisma.wikiPage.findMany({
      where: { published: true, ...seg, OR: textOr },
      select: {
        id: true, title: true, slug: true, excerpt: true, tags: true,
        category: { select: { name: true, icon: true } },
      },
      take: 5,
      orderBy: { views: 'desc' },
    }),
    prisma.course.findMany({
      where: { published: true, ...seg, OR: textOr },
      select: { id: true, title: true, tags: true },
      take: 5,
    }),
    prisma.avaliacao.findMany({
      where: { published: true, ...seg, OR: textOr },
      select: { id: true, title: true, tags: true },
      take: 5,
    }),
  ])

  // Collect all tags from results, filter those that contain the query text
  const allTags = [
    ...wiki.flatMap(p => p.tags),
    ...courses.flatMap(c => c.tags),
    ...avaliacoes.flatMap(a => a.tags),
  ]
  const qLower = q.toLowerCase()
  const tagSuggestions = [...new Set(allTags.filter(t => t.includes(qLower) && t !== qLower))]
    .slice(0, 6)

  return NextResponse.json({ wiki, courses, avaliacoes, tagSuggestions })
}
