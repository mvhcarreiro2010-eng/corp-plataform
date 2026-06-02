'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart2, Users, BookOpen, ClipboardList, Rocket, TrendingUp, RefreshCw, Clock,
  Bell, Smile, ChevronDown, ChevronRight, Download, AlertTriangle, CheckCircle2, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---- Types ----
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
interface Tentativa {
  id: string; nota: number | null; acertos: number | null; finalizadaEm: string; fechadaPorTrapa: boolean
  user: { id: string; name: string; email: string; matricula: string | null; role: string; bu: { name: string } | null }
  avaliacao: { id: string; title: string; questoesExibir: number; testeRapido: boolean }
}
interface AvaliacaoOpt { id: string; title: string; testeRapido: boolean }
interface BuOpt { id: string; name: string }
interface PendenteUser { id: string; name: string; email: string; bu: string | null; lider: string | null }
interface CursoPendente { id: string; title: string; total: number; completed: number; started: number; pendentes: PendenteUser[] }
interface ComPendente { id: string; title: string; urgente: boolean; total: number; aceitos: number; pendentes: PendenteUser[] }
interface WikiPendente { id: string; title: string; slug: string; total: number; visualizados: number; pendentes: PendenteUser[] }
interface HumorDay { data: string; avg: number; count: number }
interface HumorDist { humor: number; count: number }

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', HR: 'RH', MANAGER: 'Gestor', EMPLOYEE: 'Colaborador',
  COORDINATOR: 'Coordenador', LEADER: 'Líder', INSTRUCTOR: 'Instrutor', EDITOR: 'Editor',
}
const HUMOR_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }
const HUMOR_LABEL: Record<number, string> = { 1: 'Péssimo', 2: 'Ruim', 3: 'Ok', 4: 'Bom', 5: 'Ótimo' }
const HUMOR_COLOR: Record<number, string> = { 1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-lime-500', 5: 'bg-green-500' }

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

const TABS = [
  { id: 'geral', label: 'Geral', icon: BarChart2 },
  { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardList },
  { id: 'cursos', label: 'Cursos', icon: BookOpen },
  { id: 'comunicados', label: 'Comunicados', icon: Bell },
  { id: 'wiki', label: 'Wiki', icon: Eye },
  { id: 'humor', label: 'Humor', icon: Smile },
] as const
type TabId = typeof TABS[number]['id']

function PendentesList({ pendentes }: { pendentes: PendenteUser[] }) {
  const [open, setOpen] = useState(false)
  if (pendentes.length === 0) return <span className="text-xs text-green-600">✓ Todos visualizaram</span>
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {pendentes.length} pendente(s)
      </button>
      {open && (
        <div className="mt-1 max-h-40 overflow-y-auto bg-red-50 rounded-lg p-2 space-y-1">
          {pendentes.map(u => (
            <div key={u.id} className="text-xs text-gray-700">
              <span className="font-medium">{u.name}</span>
              {u.bu && <span className="text-gray-400"> · {u.bu}</span>}
              {u.lider && <span className="text-gray-400"> · Líder: {u.lider}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>('geral')
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Avaliações tab
  const [tentativas, setTentativas] = useState<Tentativa[]>([])
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoOpt[]>([])
  const [bus, setBus] = useState<BuOpt[]>([])
  const [filterAv, setFilterAv] = useState('')
  const [filterBu, setFilterBu] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [loadingTent, setLoadingTent] = useState(false)

  // Pendentes tabs (cursos/comunicados/wiki)
  const [cursos, setCursos] = useState<CursoPendente[]>([])
  const [comunicados, setComunicados] = useState<ComPendente[]>([])
  const [wikiPages, setWikiPages] = useState<WikiPendente[]>([])
  const [loadingPend, setLoadingPend] = useState(false)

  // Humor tab
  const [humorDays, setHumorDays] = useState<HumorDay[]>([])
  const [humorDist, setHumorDist] = useState<HumorDist[]>([])
  const [humorTodayCount, setHumorTodayCount] = useState(0)
  const [loadingHumor, setLoadingHumor] = useState(false)

  const loadGeral = useCallback(async () => {
    const res = await fetch('/api/dashboard')
    if (res.ok) { setData(await res.json()); setLastUpdate(new Date()) }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadGeral()
    const iv = setInterval(loadGeral, 30000)
    return () => clearInterval(iv)
  }, [loadGeral])

  // Load avaliacoes tab data
  useEffect(() => {
    if (tab !== 'avaliacoes') return
    const load = async () => {
      setLoadingTent(true)
      const params = new URLSearchParams()
      if (filterAv) params.set('avaliacaoId', filterAv)
      if (filterBu) params.set('buId', filterBu)
      if (filterRole) params.set('role', filterRole)
      const res = await fetch(`/api/dashboard/avaliacoes?${params}`)
      if (res.ok) {
        const d = await res.json()
        setTentativas(d.tentativas ?? [])
        setAvaliacoes(d.avaliacoes ?? [])
        setBus(d.bus ?? [])
      }
      setLoadingTent(false)
    }
    load()
  }, [tab, filterAv, filterBu, filterRole])

  // Load pendentes tabs
  useEffect(() => {
    if (!['cursos', 'comunicados', 'wiki'].includes(tab)) return
    const load = async () => {
      setLoadingPend(true)
      const res = await fetch(`/api/dashboard/pendentes?tipo=${tab === 'cursos' ? 'curso' : tab === 'comunicados' ? 'comunicado' : 'wiki'}`)
      if (res.ok) {
        const d = await res.json()
        if (tab === 'cursos') setCursos(d)
        else if (tab === 'comunicados') setComunicados(d)
        else setWikiPages(d)
      }
      setLoadingPend(false)
    }
    load()
  }, [tab])

  // Load humor tab
  useEffect(() => {
    if (tab !== 'humor') return
    const load = async () => {
      setLoadingHumor(true)
      const res = await fetch('/api/humor?type=team')
      if (res.ok) {
        const d = await res.json()
        setHumorDays(d.days ?? [])
        setHumorDist(d.todayDist ?? [])
        setHumorTodayCount(d.todayCount ?? 0)
      }
      setLoadingHumor(false)
    }
    load()
  }, [tab])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>
  if (!data) return null

  const inductionPct = data.induction.totalSteps > 0 && data.totalUsers > 0
    ? Math.round((data.induction.completedSteps / (data.totalUsers * data.induction.totalSteps)) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ROLE_LABELS[data.scope] ?? data.scope}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          <span>{lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto gap-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          )
        })}
      </div>

      {/* ---- GERAL ---- */}
      {tab === 'geral' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Usuários" value={data.totalUsers} color="bg-blue-500" />
            <StatCard icon={BookOpen} label="Cursos concluídos" value={data.courses.completed}
              sub={`${data.courses.inProgress} em andamento`} color="bg-green-500" />
            <StatCard icon={ClipboardList} label="Nota média"
              value={data.assessments.avgNota !== null ? data.assessments.avgNota.toFixed(1) : '—'}
              sub={`${data.assessments.aprovados} aprov. · ${data.assessments.reprovados} reprov.`} color="bg-orange-500" />
            <StatCard icon={Rocket} label="Progresso Indução" value={`${inductionPct}%`}
              sub={`${data.induction.completedSteps} etapas`} color="bg-purple-500" />
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
        </>
      )}

      {/* ---- AVALIAÇÕES ---- */}
      {tab === 'avaliacoes' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Avaliação</label>
              <select value={filterAv} onChange={e => setFilterAv(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white min-w-[200px]">
                <option value="">Todas</option>
                {avaliacoes.map(a => <option key={a.id} value={a.id}>{a.testeRapido ? '⚡ ' : ''}{a.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">BU</label>
              <select value={filterBu} onChange={e => setFilterBu(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white">
                <option value="">Todas as BUs</option>
                {bus.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Perfil</label>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white">
                <option value="">Todos</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" className="gap-2 ml-auto"
              onClick={() => window.open(`/api/admin/export/notas${filterAv ? `?avaliacaoId=${filterAv}` : ''}`, '_blank')}>
              <Download className="w-4 h-4" />CSV
            </Button>
          </div>

          {loadingTent ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : tentativas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma tentativa encontrada</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2 text-left">Usuário</th>
                      <th className="px-4 py-2 text-left">BU</th>
                      <th className="px-4 py-2 text-left">Avaliação</th>
                      <th className="px-4 py-2 text-left">Nota</th>
                      <th className="px-4 py-2 text-left">Acertos</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tentativas.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-900">{t.user.name}</p>
                          <p className="text-xs text-gray-400">{t.user.email}</p>
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{t.user.bu?.name ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-700 text-xs">
                          {t.avaliacao.testeRapido && <span className="text-xs text-purple-600 mr-1">⚡</span>}
                          {t.avaliacao.title}
                        </td>
                        <td className="px-4 py-2">
                          {t.nota != null ? (
                            <span className={`font-bold text-sm ${t.nota >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                              {t.nota.toFixed(1)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs">
                          {t.acertos != null ? `${t.acertos}/${t.avaliacao.questoesExibir}` : '—'}
                        </td>
                        <td className="px-4 py-2">
                          {t.fechadaPorTrapa ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Trapaça</span>
                          ) : (t.nota ?? 0) >= 6 ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aprovado</span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Reprovado</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {new Date(t.finalizadaEm).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                {tentativas.length} tentativas · Média: {tentativas.length > 0
                  ? (tentativas.reduce((s, t) => s + (t.nota ?? 0), 0) / tentativas.length).toFixed(1)
                  : '—'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- CURSOS ---- */}
      {tab === 'cursos' && (
        <div className="space-y-3">
          {loadingPend ? <div className="text-center py-12 text-gray-400">Carregando...</div> : cursos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum curso publicado</div>
          ) : cursos.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{c.title}</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="text-green-600 font-medium"><CheckCircle2 className="w-3 h-3 inline mr-1" />{c.completed} concluíram</span>
                  <span className="text-blue-600">{c.started} em andamento</span>
                  <span className="text-red-600">{c.pendentes.length} pendentes</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full"
                  style={{ width: `${c.total > 0 ? (c.completed / c.total) * 100 : 0}%` }} />
              </div>
              <PendentesList pendentes={c.pendentes} />
            </div>
          ))}
        </div>
      )}

      {/* ---- COMUNICADOS ---- */}
      {tab === 'comunicados' && (
        <div className="space-y-3">
          {loadingPend ? <div className="text-center py-12 text-gray-400">Carregando...</div> : comunicados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum comunicado publicado</div>
          ) : comunicados.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {c.urgente && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <p className="font-medium text-gray-900">{c.title}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="text-green-600 font-medium"><CheckCircle2 className="w-3 h-3 inline mr-1" />{c.aceitos} aceitaram</span>
                  <span className="text-red-600">{c.pendentes.length} pendentes</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-green-500 rounded-full"
                  style={{ width: `${c.total > 0 ? (c.aceitos / c.total) * 100 : 0}%` }} />
              </div>
              <PendentesList pendentes={c.pendentes} />
            </div>
          ))}
        </div>
      )}

      {/* ---- WIKI ---- */}
      {tab === 'wiki' && (
        <div className="space-y-3">
          {loadingPend ? <div className="text-center py-12 text-gray-400">Carregando...</div> : wikiPages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma página wiki publicada</div>
          ) : wikiPages.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{p.title}</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="text-green-600 font-medium"><Eye className="w-3 h-3 inline mr-1" />{p.visualizados} visualizaram</span>
                  <span className="text-red-600">{p.pendentes.length} pendentes</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${p.total > 0 ? (p.visualizados / p.total) * 100 : 0}%` }} />
              </div>
              <PendentesList pendentes={p.pendentes} />
            </div>
          ))}
        </div>
      )}

      {/* ---- HUMOR ---- */}
      {tab === 'humor' && (
        <div className="space-y-4">
          {loadingHumor ? <div className="text-center py-12 text-gray-400">Carregando...</div> : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Distribuição hoje ({humorTodayCount} respostas)</p>
                  {humorDist.map(d => {
                    const max = Math.max(...humorDist.map(x => x.count), 1)
                    return (
                      <div key={d.humor} className="flex items-center gap-3 mb-2">
                        <span className="text-xl w-8">{HUMOR_EMOJI[d.humor]}</span>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${HUMOR_COLOR[d.humor]} rounded-full transition-all`}
                              style={{ width: `${max > 0 ? (d.count / max) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{d.count}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Média últimos 7 dias</p>
                  {humorDays.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">Sem dados suficientes</p>
                  ) : (
                    <div className="space-y-3">
                      {humorDays.map(d => (
                        <div key={d.data} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20">
                            {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${d.avg >= 4 ? 'bg-green-500' : d.avg >= 3 ? 'bg-yellow-400' : 'bg-red-400'}`}
                              style={{ width: `${(d.avg / 5) * 100}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-8">{d.avg.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">{HUMOR_EMOJI[Math.round(d.avg)] ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {humorDays.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Legenda de humor</p>
                  <div className="flex gap-6">
                    {[1, 2, 3, 4, 5].map(h => (
                      <div key={h} className="flex items-center gap-1.5 text-sm">
                        <span className="text-lg">{HUMOR_EMOJI[h]}</span>
                        <span className="text-gray-600">{HUMOR_LABEL[h]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
