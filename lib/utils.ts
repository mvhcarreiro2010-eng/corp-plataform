import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  })
}

export function xpForNextLevel(level: number): number {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
  return thresholds[level] ?? level * 2000
}

export function xpProgress(xp: number, level: number): number {
  const current = xpForNextLevel(level - 1)
  const next = xpForNextLevel(level)
  return Math.min(100, Math.round(((xp - current) / (next - current)) * 100))
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    HR: 'RH / T&D',
    MANAGER: 'Gestor',
    EMPLOYEE: 'Colaborador',
  }
  return labels[role] ?? role
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    HR: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    EMPLOYEE: 'bg-green-100 text-green-700',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-700'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
