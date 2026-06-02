import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500MB

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
    const limit = isImage ? '10MB' : '500MB'
    return NextResponse.json({ error: `Arquivo muito grande (máx ${limit})` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const bucket = isImage ? 'images' : 'videos'
  const path = `${randomUUID()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

  return NextResponse.json({ url: data.publicUrl, type: isImage ? 'image' : 'video' })
}
