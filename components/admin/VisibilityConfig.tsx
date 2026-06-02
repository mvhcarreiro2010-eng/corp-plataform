'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, X, Search, Globe, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'

const ALL_ROLES = [
  { value: 'EMPLOYEE', label: 'Colaborador' },
  { value: 'LEADER', label: 'Líder' },
  { value: 'COORDINATOR', label: 'Coordenador' },
  { value: 'INSTRUCTOR', label: 'Instrutor' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'HR', label: 'RH' },
  { value: 'ADMIN', label: 'Admin' },
]

interface BU { id: string; name: string }
interface UserOption { id: string; name: string; role: string }

export interface VisibilityValue {
  buIds: string[]
  roleFilter: string[]
  userIds: string[]
}

interface Props {
  value: VisibilityValue
  onChange: (v: VisibilityValue) => void
}

export function VisibilityConfig({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [bus, setBus] = useState<BU[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserOption[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/admin/bus').then(r => r.json()).then(d => setBus(Array.isArray(d) ? d : []))
  }, [])

  // Load user details for pre-selected userIds
  useEffect(() => {
    if (value.userIds.length === 0) { setSelectedUsers([]); return }
    fetch(`/api/admin/usuarios?minimal=true`)
      .then(r => r.json())
      .then((all: UserOption[]) => {
        setSelectedUsers(all.filter(u => value.userIds.includes(u.id)))
      })
  }, [])

  // Search users
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (userSearch.length < 2) { setUserResults([]); return }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/admin/usuarios?search=${encodeURIComponent(userSearch)}&minimal=true`)
        .then(r => r.json())
        .then((data: UserOption[]) => {
          setUserResults(data.filter(u => !value.userIds.includes(u.id)).slice(0, 8))
          setShowDropdown(true)
        })
    }, 300)
  }, [userSearch, value.userIds])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleBu = (id: string) => {
    const next = value.buIds.includes(id) ? value.buIds.filter(x => x !== id) : [...value.buIds, id]
    onChange({ ...value, buIds: next })
  }

  const toggleRole = (role: string) => {
    const next = value.roleFilter.includes(role) ? value.roleFilter.filter(x => x !== role) : [...value.roleFilter, role]
    onChange({ ...value, roleFilter: next })
  }

  const addUser = (u: UserOption) => {
    setSelectedUsers(prev => [...prev, u])
    onChange({ ...value, userIds: [...value.userIds, u.id] })
    setUserSearch('')
    setShowDropdown(false)
  }

  const removeUser = (id: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== id))
    onChange({ ...value, userIds: value.userIds.filter(x => x !== id) })
  }

  const isGlobal = value.buIds.length === 0 && value.roleFilter.length === 0 && value.userIds.length === 0
  const summaryParts: string[] = []
  if (value.buIds.length > 0) summaryParts.push(`${value.buIds.length} BU${value.buIds.length > 1 ? 's' : ''}`)
  if (value.roleFilter.length > 0) summaryParts.push(`${value.roleFilter.length} função${value.roleFilter.length > 1 ? 'ões' : ''}`)
  if (value.userIds.length > 0) summaryParts.push(`${value.userIds.length} pessoa${value.userIds.length > 1 ? 's' : ''}`)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isGlobal ? (
            <Globe className="w-4 h-4 text-gray-400" />
          ) : (
            <Users className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-sm font-medium text-gray-700">Visibilidade</span>
          {isGlobal ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Todos</span>
          ) : (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{summaryParts.join(' · ')}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-5 bg-white">
          <p className="text-xs text-gray-400">Deixe tudo em branco para tornar visível a todos. Cada filtro preenchido restringe a visibilidade.</p>

          {/* BUs */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Unidades de Negócio</p>
            {bus.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhuma BU cadastrada.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bus.map(bu => (
                  <button
                    key={bu.id}
                    type="button"
                    onClick={() => toggleBu(bu.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      value.buIds.includes(bu.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {bu.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Funções */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Funções (Perfis)</p>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    value.roleFilter.includes(r.value)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pessoas específicas */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pessoas Específicas</p>

            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-xs font-medium">
                    {u.name}
                    <button type="button" onClick={() => removeUser(u.id)} className="hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                  placeholder="Buscar colaborador por nome ou matrícula..."
                  className="pl-8 h-9 text-sm"
                />
              </div>
              {showDropdown && userResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {userResults.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={() => addUser(u)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <span className="font-medium text-gray-900">{u.name}</span>
                      <span className="text-xs text-gray-400">{ALL_ROLES.find(r => r.value === u.role)?.label ?? u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
