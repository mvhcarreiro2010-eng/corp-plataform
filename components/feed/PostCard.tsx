'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, Pin, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CommentSection } from './CommentSection'
import { timeAgo, getRoleLabel, getRoleBadgeColor, cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

type Post = {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: Date
  author: { id: string; name: string; avatar: string | null; jobTitle: string | null; role: string }
  _count: { likes: number; comments: number }
  likes: { userId: string }[]
}

export function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const { data: session } = useSession()
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)

  const liked = post.likes.some((l) => l.userId === session?.user?.id)
  const initials = post.author.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Renderiza markdown simples (negrito, itálico, quebras de linha)
  const renderContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow', post.pinned && 'border-blue-200 ring-1 ring-blue-100')}>
      {/* Pin indicator */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border-b border-blue-100">
          <Pin className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Comunicado fixado</span>
        </div>
      )}

      <div className="p-4 md:p-5">
        {/* Header do post */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={post.author.avatar ?? undefined} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
              <Badge
                className={cn('text-xs', getRoleBadgeColor(post.author.role))}
              >
                {getRoleLabel(post.author.role)}
              </Badge>
            </div>
            {post.author.jobTitle && (
              <p className="text-xs text-gray-500">{post.author.jobTitle}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div
          className="text-gray-800 text-sm leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* Mídia */}
        {post.mediaUrl && post.mediaType === 'image' && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
            <Image
              src={post.mediaUrl}
              alt="Imagem do post"
              width={800}
              height={400}
              className="w-full object-cover max-h-80"
            />
          </div>
        )}

        {/* Contadores */}
        {(post._count.likes > 0 || post._count.comments > 0) && (
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
            {post._count.likes > 0 && (
              <span>❤️ {post._count.likes} curtida{post._count.likes !== 1 ? 's' : ''}</span>
            )}
            {post._count.comments > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                💬 {post._count.comments} comentário{post._count.comments !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLike(post.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center',
              liked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
            Curtir
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center"
          >
            <MessageCircle className="w-4 h-4" />
            Comentar
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>
      </div>

      {/* Seção de comentários */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  )
}
