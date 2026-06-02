'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Questao { id: string; enunciado: string; options: string[]; answer: number; ordem: number }

const EMPTY_FORM = { enunciado: '', options: ['', '', '', ''], answer: 0, ordem: 0 }

export default function QuestoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Questao | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/avaliacoes/${id}/questoes`)
    setQuestoes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, ordem: questoes.length }); setShowForm(true) }
  const openEdit = (q: Questao) => { setEditing(q); setForm({ enunciado: q.enunciado, options: [...q.options], answer: q.answer, ordem: q.ordem }); setShowForm(true) }
  const cancel = () => { setShowForm(false); setEditing(null) }

  const setOption = (i: number, v: string) => setForm(f => { const o = [...f.options]; o[i] = v; return { ...f, options: o } })
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }))
  const removeOption = (i: number) => setForm(f => ({
    ...f,
    options: f.options.filter((_, idx) => idx !== i),
    answer: f.answer >= i && f.answer > 0 ? f.answer - 1 : f.answer,
  }))

  const save = async () => {
    if (!form.enunciado.trim() || form.options.filter(o => o.trim()).length < 2) return
    setSaving(true)
    const cleanOptions = form.options.filter(o => o.trim())
    if (editing) {
      await fetch(`/api/avaliacoes/${id}/questoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form, options: cleanOptions }),
      })
    } else {
      await fetch(`/api/avaliacoes/${id}/questoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, options: cleanOptions }),
      })
    }
    setSaving(false)
    cancel()
    load()
  }

  const remove = async (qid: string) => {
    if (!confirm('Excluir questão?')) return
    await fetch(`/api/avaliacoes/${id}/questoes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: qid }),
    })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/avaliacoes" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Banco de Questões</h1>
          <span className="text-sm text-gray-400">({questoes.length} questões)</span>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Adicionar Questão</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Editar Questão' : 'Nova Questão'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Enunciado *</label>
              <textarea
                value={form.enunciado}
                onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Opções (marque a correta)</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, answer: i }))}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${form.answer === i ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                    >
                      {form.answer === i && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <Input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Opção ${String.fromCharCode(65 + i)}`} className="flex-1" />
                    {form.options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 6 && (
                <button onClick={addOption} className="mt-2 text-xs text-blue-600 hover:underline">+ Adicionar opção</button>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={cancel}>Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.enunciado.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : questoes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhuma questão ainda</div>
      ) : (
        <div className="space-y-3">
          {questoes.map((q, idx) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    <span className="text-gray-400 mr-2">{idx + 1}.</span>{q.enunciado}
                  </p>
                  <div className="space-y-1">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`text-xs px-2 py-1 rounded ${i === q.answer ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                        {String.fromCharCode(65 + i)}) {opt}
                        {i === q.answer && <span className="ml-2 text-green-600">✓ Correta</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(q.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
