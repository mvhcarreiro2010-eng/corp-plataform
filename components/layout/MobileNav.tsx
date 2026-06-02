'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, MessageSquare, GraduationCap, User,
  Bell, ClipboardList, Rocket, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const DASHBOARD_ROLES = ['ADMIN', 'HR', 'MANAGER', 'COORDINATOR', 'LEADER', 'INSTRUCTOR']

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''

  const initials = session?.user?.name
    ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const tabs = [
    { href: '/feed',        icon: Home,          label: 'Feed' },
    { href: '/comunidade',  icon: MessageSquare,  label: 'Comunidade' },
    { href: '/aprendizado', icon: GraduationCap,  label: 'Aprender' },
    { href: '/comunicados', icon: Bell,           label: 'Avisos' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 group"
            >
              <Icon className={cn(
                'w-6 h-6 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                active ? 'text-blue-600' : 'text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </Link>
          )
        })}

        {/* Perfil */}
        <Link
          href="/perfil"
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 group"
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={session?.user?.avatar ?? undefined} />
            <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">{initials}</AvatarFallback>
          </Avatar>
          <span className={cn(
            'text-[10px] font-medium transition-colors',
            pathname.startsWith('/perfil') ? 'text-blue-600' : 'text-gray-400'
          )}>
            Perfil
          </span>
          {pathname.startsWith('/perfil') && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </Link>
      </div>
    </nav>
  )
}
