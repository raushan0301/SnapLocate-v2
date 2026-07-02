import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-surface">

      {/* Full-width header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Row below header: sidebar + scrollable content */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto min-w-0 min-h-0 p-4 sm:p-6 pb-10">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
