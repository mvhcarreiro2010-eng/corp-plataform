'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Users, BookOpen, ClipboardList, Rocket, TrendingUp, RefreshCw, Clock } from 'lucide-react'

interface DashUser {
  id: string; name: string; role: string; admissaoEm: string | null; tempoDeCasaDias: number | null
  bu: { name: string } | null; lider: { name: string } | null; coordenador: { name: string } | null
  _count: { tentativas: number }
}
interface DashData {
  scope: string; totalUsers: number
  courses: { total: number; completed: number; inProgress: number }
  assessments: { total: number; avgNota: number | null; aprovados: number; reprovados: number }
  induction: { totalSteps: number; completedSteps: number }
  users: DashUser[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', HR: 'RH', MANAGER: 'Gestor', EMPLOYEE: 'Colaborador',
  COORDINATOR: 'Coordenador', LEADER: 'Líder', INSTRUCTOR: 'Instrutor', EDITOR: 'Editor',
}

function formatTempo(dias: number | null): string {
  if (dias === null) return '—'
  if (dias < 30) return `${dias}d`
  if (dias < 365) return `${Math.floor(dias / 30)}m`
  const anos = Math.floor(dias / 365)
  const meses = Math.floor((dias % 365) / 30)
  return meses > 0 ? `${anos}a ${meses}m` : `${anos}a`
}

function tempoColor(dias: number | null): string {
  if (dias === null) return 'text-gray-400'
  if (dias <= 30) return 'text-green-600 font-semibold'
  if (dias <= 90) return 'text-blue-600'
  if (dias <= 365) return 'text-purple-600'
  return 'text-gray-600'
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4 text-white" /></div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const load = useCallback(async () => {
    const res = await fetch('/api/dashboard')
    if (res.ok) { setData(await res.json()); setLastUpdate(new Date()) }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>
  if (!data) return null

  const inductionPct = data.induction.totalSteps > 0 && data.totalUsers > 0
    ? Math.round((data.induction.completedSteps / (data.totalUsers * data.induction.totalSteps)) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ROLE_LABELS[data.scope] ?? data.scope}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          <span>Atualiza em 30s · {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Usuários" value={data.totalUsers} color="bg-blue-500" />
        <StatCard icon={BookOpen} label="Cursos concluídos" value={data.courses.completed}
          sub={`${data.courses.inProgress} em andamento`} color="bg-green-500" />
        <StatCard icon={ClipboardList} label="Nota média"
          value={data.assessments.avgNota !== null ? data.assessments.avgNota.toFixed(1) : '—'}
          sub={`${data.assessments.aprovados} aprov. · ${data.assessments.reprovados} reprov.`} color="bg-orange-500" />
        <StatCard icon={Rocket} label="Progresso Indução" value={`${inductionPct}%`}
          sub={`${data.induction.completedSteps} etapas concluídas`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />Avaliações
          </p>
          {[
            { label: 'Aprovados', value: data.assessments.aprovados, color: 'bg-green-500', textColor: 'text-green-600' },
            { label: 'Reprovados', value: data.assessments.reprovados, color: 'bg-red-400', textColor: 'text-red-600' },
          ].map(row => (
            <div key={row.label} className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{row.label}</span>
                <span className={`font-medium ${row.textColor}`}>{row.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full`}
                  style={{ width: `${data.assessments.total > 0 ? (row.value / data.assessments.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />Cursos
          </p>
          {[
            { label: 'Concluídos', value: data.courses.completed, color: 'bg-green-500' },
            { label: 'Em andamento', value: data.courses.inProgress, color: 'bg-blue-400' },
          ].map(row => (
            <div key={row.label} className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{row.label}</span><span>{row.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${row.color} rounded-full`}
                  style={{ width: `${data.courses.inProgress + data.courses.completed > 0 ? (row.value / (data.courses.inProgress + data.courses.completed)) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users table with tempo de casa */}
      {data.users.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Usuários ({data.users.length})</h2>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Perfil</th>
                  <th className="px-4 py-2 text-left">BU</th>
                  <th className="px-4 py-2 text-left">Líder</th>
                  <th className="px-4 py-2 text-left">Admissão</th>
                  <th className="px-4 py-2 text-left">Tempo de Casa</th>
                  <th className="px-4 py-2 text-left">Tentativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-2 text-gray-500">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-4 py-2 text-gray-500">{u.bu?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{u.lider?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {u.admissaoEm ? new Date(u.admissaoEm).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className={`px-4 py-2 text-xs font-mono ${tempoColor(u.tempoDeCasaDias)}`}>
                      {formatTempo(u.tempoDeCasaDias)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{u._count.tentativas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
