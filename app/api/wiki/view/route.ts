import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { pageId } = await req.json()
  if (!pageId) return NextResponse.json({ error: 'pageId obrigatório' }, { status: 400 })

  await prisma.wikiPageView.upsert({
    where: { userId_pageId: { userId: session.user.id, pageId } },
    create: { userId: session.user.id, pageId },
    update: { viewedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
