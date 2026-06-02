import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.comunicadoAceite.upsert({
    where: { comunicadoId_userId: { comunicadoId: params.id, userId: session.user.id } },
    create: { comunicadoId: params.id, userId: session.user.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
