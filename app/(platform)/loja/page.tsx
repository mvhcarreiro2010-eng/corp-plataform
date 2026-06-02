'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Star, CheckCircle2, AlertCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LojaItem {
  id: string; name: string; description: string | null; imageUrl: string | null
  xpCusto: number; estoque: number; _count: { resgates: number }
}

export default function LojaPage() {
  const [items, setItems] = useState<LojaItem[]>([])
  const [userXp, setUserXp] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const load = async () => {
    const res = await fetch('/api/loja')
    const data = await res.json()
    setItems(data.items ?? [])
    setUserXp(data.userXp ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resgatar = async (item: LojaItem) => {
    if (redeeming) return
    if (!confirm(`Resgatar "${item.name}" por ${item.xpCusto} XP?`)) return
    setRedeeming(item.id)
    const res = await fetch('/api/loja/resgatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    })
    const data = await res.json()
    if (res.ok) {
      setFeedback({ type: 'ok', msg: `✓ Resgate solicitado! -${data.xpDebitado} XP` })
      load()
    } else {
      setFeedback({ type: 'err', msg: data.error })
    }
    setRedeeming(null)
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Loja de Recompensas</h1>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-amber-700">{userXp.toLocaleString('pt-BR')} XP</span>
          <span className="text-xs text-amber-500">disponível</span>
        </div>
      </div>

      {feedback && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {feedback.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum item disponível na loja</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const canAfford = userXp >= item.xpCusto
            const outOfStock = item.estoque === 0
            return (
              <div key={item.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${outOfStock ? 'opacity-60' : ''}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-purple-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  {item.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-amber-600">{item.xpCusto.toLocaleString('pt-BR')} XP</span>
                    </div>
                    {item.estoque > 0 && (
                      <span className="text-xs text-gray-400">{item.estoque} restantes</span>
                    )}
                    {item.estoque === -1 && <span className="text-xs text-gray-400">Ilimitado</span>}
                  </div>
                  <Button
                    onClick={() => resgatar(item)}
                    disabled={!canAfford || outOfStock || redeeming === item.id}
                    className="w-full mt-3"
                    variant={canAfford && !outOfStock ? 'default' : 'outline'}
                    size="sm"
                  >
                    {outOfStock ? 'Esgotado' : !canAfford ? `Faltam ${(item.xpCusto - userXp).toLocaleString('pt-BR')} XP` : 'Resgatar'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
