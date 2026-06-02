'use client'

import { useEffect, useState } from 'react'
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PopupData {
  id: string
  title: string
  description: string | null
  questao: {
    id: string
    enunciado: string
    options: string[]
    tipo: string
  }
}

type State = 'loading' | 'idle' | 'answering' | 'submitting' | 'correct' | 'wrong' | 'done'

export function PopupTest() {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [state, setState] = useState<State>('loading')
  const [selected, setSelected] = useState<number | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/popup-test')
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setPopup(data)
          setState('answering')
        } else {
          setState('done')
        }
      })
      .catch(() => setState('done'))
  }, [])

  const submit = async () => {
    if (selected === null || !popup) return
    setState('submitting')

    try {
      // 1. iniciar tentativa
      const initRes = await fetch(`/api/avaliacoes/${popup.id}/iniciar`, { method: 'POST' })
      const initData = await initRes.json()
      if (!initRes.ok || !initData.tentativaId) { setState('done'); return }

      // 2. submeter resposta
      const subRes = await fetch(`/api/avaliacoes/${popup.id}/submeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tentativaId: initData.tentativaId,
          respostas: { [popup.questao.id]: selected },
        }),
      })
      const subData = await subRes.json()

      // 3. mostrar resultado
      const gabItem = subData.gabarito?.[popup.questao.id]
      const correta = gabItem?.correta ?? null
      setCorrectIndex(correta)

      if (gabItem?.acertou) {
        setState('correct')
      } else {
        setState('wrong')
      }
    } catch {
      setState('done')
    }
  }

  // Not visible until there's a popup or loading is done
  if (state === 'loading' || state === 'idle' || state === 'done') return null
  if (!popup) return null

  const isResult = state === 'correct' || state === 'wrong'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">{popup.title}</p>
            <p className="text-amber-100 text-xs mt-0.5">Responda para continuar</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-gray-800 font-medium text-sm leading-relaxed">{popup.questao.enunciado}</p>

          <div className="space-y-2">
            {popup.questao.options.map((op, i) => {
              let style = 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
              if (isResult) {
                if (i === correctIndex) style = 'border-green-500 bg-green-50 text-green-800'
                else if (i === selected && !popup.questao.options[correctIndex ?? -1]) style = 'border-red-400 bg-red-50 text-red-700'
                else if (i === selected && state === 'wrong') style = 'border-red-400 bg-red-50 text-red-700'
                else style = 'border-gray-100 text-gray-400'
              } else if (selected === i) {
                style = 'border-blue-500 bg-blue-50 text-blue-800'
              }

              return (
                <button
                  key={i}
                  disabled={isResult || state === 'submitting'}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left transition-all',
                    style
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                    selected === i && !isResult ? 'border-blue-500 bg-blue-500 text-white' : 'border-current'
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{op}</span>
                  {isResult && i === correctIndex && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                  {isResult && i === selected && state === 'wrong' && i !== correctIndex && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Result feedback */}
          {state === 'correct' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-800 font-semibold text-sm">Correto! Muito bem! 🎉</p>
            </div>
          )}
          {state === 'wrong' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">
                Resposta incorreta. A correta era <strong>{String.fromCharCode(65 + (correctIndex ?? 0))}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {!isResult ? (
            <Button
              className="w-full"
              disabled={selected === null || state === 'submitting'}
              onClick={submit}
            >
              {state === 'submitting' ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
              ) : 'Responder'}
            </Button>
          ) : (
            <Button className="w-full" variant={state === 'correct' ? 'default' : 'outline'} onClick={() => setState('done')}>
              Continuar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
