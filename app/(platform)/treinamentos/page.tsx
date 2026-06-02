'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Video, Clock, CalendarDays, CheckCircle2, ExternalLink, PlayCircle } from 'lucide-react'

interface Presenca { clicou: boolean; clicadoEm: string | null }
interface Treinamento {
  id: string; title: string; description: string | null; url: string
  type: string; scheduledAt: string | null; duracao: number | null
  published: boolean; _count: { presencas: number }
  presencas: Presenca[]
}

const TYPE_LABELS: Record<string, string> = { YOUTUBE: 'YouTube', TEAMS: 'Teams', OUTROS: 'Outros' }
const TYPE_COLORS: Record<string, string> = { YOUTUBE: 'text-red-600 bg-red-50', TEAMS: 'text-blue-600 bg-blue-50', OUTROS: 'text-gray-600 bg-gray-50' }

function isFuture(dt: string | null) {
  if (!dt) return false
  return new Date(dt) > new Date()
}

export default function TreinamentosPage() {
  const [items, setItems] = useState<Treinamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/treinamentos').then(r => r.json()).then(data => { setItems(data); setLoading(false) })
  }, [])

  const upcoming = items.filter(t => t.scheduledAt && isFuture(t.scheduledAt))
  const past = items.filter(t => !t.scheduledAt || !isFuture(t.scheduledAt))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Video className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Treinamentos Online</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Video className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum treinamento disponível</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos</h2>
              <div className="space-y-3">
                {upcoming.map(t => <TreinamentoCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Anteriores</h2>
              <div className="space-y-3">
                {past.map(t => <TreinamentoCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TreinamentoCard({ t }: { t: Treinamento }) {
  const [recording, setRecording] = useState(false)
  const presenca = t.presencas[0]
  const assistiu = presenca?.clicou

  const handleClick = async () => {
    if (recording) return
    setRecording(true)
    await fetch(`/api/treinamentos/${t.id}/presenca`, { method: 'POST' })
    window.open(t.url, '_blank')
    setRecording(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[t.type] ?? 'bg-gray-50 text-gray-600'}`}>
              {TYPE_LABELS[t.type] ?? t.type}
            </span>
            {assistiu && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />Confirmado
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
          {t.description && <p className="text-sm text-gray-500 mb-2">{t.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {t.scheduledAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(t.scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {t.duracao && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duracao}min</span>}
            <span>{t._count.presencas} confirmados</span>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={recording}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-colors ${
            assistiu
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          {assistiu ? 'Rever' : 'Acessar'}
        </button>
      </div>
    </div>
  )
}
