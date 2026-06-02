import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import AdmZip from 'adm-zip'
import path from 'path'
import fs from 'fs'

// Extract launch URL from imsmanifest.xml
function parseLaunchUrl(manifestXml: string): string {
  // Try to find SCO resource href
  const scoMatch = manifestXml.match(/adlcp:scormtype="sco"[^>]*href="([^"]+)"/i)
    || manifestXml.match(/adlcp:scormType="sco"[^>]*href="([^"]+)"/i)
    || manifestXml.match(/href="([^"]+)"[^>]*adlcp:scormtype="sco"/i)
  if (scoMatch) return scoMatch[1]

  // Fallback: first resource href
  const firstHref = manifestXml.match(/href="([^"]+\.html?)"/i)
  if (firstHref) return firstHref[1]

  return 'index.html'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const lessonId = formData.get('lessonId') as string | null

  if (!file || !lessonId) return NextResponse.json({ error: 'Arquivo e lessonId são obrigatórios' }, { status: 400 })

  // Validate it's a zip
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return NextResponse.json({ error: 'O arquivo deve ser um .zip' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Extract to public/scorm/[lessonId]/
  const publicDir = path.join(process.cwd(), 'public', 'scorm', lessonId)
  if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true })
  fs.mkdirSync(publicDir, { recursive: true })

  const zip = new AdmZip(buffer)
  zip.extractAllTo(publicDir, true)

  // Find imsmanifest.xml — could be at root or inside a sub-folder
  let launchUrl = 'index.html'
  const manifestEntry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith('imsmanifest.xml'))
  if (manifestEntry) {
    const xml = manifestEntry.getData().toString('utf-8')
    const rawLaunch = parseLaunchUrl(xml)
    // Resolve relative to where manifest lives
    const manifestDir = path.dirname(manifestEntry.entryName)
    launchUrl = manifestDir === '.' ? rawLaunch : `${manifestDir}/${rawLaunch}`
  }

  const scormPath = `/scorm/${lessonId}/${launchUrl}`

  // Update the lesson
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { scormPath, type: 'SCORM' },
  })

  return NextResponse.json({ scormPath })
}
