import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// GET: check if user already did today's check-in, or get team summary
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'today' | 'team' | 'history'

  if (type === 'today') {
    const today = await prisma.humorCheckIn.findUnique({
      where: { userId_data: { userId: session.user.id, data: todayStr() } },
    })
    return NextResponse.json({ done: !!today, humor: today?.humor ?? null })
  }

  if (type === 'team') {
    const isAdmin = ['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER'].includes(session.user.role)
    if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    // Last 7 days
    const since = new Date()
    since.setDate(since.getDate() - 6)
    const sinceStr = since.toISOString().split('T')[0]

    const checkins = await prisma.humorCheckIn.findMany({
      where: { data: { gte: sinceStr } },
      include: { user: { select: { name: true, bu: { select: { name: true } } } } },
      orderBy: { data: 'asc' },
    })

    // Group by day
    const byDay: Record<string, { total: number; sum: number; count: number }> = {}
    for (const c of checkins) {
      if (!byDay[c.data]) byDay[c.data] = { total: 0, sum: 0, count: 0 }
      byDay[c.data].sum += c.humor
      byDay[c.data].count++
    }

    const days = Object.entries(byDay).map(([data, d]) => ({
      data, avg: Math.round((d.sum / d.count) * 10) / 10, count: d.count,
    }))

    // Today's distribution
    const todayCheckins = checkins.filter(c => c.data === todayStr())
    const dist = [1, 2, 3, 4, 5].map(h => ({
      humor: h,
      count: todayCheckins.filter(c => c.humor === h).length,
    }))

    return NextResponse.json({ days, todayDist: dist, todayCount: todayCheckins.length })
  }

  return NextResponse.json({ error: 'type obrigatório' }, { status: 400 })
}

// POST: submit today's check-in
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { humor } = await req.json()
  if (!humor || humor < 1 || humor > 5) return NextResponse.json({ error: 'Humor deve ser 1-5' }, { status: 400 })

  const record = await prisma.humorCheckIn.upsert({
    where: { userId_data: { userId: session.user.id, data: todayStr() } },
    create: { userId: session.user.id, humor, data: todayStr() },
    update: { humor },
  })

  return NextResponse.json(record)
}
