'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, UserCog, Save, Loader2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react'
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

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 mb-1 block">{label}{required && ' *'}</label>
    {children}
  </div>
)

const Sel = ({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
    {children}
  </select>
)

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showPassConf, setShowPassConf] = useState(false)

  const [bus, setBus] = useState<BU[]>([])
  const [allUsers, setAllUsers] = useState<UserRef[]>([])

  const [form, setForm] = useState({
    name: '', email: '', role: 'EMPLOYEE',
    matricula: '', cpf: '', regiao: '', department: '', jobTitle: '', bio: '',
    buId: '', coordenadorId: '', liderId: '', instrutorId: '',
    admissaoEm: '', ativo: true,
    newPassword: '', confirmPassword: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/usuarios/${id}`).then(r => r.json()),
      fetch('/api/admin/bus').then(r => r.json()),
      fetch('/api/admin/usuarios').then(r => r.json()),
    ]).then(([user, busData, usersData]) => {
      setBus(busData)
      setAllUsers(usersData)
      setForm({
        name: user.name ?? '',
        email: user.email ?? '',
        role: user.role ?? 'EMPLOYEE',
        matricula: user.matricula ?? '',
        cpf: user.cpf ?? '',
        regiao: user.regiao ?? '',
        department: user.department ?? '',
        jobTitle: user.jobTitle ?? '',
        bio: user.bio ?? '',
        buId: user.buId ?? '',
        coordenadorId: user.coordenadorId ?? '',
        liderId: user.liderId ?? '',
        instrutorId: user.instrutorId ?? '',
        admissaoEm: user.admissaoEm ? user.admissaoEm.slice(0, 10) : '',
        ativo: user.ativo ?? true,
        newPassword: '',
        confirmPassword: '',
      })
      setLoading(false)
    })
  }, [id])

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    setSuccess(false)
    if (!form.name.trim() || !form.email.trim()) { setError('Nome e e-mail são obrigatórios'); return }
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setError('As senhas não coincidem'); return }
    if (form.newPassword && form.newPassword.length < 6) { setError('Senha deve ter mínimo 6 caracteres'); return }

    setSaving(true)
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, email: form.email, role: form.role,
        matricula: form.matricula, cpf: form.cpf, regiao: form.regiao,
        department: form.department, jobTitle: form.jobTitle, bio: form.bio,
        buId: form.buId, coordenadorId: form.coordenadorId,
        liderId: form.liderId, instrutorId: form.instrutorId,
        admissaoEm: form.admissaoEm || null,
        ativo: form.ativo,
        password: form.newPassword || undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess(true)
    setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }))
    setTimeout(() => setSuccess(false), 3000)
  }

  const coordinators = allUsers.filter(u => u.role === 'COORDINATOR')
  const leaders = allUsers.filter(u => u.role === 'LEADER')
  const instructors = allUsers.filter(u => u.role === 'INSTRUCTOR')

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/usuarios" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <UserCog className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
        </div>
        {/* Ativo toggle */}
        <button
          onClick={() => set('ativo', !form.ativo)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            form.ativo
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}
        >
          {form.ativo
            ? <><ToggleRight className="w-4 h-4" /> Ativo</>
            : <><ToggleLeft className="w-4 h-4" /> Inativo</>}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">✓ Usuário atualizado com sucesso!</div>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">

        {/* Dados Pessoais */}
        <section className="p-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Nome completo" required>
                <Input value={form.name} onChange={e => set('name', e.target.value)} />
              </Field>
            </div>
            <Field label="E-mail" required>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Matrícula">
              <Input value={form.matricula} onChange={e => set('matricula', e.target.value)} />
            </Field>
            <Field label="CPF">
              <Input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="Data de Admissão">
              <Input type="date" value={form.admissaoEm} onChange={e => set('admissaoEm', e.target.value)} />
            </Field>
            <div className="col-span-2">
              <Field label="Bio / Apresentação">
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  rows={2}
                  placeholder="Breve descrição sobre o colaborador..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Nova Senha */}
        <section className="p-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alterar Senha</h2>
          <p className="text-xs text-gray-400 mb-3">Deixe em branco para manter a senha atual.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nova senha">
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => set('newPassword', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar nova senha">
              <div className="relative">
                <Input
                  type={showPassConf ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="Repetir senha"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </div>
          {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-xs text-red-500">As senhas não coincidem</p>
          )}
        </section>

        {/* Cargo e Perfil */}
        <section className="p-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cargo e Perfil</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Perfil / Role">
              <Sel value={form.role} onChange={v => set('role', v)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Sel>
            </Field>
            <Field label="Cargo / Função">
              <Input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="Ex: Analista de Treinamento" />
            </Field>
            <Field label="Departamento">
              <Input value={form.department} onChange={e => set('department', e.target.value)} />
            </Field>
            <Field label="Região">
              <Input value={form.regiao} onChange={e => set('regiao', e.target.value)} />
            </Field>
          </div>
        </section>

        {/* BU e Hierarquia */}
        <section className="p-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Business Unit e Hierarquia</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business Unit">
              <Sel value={form.buId} onChange={v => set('buId', v)}>
                <option value="">Sem BU</option>
                {bus.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Sel>
            </Field>
            <Field label="Coordenador">
              <Sel value={form.coordenadorId} onChange={v => set('coordenadorId', v)}>
                <option value="">Sem coordenador</option>
                {coordinators.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Sel>
            </Field>
            <Field label="Líder">
              <Sel value={form.liderId} onChange={v => set('liderId', v)}>
                <option value="">Sem líder</option>
                {leaders.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Sel>
            </Field>
            <Field label="Instrutor">
              <Sel value={form.instrutorId} onChange={v => set('instrutorId', v)}>
                <option value="">Sem instrutor</option>
                {instructors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Sel>
            </Field>
          </div>
        </section>

        {/* Footer */}
        <div className="p-6 flex justify-between items-center">
          <Link href="/admin/usuarios">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}
