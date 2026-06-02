'use client'

import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Comunicado { id: string; title: string; content: string; urgente: boolean }

const HUMOR_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😞', label: 'Péssimo', color: 'bg-red-100 border-red-300 hover:bg-red-200' },
  2: { emoji: '😕', label: 'Ruim', color: 'bg-orange-100 border-orange-300 hover:bg-orange-200' },
  3: { emoji: '😐', label: 'Ok', color: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' },
  4: { emoji: '🙂', label: 'Bom', color: 'bg-lime-100 border-lime-300 hover:bg-lime-200' },
  5: { emoji: '😄', label: 'Ótimo', color: 'bg-green-100 border-green-300 hover:bg-green-200' },
}

export function PlatformChecks() {
  const [pendingComunicados, setPendingComunicados] = useState<Comunicado[]>([])
  const [currentCom, setCurrentCom] = useState<Comunicado | null>(null)
  const [accepting, setAccepting] = useState(false)

  const [showHumor, setShowHumor] = useState(false)
  const [selectedHumor, setSelectedHumor] = useState<number | null>(null)
  const [savingHumor, setSavingHumor] = useState(false)
  const [humorDone, setHumorDone] = useState(false)

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      // 1. Initial heartbeat
      fetch('/api/activity', { method: 'POST' }).catch(() => {})

      // 2. Check humor for today
      try {
        const h = await fetch('/api/humor?type=today').then(r => r.json())
        if (!h.done) setShowHumor(true)
        else setHumorDone(true)
      } catch { /* silent */ }

      // 3. Check pending urgent comunicados
      try {
        const coms: Comunicado[] = await fetch('/api/comunicados/pending').then(r => r.json())
        if (coms.length > 0) {
          setPendingComunicados(coms)
          setCurrentCom(coms[0])
        }
      } catch { /* silent */ }
    }

    init()

    // Heartbeat every 60 seconds
    const heartbeat = setInterval(() => {
      fetch('/api/activity', { method: 'POST' }).catch(() => {})
    }, 60_000)

    return () => clearInterval(heartbeat)
  }, [])

  const acceptComunicado = async () => {
    if (!currentCom) return
    setAccepting(true)
    try {
      await fetch(`/api/comunicados/${currentCom.id}/aceite`, { method: 'POST' })
      const remaining = pendingComunicados.filter(c => c.id !== currentCom.id)
      setPendingComunicados(remaining)
      setCurrentCom(remaining.length > 0 ? remaining[0] : null)
    } finally {
      setAccepting(false)
    }
  }

  const submitHumor = async () => {
    if (!selectedHumor) return
    setSavingHumor(true)
    try {
      await fetch('/api/humor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humor: selectedHumor }),
      })
      setShowHumor(false)
      setHumorDone(true)
    } finally {
      setSavingHumor(false)
    }
  }

  // Priority: comunicados blocking modal > humor modal
  // Comunicado is always shown if pending, regardless of humor

  if (currentCom) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="text-xs text-red-200 font-medium uppercase tracking-wide">Comunicado Urgente</p>
              <h2 className="text-lg font-bold text-white">{currentCom.title}</h2>
            </div>
            {pendingComunicados.length > 1 && (
              <span className="ml-auto text-xs bg-red-700 text-red-100 px-2 py-1 rounded-full">
                {pendingComunicados.indexOf(currentCom) + 1}/{pendingComunicados.length}
              </span>
            )}
          </div>
          <div className="px-6 py-5 max-h-80 overflow-y-auto">
            <div
              className="prose prose-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentCom.content }}
            />
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">Você precisa aceitar este comunicado para continuar.</p>
            <Button
              onClick={acceptComunicado}
              disabled={accepting}
              className="gap-2 bg-red-600 hover:bg-red-700 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              {accepting ? 'Registrando...' : 'Li e aceito'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showHumor && !humorDone) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <div className="px-6 py-5 text-center">
            <Smile className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Como você está hoje?</h2>
            <p className="text-sm text-gray-500 mb-5">Nos ajude a entender o clima da equipe.</p>
            <div className="flex gap-2 justify-center mb-5">
              {[1, 2, 3, 4, 5].map(h => {
                const info = HUMOR_LABELS[h]
                return (
                  <button
                    key={h}
                    onClick={() => setSelectedHumor(h)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      selectedHumor === h
                        ? 'border-blue-500 bg-blue-50 scale-110'
                        : `border-transparent ${info.color}`
                    }`}
                  >
                    <span className="text-2xl">{info.emoji}</span>
                    <span className="text-xs font-medium text-gray-600">{info.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowHumor(false)}>
                Agora não
              </Button>
              <Button size="sm" className="flex-1" onClick={submitHumor} disabled={!selectedHumor || savingHumor}>
                {savingHumor ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
