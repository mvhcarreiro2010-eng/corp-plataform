'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Loader2, Save, Trash2, ChevronDown, ChevronRight, Eye, EyeOff,
  GripVertical, Pencil, X, Check, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichEditor from '@/components/editor/RichEditor'

type InductionQuiz = { id: string; question: string; options: string[]; answer: number }
type InductionStep = {
  id: string; title: string; content: string; type: string; order: number
  xpReward: number; mediaUrl: string | null; diasDesbloquear: number | null
  conteudoUrl: string | null; quizzes: InductionQuiz[]
}
type InductionTrail = {
  id: string; title: string; description: string | null; published: boolean
  steps: InductionStep[]
}

const STEP_TYPES = [
  { value: 'LESSON', label: '📖 Lição', color: 'bg-blue-100 text-blue-700' },
  { value: 'VIDEO', label: '🎬 Vídeo', color: 'bg-purple-100 text-purple-700' },
  { value: 'QUIZ', label: '🧠 Quiz', color: 'bg-orange-100 text-orange-700' },
  { value: 'TASK', label: '✅ Tarefa', color: 'bg-green-100 text-green-700' },
  { value: 'MILESTONE', label: '🏆 Marco', color: 'bg-amber-100 text-amber-700' },
]

const DIAS_OPTIONS = [
  { value: '', label: 'Sem trava (disponível imediatamente)' },
  { value: '5', label: '5 dias após admissão' },
  { value: '15', label: '15 dias após admissão' },
  { value: '30', label: '30 dias após admissão' },
  { value: '60', label: '60 dias após admissão' },
  { value: '90', label: '90 dias após admissão' },
  { value: '180', label: '180 dias após admissão' },
  { value: '365', label: '1 ano após admissão' },
]

function QuizEditor({ quiz, onUpdate, onDelete }: {
  quiz: InductionQuiz; onUpdate: (q: InductionQuiz) => void; onDelete: () => void
}) {
  const [q, setQ] = useState(quiz)
  const save = () => onUpdate(q)

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Pergunta</span>
        <button onClick={onDelete} className="ml-auto text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
      </div>
      <Input value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} placeholder="Pergunta do quiz..." className="h-9" />
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => setQ({ ...q, answer: i })}
              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${q.answer === i ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'}`}
            >
              {q.answer === i && <Check className="w-3 h-3 text-white" />}
            </button>
            <Input
              value={opt}
              onChange={(e) => {
                const opts = [...q.options]; opts[i] = e.target.value; setQ({ ...q, options: opts })
              }}
              placeholder={`Opção ${i + 1}`}
              className="h-8 text-sm flex-1"
            />
            {q.options.length > 2 && (
              <button onClick={() => setQ({ ...q, options: q.options.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-400"><X className="w-3 h-3" /></button>
            )}
          </div>
        ))}
        {q.options.length < 4 && (
          <button onClick={() => setQ({ ...q, options: [...q.options, ''] })} className="text-xs text-orange-600 hover:underline">+ Adicionar opção</button>
        )}
      </div>
      <div className="flex justify-end">
        <Button size="sm" className="h-8 text-xs" onClick={save}><Save className="w-3 h-3" /> Salvar quiz</Button>
      </div>
    </div>
  )
}

