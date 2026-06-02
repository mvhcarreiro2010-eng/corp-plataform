'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder = 'Adicionar tag e pressionar Enter...' }: TagInputProps) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!tag || tags.includes(tag)) { setInput(''); return }
    onChange([...tags, tag])
    setInput('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg min-h-[40px] focus-within:ring-2 focus-within:ring-blue-500 bg-white cursor-text">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-blue-900 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input.trim() && add(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-32 text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  )
}
