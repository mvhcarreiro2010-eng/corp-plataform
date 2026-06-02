'use client'

import { useState } from 'react'
import { Image as ImageIcon, Pin, Send, Loader2, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

export function CreatePost({ onCreated }: { onCreated: (post: any) => void }) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const allowed = session?.user?.role === 'ADMIN' || session?.user?.role === 'HR'
  if (!allowed) return null

  const initials = session?.user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const submit = async () => {
    if (!content.trim() || loading) return
    setLoading(true)
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, pinned }),
    })
    const post = await res.json()
    onCreated(post)
    setContent('')
    setPinned(false)
    setExpanded(false)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={session?.user?.avatar ?? undefined} />
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-150 rounded-full text-sm text-gray-500 transition-colors"
            >
              📢 Publicar comunicado para a equipe...
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o comunicado aqui... Use **negrito** e *itálico*."
                autoFocus
                rows={4}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <Pin className="w-4 h-4" />
                  Fixar comunicado
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExpanded(false); setContent('') }}
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={submit} disabled={!content.trim() || loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
