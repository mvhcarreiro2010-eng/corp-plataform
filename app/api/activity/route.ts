import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/activity — heartbeat to update lastSeenAt
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
