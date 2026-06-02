'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Pencil, ChevronDown, ChevronRight, UserPlus, UserMinus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TurmaUser { user: { id: string; name: string; email: string; role: string } }
interface Turma { id: string; name: string; descricao: string | null; _count: { users: number }; users: TurmaUser[] }
interface UserRef { id: string; name: string; role: string }

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', HR: 'RH', MANAGER: 'Gestor', EMPLOYEE: 'Colaborador',
  COORDINATOR: 'Coordenador', LEADER: 'Líder', INSTRUCTOR: 'Instrutor', EDITOR: 'Editor',
}

export default function AdminTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [allUsers, setAllUsers] = useState<UserRef[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', descricao: '' })
  const [saving, setSaving] = useState(false)
  const [addingUser, setAddingUser] = useState<string | null>(null) // turmaId
  const [selectedUser, setSelectedUser] = useState('')

  const load = async () => {
    const [t, u] = await Promise.all([
      fetch('/api/admin/turmas').then(r => r.json()),
      fetch('/api/admin/usuarios?minimal=true').then(r => r.json()),
    ])
    setTurmas(t)
    setAllUsers(u)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editingId) {
      await fetch('/api/admin/turmas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
    } else {
      await fetch('/api/admin/turmas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', descricao: '' })
    load()
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir turma "${name}"?`)) return
    await fetch('/api/admin/turmas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  const addUser = async (turmaId: string) => {
    if (!selectedUser) return
    await fetch('/api/admin/turmas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: turmaId, addUserIds: [selectedUser] }) })
    setSelectedUser('')
    setAddingUser(null)
    load()
  }

  const removeUser = async (turmaId: string, userId: string) => {
    await fetch('/api/admin/turmas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: turmaId, removeUserIds: [userId] }) })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', descricao: '' }) }} className="gap-2">
          <Plus className="w-4 h-4" />Nova Turma
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{editingId ? 'Editar Turma' : 'Nova Turma'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : turmas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhuma turma cadastrada</div>
      ) : (
        <div className="space-y-2">
          {turmas.map(t => {
            const open = expanded === t.id
            const turmaUserIds = new Set(t.users.map(u => u.user.id))
            const available = allUsers.filter(u => !turmaUserIds.has(u.id))

            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <button onClick={() => setExpanded(open ? null : t.id)} className="flex items-center gap-3 flex-1 text-left">
                    {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <span className="font-medium text-gray-900">{t.name}</span>
                    {t.descricao && <span className="text-sm text-gray-400">· {t.descricao}</span>}
                    <span className="ml-auto text-xs text-gray-400">{t._count.users} pessoa(s)</span>
                  </button>
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => { setEditingId(t.id); setForm({ name: t.name, descricao: t.descricao ?? '' }); setShowForm(true) }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(t.id, t.name)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    {/* Add user row */}
                    {addingUser === t.id ? (
                      <div className="flex gap-2 mb-3">
                        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                          className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Selecionar usuário...</option>
                          {available.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role] ?? u.role})</option>)}
                        </select>
                        <Button size="sm" onClick={() => addUser(t.id)} disabled={!selectedUser} className="h-9">Adicionar</Button>
                        <button onClick={() => { setAddingUser(null); setSelectedUser('') }} className="text-gray-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingUser(t.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline mb-3">
                        <UserPlus className="w-3.5 h-3.5" />Adicionar pessoa
                      </button>
                    )}

                    {t.users.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhum usuário nesta turma</p>
                    ) : (
                      <div className="space-y-1">
                        {t.users.map(({ user: u }) => (
                          <div key={u.id} className="flex items-center justify-between py-1">
                            <div>
                              <span className="text-sm text-gray-800">{u.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{ROLE_LABELS[u.role] ?? u.role}</span>
                            </div>
                            <button onClick={() => removeUser(t.id, u.id)} className="p-1 rounded hover:bg-red-50 text-red-400">
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
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
