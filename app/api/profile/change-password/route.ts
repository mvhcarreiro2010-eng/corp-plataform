import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { password } = await req.json()
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed, mustChangePassword: false },
  })

  return NextResponse.json({ ok: true })
}
