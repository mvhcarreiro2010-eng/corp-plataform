'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Trash2, Eye, EyeOff, Package, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LojaItem {
  id: string; name: string; description: string | null; imageUrl: string | null
  xpCusto: number; estoque: number; ativo: boolean; _count: { resgates: number }
}
interface Resgate {
  id: string; createdAt: string; xpDebitado: number; status: string
  user: { name: string; email: string }; item: { name: string }
}

const EMPTY = { name: '', description: '', imageUrl: '', xpCusto: '', estoque: '-1' }

export default function AdminLojaPage() {
  const [items, setItems] = useState<LojaItem[]>([])
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'itens' | 'resgates'>('itens')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [itemRes, resgateRes] = await Promise.all([
      fetch('/api/loja'),
      fetch('/api/loja/resgatar'),
    ])
    const itemData = await itemRes.json()
    setItems(itemData.items ?? [])
    if (resgateRes.ok) setResgates(await resgateRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim() || !form.xpCusto) return
    setSaving(true)
    await fetch('/api/loja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, xpCusto: Number(form.xpCusto), estoque: Number(form.estoque) }),
    })
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY)
    load()
  }

  const toggleAtivo = async (item: LojaItem) => {
    await fetch('/api/loja', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, ativo: !item.ativo }) })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/loja/resgatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Loja de Recompensas</h1>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['itens', 'resgates'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {t === 'itens' ? `Itens (${items.length})` : `Resgates (${resgates.length})`}
              </button>
            ))}
          </div>
          {tab === 'itens' && <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Novo Item</Button>}
        </div>
      </div>

      {tab === 'itens' && (
        <>
          {showForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Novo Item</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Descrição</label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Custo em XP *</label>
                  <Input type="number" value={form.xpCusto} onChange={e => setForm(f => ({ ...f, xpCusto: e.target.value }))} placeholder="Ex: 500" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Estoque (-1 = ilimitado)</label>
                  <Input type="number" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">URL da imagem</label>
                  <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." /></div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={save} disabled={saving || !form.name.trim() || !form.xpCusto}>{saving ? 'Salvando...' : 'Criar'}</Button>
              </div>
            </div>
          )}

          {loading ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${!item.ativo ? 'opacity-60' : ''}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Package className="w-10 h-10 text-purple-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">{item.xpCusto.toLocaleString('pt-BR')} XP</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{item.estoque === -1 ? 'Ilimitado' : `${item.estoque} estoque`}</span>
                      <span>{item._count.resgates} resgates</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => toggleAtivo(item)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50">
                        {item.ativo ? <><EyeOff className="w-3.5 h-3.5" />Desativar</> : <><Eye className="w-3.5 h-3.5" />Ativar</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'resgates' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? <div className="text-center py-8 text-gray-400">Carregando...</div> : resgates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum resgate ainda</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2 text-left">Usuário</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">XP</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {resgates.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{r.user.name}</td>
                    <td className="px-4 py-2 text-gray-500">{r.item.name}</td>
                    <td className="px-4 py-2 text-amber-600 font-medium">-{r.xpDebitado} XP</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'APROVADO' ? 'bg-green-100 text-green-700'
                        : r.status === 'REJEITADO' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
