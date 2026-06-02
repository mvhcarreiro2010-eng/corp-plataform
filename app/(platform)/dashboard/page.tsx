'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Users, BookOpen, ClipboardList, Rocket, TrendingUp, RefreshCw } from 'lucide-react'

interface DashData {
  scope: string
  totalUsers: number
  courses: { total: number; completed: number; inProgress: number }
  assessments: { total: number; avgNota: number | null; aprovados: number; reprovados: number }
  induction: { totalSteps: number; completedSteps: number }
  users: {
    id: string; name: string; role: string
    bu: { name: string } | null
    lider: { name: string } | null
    coordenador: { name: string } | null
    _count: { tentativas: number }
  }[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', HR: 'RH', MANAGER: 'Gestor', EMPLOYEE: 'Colaborador',
  COORDINATOR: 'Coordenador', LEADER: 'Líder', INSTRUCTOR: 'Instrutor', EDITOR: 'Editor',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string; color: string
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
    if (res.ok) {
      setData(await res.json())
      setLastUpdate(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [load])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>
  if (!data) return null

  const courseCompletePct = data.courses.total > 0
    ? Math.round((data.courses.completed / (data.totalUsers * data.courses.total || 1)) * 100)
    : 0
  const inductionPct = data.induction.totalSteps > 0 && data.totalUsers > 0
    ? Math.round((data.induction.completedSteps / (data.totalUsers * data.induction.totalSteps)) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400">{ROLE_LABELS[data.scope] ?? data.scope}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          <span>Atualiza em 30s · Última: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Usuários" value={data.totalUsers} color="bg-blue-500" />
        <StatCard
          icon={BookOpen} label="Cursos concluídos" value={data.courses.completed}
          sub={`${data.courses.inProgress} em andamento · ${courseCompletePct}%`} color="bg-green-500"
        />
        <StatCard
          icon={ClipboardList} label="Nota média"
          value={data.assessments.avgNota !== null ? data.assessments.avgNota.toFixed(1) : '—'}
          sub={`${data.assessments.aprovados} aprovados · ${data.assessments.reprovados} reprovados`}
          color="bg-orange-500"
        />
        <StatCard
          icon={Rocket} label="Progresso Indução"
          value={`${inductionPct}%`}
          sub={`${data.induction.completedSteps} etapas concluídas`}
          color="bg-purple-500"
        />
      </div>

      {/* Assessment donut-style bars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />Avaliações
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Aprovados</span><span className="font-medium text-green-600">{data.assessments.aprovados}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.assessments.total > 0 ? (data.assessments.aprovados / data.assessments.total) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Reprovados</span><span className="font-medium text-red-600">{data.assessments.reprovados}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${data.assessments.total > 0 ? (data.assessments.reprovados / data.assessments.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />Cursos
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Concluídos</span><span className="font-medium text-green-600">{data.courses.completed}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.courses.inProgress + data.courses.completed > 0 ? (data.courses.completed / (data.courses.inProgress + data.courses.completed)) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Em andamento</span><span>{data.courses.inProgress}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${data.courses.inProgress + data.courses.completed > 0 ? (data.courses.inProgress / (data.courses.inProgress + data.courses.completed)) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      {data.users.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Usuários sob sua visão ({data.users.length})</h2>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Perfil</th>
                  <th className="px-4 py-2 text-left">BU</th>
                  <th className="px-4 py-2 text-left">Líder</th>
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
