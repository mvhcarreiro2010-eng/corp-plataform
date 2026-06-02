'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save, Loader2, Image, Video, Link, X, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichEditor from '@/components/editor/RichEditor'
import { VisibilityConfig, VisibilityValue } from '@/components/admin/VisibilityConfig'
import NextLink from 'next/link'

interface PostEditorProps {
  mode: 'create' | 'edit'
  postId?: string
}

type MediaType = 'image' | 'video' | 'youtube' | null

export default function PostEditor({ mode, postId }: PostEditorProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>(null)
  const [pinned, setPinned] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [vis, setVis] = useState<VisibilityValue>({ buIds: [], roleFilter: [], userIds: [] })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit')
  const [error, setError] = useState('')

  const isAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')

  useEffect(() => {
    if (mode === 'edit' && postId) {
      fetch(`/api/posts?id=${postId}`).then(async (r) => {
        const data = await r.json()
        const post = data.posts?.[0]
        if (post) {
          setContent(post.content)
          setMediaUrl(post.mediaUrl ?? '')
          setMediaType(post.mediaType ?? null)
          setPinned(post.pinned)
          setVis({ buIds: post.buIds ?? [], roleFilter: post.roleFilter ?? [], userIds: post.userIds ?? [] })
        }
        setLoading(false)
      })
    }
  }, [mode, postId])

  if (!isAdmin) return (
    <div className="py-20 text-center text-gray-500">
      <p>Sem permissão para criar ou editar posts.</p>
    </div>
  )

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setMediaUrl(data.url)
        setMediaType(data.type)
      }
    } finally {
      setUploading(false)
    }
  }

  const addYoutube = () => {
    if (!youtubeUrl) return
    setMediaUrl(youtubeUrl)
    setMediaType('youtube')
    setShowYoutubeInput(false)
    setYoutubeUrl('')
  }

  const removeMedia = () => {
    setMediaUrl('')
    setMediaType(null)
  }

  const save = async () => {
    if (!content.trim()) { setError('O conteúdo do post é obrigatório.'); return }
    setSaving(true); setError('')
    try {
      const body = { content, mediaUrl: mediaUrl || null, mediaType: mediaType || null, pinned, ...vis }
      const res = mode === 'create'
        ? await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/posts/${postId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro ao salvar'); return }
      router.push('/admin/posts')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <NextLink href="/admin/posts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Gerenciar posts
        </NextLink>
        <h1 className="text-lg font-bold text-gray-900">{mode === 'create' ? 'Novo post' : 'Editar post'}</h1>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Publicar
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Opção fixar */}
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
        <Pin className="w-4 h-4 text-yellow-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">Fixar no topo do feed</p>
          <p className="text-xs text-yellow-600">Posts fixados aparecem sempre primeiro.</p>
        </div>
        <button
          type="button"
          onClick={() => setPinned(!pinned)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pinned ? 'bg-yellow-500' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pinned ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Editor de conteúdo */}
      <RichEditor content={content} onChange={setContent} placeholder="Escreva o comunicado, notícia ou anúncio..." minHeight={300} />

      {/* Visibilidade */}
      <VisibilityConfig value={vis} onChange={setVis} />

      {/* Mídia */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Mídia (opcional)</p>

        {mediaUrl && (
          <div className="relative">
            {mediaType === 'image' && <img src={mediaUrl} alt="preview" className="max-h-60 w-full object-cover rounded-lg" />}
            {mediaType === 'video' && (
              <video controls className="w-full rounded-lg max-h-60">
                <source src={mediaUrl} />
              </video>
            )}
            {mediaType === 'youtube' && (
              <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-2">
                <span className="text-red-500 text-lg">▶</span>
                <span className="text-white text-sm truncate flex-1">{mediaUrl}</span>
              </div>
            )}
            <button
              onClick={removeMedia}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!mediaUrl && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click() } }}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              Imagem
            </button>
            <button
              type="button"
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click() } }}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Video className="w-4 h-4" />
              Vídeo
            </button>
            <button
              type="button"
              onClick={() => setShowYoutubeInput(!showYoutubeInput)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Link className="w-4 h-4" />
              YouTube / Vimeo
            </button>
          </div>
        )}

        {showYoutubeInput && !mediaUrl && (
          <div className="flex gap-2">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Cole a URL do YouTube ou Vimeo"
              className="flex-1 h-9 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYoutube() } }}
            />
            <Button size="sm" className="h-9" onClick={addYoutube}>Adicionar</Button>
            <button type="button" onClick={() => setShowYoutubeInput(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        <input ref={fileInputRef} type="file" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
      </div>
    </div>
  )
}
