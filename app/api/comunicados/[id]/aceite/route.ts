import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  await prisma.comunicadoAceite.upsert({
    where: { comunicadoId_userId: { comunicadoId: id, userId: session.user.id } },
    create: { comunicadoId: id, userId: session.user.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
