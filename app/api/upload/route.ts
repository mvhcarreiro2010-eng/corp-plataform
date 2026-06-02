import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Arquivo muito grande (máx ${isImage ? '10MB' : '200MB'})` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const filename = `${randomUUID()}.${ext}`
  const subdir = isImage ? 'images' : 'videos'
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir)

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const url = `/uploads/${subdir}/${filename}`
  return NextResponse.json({ url, type: isImage ? 'image' : 'video' })
}
