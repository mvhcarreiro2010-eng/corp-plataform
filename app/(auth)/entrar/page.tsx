'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-mail ou senha incorretos. Verifique e tente novamente.')
      setLoading(false)
    } else {
      router.push('/feed')
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header do card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CorpHub</h1>
          <p className="text-blue-200 text-sm mt-1">Plataforma Corporativa de Aprendizado</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bem-vindo de volta!</h2>
            <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">E-mail corporativo</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@empresa.com"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          {/* Credenciais de demo */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center mb-3">Credenciais para teste</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🔑 Admin', email: 'admin@empresa.com', pass: 'admin123' },
                { label: '👥 RH', email: 'rh@empresa.com', pass: 'user123' },
                { label: '📊 Gestor', email: 'gestor@empresa.com', pass: 'user123' },
                { label: '👤 Colaborador', email: 'colaborador@empresa.com', pass: 'user123' },
              ].map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => {
                    setEmail(c.email)
                    setPassword(c.pass)
                  }}
                  className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 text-left transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Problemas para acessar? Contate o RH ou TI.
      </p>
    </div>
  )
}
