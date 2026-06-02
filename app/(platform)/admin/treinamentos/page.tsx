'use client'

import { useState, useEffect } from 'react'
import { Video, Plus, Trash2, Eye, EyeOff, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Treinamento {
  id: string; title: string; description: string | null; url: string; type: string
  scheduledAt: string | null; duracao: number | null; published: boolean
  turmaIds: string[]; _count: { presencas: number }
}
interface Presenca { user: { name: string; email: string; bu: { name: string } | null }; clicadoEm: string | null }
interface Turma { id: string; name: string }

const TYPE_OPTIONS = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TEAMS', label: 'Microsoft Teams' },
  { value: 'OUTROS', label: 'Outros' },
]

const EMPTY = { title: '', description: '', url: '', type: 'YOUTUBE', scheduledAt: '', duracao: '', turmaIds: [] as string[] }

export default function AdminTreinamentosPage() {
  const [items, setItems] = useState<Treinamento[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [presencasView, setPresencasView] = useState<{ id: string; data: Presenca[] } | null>(null)

  const load = async () => {
    const [t, tr] = await Promise.all([
      fetch('/api/treinamentos').then(r => r.json()),
      fetch('/api/admin/turmas').then(r => r.json()),
    ])
    setItems(t)
    setTurmas(tr)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) return
    setSaving(true)
    await fetch('/api/treinamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, duracao: form.duracao ? Number(form.duracao) : null }),
    })
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY)
    load()
  }

  const togglePublish = async (t: Treinamento) => {
    await fetch('/api/treinamentos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, published: !t.published }),
    })
    load()
  }

  const remove = async (id: string, title: string) => {
    if (!confirm(`Excluir treinamento "${title}"?`)) return
    await fetch('/api/treinamentos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const viewPresencas = async (id: string) => {
    const res = await fetch(`/api/treinamentos/${id}/presenca`)
    const data = await res.json()
    setPresencasView({ id, data })
  }

  const toggleTurma = (tid: string) => {
    setForm(f => ({
      ...f,
      turmaIds: f.turmaIds.includes(tid) ? f.turmaIds.filter(x => x !== tid) : [...f.turmaIds, tid],
    }))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Treinamentos Online</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Novo Treinamento</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Novo Treinamento</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">URL (Teams/YouTube) *</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg">
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Data/Hora</label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Duração estimada (min)</label>
              <Input type="number" value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))} placeholder="60" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            {turmas.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Turmas (vazio = todas)</label>
                <div className="flex flex-wrap gap-2">
                  {turmas.map(t => (
                    <button key={t.id} type="button" onClick={() => toggleTurma(t.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${form.turmaIds.includes(t.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.title.trim() || !form.url.trim()}>{saving ? 'Salvando...' : 'Criar'}</Button>
          </div>
        </div>
      )}

      {/* Presenças modal */}
      {presencasView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Confirmações de Presença</h3>
              <button onClick={() => setPresencasView(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 py-3">
              {presencasView.data.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhuma confirmação ainda</p>
              ) : (
                <div className="space-y-2">
                  {presencasView.data.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.user.name}</p>
                        <p className="text-xs text-gray-400">{p.user.email} · {p.user.bu?.name ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto mb-0.5" />
                        <p className="text-xs text-gray-400">
                          {p.clicadoEm ? new Date(p.clicadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum treinamento criado</div>
      ) : (
        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{t.title}</span>
                  {t.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicado</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>}
                </div>
                <div className="text-xs text-gray-400 flex gap-3">
                  <span>{t.type}</span>
                  {t.scheduledAt && <span>{new Date(t.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                  <span>{t.duracao ? `${t.duracao}min` : '—'}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => viewPresencas(t.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Ver presenças">
                  <Users className="w-4 h-4" /><span className="text-xs ml-0.5">{t._count.presencas}</span>
                </button>
                <button onClick={() => togglePublish(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                  {t.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(t.id, t.title)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
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
