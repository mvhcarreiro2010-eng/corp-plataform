'use client'

import { useRef, useState } from 'react'
import { FileText, Upload, X, Loader2, ExternalLink } from 'lucide-react'

interface PdfUploadProps {
  pdfUrl: string
  pdfName: string
  onChange: (url: string, name: string) => void
}

export function PdfUpload({ pdfUrl, pdfName, onChange }: PdfUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Somente arquivos PDF são permitidos.'); return }
    if (file.size > 50 * 1024 * 1024)   { setError('O PDF deve ter no máximo 50MB.'); return }
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.url) { setError(data.error ?? 'Erro ao fazer upload.'); return }
      onChange(data.url, file.name)
    } finally {
      setUploading(false)
    }
  }

  const remove = () => {
    onChange('', '')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4 text-red-500" />
        Documento PDF (opcional)
      </p>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {pdfUrl ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
          <FileText className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm text-gray-700 flex-1 truncate">{pdfName || 'documento.pdf'}</span>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="text-red-500 hover:text-red-700 p-1" title="Visualizar PDF">
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={remove} className="text-gray-400 hover:text-red-500 p-1" title="Remover PDF">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-4 text-sm text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Enviando PDF...</>
          ) : (
            <><Upload className="w-4 h-4" />Clique para anexar um PDF (máx 50MB)</>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}
      />
    </div>
  )
}
