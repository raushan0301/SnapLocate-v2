import { useState } from 'react'
import FacultyHeader from './FacultyHeader'
import FacultySidebar from './FacultySidebar'

export default function FacultyLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-surface">
      <FacultyHeader onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <FacultySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto min-w-0 min-h-0 p-4 sm:p-6 pb-10">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
