'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Props {
  src: string
  lessonId: string
  onComplete?: () => void
}

// SCORM 1.2 LMS API shim
// Sets window.API so the iframe content can find it by searching up the parent chain
function buildScormApi(onComplete: () => void) {
  const data: Record<string, string> = {
    'cmi.core.lesson_status': 'not attempted',
    'cmi.core.score.raw': '',
    'cmi.core.total_time': '00:00:00',
    'cmi.core.session_time': '00:00:00',
    'cmi.suspend_data': '',
  }
  let completed = false

  return {
    LMSInitialize: () => 'true',
    LMSFinish: () => {
      if (!completed) { completed = true; onComplete() }
      return 'true'
    },
    LMSGetValue: (element: string) => data[element] ?? '',
    LMSSetValue: (element: string, value: string) => {
      data[element] = value
      if (element === 'cmi.core.lesson_status' && ['passed', 'completed'].includes(value)) {
        if (!completed) { completed = true; onComplete() }
      }
      return 'true'
    },
    LMSCommit: () => 'true',
    LMSGetLastError: () => '0',
    LMSGetErrorString: () => 'No error',
    LMSGetDiagnostic: () => '',
  }
}

export default function ScormPlayer({ src, lessonId, onComplete }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const completed = useRef(false)

  const handleComplete = useCallback(() => {
    if (completed.current) return
    completed.current = true
    onComplete?.()
  }, [onComplete])

  // Install SCORM API on the parent window so iframe can find it
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).API = buildScormApi(handleComplete)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).API
    }
  }, [handleComplete])

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: '600px' }}>
      <iframe
        ref={iframeRef}
        key={lessonId}
        src={src}
        className="w-full h-full border-0"
        allow="fullscreen"
        title="SCORM Content"
      />
    </div>
  )
}
