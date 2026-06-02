'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Lock, Star, Loader2, X, ChevronRight, Trophy, CalendarDays, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Quiz = { id: string; question: string; options: string[]; answer: number }
type Step = {
  id: string; title: string; content: string; type: string; order: number; xpReward: number
  diasDesbloquear: number | null; conteudoUrl: string | null
  unlockDate: string | null; isUnlocked: boolean
  quizzes: Quiz[]
  progress: { completed: boolean; score: number | null }[]
}
type Trail = { id: string; title: string; description: string | null; steps: Step[] }
type Convocado = {
  id: string; title: string; url: string; type: string
  scheduledAt: string | null; duracao: number | null
  presencas: { clicou: boolean; clicadoEm: string | null }[]
}

const STEP_EMOJIS: Record<string, string> = {
  QUIZ: '🎯', VIDEO: '🎬', TASK: '✏️', LESSON: '📖', MILESTONE: '🏆',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function InducaoPage() {
  const [data, setData] = useState<{ trail: Trail | null; convocados: Convocado[]; admissaoEm: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<Step | null>(null)
  const [completing, setCompleting] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)
  const [showXP, setShowXP] = useState<number | null>(null)

  const load = () => {
    fetch('/api/induction')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const completeStep = async (score?: number) => {
    if (!activeStep || completing) return
    setCompleting(true)
    await fetch('/api/induction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId: activeStep.id, score }),
    })
    const xpGained = activeStep.diasDesbloquear !== null ? activeStep.xpReward + 100 : activeStep.xpReward
    setShowXP(xpGained)
    setTimeout(() => {
      setShowXP(null)
      setActiveStep(null)
      load()
    }, 1500)
    setCompleting(false)
  }

  const checkQuiz = (idx: number) => {
    if (quizAnswer !== null) return
    setQuizAnswer(idx)
    const correct = idx === activeStep?.quizzes[0]?.answer
    setQuizResult(correct ? 'correct' : 'wrong')
    if (correct) completeStep(100)
  }

  const handleTrainingClick = async (t: Convocado) => {
    await fetch(`/api/treinamentos/${t.id}/presenca`, { method: 'POST' })
    window.open(t.url, '_blank')
    load()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const trail = data?.trail ?? null
  const convocados = data?.convocados ?? []

  if (!trail && convocados.length === 0) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🚀</p>
      <h2 className="text-xl font-semibold text-gray-900">Trilha de Indução não disponível</h2>
      <p className="text-gray-500 mt-2">Aguarde a configuração pelo RH.</p>
    </div>
  )

  const completedSteps = trail?.steps.filter(s => s.progress[0]?.completed).length ?? 0
  const totalSteps = trail?.steps.length ?? 0
  const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const isAllDone = totalSteps > 0 && completedSteps === totalSteps

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {trail && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">{trail.title}</h1>
                {trail.description && <p className="text-blue-200 text-sm mt-1">{trail.description}</p>}
                {data?.admissaoEm && (
                  <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />Admissão: {formatDate(data.admissaoEm)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-black">{percent}%</div>
                <div className="text-xs text-blue-200">{completedSteps}/{totalSteps} etapas</div>
              </div>
            </div>
            <Progress value={percent} className="h-3 bg-blue-700 [&>div]:bg-white" />
          </div>

          {isAllDone && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900">Parabéns! 🎉</h2>
              <p className="text-gray-600 mt-1">Você completou toda a trilha de integração!</p>
              <Badge variant="success" className="mt-3 text-sm px-4 py-1">Bem-vindo(a) ao time! 🚀</Badge>
            </div>
          )}

          {/* Trail Map */}
          <div className="relative">
            <div className="absolute left-1/2 top-6 bottom-6 w-0.5 bg-gray-200 -translate-x-1/2 z-0" />
            <div className="space-y-6 relative z-10">
              {trail.steps.map((step, i) => {
                const isDone = step.progress[0]?.completed
                const isMilestone = step.type === 'MILESTONE'
                const lockedByDate = isMilestone && !step.isUnlocked
                const lockedBySequence = !isDone && !lockedByDate && i > 0 && !trail.steps[i - 1].progress[0]?.completed
                const isLocked = lockedByDate || lockedBySequence
                const isActive = !isDone && !isLocked

                return (
                  <div key={step.id} className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => {
                        if (isLocked) return
                        if (isMilestone && step.conteudoUrl) {
                          window.open(step.conteudoUrl, '_blank')
                          return
                        }
                        setActiveStep(step)
                        setQuizAnswer(null)
                        setQuizResult(null)
                      }}
                      disabled={isLocked}
                      className={cn(
                        'relative w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl transition-all duration-300 shadow-md',
                        isDone
                          ? 'bg-green-500 border-green-600 text-white shadow-green-200'
                          : isActive
                          ? isMilestone
                            ? 'bg-amber-50 border-amber-400 shadow-amber-100 hover:scale-110 cursor-pointer'
                            : 'bg-white border-blue-500 shadow-blue-200 animate-pulse-ring hover:scale-110 cursor-pointer'
                          : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {isDone ? <CheckCircle className="w-10 h-10 text-white" /> :
                       isLocked ? <Lock className="w-8 h-8 text-gray-400" /> :
                       <span>{STEP_EMOJIS[step.type] ?? '📖'}</span>}
                    </button>

                    <div className={cn(
                      'text-center px-4 py-2 rounded-xl max-w-[240px]',
                      isDone ? 'bg-green-50 border border-green-200'
                        : isActive && isMilestone ? 'bg-amber-50 border border-amber-300'
                        : isActive ? 'bg-blue-50 border border-blue-300'
                        : 'bg-gray-50 border border-gray-200'
                    )}>
                      <p className={cn(
                        'text-sm font-semibold',
                        isDone ? 'text-green-700'
                          : isActive && isMilestone ? 'text-amber-700'
                          : isActive ? 'text-blue-700'
                          : 'text-gray-400'
                      )}>
                        {step.title}
                        {isMilestone && step.diasDesbloquear !== null && (
                          <span className="block text-xs font-normal mt-0.5">
                            {step.isUnlocked
                              ? '🔓 Disponível'
                              : `🔒 Libera em ${formatDate(step.unlockDate!)}`}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-600">+{step.xpReward + (isMilestone ? 100 : 0)} XP</span>
                        {isActive && !isMilestone && <Badge variant="default" className="text-xs ml-1 py-0">Agora</Badge>}
                        {isDone && <span className="text-xs text-green-600 ml-1">✓</span>}
                        {isActive && isMilestone && <Badge className="text-xs ml-1 py-0 bg-amber-500">Marco!</Badge>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Treinamentos Convocados */}
      {convocados.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />Treinamentos Convocados
          </h2>
          <div className="space-y-3">
            {convocados.map(t => {
              const presenca = t.presencas[0]
              const assistiu = presenca?.clicou
              return (
                <div key={t.id} className={cn(
                  'rounded-xl border p-4 flex items-center justify-between gap-4',
                  assistiu ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                )}>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                      {t.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(t.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {t.duracao && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duracao}min</span>}
                      {assistiu && <span className="text-green-600">✓ Confirmado</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrainingClick(t)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium shrink-0',
                      assistiu ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {assistiu ? 'Rever' : 'Acessar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step Modal */}
      {activeStep && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">{activeStep.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{activeStep.type}</Badge>
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />+{activeStep.xpReward + (activeStep.diasDesbloquear !== null ? 100 : 0)} XP
                  </span>
                </div>
              </div>
              <button onClick={() => setActiveStep(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{
                  __html: activeStep.content
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^- (.*$)/gm, '<li>$1</li>').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />'),
                }}
              />

              {activeStep.type === 'QUIZ' && activeStep.quizzes.length > 0 && (
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">{activeStep.quizzes[0].question}</p>
                  <div className="space-y-2">
                    {activeStep.quizzes[0].options.map((opt, idx) => (
                      <button key={idx} onClick={() => checkQuiz(idx)} disabled={quizAnswer !== null}
                        className={cn(
                          'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                          quizAnswer === null ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                            : idx === activeStep.quizzes[0].answer ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                            : quizAnswer === idx ? 'border-red-300 bg-red-50 text-red-600'
                            : 'border-gray-100 text-gray-400'
                        )}>
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                  {quizResult && (
                    <div className={cn('px-4 py-3 rounded-xl text-sm font-medium',
                      quizResult === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {quizResult === 'correct' ? '🎉 Correto! Avançando...' : '❌ Tente novamente!'}
                    </div>
                  )}
                </div>
              )}

              {showXP !== null && (
                <div className="flex items-center justify-center py-4">
                  <div className="bg-amber-100 text-amber-700 font-bold text-2xl px-6 py-3 rounded-2xl animate-bounce">
                    +{showXP} XP! ⭐
                  </div>
                </div>
              )}

              {activeStep.type !== 'QUIZ' && (
                <Button onClick={() => completeStep()} disabled={completing || !!activeStep.progress[0]?.completed || showXP !== null} className="w-full">
                  {completing ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    : activeStep.progress[0]?.completed ? <><CheckCircle className="w-4 h-4" /> Já concluída!</>
                    : <>Concluir e ganhar +{activeStep.xpReward + (activeStep.diasDesbloquear !== null ? 100 : 0)} XP <ChevronRight className="w-4 h-4" /></>}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
