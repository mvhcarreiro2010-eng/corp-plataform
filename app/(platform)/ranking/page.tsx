'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Star, MessageCircle, Heart, BookOpen, ClipboardList, Loader2, Rocket, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface RankedUser {
  rank: number
  id: string
  name: string
  avatar: string | null
  role: string
  jobTitle: string | null
  bu: string | null
  xp: number
  level: number
  score: number
  posts: number
  comments: number
  likes: number
  coursesCompleted: number
  avaliacoesFeitas: number
  avgNota: number
  inducaoSteps: number
}

type Period = 'all' | 'month' | 'week'

const PERIOD_LABELS: Record<Period, string> = {
  all: 'Geral',
  month: 'Este mês',
  week: 'Esta semana',
}

const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
const MEDAL_BG    = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200']
const MEDAL_ICONS = [
  <Trophy key="1" className="w-5 h-5 text-yellow-500" />,
  <Medal  key="2" className="w-5 h-5 text-gray-400" />,
  <Medal  key="3" className="w-5 h-5 text-amber-600" />,
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankedUser[]>([])
  const [myId, setMyId] = useState<string>('')
  const [period, setPeriod] = useState<Period>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ranking?period=${period}`)
      .then(r => r.json())
      .then(data => {
        setRanking(data.ranking ?? [])
        setMyId(data.myId ?? '')
        setLoading(false)
      })
  }, [period])

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const me = ranking.find(u => u.id === myId)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Ranking
          </h1>
          <p className="text-sm text-gray-500">Classificação por XP e interações</p>
        </div>
        {/* Period filter */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                period === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Podium top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {/* 2nd */}
              {top3[1] ? (
                <PodiumCard user={top3[1]} position={1} myId={myId} />
              ) : <div />}
              {/* 1st — taller */}
              {top3[0] && (
                <PodiumCard user={top3[0]} position={0} myId={myId} featured />
              )}
              {/* 3rd */}
              {top3[2] ? (
                <PodiumCard user={top3[2]} position={2} myId={myId} />
              ) : <div />}
            </div>
          )}

          {/* My position (if not in top 3) */}
          {me && me.rank > 3 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-blue-600 font-bold text-sm w-8 text-center">#{me.rank}</span>
              <Avatar className="w-9 h-9">
                <AvatarImage src={me.avatar ?? undefined} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{getInitials(me.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 truncate">{me.name} <span className="text-blue-500 font-normal text-xs">(você)</span></p>
                <p className="text-xs text-blue-600">Nível {me.level} · {me.score.toLocaleString()} pts</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-blue-500">⭐ {me.xp} XP</p>
              </div>
            </div>
          )}

          {/* Full list (from position 4) */}
          {rest.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {rest.map(user => (
                <RankRow key={user.id} user={user} isMe={user.id === myId} />
              ))}
            </div>
          )}

          {ranking.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum dado ainda</p>
              <p className="text-sm">Interaja com a plataforma para aparecer no ranking!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PodiumCard({ user, position, myId, featured }: {
  user: RankedUser; position: number; myId: string; featured?: boolean
}) {
  const isMe = user.id === myId
  return (
    <div className={cn(
      'flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all',
      MEDAL_BG[position],
      featured ? 'scale-105 shadow-md' : '',
      isMe ? 'ring-2 ring-blue-400 ring-offset-1' : ''
    )}>
      <div className="mb-1">{MEDAL_ICONS[position]}</div>
      <Avatar className={cn('mb-2', featured ? 'w-14 h-14' : 'w-11 h-11')}>
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className={cn('font-bold', featured ? 'text-sm' : 'text-xs')}>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <p className="text-xs font-semibold text-gray-900 truncate w-full leading-tight">{user.name}{isMe && ' 👤'}</p>
      {user.jobTitle && <p className="text-[10px] text-gray-400 truncate w-full mt-0.5">{user.jobTitle}</p>}
      <div className={cn('mt-2 font-bold', MEDAL_COLORS[position], featured ? 'text-base' : 'text-sm')}>
        {user.score.toLocaleString()} pts
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">Nível {user.level} · ⭐ {user.xp} XP</p>
    </div>
  )
}

function RankRow({ user, isMe }: { user: RankedUser; isMe: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', isMe && 'bg-blue-50')}>
      <span className={cn('text-sm font-bold w-8 text-center shrink-0', isMe ? 'text-blue-600' : 'text-gray-400')}>
        #{user.rank}
      </span>
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', isMe ? 'text-blue-900' : 'text-gray-900')}>
          {user.name}{isMe && <span className="text-blue-400 text-xs font-normal ml-1">(você)</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">{user.jobTitle ?? user.bu ?? ''}</p>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-400 shrink-0">
        {user.posts > 0      && <span title="Posts"           className="flex items-center gap-0.5"><TrendingUp   className="w-3 h-3" />{user.posts}</span>}
        {user.comments > 0   && <span title="Comentários"     className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{user.comments}</span>}
        {user.likes > 0      && <span title="Curtidas"        className="flex items-center gap-0.5"><Heart         className="w-3 h-3" />{user.likes}</span>}
        {user.coursesCompleted > 0 && <span title="Cursos"   className="flex items-center gap-0.5"><BookOpen      className="w-3 h-3" />{user.coursesCompleted}</span>}
        {user.avaliacoesFeitas > 0 && <span title="Avaliações" className="flex items-center gap-0.5"><ClipboardList className="w-3 h-3" />{user.avaliacoesFeitas}</span>}
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-bold', isMe ? 'text-blue-600' : 'text-gray-700')}>{user.score.toLocaleString()}</p>
        <p className="text-[10px] text-gray-400">Nível {user.level}</p>
      </div>
    </div>
  )
}
