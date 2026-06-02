import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildSegFilter } from '@/lib/segmentation'

// GET /api/popup-test
// Returns the first published testeRapido avaliacao the user hasn't fully answered yet.
// Includes the first questao (without answer field).
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json(null)

  const segFilter = buildSegFilter(session.user)

  const pending = await prisma.avaliacao.findFirst({
    where: {
      testeRapido: true,
      published: true,
      AND: segFilter.AND,
      // Exclude avaliacoes where user already has a finalized tentativa
      NOT: {
        tentativas: {
          some: {
            userId: session.user.id,
            finalizadaEm: { not: null },
          },
        },
      },
    },
    include: {
      questoes: {
        select: { id: true, enunciado: true, options: true, tipo: true },
        take: 1,
        orderBy: { ordem: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!pending || pending.questoes.length === 0) return NextResponse.json(null)

  return NextResponse.json({
    id: pending.id,
    title: pending.title,
    description: pending.description,
    questao: pending.questoes[0],
  })
}