function StepCard({ step, trailId, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  step: InductionStep; trailId: string; onUpdate: (s: InductionStep) => void; onDelete: () => void
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(step.title)
  const [type, setType] = useState(step.type)
  const [content, setContent] = useState(step.content)
  const [mediaUrl, setMediaUrl] = useState(step.mediaUrl ?? '')
  const [xpReward, setXpReward] = useState(step.xpReward)
  const [diasDesbloquear, setDiasDesbloquear] = useState(step.diasDesbloquear?.toString() ?? '')
  const [conteudoUrl, setConteudoUrl] = useState(step.conteudoUrl ?? '')
  const [quizzes, setQuizzes] = useState<InductionQuiz[]>(step.quizzes)
  const [saving, setSaving] = useState(false)

  const typeInfo = STEP_TYPES.find(t => t.value === type) ?? STEP_TYPES[0]

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/induction/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity: 'step', id: step.id, title, type, content,
        mediaUrl: mediaUrl || null, xpReward,
        diasDesbloquear: diasDesbloquear ? Number(diasDesbloquear) : null,
        conteudoUrl: conteudoUrl || null,
      }),
    })
    const updated = await res.json()
    onUpdate({ ...updated, quizzes })
    setEditing(false)
    setSaving(false)
  }

  const addQuiz = async () => {
    const res = await fetch('/api/induction/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', stepId: step.id, question: '', options: ['', ''], answer: 0 }),
    })
    const q = await res.json()
    setQuizzes(prev => [...prev, q])
  }

  const updateQuiz = async (quiz: InductionQuiz) => {
    await fetch('/api/induction/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', ...quiz }),
    })
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? quiz : q))
  }

  const deleteQuiz = async (id: string) => {
    await fetch('/api/induction/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', id }),
    })
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
        </div>
        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{step.order + 1}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
        <span className="font-medium text-gray-900 flex-1 text-sm">{step.title}</span>
        {step.diasDesbloquear && (
          <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">🔒 {step.diasDesbloquear}d</span>
        )}
        <span className="text-xs text-yellow-600 font-medium">+{step.xpReward} XP</span>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button onClick={() => { setEditing(!editing); setOpen(true) }} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Título *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">XP da etapa</label>
                  <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className="h-9" min={0} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔒 Trava por tempo de casa</label>
                  <select value={diasDesbloquear} onChange={e => setDiasDesbloquear(e.target.value)}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DIAS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {(type === 'VIDEO' || type === 'LESSON') && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">URL de mídia (vídeo)</label>
                    <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="YouTube, Vimeo ou /uploads/..." className="h-9" />
                  </div>
                )}
                {(type === 'MILESTONE' || type === 'TASK') && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">URL de conteúdo (link externo)</label>
                    <Input value={conteudoUrl} onChange={(e) => setConteudoUrl(e.target.value)} placeholder="https://teams.microsoft.com/..." className="h-9" />
                  </div>
                )}
              </div>
              {diasDesbloquear && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                  🔒 Esta etapa ficará bloqueada até {diasDesbloquear} dias após a data de admissão do colaborador.
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Conteúdo</label>
                <RichEditor content={content} onChange={setContent} minHeight={200} />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar etapa
                </Button>
              </div>
            </>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: step.content || '<em>Sem conteúdo ainda.</em>' }} />
          )}

          {/* Quizzes */}
          {(type === 'QUIZ' || quizzes.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">PERGUNTAS DO QUIZ ({quizzes.length})</span>
                <button onClick={addQuiz} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar pergunta
                </button>
              </div>
              {quizzes.map(q => (
                <QuizEditor key={q.id} quiz={q} onUpdate={updateQuiz} onDelete={() => deleteQuiz(q.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminInducaoPage() {
  const { data: session } = useSession()
  const [trails, setTrails] = useState<InductionTrail[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrail, setSelectedTrail] = useState<InductionTrail | null>(null)
  const [showNewTrail, setShowNewTrail] = useState(false)
  const [newTrailTitle, setNewTrailTitle] = useState('')
  const [newTrailDesc, setNewTrailDesc] = useState('')
  const [savingTrail, setSavingTrail] = useState(false)
  const [addingStep, setAddingStep] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepType, setNewStepType] = useState('LESSON')
  const [newStepDias, setNewStepDias] = useState('')
  const [newStepUrl, setNewStepUrl] = useState('')

  const isAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/induction/admin').then(r => r.json()).then(d => {
      setTrails(d)
      if (d.length > 0) setSelectedTrail(d[0])
      setLoading(false)
    })
  }, [isAdmin])

  if (!isAdmin) return <div className="py-20 text-center text-gray-500"><p>Sem permissão.</p></div>
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const createTrail = async () => {
    if (!newTrailTitle.trim()) return
    setSavingTrail(true)
    const res = await fetch('/api/induction/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'trail', title: newTrailTitle, description: newTrailDesc }),
    })
    const trail = await res.json()
    setTrails(prev => [trail, ...prev])
    setSelectedTrail(trail)
    setShowNewTrail(false); setNewTrailTitle(''); setNewTrailDesc('')
    setSavingTrail(false)
  }

  const togglePublish = async () => {
    if (!selectedTrail) return
    const res = await fetch('/api/induction/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'trail', id: selectedTrail.id, title: selectedTrail.title, description: selectedTrail.description, published: !selectedTrail.published }),
    })
    const trail = await res.json()
    const updated = { ...selectedTrail, published: trail.published }
    setSelectedTrail(updated)
    setTrails(prev => prev.map(t => t.id === updated.id ? { ...t, published: trail.published } : t))
  }

  const addStep = async () => {
    if (!newStepTitle.trim() || !selectedTrail) return
    const res = await fetch('/api/induction/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity: 'step', trailId: selectedTrail.id, title: newStepTitle, type: newStepType,
        diasDesbloquear: newStepDias ? Number(newStepDias) : null,
        conteudoUrl: newStepUrl || null,
      }),
    })
    const step = await res.json()
    const updated = { ...selectedTrail, steps: [...selectedTrail.steps, step] }
    setSelectedTrail(updated)
    setTrails(prev => prev.map(t => t.id === updated.id ? updated : t))
    setAddingStep(false); setNewStepTitle(''); setNewStepType('LESSON'); setNewStepDias(''); setNewStepUrl('')
  }

  const updateStep = (step: InductionStep) => {
    if (!selectedTrail) return
    const updated = { ...selectedTrail, steps: selectedTrail.steps.map(s => s.id === step.id ? step : s) }
    setSelectedTrail(updated)
    setTrails(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const deleteStep = async (id: string) => {
    if (!confirm('Excluir esta etapa?') || !selectedTrail) return
    await fetch('/api/induction/admin', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'step', id }),
    })
    const updated = { ...selectedTrail, steps: selectedTrail.steps.filter(s => s.id !== id) }
    setSelectedTrail(updated)
    setTrails(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const moveStep = async (index: number, direction: 'up' | 'down') => {
    if (!selectedTrail) return
    const steps = [...selectedTrail.steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return;
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]]
    const reordered = steps.map((s, i) => ({ ...s, order: i }))
    setSelectedTrail({ ...selectedTrail, steps: reordered })
    await fetch('/api/induction/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'reorder', steps: reordered.map(s => ({ id: s.id, order: s.order })) }),
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Builder de Indução</h1>
          <p className="text-sm text-gray-500">Crie e edite a trilha de onboarding estilo Duolingo</p>
        </div>
        <Button size="sm" onClick={() => setShowNewTrail(!showNewTrail)}>
          <Plus className="w-4 h-4" /> Nova trilha
        </Button>
      </div>

      {showNewTrail && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <Input value={newTrailTitle} onChange={(e) => setNewTrailTitle(e.target.value)} placeholder="Nome da trilha *" className="h-9" />
          <Input value={newTrailDesc} onChange={(e) => setNewTrailDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-9" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowNewTrail(false)}><X className="w-4 h-4" /> Cancelar</Button>
            <Button size="sm" onClick={createTrail} disabled={savingTrail}>
              {savingTrail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Criar
            </Button>
          </div>
        </div>
      )}

      {/* Selector de trilhas */}
      {trails.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {trails.map(t => (
            <button key={t.id} onClick={() => setSelectedTrail(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${selectedTrail?.id === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              {t.title}
              {t.published && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">ao vivo</span>}
            </button>
          ))}
        </div>
      )}

      {selectedTrail && (
        <div className="space-y-4">
          {/* Trail header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{selectedTrail.title}</p>
              {selectedTrail.description && <p className="text-sm text-gray-500">{selectedTrail.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{selectedTrail.steps.length} etapas</p>
            </div>
            <Button size="sm" variant={selectedTrail.published ? 'outline' : 'default'} onClick={togglePublish}>
              {selectedTrail.published ? <><EyeOff className="w-4 h-4" /> Despublicar</> : <><Eye className="w-4 h-4" /> Publicar</>}
            </Button>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {selectedTrail.steps.map((step, i) => (
              <StepCard key={step.id} step={step} trailId={selectedTrail.id}
                onUpdate={updateStep}
                onDelete={() => deleteStep(step.id)}
                onMoveUp={() => moveStep(i, 'up')}
                onMoveDown={() => moveStep(i, 'down')}
                isFirst={i === 0}
                isLast={i === selectedTrail.steps.length - 1}
              />
            ))}
          </div>

          {/* Add step */}
          {addingStep ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-green-800">Nova etapa</p>
              <div className="flex gap-3">
                <Input value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} placeholder="Título da etapa *" className="h-9 flex-1" />
                <select value={newStepType} onChange={(e) => setNewStepType(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none h-9">
                  {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">🔒 Trava por tempo de casa</label>
                  <select value={newStepDias} onChange={e => setNewStepDias(e.target.value)}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none">
                    {DIAS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {(newStepType === 'MILESTONE' || newStepType === 'TASK') && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">URL de conteúdo</label>
                    <Input value={newStepUrl} onChange={e => setNewStepUrl(e.target.value)} placeholder="https://..." className="h-9" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setAddingStep(false)}><X className="w-4 h-4" /> Cancelar</Button>
                <Button size="sm" onClick={addStep}><Plus className="w-4 h-4" /> Adicionar</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingStep(true)}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar etapa
            </button>
          )}
        </div>
      )}

      {trails.length === 0 && !showNewTrail && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🚀</p>
          <p>Nenhuma trilha criada ainda. Crie a primeira!</p>
        </div>
      )}
    </div>
  )
}
