'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichEditor from '@/components/editor/RichEditor'

interface Comunicado {
  id: string; title: string; content: string; urgente: boolean; requireAceite: boolean
  published: boolean; buIds: string[]; roleFilter: string[]; createdAt: string
  _count: { aceites: number }
  author: { name: string }
}

const EMPTY = {
  title: '', content: '', urgente: false, requireAceite: false,
  published: false, buIds: [] as string[], roleFilter: [] as string[],
}

export default function AdminComunicadosPage() {
  const [items, setItems] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/comunicados?admin=true')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await fetch('/api/comunicados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY)
    load()
  }

  const togglePublish = async (item: Comunicado) => {
    await fetch('/api/comunicados', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, published: !item.published }),
    })
    load()
  }

  const remove = async (id: string, title: string) => {
    if (!confirm(`Excluir comunicado "${title}"?`)) return
    await fetch('/api/comunicados', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Novo Comunicado</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Novo Comunicado</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Título *</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Conteúdo *</label>
            <RichEditor content={form.content} onChange={c => setForm(f => ({ ...f, content: c }))} minHeight={150} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.urgente}
                onChange={e => setForm(f => ({ ...f, urgente: e.target.checked, requireAceite: e.target.checked ? true : f.requireAceite }))}
                className="w-4 h-4 accent-red-600" />
              <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />Urgente (popup bloqueante)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.requireAceite}
                onChange={e => setForm(f => ({ ...f, requireAceite: e.target.checked }))}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />Exigir aceite do usuário
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.published}
                onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Publicar imediatamente</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY) }}>Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving ? 'Salvando...' : 'Criar'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum comunicado criado</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white border rounded-xl px-4 py-4 flex items-start gap-4 ${item.urgente ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {item.urgente && (
                    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />Urgente
                    </span>
                  )}
                  {item.requireAceite && (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />Requer aceite
                    </span>
                  )}
                  {item.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicado</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>}
                  <span className="font-medium text-gray-900">{item.title}</span>
                </div>
                <div className="text-xs text-gray-400 flex gap-3">
                  <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{item._count.aceites} aceites</span>
                  <span>por {item.author.name}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => togglePublish(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  title={item.published ? 'Despublicar' : 'Publicar'}>
                  {item.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(item.id, item.title)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
