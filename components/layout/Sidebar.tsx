'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, MessageSquare, GraduationCap, Rocket, User,
  ChevronLeft, ChevronRight, ChevronDown, Building2, Newspaper,
  FolderOpen, BookMarked, ClipboardList, BarChart2, Users, Video,
  ShoppingBag, UsersRound, MessagesSquare, Bell, Settings, Trophy,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const navItems = [
  { href: '/feed',          label: 'Feed',         icon: Home },
  { href: '/comunicados',   label: 'Comunicados',  icon: Bell },
  { href: '/wiki',          label: 'Wiki',         icon: BookOpen },
  { href: '/comunidade',    label: 'Comunidade',   icon: MessageSquare },
  { href: '/aprendizado',   label: 'Aprendizado',  icon: GraduationCap },
  { href: '/inducao',       label: 'Indução',      icon: Rocket },
  { href: '/treinamentos',  label: 'Treinamentos', icon: Video },
  { href: '/avaliacoes',    label: 'Avaliações',   icon: ClipboardList },
  { href: '/ranking',       label: 'Ranking',      icon: Trophy },
  { href: '/loja',          label: 'Loja',         icon: ShoppingBag },
]

const adminGroups = [
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/comunicados', label: 'Comunicados', icon: Bell },
      { href: '/admin/posts',       label: 'Posts',       icon: Newspaper },
      { href: '/admin/wiki',        label: 'Wiki',        icon: FolderOpen },
      { href: '/admin/cursos',      label: 'Cursos',      icon: BookMarked },
      { href: '/admin/inducao',     label: 'Indução',     icon: Rocket },
      { href: '/admin/avaliacoes',  label: 'Avaliações',  icon: ClipboardList },
      { href: '/admin/treinamentos',label: 'Treinamentos',icon: Video },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/admin/turmas',      label: 'Turmas',         icon: UsersRound },
      { href: '/admin/loja',        label: 'Loja',           icon: ShoppingBag },
      { href: '/admin/comunidade',  label: 'Comunidades',    icon: MessagesSquare },
      { href: '/admin/bus',         label: 'Business Units', icon: Building2, adminOnly: true },
      { href: '/admin/usuarios',    label: 'Usuários',       icon: Users,     adminOnly: true },
    ],
  },
]

const DASHBOARD_ROLES = ['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER', 'INSTRUCTOR']

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [adminOpen, setAdminOpen] = useState(() => pathname.startsWith('/admin'))
  const { data: session } = useSession()

  const role = session?.user?.role ?? ''
  const isAdmin = role === 'ADMIN'
  const isAdminUser = ['ADMIN', 'HR'].includes(role)

  const NavLink = ({ href, label, icon: Icon, active }: {
    href: string; label: string; icon: React.ElementType; active?: boolean
  }) => (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  const AdminLink = ({ href, label, icon: Icon }: {
    href: string; label: string; icon: React.ElementType
  }) => {
    const active = pathname.startsWith(href)
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
          active
            ? 'bg-violet-50 text-violet-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600')} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  return (
    <aside className={cn(
      'hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 sticky top-0 z-30',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-gray-900 text-lg truncate">CorpHub</span>}
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {/* User nav */}
        {navItems.map(item => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        {/* Dashboard (role-gated) */}
        {DASHBOARD_ROLES.includes(role) && (
          <NavLink href="/dashboard" label="Dashboard" icon={BarChart2} active={pathname.startsWith('/dashboard')} />
        )}

        {/* Admin section */}
        {isAdminUser && (
          <div className="pt-3">
            {/* Admin toggle header */}
            <button
              onClick={() => !collapsed && setAdminOpen(o => !o)}
              title={collapsed ? 'Admin' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                pathname.startsWith('/admin')
                  ? 'text-violet-700 bg-violet-50'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              )}
            >
              <Settings className={cn('w-5 h-5 shrink-0', pathname.startsWith('/admin') ? 'text-violet-600' : 'text-gray-400')} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Admin</span>
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform text-gray-400',
                    adminOpen ? 'rotate-180' : ''
                  )} />
                </>
              )}
            </button>

            {/* Admin groups */}
            {(adminOpen || collapsed) && adminGroups.map(group => (
              <div key={group.label} className="mt-1">
                {!collapsed && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                    {group.label}
                  </p>
                )}
                {group.items
                  .filter(item => isAdmin || !('adminOnly' in item && item.adminOnly))
                  .map(item => (
                    <AdminLink key={item.href} {...item} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Profile + collapse toggle */}
      <div className="px-2 py-3 border-t border-gray-200 space-y-1 shrink-0">
        <Link
          href="/perfil"
          title={collapsed ? session?.user?.name : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname.startsWith('/perfil') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <User className="w-5 h-5 shrink-0 text-gray-400" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-gray-900">{session?.user?.name}</p>
              <p className="truncate text-xs text-gray-500">{session?.user?.jobTitle ?? 'Perfil'}</p>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 mx-auto" />
            : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>}
        </button>
      </div>
    </aside>
  )
}
