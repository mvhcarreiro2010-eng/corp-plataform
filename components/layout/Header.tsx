'use client'

import { Bell, LogOut, User, ChevronDown, X, Pin, Loader2 } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { getRoleLabel, getRoleBadgeColor, xpForNextLevel, xpProgress } from '@/lib/utils'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

interface Notif {
  id: string
  content: string
  pinned: boolean
  createdAt: string
  author: { name: string }
  _count: { comments: number }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (min < 2) return 'agora'
  if (min < 60) return `${min}min`
  if (h < 24) return `${h}h`
  if (d < 7) return `${d}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function Header() {
  const { data: session } = useSession()

  const [showNotif, setShowNotif] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '??'

  const progress = xpProgress(session?.user?.xp ?? 0, session?.user?.level ?? 1)

  const openNotif = useCallback(async () => {
    setShowNotif(true)
    setLoadingNotifs(true)
    try {
      const res = await fetch('/api/notificacoes')
      setNotifs(await res.json())
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  useEffect(() => {
    if (!showNotif) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotif])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-20">
      <SearchBar />

      <div className="flex items-center gap-3 ml-auto">
        {/* XP Badge */}
        {session?.user && (
          <div className="hidden md:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-600">⭐ Nível {session.user.level}</span>
              <span className="text-xs text-gray-500">{session.user.xp} XP</span>
            </div>
            <Progress value={progress} className="w-20 h-1.5" />
          </div>
        )}

        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => showNotif ? setShowNotif(false) : openNotif()}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-sm text-gray-900">Comunicados</span>
                </div>
                <button
                  onClick={() => setShowNotif(false)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista */}
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                {loadingNotifs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-2xl mb-1">📢</p>
                    <p className="text-sm text-gray-400">Nenhum comunicado ainda</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <Link
                      key={n.id}
                      href="/feed"
                      onClick={() => setShowNotif(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {n.pinned && (
                          <Pin className="w-3 h-3 text-blue-500 shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-xs font-medium text-gray-500 truncate">{n.author.name}</p>
                            <p className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</p>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{n.content}</p>
                          {n._count.comments > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              💬 {n._count.comments} comentário{n._count.comments !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <Link
                  href="/feed"
                  onClick={() => setShowNotif(false)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Ver todos os comunicados →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors outline-none">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session?.user?.avatar ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">{session?.user?.name}</p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(session?.user?.role ?? '')}`}
                >
                  {getRoleLabel(session?.user?.role ?? '')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2"
              align="end"
              sideOffset={8}
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                onSelect={() => signOut({ callbackUrl: '/entrar' })}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
