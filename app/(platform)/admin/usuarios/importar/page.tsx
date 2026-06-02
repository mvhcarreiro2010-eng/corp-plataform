'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ChevronLeft, FileText, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PreviewRow { name: string; matricula: string; cpf: string; email: string; senha: string; bu: string; regiao: string; role: string }

export default function ImportarUsuariosPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)

  const loadPreview = async (f: File) => {
    setLoading(true)
    const fd = new FormData()
    fd.append('file', f)
    fd.append('preview', 'true')
    const res = await fetch('/api/admin/usuarios/importar', { method: 'POST', body: fd })
    const data = await res.json()
    setPreview(data.rows ?? [])
    setLoading(false)
  }

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(null)
    setResult(null)
    loadPreview(f)
  }

  const importar = async () => {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/usuarios/importar', { method: 'POST', body: fd })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/usuarios" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Upload className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">Importar Usuários via CSV</h1>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-medium mb-1">Formato do CSV (cabeçalho obrigatório):</p>
        <code className="font-mono text-xs bg-blue-100 px-2 py-1 rounded block">
          nome,matricula,cpf,email,senha,bu,regiao,role
        </code>
        <p className="mt-2 text-blue-600 text-xs">Se a senha estiver vazia, será definida como <strong>Mudar@123</strong>. A BU deve corresponder a um nome cadastrado. Roles válidos: ADMIN, HR, MANAGER, EMPLOYEE, COORDINATOR, LEADER, INSTRUCTOR, EDITOR.</p>
      </div>

      {!result && (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium">Arraste um arquivo CSV ou clique para selecionar</p>
          <p className="text-gray-400 text-sm mt-1">.csv</p>
          <input ref={inputRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {loading && <div className="text-center py-8 text-gray-400">Processando...</div>}

      {preview && !loading && !result && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{preview.length} linha(s) encontrada(s) no arquivo</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null) }}>Trocar arquivo</Button>
              <Button size="sm" onClick={importar} disabled={preview.length === 0}>Confirmar Importação</Button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  {['Nome', 'Matrícula', 'CPF', 'E-mail', 'BU', 'Região', 'Role'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.matricula || '—'}</td>
                    <td className="px-3 py-2">{r.cpf || '—'}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.bu || '—'}</td>
                    <td className="px-3 py-2">{r.regiao || '—'}</td>
                    <td className="px-3 py-2">{r.role || 'EMPLOYEE'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <Check className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{result.created}</p>
              <p className="text-sm text-green-600">Criados</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
              <p className="text-sm text-yellow-500">Ignorados (já existem)</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
              <p className="text-sm text-red-500">Erros</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null) }}>Nova Importação</Button>
            <Button onClick={() => router.push('/admin/usuarios')}>Ver Usuários</Button>
          </div>
        </div>
      )}
    </div>
  )
}
