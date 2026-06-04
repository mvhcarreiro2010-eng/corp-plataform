'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/ui/TagInput'
import RichEditor from '@/components/editor/RichEditor'
import { VisibilityConfig, VisibilityValue } from '@/components/admin/VisibilityConfig'
import { PdfUpload } from '@/components/wiki/PdfUpload'
import Link from 'next/link'

type Category = { id: string; name: string; icon: string | null }

export default function WikiNovoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [vis, setVis] = useState<VisibilityValue>({ buIds: [], roleFilter: [], userIds: [] })
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canEdit = ['ADMIN', 'HR', 'MANAGER'].includes(session?.user?.role ?? '')

  useEffect(() => {
    fetch('/api/wiki/categories').then(r => r.json()).then(d => setCategories(d))
  }, [])

  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-gray-500">Você não tem permissão para criar artigos.</p>
        <Link href="/wiki" className="text-blue-600 text-sm mt-2 inline-block">← Voltar para a Wiki</Link>
      </div>
    )
  }

  const save = async () => {
    if (!title.trim() || !content || !categoryId) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page', title, content, categoryId, tags, pdfUrl: pdfUrl || null, pdfName: pdfName || null, ...vis }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro ao salvar'); return }
      const page = await res.json()
      router.push(`/wiki/${page.slug}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/wiki" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Novo artigo</h1>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do artigo *"
          className="text-lg font-semibold"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione uma categoria *</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
          <p className="text-xs text-gray-400 mt-1">Pressione Enter ou vírgula para adicionar. Usado na busca.</p>
        </div>

        <VisibilityConfig value={vis} onChange={setVis} />

        <PdfUpload
          pdfUrl={pdfUrl}
          pdfName={pdfName}
          onChange={(url, name) => { setPdfUrl(url); setPdfName(name) }}
        />

        <RichEditor
          content={content}
          onChange={setContent}
          placeholder="Escreva o conteúdo do artigo..."
          minHeight={400}
        />
      </div>
    </div>
  )
}
