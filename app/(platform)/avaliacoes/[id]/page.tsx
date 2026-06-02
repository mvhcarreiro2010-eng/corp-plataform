'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle2, XCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Questao { id: string; enunciado: string; options: string[] }
interface GabaritoItem { correta: number; marcada: number | null; acertou: boolean; enunciado: string; options: string[] }
interface ExamState {
  tentativaId: string
  questoes: Questao[]
  tempoPorQuestao: number | null
  tempoTotal: number | null
  iniciadaEm: string
}
interface Result { nota: number; acertos: number; total: number; gabarito: Record<string, GabaritoItem> }

function Timer({ seconds, onExpire, label }: { seconds: number; onExpire: () => void; label: string }) {
  const [remaining, setRemaining] = useState(seconds)
  const expired = useRef(false)

  useEffect(() => {
    setRemaining(seconds)
    expired.current = false
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      if (!expired.current) { expired.current = true; onExpire() }
      return
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onExpire])

  const pct = (remaining / seconds) * 100
  const urgent = remaining <= 10

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-medium ${urgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
      <Clock className="w-4 h-4" />
      <span>{label}: {Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}</span>
    </div>
  )
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [exam, setExam] = useState<ExamState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [trapWarning, setTrapWarning] = useState(false)
  const trapCount = useRef(0)
  const submitted = useRef(false)

  const submit = useCallback(async (forceAnswers?: Record<string, number>, byTrapa = false) => {
    if (submitted.current || !exam) return
    submitted.current = true
    setSubmitting(true)
    const res = await fetch(`/api/avaliacoes/${id}/submeter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tentativaId: exam.tentativaId,
        respostas: forceAnswers ?? answers,
        fechadaPorTrapa: byTrapa,
      }),
    })
    const data = await res.json()
    setResult(data)
    setSubmitting(false)
  }, [exam, answers, id])

  // Anti-cheat: tab switch / window blur
  useEffect(() => {
    if (!exam || result) return

    const handleVisibility = () => {
      if (document.hidden) {
        trapCount.current++
        if (trapCount.current === 1) {
          setTrapWarning(true)
        } else {
          setTrapWarning(false)
          submit(answers, true)
        }
      }
    }
    const handleBlur = () => {
      // Only count significant blurs (DevTools detection via inner/outer size)
      const delta = window.outerHeight - window.innerHeight
      if (delta > 200) {
        trapCount.current++
        if (trapCount.current === 1) {
          setTrapWarning(true)
        } else {
          submit(answers, true)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [exam, result, answers, submit])

  // Block right-click and text selection
  useEffect(() => {
    if (!exam || result) return
    const noContext = (e: MouseEvent) => e.preventDefault()
    const noSelect = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'p', 's', 'u'].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('contextmenu', noContext)
    document.addEventListener('keydown', noSelect)
    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('keydown', noSelect)
    }
  }, [exam, result])

  useEffect(() => {
    fetch(`/api/avaliacoes/${id}/iniciar`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setExam(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Preparando avaliação...</div>

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertTriangle className="w-12 h-12 text-red-400" />
      <p className="text-gray-700 font-medium">{error}</p>
      <Button variant="outline" onClick={() => router.push('/avaliacoes')}>Voltar</Button>
    </div>
  )

  if (result) return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        {result.nota >= 6
          ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nota: <span className={result.nota >= 6 ? 'text-green-600' : 'text-red-600'}>{result.nota.toFixed(1)}</span>
        </h1>
        <p className="text-gray-500">{result.acertos} de {result.total} questões corretas</p>
        <p className={`text-sm font-medium mt-2 ${result.nota >= 6 ? 'text-green-600' : 'text-red-600'}`}>
          {result.nota >= 6 ? 'Aprovado!' : 'Não atingiu a nota mínima (6,0)'}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {exam!.questoes.map((q, i) => {
          const g = result.gabarito[q.id]
          return (
            <div key={q.id} className={`border rounded-xl p-4 ${g?.acertou ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-sm font-medium text-gray-800 mb-2">{i + 1}. {q.enunciado}</p>
              <div className="space-y-1">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={`text-xs px-2 py-1 rounded ${
                    idx === g?.correta ? 'bg-green-200 text-green-800 font-medium' :
                    idx === g?.marcada && !g?.acertou ? 'bg-red-200 text-red-800' : 'text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}) {opt}
                    {idx === g?.correta && ' ✓'}
                    {idx === g?.marcada && !g?.acertou && ' ✗'}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center">
        <Button onClick={() => router.push('/avaliacoes')}>Voltar para Avaliações</Button>
      </div>
    </div>
  )

  if (!exam) return null

  const q = exam.questoes[current]
  const totalQ = exam.questoes.length
  const progress = ((current + 1) / totalQ) * 100

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 select-none" style={{ userSelect: 'none' }}>
      {/* Anti-cheat warning modal */}
      {trapWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-2xl">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Atenção!</h2>
            <p className="text-sm text-gray-600 mb-4">Você saiu da janela da avaliação. <strong>Esta é sua única advertência.</strong> Se sair novamente, a prova será encerrada automaticamente.</p>
            <Button onClick={() => setTrapWarning(false)} className="w-full">Entendi, continuar</Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Questão {current + 1} de {totalQ}</p>
        </div>
        <div className="flex gap-2">
          {exam.tempoTotal && (
            <Timer
              key={`total-${exam.tentativaId}`}
              seconds={exam.tempoTotal}
              onExpire={() => submit(answers, false)}
              label="Total"
            />
          )}
          {exam.tempoPorQuestao && (
            <Timer
              key={`q-${current}`}
              seconds={exam.tempoPorQuestao}
              onExpire={() => {
                if (current < totalQ - 1) setCurrent(c => c + 1)
                else submit(answers, false)
              }}
              label="Questão"
            />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <p className="text-base font-medium text-gray-900 mb-5">{q.enunciado}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAnswers(a => ({ ...a, [q.id]: i }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                answers[q.id] === i
                  ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="font-mono text-xs mr-3 text-gray-400">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
          Anterior
        </Button>
        <div className="flex gap-1">
          {exam.questoes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                i === current ? 'bg-blue-600 text-white' :
                answers[exam.questoes[i].id] !== undefined ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {current < totalQ - 1 ? (
          <Button onClick={() => setCurrent(c => c + 1)}>Próxima</Button>
        ) : (
          <Button
            onClick={() => submit()}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Enviando...' : 'Finalizar Prova'}
          </Button>
        )}
      </div>

      {/* Answer summary */}
      <div className="mt-4 text-center text-xs text-gray-400">
        {Object.keys(answers).length} de {totalQ} questões respondidas
      </div>
    </div>
  )
}
