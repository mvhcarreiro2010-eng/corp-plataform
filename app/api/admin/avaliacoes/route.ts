import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/avaliacoes — returns ALL avaliacoes (drafts + published + testeRapido) for admin panel
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const avaliacoes = await prisma.avaliacao.findMany({
    include: {
      _count: { select: { questoes: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(avaliacoes)
}
