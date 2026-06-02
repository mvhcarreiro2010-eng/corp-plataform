'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Circle, Play, FileText, HelpCircle, Loader2, Star, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Quiz = { id: string; question: string; options: string[]; answer: number }
type Lesson = {
  id: string; title: string; content: string | null; videoUrl: string | null
  type: string; order: number; xpReward: number
  progress: { completed: boolean; score: number | null }[]
  quizzes: Quiz[]
}
type Module = { id: string; title: string; order: number; lessons: Lesson[] }
type Course = { id: string; title: string; description: string; xpReward: number; modules: Module[] }

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)

  useEffect(() => {
    fetch(`/api/courses/${params.courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data)
        // Abre a primeira lição não concluída
        const firstPending = data.modules
          .flatMap((m: Module) => m.lessons)
          .find((l: Lesson) => !l.progress[0]?.completed)
        setActiveLesson(firstPending ?? data.modules[0]?.lessons[0] ?? null)
        setLoading(false)
      })
  }, [params.courseId])

  const completeLesson = async (score?: number) => {
    if (!activeLesson || completing) return
    setCompleting(true)
    await fetch(`/api/courses/${params.courseId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: activeLesson.id, score }),
    })
    // Recarrega o curso para atualizar progresso
    const res = await fetch(`/api/courses/${params.courseId}`)
    const data = await res.json()
    setCourse(data)
    setActiveLesson(data.modules.flatMap((m: Module) => m.lessons).find((l: Lesson) => l.id === activeLesson.id))
    setCompleting(false)
    setQuizAnswer(null)
    setQuizResult(null)
  }

  const checkQuiz = (idx: number) => {
    setQuizAnswer(idx)
    if (!activeLesson?.quizzes[0]) return
    const correct = idx === activeLesson.quizzes[0].answer
    setQuizResult(correct ? 'correct' : 'wrong')
    if (correct) completeLesson(100)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  if (!course) return null

  const allLessons = course.modules.flatMap((m) => m.lessons)
  const completedCount = allLessons.filter((l) => l.progress[0]?.completed).length
  const totalLessons = allLessons.length
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const isCompleted = activeLesson?.progress[0]?.completed

  const lessonIcon = (type: string) => {
    if (type === 'VIDEO') return <Play className="w-4 h-4" />
    if (type === 'QUIZ') return <HelpCircle className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push('/aprendizado')} className="mb-4 gap-1">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <div className="grid grid-cols-3 gap-6">
        {/* Sidebar — lista de módulos/lições */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-bold text-gray-900 mb-1">{course.title}</h2>
            <p className="text-xs text-gray-500 mb-3">{completedCount}/{totalLessons} lições concluídas</p>
            <Progress value={percent} />
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">+{course.xpReward} XP ao concluir</span>
            </div>
          </div>

          {course.modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{mod.title}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {mod.lessons.map((lesson) => {
                  const done = lesson.progress[0]?.completed
                  const active = lesson.id === activeLesson?.id
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setActiveLesson(lesson); setQuizAnswer(null); setQuizResult(null) }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors',
                        active ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      {done
                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : <Circle className={cn('w-4 h-4 shrink-0', active ? 'text-blue-600' : 'text-gray-300')} />
                      }
                      <span className="flex-1 truncate">{lesson.title}</span>
                      <span className={cn('shrink-0', active ? 'text-blue-500' : 'text-gray-400')}>
                        {lessonIcon(lesson.type)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Conteúdo da lição */}
        <div className="col-span-2">
          {activeLesson ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{activeLesson.title}</h2>
                    {isCompleted && <Badge variant="success">✓ Concluída</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{activeLesson.type}</Badge>
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />+{activeLesson.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* VIDEO */}
                {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black">
                    <video controls className="w-full max-h-80" src={activeLesson.videoUrl} />
                  </div>
                )}

                {/* TEXT/PDF content */}
                {activeLesson.content && activeLesson.type !== 'QUIZ' && (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: activeLesson.content
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^- (.*$)/gm, '<li>$1</li>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br />'),
                    }}
                  />
                )}

                {/* QUIZ */}
                {activeLesson.type === 'QUIZ' && activeLesson.quizzes.length > 0 && (
                  <div className="space-y-4">
                    <p className="font-semibold text-gray-900">{activeLesson.quizzes[0].question}</p>
                    <div className="space-y-2">
                      {activeLesson.quizzes[0].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => !quizAnswer && checkQuiz(idx)}
                          disabled={quizAnswer !== null}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                            quizAnswer === null
                              ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                              : idx === activeLesson.quizzes[0].answer
                              ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                              : quizAnswer === idx
                              ? 'border-red-300 bg-red-50 text-red-600'
                              : 'border-gray-100 text-gray-400'
                          )}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizResult && (
                      <div className={cn(
                        'px-4 py-3 rounded-xl text-sm font-medium',
                        quizResult === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      )}>
                        {quizResult === 'correct' ? '🎉 Correto! +30 XP bônus!' : '❌ Incorreto. Tente novamente!'}
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de concluir */}
                {activeLesson.type !== 'QUIZ' && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => completeLesson()}
                      disabled={completing || isCompleted}
                      className={cn(isCompleted && 'bg-green-600 hover:bg-green-700')}
                    >
                      {completing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                      ) : isCompleted ? (
                        <><CheckCircle className="w-4 h-4" /> Concluída!</>
                      ) : (
                        'Marcar como concluída ✓'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400">Selecione uma lição para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
