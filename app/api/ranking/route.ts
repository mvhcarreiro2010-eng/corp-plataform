import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? 'all' // all | month | week

  const now = new Date()
  let since: Date | undefined
  if (period === 'month') {
    since = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'week') {
    const day = now.getDay()
    since = new Date(now)
    since.setDate(now.getDate() - day)
    since.setHours(0, 0, 0, 0)
  }

  const dateFilter = since ? { gte: since } : undefined

  const users = await prisma.user.findMany({
    where: { ativo: true },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      jobTitle: true,
      xp: true,
      level: true,
      bu: { select: { name: true } },
      _count: {
        select: {
          posts: dateFilter ? { where: { createdAt: dateFilter } } : true,
          comments: dateFilter ? { where: { createdAt: dateFilter } } : true,
          likes: dateFilter ? { where: { createdAt: dateFilter } } : true,
        },
      },
      progress: {
        where: {
          completed: true,
          ...(dateFilter ? { completedAt: dateFilter } : {}),
        },
        select: { id: true },
      },
      tentativas: {
        where: {
          finalizadaEm: { not: null },
          ...(dateFilter ? { finalizadaEm: dateFilter } : {}),
        },
        select: { nota: true },
      },
      inductionProgress: {
        where: {
          completed: true,
          ...(dateFilter ? { completedAt: dateFilter } : {}),
        },
        select: { id: true },
      },
    },
    orderBy: { xp: 'desc' },
  })

  const ranked = users.map((u, i) => {
    const posts = u._count.posts
    const comments = u._count.comments
    const likes = u._count.likes
    const coursesCompleted = u.progress.length
    const avaliacoesFeitas = u.tentativas.length
    const avgNota = u.tentativas.length > 0
      ? u.tentativas.reduce((sum, t) => sum + (t.nota ?? 0), 0) / u.tentativas.length
      : 0
    const inducaoSteps = u.inductionProgress.length

    // Score: XP + bonuses for interactions
    const score = u.xp
      + posts * 20
      + comments * 5
      + likes * 2
      + coursesCompleted * 50
      + avaliacoesFeitas * 10
      + inducaoSteps * 10

    return {
      rank: i + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      jobTitle: u.jobTitle,
      bu: u.bu?.name ?? null,
      xp: u.xp,
      level: u.level,
      score,
      posts,
      comments,
      likes,
      coursesCompleted,
      avaliacoesFeitas,
      avgNota: Math.round(avgNota * 10) / 10,
      inducaoSteps,
    }
  }).sort((a, b) => b.score - a.score).map((u, i) => ({ ...u, rank: i + 1 }))

  return NextResponse.json({
    ranking: ranked,
    myId: session.user.id,
  })
}
