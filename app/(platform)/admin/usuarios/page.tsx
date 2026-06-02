'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Plus, Upload, Search, Trash2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface User {
  id: string; name: string; email: string; role: string; matricula: string | null
  admissaoEm: string | null; ativo: boolean; createdAt: string
  bu: { id: string; name: string } | null
  lider: { id: string; name: string } | null
  turmas: { turma: { id: string; name: string } }[]
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

function tempoDeCasa(admissaoEm: string | null): string {
  if (!admissaoEm) return '—'
  const dias = Math.floor((Date.now() - new Date(admissaoEm).getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 30) return `${dias}d`
  if (dias < 365) return `${Math.floor(dias / 30)}m`
  const anos = Math.floor(dias / 365)
  const meses = Math.floor((dias % 365) / 30)
  return meses > 0 ? `${anos}a ${meses}m` : `${anos}a`
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [bus, setBus] = useState<BU[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBu, setFilterBu] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterAtivo, setFilterAtivo] = useState('true')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterBu) params.set('buId', filterBu)
    if (filterRole) params.set('role', filterRole)
    if (filterAtivo) params.set('ativo', filterAtivo)
    const res = await fetch(`/api/admin/usuarios?${params}`)
    setUsers(await res.json())
    setLoading(false)
  }, [search, filterBu, filterRole, filterAtivo])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/admin/bus').then(r => r.json()).then(setBus) }, [])

  const toggleAtivo = async (u: User) => {
    await fetch('/api/admin/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, ativo: !u.ativo }),
    })
    load()
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir permanentemente o usuário "${name}"? Esta ação não pode ser desfeita.`)) return
    await fetch('/api/admin/usuarios', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
        {[
          { value: filterAtivo, onChange: setFilterAtivo, options: [{ v: 'true', l: 'Ativos' }, { v: 'false', l: 'Inativos' }, { v: '', l: 'Todos' }] },
          { value: filterBu, onChange: setFilterBu, placeholder: 'Todas as BUs', opts: bus.map(b => ({ v: b.id, l: b.name })) },
          { value: filterRole, onChange: setFilterRole, placeholder: 'Todos os perfis', opts: Object.entries(ROLE_LABELS).map(([v, l]) => ({ v, l })) },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.value} onChange={e => f.onChange(e.target.value)}
              className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              {f.options
                ? f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)
                : <><option value="">{f.placeholder}</option>{f.opts?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</>
              }
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Matrícula</th>
                <th className="px-4 py-3 text-left">BU</th>
                <th className="px-4 py-3 text-left">Turmas</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Admissão</th>
                <th className="px-4 py-3 text-left">Tempo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.ativo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.matricula ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.bu?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.turmas.length > 0
                      ? u.turmas.map(t => t.turma.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.admissaoEm ? new Date(u.admissaoEm).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                    {tempoDeCasa(u.admissaoEm)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAtivo(u)} title={u.ativo ? 'Desativar' : 'Ativar'}
                      className={`p-1 rounded transition-colors ${u.ativo ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}>
                      {u.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
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
