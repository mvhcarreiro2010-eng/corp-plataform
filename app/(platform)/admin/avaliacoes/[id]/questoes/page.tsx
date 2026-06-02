'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Pencil, Check, Square, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type TipoQuestao = 'MULTIPLA_ESCOLHA' | 'VERDADEIRO_FALSO' | 'MULTIPLA_RESPOSTA' | 'TEXTO_LIVRE'

interface Questao {
  id: string
  tipo: TipoQuestao
  enunciado: string
  options: string[]
  answer: number
  answers: number[]
  gabarito: string | null
  ordem: number
}

const TIPO_LABELS: Record<TipoQuestao, string> = {
  MULTIPLA_ESCOLHA: 'Múltipla Escolha',
  VERDADEIRO_FALSO: 'Verdadeiro ou Falso',
  MULTIPLA_RESPOSTA: 'Múltipla Resposta',
  TEXTO_LIVRE: 'Texto Livre',
}

const TIPO_COLORS: Record<TipoQuestao, string> = {
  MULTIPLA_ESCOLHA: 'bg-blue-100 text-blue-700',
  VERDADEIRO_FALSO: 'bg-purple-100 text-purple-700',
  MULTIPLA_RESPOSTA: 'bg-orange-100 text-orange-700',
  TEXTO_LIVRE: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = {
  tipo: 'MULTIPLA_ESCOLHA' as TipoQuestao,
  enunciado: '',
  options: ['', '', '', ''],
  answer: 0,
  answers: [] as number[],
  gabarito: '',
  ordem: 0,
}

export default function QuestoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Questao | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/avaliacoes/${id}/questoes`)
    setQuestoes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, ordem: questoes.length })
    setShowForm(true)
  }

  const openEdit = (q: Questao) => {
    setEditing(q)
    setForm({
      tipo: q.tipo,
      enunciado: q.enunciado,
      options: q.options.length > 0 ? [...q.options] : ['', '', '', ''],
      answer: q.answer,
      answers: [...q.answers],
      gabarito: q.gabarito ?? '',
      ordem: q.ordem,
    })
    setShowForm(true)
  }

  const cancel = () => { setShowForm(false); setEditing(null) }

  const changeTipo = (tipo: TipoQuestao) => {
    if (tipo === 'VERDADEIRO_FALSO') {
      setForm(f => ({ ...f, tipo, options: ['Verdadeiro', 'Falso'], answer: 0, answers: [] }))
    } else if (tipo === 'TEXTO_LIVRE') {
      setForm(f => ({ ...f, tipo, options: [], answers: [] }))
    } else {
      setForm(f => ({ ...f, tipo, options: f.options.length >= 2 ? f.options : ['', '', '', ''], answers: [] }))
    }
  }

  const setOption = (i: number, v: string) => setForm(f => { const o = [...f.options]; o[i] = v; return { ...f, options: o } })
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }))
  const removeOption = (i: number) => setForm(f => ({
    ...f,
    options: f.options.filter((_, idx) => idx !== i),
    answer: f.answer >= i && f.answer > 0 ? f.answer - 1 : f.answer,
    answers: f.answers.filter(a => a !== i).map(a => a > i ? a - 1 : a),
  }))

  const toggleMultiAnswer = (i: number) => {
    setForm(f => {
      const has = f.answers.includes(i)
      return { ...f, answers: has ? f.answers.filter(a => a !== i) : [...f.answers, i] }
    })
  }

  const save = async () => {
    if (!form.enunciado.trim()) return
    if (form.tipo !== 'TEXTO_LIVRE' && form.tipo !== 'VERDADEIRO_FALSO' && form.options.filter(o => o.trim()).length < 2) return
    if (form.tipo === 'MULTIPLA_RESPOSTA' && form.answers.length === 0) return

    setSaving(true)
    const cleanOptions = form.tipo === 'TEXTO_LIVRE' ? [] : form.options.filter(o => o.trim())
    const body = {
      tipo: form.tipo,
      enunciado: form.enunciado,
      options: cleanOptions,
      answer: form.tipo === 'MULTIPLA_RESPOSTA' || form.tipo === 'TEXTO_LIVRE' ? 0 : form.answer,
      answers: form.tipo === 'MULTIPLA_RESPOSTA' ? form.answers : [],
      gabarito: form.gabarito || null,
      ordem: form.ordem,
    }

    if (editing) {
      await fetch(`/api/avaliacoes/${id}/questoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...body }),
      })
    } else {
      await fetch(`/api/avaliacoes/${id}/questoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <div className="space-y-4">
            {/* Tipo selector */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Tipo de questão *</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TIPO_LABELS) as TipoQuestao[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => changeTipo(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.tipo === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {TIPO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Enunciado */}
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

            {/* Options — MULTIPLA_ESCOLHA / MULTIPLA_RESPOSTA */}
            {(form.tipo === 'MULTIPLA_ESCOLHA' || form.tipo === 'MULTIPLA_RESPOSTA') && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  {form.tipo === 'MULTIPLA_RESPOSTA'
                    ? 'Opções (marque todas as corretas)'
                    : 'Opções (marque a correta)'}
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {form.tipo === 'MULTIPLA_RESPOSTA' ? (
                        <button
                          type="button"
                          onClick={() => toggleMultiAnswer(i)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${
                            form.answers.includes(i) ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}
                        >
                          {form.answers.includes(i) && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, answer: i }))}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            form.answer === i ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}
                        >
                          {form.answer === i && <Check className="w-3 h-3 text-white" />}
                        </button>
                      )}
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
                {form.tipo === 'MULTIPLA_RESPOSTA' && form.answers.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">Selecione pelo menos uma resposta correta</p>
                )}
              </div>
            )}

            {/* VERDADEIRO_FALSO */}
            {form.tipo === 'VERDADEIRO_FALSO' && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Resposta correta</label>
                <div className="flex gap-3">
                  {['Verdadeiro', 'Falso'].map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, answer: i }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.answer === i
                          ? i === 0 ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {i === 0 ? '✓ ' : '✗ '}{label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEXTO_LIVRE — gabarito de referência */}
            {form.tipo === 'TEXTO_LIVRE' && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Gabarito de referência <span className="text-gray-400">(opcional — exibido ao aluno após envio)</span>
                </label>
                <textarea
                  value={form.gabarito}
                  onChange={e => setForm(f => ({ ...f, gabarito: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Ex: A resposta esperada deve incluir..."
                />
                <p className="text-xs text-gray-400 mt-1">Questões de texto livre são consideradas corretas automaticamente se o aluno digitar algum texto.</p>
              </div>
            )}
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-sm">{idx + 1}.</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[q.tipo]}`}>
                      {TIPO_LABELS[q.tipo]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-2">{q.enunciado}</p>

                  {(q.tipo === 'MULTIPLA_ESCOLHA' || q.tipo === 'VERDADEIRO_FALSO') && (
                    <div className="space-y-1">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded ${i === q.answer ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                          {String.fromCharCode(65 + i)}) {opt}
                          {i === q.answer && <span className="ml-2">✓ Correta</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.tipo === 'MULTIPLA_RESPOSTA' && (
                    <div className="space-y-1">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${q.answers.includes(i) ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                          {q.answers.includes(i) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                          {String.fromCharCode(65 + i)}) {opt}
                          {q.answers.includes(i) && <span className="ml-1">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.tipo === 'TEXTO_LIVRE' && (
                    <div className="text-xs text-gray-400 italic">
                      {q.gabarito ? `Gabarito: ${q.gabarito}` : 'Sem gabarito de referência'}
                    </div>
                  )}
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
