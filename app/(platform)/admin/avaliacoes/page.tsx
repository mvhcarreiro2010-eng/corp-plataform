'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, Trash2, BookOpen, Eye, EyeOff, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Avaliacao {
  id: string; title: string; description: string | null; questoesExibir: number
  maxTentativas: number; published: boolean; createdAt: string
  _count: { questoes: number }
}

export default function AdminAvaliacoesPage() {
  const [items, setItems] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', questoesExibir: 10, tempoPorQuestao: '', tempoTotal: '', maxTentativas: 1 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    // Admin sees all - use admin bypass
    const res = await fetch('/api/avaliacoes')
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await fetch('/api/avaliacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tempoPorQuestao: form.tempoPorQuestao ? Number(form.tempoPorQuestao) : null,
        tempoTotal: form.tempoTotal ? Number(form.tempoTotal) : null,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ title: '', description: '', questoesExibir: 10, tempoPorQuestao: '', tempoTotal: '', maxTentativas: 1 })
    load()
  }

  const togglePublish = async (av: Avaliacao) => {
    await fetch(`/api/avaliacoes/${av.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...av, published: !av.published }),
    })
    load()
  }

  const remove = async (id: string, title: string) => {
    if (!confirm(`Excluir avaliação "${title}"?`)) return
    await fetch(`/api/avaliacoes/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => window.open('/api/admin/export/notas', '_blank')}>
            <Download className="w-4 h-4" />Exportar CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Nova Avaliação</Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nova Avaliação</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Questões por tentativa</label>
              <Input type="number" min={1} value={form.questoesExibir} onChange={e => setForm(f => ({ ...f, questoesExibir: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Máx. tentativas</label>
              <Input type="number" min={1} value={form.maxTentativas} onChange={e => setForm(f => ({ ...f, maxTentativas: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tempo por questão (seg, vazio = sem limite)</label>
              <Input type="number" min={0} value={form.tempoPorQuestao} onChange={e => setForm(f => ({ ...f, tempoPorQuestao: e.target.value }))} placeholder="Ex: 60" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tempo total (seg, vazio = sem limite)</label>
              <Input type="number" min={0} value={form.tempoTotal} onChange={e => setForm(f => ({ ...f, tempoTotal: e.target.value }))} placeholder="Ex: 1800" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.title.trim()}>{saving ? 'Salvando...' : 'Criar'}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma avaliação criada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(av => (
            <div key={av.id} className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{av.title}</span>
                  {av.published
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicada</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>
                  }
                </div>
                <div className="text-xs text-gray-400 flex gap-3">
                  <span><BookOpen className="w-3 h-3 inline mr-1" />{av._count.questoes} questões no banco</span>
                  <span>Exibe {av.questoesExibir} por tentativa</span>
                  <span>Máx {av.maxTentativas} tentativa(s)</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link href={`/admin/avaliacoes/${av.id}/questoes`}>
                  <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Banco de questões">
                    <BookOpen className="w-4 h-4" />
                  </button>
                </Link>
                <button onClick={() => togglePublish(av)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={av.published ? 'Despublicar' : 'Publicar'}>
                  {av.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(av.id, av.title)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
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
