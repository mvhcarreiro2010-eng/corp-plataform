'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Plus, Upload, Search, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User {
  id: string; name: string; email: string; role: string; matricula: string | null
  createdAt: string
  bu: { id: string; name: string } | null
  lider: { id: string; name: string } | null
  coordenador: { id: string; name: string } | null
}

interface BU { id: string; name: string }

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', HR: 'RH', MANAGER: 'Gestor', EMPLOYEE: 'Colaborador',
  COORDINATOR: 'Coordenador', LEADER: 'Líder', INSTRUCTOR: 'Instrutor', EDITOR: 'Editor',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', HR: 'bg-orange-100 text-orange-700',
  MANAGER: 'bg-yellow-100 text-yellow-700', EMPLOYEE: 'bg-gray-100 text-gray-600',
  COORDINATOR: 'bg-blue-100 text-blue-700', LEADER: 'bg-indigo-100 text-indigo-700',
  INSTRUCTOR: 'bg-green-100 text-green-700', EDITOR: 'bg-purple-100 text-purple-700',
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [bus, setBus] = useState<BU[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBu, setFilterBu] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterBu) params.set('buId', filterBu)
    if (filterRole) params.set('role', filterRole)
    const res = await fetch(`/api/admin/usuarios?${params}`)
    setUsers(await res.json())
    setLoading(false)
  }, [search, filterBu, filterRole])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/admin/bus').then(r => r.json()).then(setBus) }, [])

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir usuário "${name}"?`)) return
    await fetch('/api/admin/usuarios', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <span className="text-sm text-gray-400">({users.length})</span>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/usuarios/importar">
            <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />Importar CSV</Button>
          </Link>
          <Link href="/admin/usuarios/novo">
            <Button className="gap-2"><Plus className="w-4 h-4" />Novo Usuário</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, email ou matrícula..." className="pl-9" />
        </div>
        <div className="relative">
          <select value={filterBu} onChange={e => setFilterBu(e.target.value)}
            className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas as BUs</option>
            {bus.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os perfis</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Matrícula</th>
                <th className="px-4 py-3 text-left">BU</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Líder</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.matricula ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.bu?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.lider?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(u.id, u.name)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
