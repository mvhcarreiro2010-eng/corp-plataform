'use client'

import { Bell, Search, LogOut, User, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { getRoleLabel, getRoleBadgeColor, xpForNextLevel, xpProgress } from '@/lib/utils'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/wiki?q=${encodeURIComponent(search)}`)
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '??'

  const progress = xpProgress(session?.user?.xp ?? 0, session?.user?.level ?? 1)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Busca */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na wiki, cursos, usuários..."
            className="pl-9 bg-gray-50 border-gray-200 h-9"
          />
        </div>
      </form>

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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

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
