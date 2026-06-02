'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o assistente da plataforma. Como posso ajudar você hoje?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50',
          open
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:scale-110'
        )}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Painel de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Assistente CorpHub</p>
              <p className="text-xs text-blue-200">Online agora</p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="w-7 h-7 shrink-0 mt-1">
                    <AvatarFallback className="text-xs bg-blue-600 text-white">IA</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[220px] px-3 py-2 rounded-2xl text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-xs bg-blue-600 text-white">IA</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Digite sua pergunta..."
              className="h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={send} disabled={loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
