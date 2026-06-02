'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Users, Lock, Globe, ChevronDown, ChevronRight, UserMinus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChannelMemberUser { id: string; name: string; email: string; bu: { name: string } | null }
interface ChannelMember { userId: string; joinedAt: string; user: ChannelMemberUser }
interface Channel {
  id: string; name: string; description: string | null; icon: string | null; type: string; createdAt: string
  _count: { messages: number; members: number }
  members: ChannelMember[]
}
interface Turma { id: string; name: string }
interface SimpleUser { id: string; name: string; email: string }

const EMPTY_FORM = { name: '', description: '', icon: '', type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE', turmaId: '', userSearch: '' }

export default function AdminComunidadePage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addMemberState, setAddMemberState] = useState<{ channelId: string; search: string; turmaId: string } | null>(null)
  const [filteredUsers, setFilteredUsers] = useState<SimpleUser[]>([])

  const load = async () => {
    setLoading(true)
    const [chRes, trRes, usRes] = await Promise.all([
      fetch('/api/admin/comunidade').then(r => r.json()),
      fetch('/api/admin/turmas').then(r => r.json()),
      fetch('/api/admin/usuarios?minimal=true').then(r => r.json()),
    ])
    setChannels(chRes)
    setTurmas(trRes)
    setUsers(usRes)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!addMemberState?.search) { setFilteredUsers([]); return }
    const q = addMemberState.search.toLowerCase()
    setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 10))
  }, [addMemberState?.search, users])

  const create = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/admin/comunidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, description: form.description || null,
        icon: form.icon || null, type: form.type,
        turmaId: form.turmaId || undefined,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
    load()
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir canal "${name}" e todas suas mensagens?`)) return
    await fetch('/api/admin/comunidade', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const addMemberByTurma = async (channelId: string, turmaId: string) => {
    if (!turmaId) return
    await fetch('/api/admin/comunidade', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: channelId, addTurmaId: turmaId }),
    })
    load()
    setAddMemberState(null)
  }

  const addMemberById = async (channelId: string, userId: string) => {
    await fetch('/api/admin/comunidade', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: channelId, addUserIds: [userId] }),
    })
    load()
    setAddMemberState(s => s ? { ...s, search: '' } : null)
    setFilteredUsers([])
  }

  const removeMember = async (channelId: string, userId: string) => {
    await fetch('/api/admin/comunidade', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: channelId, removeUserIds: [userId] }),
    })
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Comunidades</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Novo Canal</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Novo Canal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Emoji / Ícone</label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Ex: 🎯" /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'PUBLIC' | 'PRIVATE' }))}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg">
                <option value="PUBLIC">Público (todos veem)</option>
                <option value="PRIVATE">Privado (somente membros)</option>
              </select></div>
            {form.type === 'PRIVATE' && (
              <div><label className="text-xs text-gray-500 mb-1 block">Adicionar turma inicial (opcional)</label>
                <select value={form.turmaId} onChange={e => setForm(f => ({ ...f, turmaId: e.target.value }))}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg">
                  <option value="">Sem turma</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancelar</Button>
            <Button size="sm" onClick={create} disabled={saving || !form.name.trim()}>{saving ? 'Criando...' : 'Criar Canal'}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum canal criado</div>
      ) : (
        <div className="space-y-3">
          {channels.map(ch => (
            <div key={ch.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4">
                <span className="text-xl">{ch.icon ?? '#'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{ch.name}</span>
                    {ch.type === 'PRIVATE'
                      ? <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" />Privado</span>
                      : <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"><Globe className="w-3 h-3" />Público</span>}
                  </div>
                  {ch.description && <p className="text-xs text-gray-400 mt-0.5">{ch.description}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{ch._count.members}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{ch._count.messages}</span>
                </div>
                <div className="flex gap-1">
                  {ch.type === 'PRIVATE' && (
                    <button onClick={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                      {expandedId === ch.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => remove(ch.id, ch.name)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members panel (only for PRIVATE) */}
              {expandedId === ch.id && ch.type === 'PRIVATE' && (
                <div className="border-t border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membros ({ch.members.length})</p>
                    <button onClick={() => setAddMemberState(addMemberState?.channelId === ch.id ? null : { channelId: ch.id, search: '', turmaId: '' })}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>

                  {/* Add member controls */}
                  {addMemberState?.channelId === ch.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Adicionar por turma</label>
                        <div className="flex gap-2">
                          <select value={addMemberState.turmaId}
                            onChange={e => setAddMemberState(s => s ? { ...s, turmaId: e.target.value } : null)}
                            className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg">
                            <option value="">Selecionar turma...</option>
                            {turmas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <Button size="sm" onClick={() => addMemberByTurma(ch.id, addMemberState.turmaId)}
                            disabled={!addMemberState.turmaId}>Adicionar turma</Button>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="text-xs text-gray-500 mb-1 block">Buscar usuário individualmente</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input value={addMemberState.search}
                            onChange={e => setAddMemberState(s => s ? { ...s, search: e.target.value } : null)}
                            placeholder="Nome ou e-mail..." className="pl-9 h-9 text-sm" />
                        </div>
                        {filteredUsers.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {filteredUsers.map(u => (
                              <button key={u.id} onClick={() => addMemberById(ch.id, u.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm">
                                <div>
                                  <p className="font-medium text-gray-900">{u.name}</p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members list */}
                  {ch.members.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum membro ainda</p>
                  ) : (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {ch.members.map(m => (
                        <div key={m.userId} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{m.user.name}</p>
                            <p className="text-xs text-gray-400">{m.user.email}{m.user.bu ? ` · ${m.user.bu.name}` : ''}</p>
                          </div>
                          <button onClick={() => removeMember(ch.id, m.userId)}
                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
