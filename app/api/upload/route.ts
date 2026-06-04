import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
const ALLOWED_PDF_TYPES   = ['application/pdf']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500MB
const MAX_PDF_SIZE   = 50 * 1024 * 1024   // 50MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
  const isPdf   = ALLOWED_PDF_TYPES.includes(file.type)

  if (!isImage && !isVideo && !isPdf) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : isVideo ? MAX_VIDEO_SIZE : MAX_PDF_SIZE
  if (file.size > maxSize) {
    const limit = isImage ? '10MB' : isVideo ? '500MB' : '50MB'
    return NextResponse.json({ error: `Arquivo muito grande (máx ${limit})` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  // PDFs go to the 'images' bucket under a documents/ prefix (no new bucket needed)
  const bucket = isVideo ? 'videos' : 'images'
  const path = isPdf ? `documents/${randomUUID()}.pdf` : `${randomUUID()}.${ext}`

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

  return NextResponse.json({
    url: data.publicUrl,
    type: isImage ? 'image' : isVideo ? 'video' : 'pdf',
    name: isPdf ? file.name : undefined,
  })
}
