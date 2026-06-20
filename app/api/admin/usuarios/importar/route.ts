import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (!['ADMIN', 'HR'].includes(session.user.role as string)) return null
  return session
}

// Parses CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const preview = formData.get('preview') === 'true'

  if (!file) return NextResponse.json({ error: 'Arquivo CSV obrigatório' }, { status: 400 })

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return NextResponse.json({ error: 'CSV vazio ou sem dados' }, { status: 400 })

  // Expected header: nome,matricula,cpf,email,senha,bu,regiao,role
  const rows = lines.slice(1).map(line => {
    const [name, matricula, cpf, email, senha, bu, regiao, role] = parseCSVLine(line)
    return { name, matricula, cpf, email, senha, bu, regiao, role }
  }).filter(r => r.name && r.email)

  // Preview: never expose plaintext passwords or CPF in the response
  if (preview) {
    const safeRows = rows.map(({ senha: _senha, cpf: _cpf, ...rest }) => rest)
    return NextResponse.json({ rows: safeRows, total: rows.length })
  }

  // Resolve BU names to IDs
  const buNames = [...new Set(rows.map(r => r.bu).filter(Boolean))]
  const buList = buNames.length > 0
    ? await prisma.businessUnit.findMany({ where: { name: { in: buNames } } })
    : []
  const buMap = Object.fromEntries(buList.map(b => [b.name.toLowerCase(), b.id]))

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (const row of rows) {
    try {
      const exists = await prisma.user.findUnique({ where: { email: row.email.toLowerCase() } })
      if (exists) { results.skipped++; continue }

      const validRoles = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'COORDINATOR', 'LEADER', 'INSTRUCTOR', 'EDITOR']
      const role = validRoles.includes(row.role?.toUpperCase()) ? row.role.toUpperCase() : 'EMPLOYEE'
      const buId = row.bu ? (buMap[row.bu.toLowerCase()] ?? null) : null

      await prisma.user.create({
        data: {
          name: row.name,
          email: row.email.toLowerCase(),
          password: await hash(row.senha || 'Mudar@123', 12),
          role: role as never,
          matricula: row.matricula || null,
          cpf: row.cpf || null,
          regiao: row.regiao || null,
          buId,
        },
      })
      results.created++
    } catch {
      results.errors.push(`${row.email}: erro ao importar`)
    }
  }

  return NextResponse.json(results)
}
