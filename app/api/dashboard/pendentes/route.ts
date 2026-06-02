import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/pendentes?tipo=curso|comunicado|wiki&itemId=&buId=&role=
// Returns users who SHOULD see the item but haven't yet
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER'].includes(session.user.role))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') // 'curso' | 'comunicado' | 'wiki'
  const itemId = searchParams.get('itemId')
  const buId = searchParams.get('buId') || undefined
  const filterRole = searchParams.get('role') || undefined

  if (!tipo) return NextResponse.json({ error: 'tipo obrigatório' }, { status: 400 })

  // Get all active users (optionally filtered)
  const userFilter: Record<string, unknown> = { ativo: true }
  if (buId) userFilter.buId = buId
  if (filterRole) userFilter.role = filterRole

  // Hierarchy scope
  const sessionRole = session.user.role
  const sessionUserId = session.user.id

  if (sessionRole === 'COORDINATOR') {
    const lideres = await prisma.user.findMany({ where: { coordenadorId: sessionUserId }, select: { id: true } })
    const liderIds = lideres.map(u => u.id)
    const employees = await prisma.user.findMany({ where: { liderId: { in: liderIds } }, select: { id: true } })
    userFilter.id = { in: [...liderIds, ...employees.map(u => u.id)] }
  } else if (sessionRole === 'LEADER') {
    const liderados = await prisma.user.findMany({ where: { liderId: sessionUserId }, select: { id: true } })
    userFilter.id = { in: liderados.map(u => u.id) }
  }

  if (tipo === 'curso') {
    const courses = await prisma.course.findMany({
      where: { published: true, ...(itemId && { id: itemId }) },
      select: { id: true, title: true, buIds: true, roleFilter: true },
    })

    const allUsers = await prisma.user.findMany({
      where: userFilter as Record<string, unknown>,
      select: { id: true, name: true, email: true, role: true, buId: true, bu: { select: { name: true } }, lider: { select: { name: true } } },
    })

    const result = await Promise.all(courses.map(async (course) => {
      // Who should see this course
      const eligible = allUsers.filter(u => {
        const buOk = course.buIds.length === 0 || (u.buId && course.buIds.includes(u.buId))
        const roleOk = course.roleFilter.length === 0 || course.roleFilter.includes(u.role)
        return buOk && roleOk
      })

      const progresso = await prisma.progress.findMany({
        where: { courseId: course.id, userId: { in: eligible.map(u => u.id) }, lessonId: null },
        select: { userId: true, completed: true },
      })
      const completedIds = new Set(progresso.filter(p => p.completed).map(p => p.userId))
      const startedIds = new Set(progresso.filter(p => !p.completed).map(p => p.userId))

      return {
        id: course.id, title: course.title, total: eligible.length,
        completed: eligible.filter(u => completedIds.has(u.id)).length,
        started: eligible.filter(u => startedIds.has(u.id)).length,
        pendentes: eligible.filter(u => !completedIds.has(u.id) && !startedIds.has(u.id)).map(u => ({
          id: u.id, name: u.name, email: u.email, bu: u.bu?.name ?? null, lider: u.lider?.name ?? null,
        })),
      }
    }))

    return NextResponse.json(result)
  }

  if (tipo === 'comunicado') {
    const comunicados = await prisma.comunicado.findMany({
      where: { published: true, ...(itemId && { id: itemId }) },
      select: { id: true, title: true, urgente: true, requireAceite: true, buIds: true, roleFilter: true },
    })

    const allUsers = await prisma.user.findMany({
      where: userFilter as Record<string, unknown>,
      select: { id: true, name: true, email: true, role: true, buId: true, bu: { select: { name: true } }, lider: { select: { name: true } } },
    })

    const result = await Promise.all(comunicados.map(async (com) => {
      const eligible = allUsers.filter(u => {
        const buOk = com.buIds.length === 0 || (u.buId && com.buIds.includes(u.buId))
        const roleOk = com.roleFilter.length === 0 || com.roleFilter.includes(u.role)
        return buOk && roleOk
      })

      const aceites = await prisma.comunicadoAceite.findMany({
        where: { comunicadoId: com.id, userId: { in: eligible.map(u => u.id) } },
        select: { userId: true },
      })
      const aceitadoIds = new Set(aceites.map(a => a.userId))

      return {
        id: com.id, title: com.title, urgente: com.urgente, total: eligible.length,
        aceitos: aceites.length,
        pendentes: eligible.filter(u => !aceitadoIds.has(u.id)).map(u => ({
          id: u.id, name: u.name, email: u.email, bu: u.bu?.name ?? null, lider: u.lider?.name ?? null,
        })),
      }
    }))

    return NextResponse.json(result)
  }

  if (tipo === 'wiki') {
    const pages = await prisma.wikiPage.findMany({
      where: { published: true, ...(itemId && { id: itemId }) },
      select: { id: true, title: true, slug: true, buIds: true, roleFilter: true },
      take: 50,
    })

    const allUsers = await prisma.user.findMany({
      where: userFilter as Record<string, unknown>,
      select: { id: true, name: true, email: true, role: true, buId: true, bu: { select: { name: true } }, lider: { select: { name: true } } },
    })

    const result = await Promise.all(pages.map(async (page) => {
      const eligible = allUsers.filter(u => {
        const buOk = page.buIds.length === 0 || (u.buId && page.buIds.includes(u.buId))
        const roleOk = page.roleFilter.length === 0 || page.roleFilter.includes(u.role)
        return buOk && roleOk
      })

      const views = await prisma.wikiPageView.findMany({
        where: { pageId: page.id, userId: { in: eligible.map(u => u.id) } },
        select: { userId: true },
      })
      const viewedIds = new Set(views.map(v => v.userId))

      return {
        id: page.id, title: page.title, slug: page.slug, total: eligible.length,
        visualizados: views.length,
        pendentes: eligible.filter(u => !viewedIds.has(u.id)).map(u => ({
          id: u.id, name: u.name, email: u.email, bu: u.bu?.name ?? null, lider: u.lider?.name ?? null,
        })),
      }
    }))

    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}
