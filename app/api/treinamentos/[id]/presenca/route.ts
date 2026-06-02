import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — registers that the user clicked (attended) the training
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.treinamentoPresenca.findUnique({
    where: { userId_treinamentoId: { userId: session.user.id, treinamentoId: id } },
  })

  if (existing?.clicou) {
    return NextResponse.json({ ok: true, already: true })
  }

  const XP_REWARD = 50

  await prisma.$transaction(async (tx) => {
    await tx.treinamentoPresenca.upsert({
      where: { userId_treinamentoId: { userId: session.user.id, treinamentoId: id } },
      create: { userId: session.user.id, treinamentoId: id, clicou: true, clicadoEm: new Date(), xpCreditado: true },
      update: { clicou: true, clicadoEm: new Date(), xpCreditado: true },
    })

    if (!existing?.xpCreditado) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: XP_REWARD } },
      })
    }
  })

  return NextResponse.json({ ok: true, xpGanho: existing?.xpCreditado ? 0 : XP_REWARD })
}

// GET — admin: list all presences for a training
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params

  const presencas = await prisma.treinamentoPresenca.findMany({
    where: { treinamentoId: id },
    include: { user: { select: { id: true, name: true, email: true, bu: { select: { name: true } } } } },
    orderBy: { clicadoEm: 'desc' },
  })

  return NextResponse.json(presencas)
}
