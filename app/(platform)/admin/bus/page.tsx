'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BU { id: string; name: string; region: string | null; createdAt: string }

export default function AdminBUsPage() {
  const [bus, setBus] = useState<BU[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BU | null>(null)
  const [form, setForm] = useState({ name: '', region: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/bus')
    const data = await res.json()
    setBus(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', region: '' }); setShowForm(true) }
  const openEdit = (bu: BU) => { setEditing(bu); setForm({ name: bu.name, region: bu.region ?? '' }); setShowForm(true) }
  const cancel = () => { setShowForm(false); setEditing(null) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { id: editing.id, ...form } : form
    await fetch('/api/admin/bus', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    cancel()
    load()
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir BU "${name}"? Os usuários perderão a associação.`)) return
    await fetch('/api/admin/bus', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Business Units</h1>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nova BU
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">{editing ? 'Editar BU' : 'Nova BU'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Operações SP" autoFocus />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Região</label>
              <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Ex: Sudeste" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={cancel}><X className="w-4 h-4 mr-1" />Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
              <Check className="w-4 h-4 mr-1" />{saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : bus.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma BU cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bus.map(bu => (
            <div key={bu.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{bu.name}</span>
                {bu.region && <span className="text-sm text-gray-500 ml-2">· {bu.region}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(bu)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(bu.id, bu.name)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
