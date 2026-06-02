'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  MessageSquare,
  GraduationCap,
  Rocket,
  User,
  ChevronLeft,
  ChevronRight,
  Building2,
  Newspaper,
  FolderOpen,
  BookMarked,
  ClipboardList,
  BarChart2,
  Users,
  Video,
  ShoppingBag,
  UsersRound,
  MessagesSquare,
  Bell,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/comunicados', label: 'Comunicados', icon: Bell },
  { href: '/wiki', label: 'Wiki', icon: BookOpen },
  { href: '/comunidade', label: 'Comunidade', icon: MessageSquare },
  { href: '/aprendizado', label: 'Aprendizado', icon: GraduationCap },
  { href: '/inducao', label: 'Indução', icon: Rocket },
  { href: '/treinamentos', label: 'Treinamentos', icon: Video },
  { href: '/avaliacoes', label: 'Avaliações', icon: ClipboardList },
  { href: '/loja', label: 'Loja', icon: ShoppingBag },
]

const adminItems = [
  { href: '/admin/comunicados', label: 'Comunicados', icon: Bell },
  { href: '/admin/posts', label: 'Posts', icon: Newspaper },
  { href: '/admin/wiki', label: 'Categorias Wiki', icon: FolderOpen },
  { href: '/admin/cursos', label: 'Cursos', icon: BookMarked },
  { href: '/admin/inducao', label: 'Trilha Indução', icon: Rocket },
  { href: '/admin/avaliacoes', label: 'Avaliações', icon: ClipboardList },
  { href: '/admin/treinamentos', label: 'Treinamentos', icon: Video },
  { href: '/admin/turmas', label: 'Turmas', icon: UsersRound },
  { href: '/admin/loja', label: 'Loja', icon: ShoppingBag },
  { href: '/admin/comunidade', label: 'Comunidades', icon: MessagesSquare },
  { href: '/admin/bus', label: 'Business Units', icon: Building2, adminOnly: true },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
]

const DASHBOARD_ROLES = ['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER', 'INSTRUCTOR']

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 sticky top-0 z-30',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-gray-900 text-lg truncate">CorpHub</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
        {DASHBOARD_ROLES.includes(session?.user?.role ?? '') && (
          <Link
            href="/dashboard"
            title={collapsed ? 'Dashboard' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
              pathname.startsWith('/dashboard')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <BarChart2 className={cn('w-5 h-5 shrink-0', pathname.startsWith('/dashboard') ? 'text-blue-600' : 'text-gray-500')} />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </Link>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-gray-200 space-y-1">
        {/* Admin section */}
        {['ADMIN', 'HR'].includes(session?.user?.role ?? '') && (
          <div className="mb-2">
            {!collapsed && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">Admin</p>
            )}
            {adminItems
              .filter(item => session?.user?.role === 'ADMIN' || !item.adminOnly)
              .map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    )}>
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-purple-600' : 'text-gray-400')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
          </div>
        )}

        <Link
          href="/perfil"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
            pathname.startsWith('/perfil')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          title={collapsed ? 'Perfil' : undefined}
        >
          <User className="w-5 h-5 shrink-0 text-gray-500" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-gray-900">{session?.user?.name}</p>
              <p className="truncate text-xs text-gray-500">{session?.user?.jobTitle ?? 'Perfil'}</p>
            </div>
          )}
        </Link>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
