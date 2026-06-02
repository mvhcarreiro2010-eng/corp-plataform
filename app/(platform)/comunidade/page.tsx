'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Hash, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { timeAgo, getRoleBadgeColor, getRoleLabel, cn } from '@/lib/utils'

type Channel = { id: string; name: string; description: string | null; icon: string | null; _count: { messages: number } }
type Message = {
  id: string; content: string; createdAt: Date
  user: { id: string; name: string; avatar: string | null; jobTitle: string | null; role: string }
}

export default function ComunidadePage() {
  const { data: session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/messages/channels')
      .then((r) => r.json())
      .then((data) => {
        setChannels(data)
        if (data.length > 0) setActiveChannel(data[0])
      })
  }, [])

  useEffect(() => {
    if (!activeChannel) return
    setLoadingMessages(true)
    setMessages([])

    const load = () => {
      fetch(`/api/messages?channelId=${activeChannel.id}`)
        .then((r) => r.json())
        .then(setMessages)
        .finally(() => setLoadingMessages(false))
    }

    load()
    pollRef.current = setInterval(load, 5000) // Poll a cada 5s
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeChannel])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !activeChannel || sending) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input, channelId: activeChannel.id }),
    })
    const msg = await res.json()
    setMessages((prev) => [...prev, msg])
    setInput('')
    setSending(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initials = (name: string) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm -mx-4">
      {/* Sidebar de canais */}
      <div className="w-64 bg-gray-900 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold">Comunidade</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          <p className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">Canais Públicos</p>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                activeChannel?.id === ch.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              <span>{ch.icon ?? '#'}</span>
              <span className="flex-1 truncate">{ch.name}</span>
            </button>
          ))}
        </div>

        {/* Usuário */}
        <div className="px-3 py-3 border-t border-gray-700 flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs text-white">
              {initials(session?.user?.name ?? '??')}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{getRoleLabel(session?.user?.role ?? '')}</p>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header do canal */}
        {activeChannel && (
          <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
            <span className="text-lg">{activeChannel.icon ?? '#'}</span>
            <div>
              <p className="font-semibold text-gray-900">{activeChannel.name}</p>
              {activeChannel.description && (
                <p className="text-xs text-gray-500">{activeChannel.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Hash className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a escrever!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.user.id === session?.user?.id
              const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id

              return (
                <div key={msg.id} className={cn('flex gap-3', !showAvatar && 'ml-10')}>
                  {showAvatar ? (
                    <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                      <AvatarImage src={msg.user.avatar ?? undefined} />
                      <AvatarFallback className="text-xs">{initials(msg.user.name)}</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={cn('text-sm font-semibold', isOwn ? 'text-blue-700' : 'text-gray-900')}>
                          {msg.user.name}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-800 leading-relaxed break-words">{msg.content}</p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-200">
          <div className="flex gap-3 items-end">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={activeChannel ? `Mensagem em #${activeChannel.name}` : 'Selecione um canal'}
              disabled={!activeChannel || sending}
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <Button onClick={send} disabled={!input.trim() || sending} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
