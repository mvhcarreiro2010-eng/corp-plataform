import { Role } from '@prisma/client'

// Extensão do NextAuth
declare module 'next-auth' {
  interface User {
    id: string
    role: string
    avatar?: string
    jobTitle?: string
    department?: string
    xp: number
    level: number
    buId?: string
    mustChangePassword?: boolean
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      avatar?: string
      jobTitle?: string
      department?: string
      xp: number
      level: number
      buId?: string
      mustChangePassword?: boolean
    }
  }
}

// Tipos de feed
export type PostWithRelations = {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: Date
  author: {
    id: string
    name: string
    avatar: string | null
    jobTitle: string | null
    role: Role
  }
  _count: {
    likes: number
    comments: number
  }
  likes: { userId: string }[]
}

export type CommentWithAuthor = {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string
    avatar: string | null
    jobTitle: string | null
  }
}

// Tipos de wiki
export type WikiPageWithCategory = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  views: number
  updatedAt: Date
  category: {
    id: string
    name: string
    icon: string | null
  }
}

// Tipos de curso
export type CourseWithProgress = {
  id: string
  title: string
  description: string
  thumbnail: string | null
  xpReward: number
  _count: { modules: number }
  progress: { completed: boolean }[]
  completedLessons: number
  totalLessons: number
}

// Tipos de indução
export type TrailStepWithProgress = {
  id: string
  title: string
  content: string
  type: string
  order: number
  xpReward: number
  progress: { completed: boolean }[]
}

// Navegação
export type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: Role[]
}
