'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Clock, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Tentativa { id: string; nota: number | null; finalizadaEm: string | null }
interface Avaliacao {
  id: string; title: string; description: string | null
  questoesExibir: number; tempoPorQuestao: number | null; tempoTotal: number | null
  maxTentativas: number; _count: { questoes: number }
  tentativas: Tentativa[]
}

function formatSecs(s: number) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return s % 60 ? `${m}min ${s % 60}s` : `${m}min`
}

export default function AvaliacoesPage() {
  const [items, setItems] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/avaliacoes').then(r => r.json()).then(data => { setItems(data); setLoading(false) })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma avaliação disponível para você</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(av => {
            const concluidas = av.tentativas.filter(t => t.finalizadaEm)
            const melhorNota = concluidas.length > 0 ? Math.max(...concluidas.map(t => t.nota ?? 0)) : null
            const restantes = av.maxTentativas - concluidas.length
            const bloqueada = restantes <= 0

            return (
              <div key={av.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900">{av.title}</h2>
                      {bloqueada && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Esgotado</span>}
                    </div>
                    {av.description && <p className="text-sm text-gray-500 mb-2">{av.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>{av.questoesExibir} questões</span>
                      {av.tempoPorQuestao && <span><Clock className="w-3 h-3 inline mr-1" />{formatSecs(av.tempoPorQuestao)} por questão</span>}
                      {av.tempoTotal && <span><Clock className="w-3 h-3 inline mr-1" />{formatSecs(av.tempoTotal)} total</span>}
                      <span>{restantes > 0 ? `${restantes} tentativa(s) restante(s)` : 'Sem tentativas restantes'}</span>
                    </div>
                    {melhorNota !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        {melhorNota >= 6
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm font-medium ${melhorNota >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                          Melhor nota: {melhorNota.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {!bloqueada ? (
                    <Link href={`/avaliacoes/${av.id}`}>
                      <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                        {concluidas.length > 0 ? 'Tentar novamente' : 'Iniciar'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg shrink-0">
                      <AlertCircle className="w-4 h-4" /> Encerrado
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
