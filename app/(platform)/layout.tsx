import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Chatbot } from '@/components/layout/Chatbot'
import { PlatformChecks } from '@/components/layout/PlatformChecks'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <PlatformChecks />
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>
      {/* Bottom nav: mobile only */}
      <MobileNav />
      <Chatbot />
    </div>
  )
}
