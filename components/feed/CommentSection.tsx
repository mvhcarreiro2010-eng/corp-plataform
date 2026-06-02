'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from 'next-auth/react'
import { timeAgo } from '@/lib/utils'

type Comment = {
  id: string
  content: string
  createdAt: Date
  author: { id: string; name: string; avatar: string | null; jobTitle: string | null }
}

export function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .finally(() => setFetching(false))
  }, [postId])

  const submit = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    })
    const comment = await res.json()
    setComments((prev) => [...prev, comment])
    setInput('')
    setLoading(false)
  }

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  if (fetching) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2.5">
          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
            <AvatarImage src={comment.author.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{initials(comment.author.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-white rounded-xl px-3 py-2 border border-gray-200 inline-block max-w-full">
              <span className="font-semibold text-xs text-gray-900">{comment.author.name}</span>
              <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-1">{timeAgo(comment.createdAt)}</p>
          </div>
        </div>
      ))}

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="text-xs">
            {session?.user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
            placeholder="Escreva um comentário..."
            className="flex-1 text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={submit}
            disabled={loading || !input.trim()}
            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
