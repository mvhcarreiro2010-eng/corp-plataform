import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'Item obrigatório' }, { status: 400 })

  const item = await prisma.lojaItem.findUnique({ where: { id: itemId } })
  if (!item || !item.ativo) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  if (item.estoque === 0) return NextResponse.json({ error: 'Item esgotado' }, { status: 409 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { xp: true } })
  if (!user || user.xp < item.xpCusto) {
    return NextResponse.json({ error: `XP insuficiente. Você tem ${user?.xp ?? 0} XP, necessário: ${item.xpCusto} XP` }, { status: 402 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.resgate.create({
      data: { userId: session.user.id, itemId, xpDebitado: item.xpCusto },
    })
    await tx.user.update({
      where: { id: session.user.id },
      data: { xp: { decrement: item.xpCusto } },
    })
    if (item.estoque > 0) {
      await tx.lojaItem.update({ where: { id: itemId }, data: { estoque: { decrement: 1 } } })
    }
  })

  return NextResponse.json({ ok: true, xpDebitado: item.xpCusto })
}

// PUT — admin: update resgate status
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, status } = await req.json()
  const validStatuses = ['PENDENTE', 'APROVADO', 'REJEITADO']
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })

  const resgate = await prisma.resgate.update({ where: { id }, data: { status } })

  // If rejecting, refund the XP
  if (status === 'REJEITADO') {
    await prisma.user.update({ where: { id: resgate.userId }, data: { xp: { increment: resgate.xpDebitado } } })
    // Restore stock if not unlimited
    const item = await prisma.lojaItem.findUnique({ where: { id: resgate.itemId } })
    if (item && item.estoque >= 0) {
      await prisma.lojaItem.update({ where: { id: resgate.itemId }, data: { estoque: { increment: 1 } } })
    }
  }

  return NextResponse.json(resgate)
}

// GET — admin: list all redemptions
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const resgates = await prisma.resgate.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      item: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(resgates)
}
