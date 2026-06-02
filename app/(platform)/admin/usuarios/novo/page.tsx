'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface BU { id: string; name: string }
interface UserRef { id: string; name: string; role: string }

const ROLES = [
  { value: 'EMPLOYEE', label: 'Colaborador' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'INSTRUCTOR', label: 'Instrutor' },
  { value: 'LEADER', label: 'Líder' },
  { value: 'COORDINATOR', label: 'Coordenador' },
  { value: 'MANAGER', label: 'Gestor' },
  { value: 'HR', label: 'RH' },
  { value: 'ADMIN', label: 'Administrador' },
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}{required && ' *'}</label>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      {children}
    </select>
  )
}

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [bus, setBus] = useState<BU[]>([])
  const [allUsers, setAllUsers] = useState<UserRef[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'EMPLOYEE',
    matricula: '', cpf: '', regiao: '', department: '', jobTitle: '',
    buId: '', coordenadorId: '', liderId: '', instrutorId: '',
    admissaoEm: '',
  })

  useEffect(() => {
    fetch('/api/admin/bus').then(r => r.json()).then(setBus)
    fetch('/api/admin/usuarios').then(r => r.json()).then(setAllUsers)
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Nome, e-mail e senha são obrigatórios')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/admin/usuarios')
  }

  const coordinators = allUsers.filter(u => u.role === 'COORDINATOR')
  const leaders = allUsers.filter(u => u.role === 'LEADER')
  const instructors = allUsers.filter(u => u.role === 'INSTRUCTOR')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/usuarios" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <UserPlus className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Nome completo" required><Input value={form.name} onChange={e => set('name', e.target.value)} /></Field></div>
            <Field label="E-mail" required><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Senha" required><Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" /></Field>
            <Field label="Matrícula"><Input value={form.matricula} onChange={e => set('matricula', e.target.value)} /></Field>
            <Field label="CPF"><Input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></Field>
            <Field label="Data de Admissão"><Input type="date" value={form.admissaoEm} onChange={e => set('admissaoEm', e.target.value)} /></Field>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Cargo e Perfil</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Perfil / Role">
              <SelectField value={form.role} onChange={v => set('role', v)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </SelectField>
            </Field>
            <Field label="Cargo / Função"><Input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="Ex: Analista de Treinamento" /></Field>
            <Field label="Departamento"><Input value={form.department} onChange={e => set('department', e.target.value)} /></Field>
            <Field label="Região"><Input value={form.regiao} onChange={e => set('regiao', e.target.value)} /></Field>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Business Unit e Hierarquia</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business Unit">
              <SelectField value={form.buId} onChange={v => set('buId', v)}>
                <option value="">Selecionar BU...</option>
                {bus.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectField>
            </Field>
            <Field label="Região"><Input value={form.regiao} onChange={e => set('regiao', e.target.value)} placeholder="Já preenchida acima" /></Field>
            <Field label="Coordenador">
              <SelectField value={form.coordenadorId} onChange={v => set('coordenadorId', v)}>
                <option value="">Sem coordenador</option>
                {coordinators.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectField>
            </Field>
            <Field label="Líder">
              <SelectField value={form.liderId} onChange={v => set('liderId', v)}>
                <option value="">Sem líder</option>
                {leaders.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectField>
            </Field>
            <Field label="Instrutor">
              <SelectField value={form.instrutorId} onChange={v => set('instrutorId', v)}>
                <option value="">Sem instrutor</option>
                {instructors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SelectField>
            </Field>
          </div>
        </section>

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/admin/usuarios"><Button variant="outline">Cancelar</Button></Link>
          <Button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : 'Criar Usuário'}</Button>
        </div>
      </div>
    </div>
  )
}
