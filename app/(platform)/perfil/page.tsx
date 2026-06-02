'use client'

import { useEffect, useState } from 'react'
import { Edit3, Save, Loader2, User, Star, Trophy, BookOpen, Rocket } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSession } from 'next-auth/react'
import { getRoleLabel, getRoleBadgeColor, xpForNextLevel, xpProgress } from '@/lib/utils'

type UserData = {
  id: string; name: string; email: string; role: string
  avatar: string | null; bio: string | null; jobTitle: string | null; department: string | null
  xp: number; level: number
  badges: { badge: { name: string; icon: string; description: string } }[]
  progress: { id: string }[]
  inductionProgress: { id: string }[]
}

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', jobTitle: '', department: '' })

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data)
        setForm({
          name: data.name ?? '',
          bio: data.bio ?? '',
          jobTitle: data.jobTitle ?? '',
          department: data.department ?? '',
        })
      })
  }, [])

  const save = async () => {
    if (!user) return
    setSaving(true)
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setUser((prev) => prev ? { ...prev, ...updated } : prev)
    await update({ name: updated.name })
    setEditing(false)
    setSaving(false)
  }

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const nextLevelXP = xpForNextLevel(user.level)
  const prevLevelXP = xpForNextLevel(user.level - 1)
  const progress = xpProgress(user.xp, user.level)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        Meu Perfil
      </h1>

      {/* Card principal */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="px-6 pb-6">
          {/* Avatar + ações */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit3 className="w-4 h-4" />
                Editar perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </Button>
              </div>
            )}
          </div>

          {/* Info */}
          {!editing ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              {user.jobTitle && <p className="text-gray-600 text-sm mt-0.5">{user.jobTitle}</p>}
              {user.department && <p className="text-gray-500 text-xs">{user.department}</p>}
              <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
              {user.bio && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{user.bio}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Nome</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Cargo</label>
                  <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Departamento</label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Bio</label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* XP e Nível */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Nível {user.level}
          </h3>
          <span className="text-sm font-bold text-amber-600">{user.xp} XP total</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Progresso para Nível {user.level + 1}</span>
            <span>{user.xp - prevLevelXP} / {nextLevelXP - prevLevelXP} XP</span>
          </div>
          <Progress value={progress} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
          <p className="text-xs text-gray-400 text-right">Faltam {nextLevelXP - user.xp} XP para o próximo nível</p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
          {[
            { icon: <BookOpen className="w-5 h-5 text-blue-600" />, value: user.progress.length, label: 'Lições' },
            { icon: <Rocket className="w-5 h-5 text-purple-600" />, value: user.inductionProgress.length, label: 'Etapas Indução' },
            { icon: <Trophy className="w-5 h-5 text-amber-600" />, value: user.badges.length, label: 'Conquistas' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Conquistas (Badges) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          Conquistas
        </h3>
        {user.badges.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            Complete cursos e atividades para ganhar conquistas! 🏆
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {user.badges.map((ub, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <span className="text-3xl mb-1">{ub.badge.icon}</span>
                <p className="text-xs font-semibold text-gray-800">{ub.badge.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ub.badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
