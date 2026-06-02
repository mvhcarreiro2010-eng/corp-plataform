import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !['ADMIN', 'HR'].includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const avaliacaoId = searchParams.get('avaliacaoId')

  const tentativas = await prisma.tentativa.findMany({
    where: avaliacaoId ? { avaliacaoId } : {},
    include: {
      user: { select: { name: true, email: true, matricula: true, bu: { select: { name: true } } } },
      avaliacao: { select: { title: true, questoesExibir: true } },
    },
    orderBy: { iniciadaEm: 'desc' },
    take: 5000,
  })

  const rows = [
    ['Nome', 'Email', 'Matrícula', 'BU', 'Avaliação', 'Nota', 'Acertos', 'Total Questões', 'Status', 'Iniciada em', 'Finalizada em'].join(';'),
    ...tentativas.map(t => [
      `"${t.user.name}"`,
      `"${t.user.email}"`,
      `"${t.user.matricula ?? ''}"`,
      `"${t.user.bu?.name ?? ''}"`,
      `"${t.avaliacao.title}"`,
      t.nota != null ? t.nota.toFixed(1).replace('.', ',') : '',
      t.acertos ?? '',
      t.avaliacao.questoesExibir,
      t.fechadaPorTrapa ? 'TRAPAÇA' : t.finalizadaEm ? 'Finalizada' : 'Em andamento',
      t.iniciadaEm ? new Date(t.iniciadaEm).toLocaleString('pt-BR') : '',
      t.finalizadaEm ? new Date(t.finalizadaEm).toLocaleString('pt-BR') : '',
    ].join(';')),
  ]

  const csv = rows.join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="notas_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
