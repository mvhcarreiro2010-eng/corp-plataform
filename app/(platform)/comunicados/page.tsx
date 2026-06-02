'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Comunicado {
  id: string; title: string; content: string; urgente: boolean; requireAceite: boolean
  createdAt: string; aceites: { aceitadoEm: string }[]
}

export default function ComunicadosPage() {
  const [items, setItems] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/comunicados')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const aceitar = async (id: string) => {
    setAccepting(id)
    await fetch(`/api/comunicados/${id}/aceite`, { method: 'POST' })
    setAccepting(null)
    load()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>
        {items.filter(i => i.aceites.length === 0 && i.requireAceite).length > 0 && (
          <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            {items.filter(i => i.aceites.length === 0 && i.requireAceite).length} pendente(s)
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum comunicado disponível</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const aceito = item.aceites.length > 0
            const isExpanded = expanded === item.id

            return (
              <div key={item.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
                  item.urgente && !aceito ? 'border-red-300' : aceito ? 'border-gray-200 opacity-80' : 'border-gray-200'
                }`}>
                <div
                  className="flex items-center gap-3 px-4 py-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  {item.urgente ? (
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${aceito ? 'text-gray-400' : 'text-red-500'}`} />
                  ) : (
                    <Bell className="w-5 h-5 text-blue-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${aceito ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {aceito && item.requireAceite && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Aceito em {new Date(item.aceites[0].aceitadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {!aceito && item.requireAceite && (
                        <span className="text-red-500">⚠ Aceite pendente</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <div
                      className="prose prose-sm text-gray-700 max-w-none leading-relaxed mb-4"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    {item.requireAceite && !aceito && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => aceitar(item.id)}
                          disabled={accepting === item.id}
                          className={`gap-2 ${item.urgente ? 'bg-red-600 hover:bg-red-700' : ''}`}
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {accepting === item.id ? 'Registrando...' : 'Li e aceito'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
