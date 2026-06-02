'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, Trash2, BookOpen, Eye, EyeOff, Download, Play, Settings2, Zap, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/ui/TagInput'
import { VisibilityConfig, VisibilityValue } from '@/components/admin/VisibilityConfig'

interface Avaliacao {
  id: string; title: string; description: string | null; questoesExibir: number
  maxTentativas: number; published: boolean; createdAt: string
  buIds: string[]; roleFilter: string[]; userIds: string[]
  _count: { questoes: number }
}

const EMPTY_VIS: VisibilityValue = { buIds: [], roleFilter: [], userIds: [] }

const EMPTY_QUICK = {
  title: '',
  enunciado: '',
  opcoes: ['', '', '', ''],
  correta: 0,
}

export default function AdminAvaliacoesPage() {
  const [items, setItems] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)

  // Formulário nova avaliação completa
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', questoesExibir: 10, tempoPorQuestao: '', tempoTotal: '', maxTentativas: 1 })
  const [formTags, setFormTags] = useState<string[]>([])
  const [formVis, setFormVis] = useState<VisibilityValue>(EMPTY_VIS)
  const [saving, setSaving] = useState(false)

  // Formulário teste rápido
  const [showQuick, setShowQuick] = useState(false)
  const [quick, setQuick] = useState(EMPTY_QUICK)
  const [savingQuick, setSavingQuick] = useState(false)
  const [quickError, setQuickError] = useState('')

  // Visibilidade inline
  const [editingVis, setEditingVis] = useState<string | null>(null)
  const [editVisValue, setEditVisValue] = useState<VisibilityValue>(EMPTY_VIS)
  const [savingVis, setSavingVis] = useState(false)

  const load = async () => {
    const res = await fetch('/api/avaliacoes')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
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
        tags: formTags,
        ...formVis,
        tempoPorQuestao: form.tempoPorQuestao ? Number(form.tempoPorQuestao) : null,
        tempoTotal: form.tempoTotal ? Number(form.tempoTotal) : null,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ title: '', description: '', questoesExibir: 10, tempoPorQuestao: '', tempoTotal: '', maxTentativas: 1 })
    setFormTags([])
    setFormVis(EMPTY_VIS)
    load()
  }

  const saveQuick = async () => {
    setQuickError('')
    if (!quick.title.trim()) { setQuickError('Informe o título do teste.'); return }
    if (!quick.enunciado.trim()) { setQuickError('Informe o enunciado da questão.'); return }
    const validOpcoes = quick.opcoes.filter(o => o.trim())
    if (validOpcoes.length < 2) { setQuickError('Informe ao menos 2 opções.'); return }
    if (!quick.opcoes[quick.correta]?.trim()) { setQuickError('A opção correta está vazia.'); return }

    setSavingQuick(true)
    try {
      // 1. cria avaliação
      const resAv = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: quick.title.trim(), questoesExibir: 1, maxTentativas: 3 }),
      })
      if (!resAv.ok) { setQuickError('Erro ao criar avaliação.'); return }
      const av = await resAv.json()

      // 2. cria questão
      await fetch(`/api/avaliacoes/${av.id}/questoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enunciado: quick.enunciado.trim(),
          options: quick.opcoes.filter(o => o.trim()),
          answer: quick.correta,
        }),
      })

      // 3. publica imediatamente
      await fetch(`/api/avaliacoes/${av.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      })

      setShowQuick(false)
      setQuick(EMPTY_QUICK)
      load()
    } finally {
      setSavingQuick(false)
    }
  }

  const togglePublish = async (av: Avaliacao) => {
    await fetch(`/api/avaliacoes/${av.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...av, published: !av.published }),
    })
    load()
  }

  const openVisEdit = (av: Avaliacao) => {
    setEditingVis(av.id)
    setEditVisValue({ buIds: av.buIds ?? [], roleFilter: av.roleFilter ?? [], userIds: av.userIds ?? [] })
  }

  const saveVis = async (av: Avaliacao) => {
    setSavingVis(true)
    await fetch(`/api/avaliacoes/${av.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...av, ...editVisValue }),
    })
    setSavingVis(false)
    setEditingVis(null)
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
          <Button variant="outline" size="sm" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => { setShowQuick(true); setShowForm(false) }}>
            <Zap className="w-4 h-4" />Teste Rápido
          </Button>
          <Button onClick={() => { setShowForm(true); setShowQuick(false) }} className="gap-2">
            <Plus className="w-4 h-4" />Nova Avaliação
          </Button>
        </div>
      </div>

      {/* Modal Teste Rápido */}
      {showQuick && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-700">Teste Rápido — 1 Pergunta</h2>
            </div>
            <button onClick={() => { setShowQuick(false); setQuickError('') }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Cria uma avaliação com uma única pergunta e publica imediatamente.</p>

          {quickError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{quickError}</p>}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Título do teste *</label>
            <Input
              value={quick.title}
              onChange={e => setQuick(q => ({ ...q, title: e.target.value }))}
              placeholder="Ex: Quiz de Segurança"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Pergunta *</label>
            <textarea
              value={quick.enunciado}
              onChange={e => setQuick(q => ({ ...q, enunciado: e.target.value }))}
              placeholder="Qual é o procedimento correto em caso de acidente?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 block">Opções (marque a correta) *</label>
            {quick.opcoes.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuick(q => ({ ...q, correta: i }))}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    quick.correta === i
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {quick.correta === i && <Check className="w-3.5 h-3.5" />}
                </button>
                <Input
                  value={op}
                  onChange={e => setQuick(q => {
                    const opcoes = [...q.opcoes]
                    opcoes[i] = e.target.value
                    return { ...q, opcoes }
                  })}
                  placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                  className="flex-1 h-9"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => { setShowQuick(false); setQuickError('') }}>Cancelar</Button>
            <Button size="sm" onClick={saveQuick} disabled={savingQuick} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Zap className="w-3.5 h-3.5" />
              {savingQuick ? 'Publicando...' : 'Publicar Teste'}
            </Button>
          </div>
        </div>
      )}

      {/* Formulário nova avaliação completa */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Nova Avaliação</h2>
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
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tempo por questão (seg)</label>
              <Input type="number" min={0} value={form.tempoPorQuestao} onChange={e => setForm(f => ({ ...f, tempoPorQuestao: e.target.value }))} placeholder="Vazio = sem limite" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tempo total (seg)</label>
              <Input type="number" min={0} value={form.tempoTotal} onChange={e => setForm(f => ({ ...f, tempoTotal: e.target.value }))} placeholder="Vazio = sem limite" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
            <TagInput tags={formTags} onChange={setFormTags} />
            <p className="text-xs text-gray-400 mt-1">Pressione Enter ou vírgula para adicionar.</p>
          </div>
          <VisibilityConfig value={formVis} onChange={setFormVis} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setFormVis(EMPTY_VIS) }}>Cancelar</Button>
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
            <div key={av.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900">{av.title}</span>
                    {av.published
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicada</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>
                    }
                    {(av.buIds?.length > 0 || av.roleFilter?.length > 0 || av.userIds?.length > 0) && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Restrita</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-3 flex-wrap">
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
                  <Link href={`/avaliacoes/${av.id}`} target="_blank">
                    <button className="p-1.5 rounded hover:bg-blue-50 text-blue-400" title="Testar avaliação">
                      <Play className="w-4 h-4" />
                    </button>
                  </Link>
                  <button onClick={() => editingVis === av.id ? setEditingVis(null) : openVisEdit(av)}
                    className={`p-1.5 rounded text-gray-500 ${editingVis === av.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                    title="Visibilidade">
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => togglePublish(av)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title={av.published ? 'Despublicar' : 'Publicar'}>
                    {av.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(av.id, av.title)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingVis === av.id && (
                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                  <VisibilityConfig value={editVisValue} onChange={setEditVisValue} />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingVis(null)}>Cancelar</Button>
                    <Button size="sm" onClick={() => saveVis(av)} disabled={savingVis}>
                      {savingVis ? 'Salvando...' : 'Salvar visibilidade'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
