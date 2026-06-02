'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useRef, useState, useCallback } from 'react'
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Link2, ImageIcon,
  PlaySquare, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Undo, Redo, Loader2, Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RichEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichEditor({ content = '', onChange, placeholder = 'Escreva aqui...', minHeight = 300 }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState<'link' | 'youtube' | 'image' | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg my-2' } }),
      Youtube.configure({ width: 640, height: 480, HTMLAttributes: { class: 'w-full rounded-lg my-2' } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3' },
    },
  })

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url && editor) {
        if (data.type === 'image') {
          editor.chain().focus().setImage({ src: data.url }).run()
        } else {
          editor.chain().focus().insertContent(`<video controls class="w-full rounded-lg my-2"><source src="${data.url}" /></video>`).run()
        }
      }
    } finally {
      setUploading(false)
    }
  }, [editor])

  const applyLink = () => {
    if (!editor || !urlInput) return
    if (showUrlInput === 'link') {
      editor.chain().focus().setLink({ href: urlInput }).run()
    } else if (showUrlInput === 'youtube') {
      editor.commands.setYoutubeVideo({ src: urlInput })
    } else if (showUrlInput === 'image') {
      editor.chain().focus().setImage({ src: urlInput }).run()
    }
    setUrlInput('')
    setShowUrlInput(null)
  }

  if (!editor) return null

  const ToolBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado">
          <UnderlineIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código">
          <Code className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar esquerda">
          <AlignLeft className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar">
          <AlignCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar direita">
          <AlignRight className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
          <AlignJustify className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação">
          <Quote className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador" active={false}>
          <Minus className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <ToolBtn onClick={() => setShowUrlInput(showUrlInput === 'link' ? null : 'link')} active={editor.isActive('link') || showUrlInput === 'link'} title="Link">
          <Link2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => setShowUrlInput(showUrlInput === 'image' ? null : 'image')} active={showUrlInput === 'image'} title="Imagem por URL">
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>
        <button
          type="button"
          title="Upload de imagem"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-green-600" />}
        </button>
        <button
          type="button"
          title="Upload de vídeo"
          onClick={() => videoInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Video className="w-4 h-4" />
        </button>
        <ToolBtn onClick={() => setShowUrlInput(showUrlInput === 'youtube' ? null : 'youtube')} active={showUrlInput === 'youtube'} title="YouTube / Vimeo">
          <PlaySquare className="w-4 h-4 text-red-500" />
        </ToolBtn>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer" active={false}>
          <Undo className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer" active={false}>
          <Redo className="w-4 h-4" />
        </ToolBtn>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
      </div>

      {/* URL input bar */}
      {showUrlInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-blue-50">
          <Input
            autoFocus
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } if (e.key === 'Escape') setShowUrlInput(null) }}
            placeholder={
              showUrlInput === 'link' ? 'https://...' :
              showUrlInput === 'youtube' ? 'URL do YouTube ou Vimeo' :
              'URL da imagem'
            }
            className="h-8 text-sm flex-1"
          />
          <Button size="sm" className="h-8 text-xs" onClick={applyLink}>Inserir</Button>
          <button type="button" onClick={() => setShowUrlInput(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
      )}

      {/* Editor */}
      <div style={{ minHeight }} className="cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
