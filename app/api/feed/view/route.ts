import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/feed/view — track which post IDs the user saw
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })

  const { postIds } = await req.json()
  if (!Array.isArray(postIds) || postIds.length === 0) return NextResponse.json({ ok: false })

  await prisma.$transaction(
    postIds.map((postId: string) =>
      prisma.postView.upsert({
        where: { userId_postId: { userId: session.user.id, postId } },
        create: { userId: session.user.id, postId },
        update: { viewedAt: new Date() },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
