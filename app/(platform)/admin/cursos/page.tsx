'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Plus, Loader2, Save, Trash2, Pencil, X, ChevronRight, ChevronDown,
  Eye, EyeOff, ChevronUp, Check, Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichEditor from '@/components/editor/RichEditor'
import { VisibilityConfig, VisibilityValue } from '@/components/admin/VisibilityConfig'

type Quiz = { id: string; question: string; options: string[]; answer: number }
type Lesson = {
  id: string; title: string; type: string; content: string | null; videoUrl: string | null
  scormPath: string | null; order: number; xpReward: number; duration: number | null; quizzes: Quiz[]
}
type Module = { id: string; title: string; order: number; lessons: Lesson[] }
type Course = {
  id: string; title: string; description: string; thumbnail: string | null
  xpReward: number; published: boolean; modules: Module[]
  buIds: string[]; roleFilter: string[]; userIds: string[]
  _count: { progress: number }
}

const LESSON_TYPES = [
  { value: 'TEXT', label: '📝 Texto' },
  { value: 'VIDEO', label: '🎬 Vídeo' },
  { value: 'QUIZ', label: '🧠 Quiz' },
  { value: 'PDF', label: '📄 PDF' },
  { value: 'SCORM', label: '🎮 SCORM' },
]

function LessonEditor({ lesson, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  lesson: Lesson; onUpdate: (l: Lesson) => void; onDelete: () => void
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [type, setType] = useState(lesson.type)
  const [content, setContent] = useState(lesson.content ?? '')
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? '')
  const [scormPath, setScormPath] = useState(lesson.scormPath ?? '')
  const [xpReward, setXpReward] = useState(lesson.xpReward)
  const [duration, setDuration] = useState(lesson.duration ?? 0)
  const [quizzes, setQuizzes] = useState<Quiz[]>(lesson.quizzes)
  const [saving, setSaving] = useState(false)
  const [uploadingScorm, setUploadingScorm] = useState(false)
  const scormRef = useRef<HTMLInputElement>(null)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/courses/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'lesson', id: lesson.id, title, type, content: content || null, videoUrl: videoUrl || null, scormPath: scormPath || null, xpReward, order: lesson.order, duration: duration || null }),
    })
    const updated = await res.json()
    onUpdate({ ...updated, quizzes })
    setEditing(false); setSaving(false)
  }

  const uploadScorm = async (file: File) => {
    setUploadingScorm(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('lessonId', lesson.id)
    const res = await fetch('/api/courses/admin/scorm', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.scormPath) {
      setScormPath(data.scormPath)
      setType('SCORM')
      onUpdate({ ...lesson, scormPath: data.scormPath, type: 'SCORM' })
    }
    setUploadingScorm(false)
  }

  const addQuiz = async () => {
    const res = await fetch('/api/courses/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', lessonId: lesson.id, question: 'Nova pergunta', options: ['Opção 1', 'Opção 2'], answer: 0 }),
    })
    const q = await res.json()
    setQuizzes(prev => [...prev, q])
  }

  const updateQuiz = async (quiz: Quiz) => {
    await fetch('/api/courses/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', ...quiz }),
    })
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? quiz : q))
  }

  const deleteQuiz = async (id: string) => {
    await fetch('/api/courses/admin', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'quiz', id }),
    })
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  const typeInfo = LESSON_TYPES.find(t => t.value === type)

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="flex flex-col">
          <button onClick={onMoveUp} disabled={isFirst} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-gray-300 hover:text-gray-500 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
        <span className="text-xs text-gray-400 w-5 text-center">{lesson.order + 1}</span>
        <span className="text-xs font-medium text-gray-600">{typeInfo?.label}</span>
        <span className="text-sm text-gray-800 flex-1">{lesson.title}</span>
        <span className="text-xs text-yellow-600">+{lesson.xpReward} XP</span>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <button onClick={() => { setEditing(!editing); setOpen(true) }} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {open && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
          {editing ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Título *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none">
                    {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">XP</label>
                  <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className="h-9" min={0} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Duração (min)</label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-9" min={0} />
                </div>
              </div>
              {type === 'VIDEO' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">URL do vídeo (YouTube, Vimeo ou /uploads/videos/...)</label>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="h-9" />
                </div>
              )}
              {(type === 'TEXT' || type === 'PDF') && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Conteúdo</label>
                  <RichEditor content={content} onChange={setContent} minHeight={200} />
                </div>
              )}
              {type === 'SCORM' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Pacote SCORM (.zip)</label>
                  {scormPath ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-xs text-green-700 flex-1 truncate">✓ {scormPath}</span>
                      <button onClick={() => scormRef.current?.click()} className="text-xs text-blue-600 hover:underline shrink-0">
                        Substituir
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => scormRef.current?.click()}
                      disabled={uploadingScorm}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {uploadingScorm ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Extraindo SCORM...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Selecionar arquivo .zip</>
                      )}
                    </button>
                  )}
                  <input
                    ref={scormRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadScorm(f); e.target.value = '' }}
                  />
                  <p className="text-xs text-gray-400">Faça upload do pacote SCORM 1.2 (.zip). O conteúdo será extraído automaticamente.</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </Button>
              </div>
            </>
          ) : (
            <div className="prose prose-sm max-w-none text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: lesson.content || '<em>Sem conteúdo.</em>' }} />
          )}

          {(type === 'QUIZ' || quizzes.length > 0) && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">PERGUNTAS ({quizzes.length})</span>
                <button onClick={addQuiz} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
              </div>
              {quizzes.map(q => (
                <div key={q.id} className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                  <Input value={q.question} onChange={(e) => updateQuiz({ ...q, question: e.target.value })}
                    onBlur={() => updateQuiz(q)} placeholder="Pergunta..." className="h-8 text-sm" />
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button onClick={() => updateQuiz({ ...q, answer: i })}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${q.answer === i ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {q.answer === i && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <Input value={opt} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; updateQuiz({ ...q, options: opts }) }}
                        placeholder={`Opção ${i + 1}`} className="h-7 text-xs flex-1" />
                    </div>
                  ))}
                  <div className="flex justify-between">
                    {q.options.length < 4 && <button onClick={() => updateQuiz({ ...q, options: [...q.options, ''] })} className="text-xs text-blue-600 hover:underline">+ Opção</button>}
                    <button onClick={() => deleteQuiz(q.id)} className="text-xs text-red-500 hover:underline ml-auto">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminCursosPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Course | null>(null)
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showNewModule, setShowNewModule] = useState(false)
  const [newModTitle, setNewModTitle] = useState('')
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonType, setNewLessonType] = useState('TEXT')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [showVis, setShowVis] = useState(false)
  const [visValue, setVisValue] = useState<VisibilityValue>({ buIds: [], roleFilter: [], userIds: [] })
  const [savingVis, setSavingVis] = useState(false)
  const thumbRef = useRef<HTMLInputElement>(null)
  const isAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/courses/admin').then(r => r.json()).then(d => { setCourses(d); if (d.length > 0) setSelected(d[0]); setLoading(false) })
  }, [isAdmin])

  if (!isAdmin) return <div className="py-20 text-center text-gray-500"><p>Sem permissão.</p></div>
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const createCourse = async () => {
    if (!newTitle.trim()) return
    const res = await fetch('/api/courses/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'course', title: newTitle, description: newDesc }),
    })
    const course = await res.json()
    setCourses(prev => [course, ...prev]); setSelected(course)
    setShowNewCourse(false); setNewTitle(''); setNewDesc('')
  }

  const uploadThumb = async (file: File) => {
    if (!selected) return
    setUploadingThumb(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      const updated = { ...selected, thumbnail: data.url }
      await fetch('/api/courses/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'course', id: selected.id, title: selected.title, description: selected.description, thumbnail: data.url, xpReward: selected.xpReward, published: selected.published }),
      })
      setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
    }
    setUploadingThumb(false)
  }

  const togglePublish = async () => {
    if (!selected) return
    const res = await fetch('/api/courses/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'course', id: selected.id, title: selected.title, description: selected.description, thumbnail: selected.thumbnail, xpReward: selected.xpReward, published: !selected.published }),
    })
    const updated = await res.json()
    setSelected({ ...selected, published: updated.published })
    setCourses(prev => prev.map(c => c.id === selected.id ? { ...c, published: updated.published } : c))
  }

  const openVisibility = () => {
    if (!selected) return
    setVisValue({ buIds: selected.buIds ?? [], roleFilter: selected.roleFilter ?? [], userIds: selected.userIds ?? [] })
    setShowVis(true)
  }

  const saveVisibility = async () => {
    if (!selected) return
    setSavingVis(true)
    await fetch('/api/courses/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'course', id: selected.id, title: selected.title, description: selected.description, thumbnail: selected.thumbnail, xpReward: selected.xpReward, published: selected.published, ...visValue }),
    })
    const updated = { ...selected, ...visValue }
    setSelected(updated)
    setCourses(prev => prev.map(c => c.id === selected.id ? { ...c, ...visValue } : c))
    setSavingVis(false)
    setShowVis(false)
  }

  const addModule = async () => {
    if (!newModTitle.trim() || !selected) return
    const res = await fetch('/api/courses/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'module', courseId: selected.id, title: newModTitle }),
    })
    const mod = await res.json()
    const updated = { ...selected, modules: [...selected.modules, mod] }
    setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
    setShowNewModule(false); setNewModTitle('')
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?') || !selected) return
    await fetch('/api/courses/admin', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'module', id: moduleId }),
    })
    const updated = { ...selected, modules: selected.modules.filter(m => m.id !== moduleId) }
    setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const addLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim() || !selected) return
    const res = await fetch('/api/courses/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'lesson', moduleId, title: newLessonTitle, type: newLessonType }),
    })
    const lesson = await res.json()
    const updated = {
      ...selected,
      modules: selected.modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m)
    }
    setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
    setShowNewLesson(null); setNewLessonTitle(''); setNewLessonType('TEXT')
  }

  const updateLesson = (moduleId: string, lesson: Lesson) => {
    if (!selected) return
    const updated = {
      ...selected,
      modules: selected.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? lesson : l) } : m)
    }
    setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Excluir esta aula?') || !selected) return
    await fetch('/api/courses/admin', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'lesson', id: lessonId }),
    })
    const updated = {
      ...selected,
      modules: selected.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m)
    }
    setSelected(updated); setCourses(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const moveLesson = async (moduleId: string, index: number, direction: 'up' | 'down') => {
    if (!selected) return
    const mod = selected.modules.find(m => m.id === moduleId)
    if (!mod) return
    const lessons = [...mod.lessons]
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= lessons.length) return;
    [lessons[index], lessons[newIdx]] = [lessons[newIdx], lessons[index]]
    const reordered = lessons.map((l, i) => ({ ...l, order: i }))
    const updated = {
      ...selected,
      modules: selected.modules.map(m => m.id === moduleId ? { ...m, lessons: reordered } : m)
    }
    setSelected(updated)
    await fetch('/api/courses/admin', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'reorder-lessons', lessons: reordered.map(l => ({ id: l.id, order: l.order })) }),
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Builder de Cursos</h1>
          <p className="text-sm text-gray-500">{courses.length} cursos cadastrados</p>
        </div>
        <Button size="sm" onClick={() => setShowNewCourse(!showNewCourse)}><Plus className="w-4 h-4" /> Novo curso</Button>
      </div>

      {showNewCourse && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nome do curso *" className="h-9" />
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição curta" className="h-9" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowNewCourse(false)}><X className="w-4 h-4" /> Cancelar</Button>
            <Button size="sm" onClick={createCourse}><Save className="w-4 h-4" /> Criar</Button>
          </div>
        </div>
      )}

      {/* Course tabs */}
      {courses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {courses.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${selected?.id === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}>
              {c.title}
              {c.published && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">ao vivo</span>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          {/* Course header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {selected.thumbnail ? (
                  <img src={selected.thumbnail} alt="" className="w-24 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">🎓</div>
                )}
                <button onClick={() => thumbRef.current?.click()}
                  disabled={uploadingThumb}
                  className="mt-1 w-24 text-xs text-center text-blue-600 hover:underline flex items-center justify-center gap-1">
                  {uploadingThumb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Alterar capa
                </button>
                <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadThumb(f); e.target.value = '' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selected.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>
                <p className="text-xs text-gray-400 mt-1">{selected.modules.length} módulos · {selected._count.progress} matrículas</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant={selected.published ? 'outline' : 'default'} onClick={togglePublish}>
                  {selected.published ? <><EyeOff className="w-4 h-4" /> Despublicar</> : <><Eye className="w-4 h-4" /> Publicar</>}
                </Button>
                <Button size="sm" variant="outline" onClick={openVisibility}>
                  Visibilidade
                </Button>
              </div>
            </div>
            {showVis && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <VisibilityConfig value={visValue} onChange={setVisValue} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowVis(false)}>Cancelar</Button>
                  <Button size="sm" onClick={saveVisibility} disabled={savingVis}>
                    {savingVis ? 'Salvando...' : 'Salvar visibilidade'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Modules */}
          {selected.modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                <span className="font-semibold text-gray-800 flex-1">{mod.title}</span>
                <span className="text-xs text-gray-400">{mod.lessons.length} aulas</span>
                <button onClick={() => deleteModule(mod.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="p-3 space-y-2">
                {mod.lessons.map((lesson, i) => (
                  <LessonEditor key={lesson.id} lesson={lesson}
                    onUpdate={(l) => updateLesson(mod.id, l)}
                    onDelete={() => deleteLesson(mod.id, lesson.id)}
                    onMoveUp={() => moveLesson(mod.id, i, 'up')}
                    onMoveDown={() => moveLesson(mod.id, i, 'down')}
                    isFirst={i === 0} isLast={i === mod.lessons.length - 1}
                  />
                ))}

                {showNewLesson === mod.id ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Título da aula *" className="h-8 text-sm flex-1" />
                      <select value={newLessonType} onChange={(e) => setNewLessonType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 text-sm bg-white focus:outline-none h-8">
                        {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewLesson(null)}><X className="w-3 h-3" /></Button>
                      <Button size="sm" className="h-7 text-xs" onClick={() => addLesson(mod.id)}><Plus className="w-3 h-3" /> Aula</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewLesson(mod.id)}
                    className="w-full py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar aula
                  </button>
                )}
              </div>
            </div>
          ))}

          {showNewModule ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <Input value={newModTitle} onChange={(e) => setNewModTitle(e.target.value)} placeholder="Nome do módulo *" className="h-9" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowNewModule(false)}><X className="w-4 h-4" /></Button>
                <Button size="sm" onClick={addModule}><Plus className="w-4 h-4" /> Módulo</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewModule(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar módulo
            </button>
          )}
        </div>
      )}

      {courses.length === 0 && !showNewCourse && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🎓</p>
          <p>Nenhum curso criado ainda. Crie o primeiro!</p>
        </div>
      )}
    </div>
  )
}
