import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'

const mockLogout = vi.fn()
let mockUser = { role: 'student', full_name: 'Test Student' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}))

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })) },
}))

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <Sidebar isOpen={false} onClose={() => {}} {...props} />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockLogout.mockClear()
  })

  describe('student role', () => {
    beforeEach(() => { mockUser = { role: 'student', full_name: 'Test Student' } })

    it('renders section headers Overview, Academic, Campus Life', () => {
      renderSidebar()
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Academic')).toBeInTheDocument()
      expect(screen.getByText('Campus Life')).toBeInTheDocument()
    })

    it('lists Professor under the Academic section, not Campus Life', () => {
      renderSidebar()
      const academicHeader = screen.getByText('Academic')
      const campusLifeHeader = screen.getByText('Campus Life')
      const professorLink = screen.getByText('Professor').closest('a')

      // Professor's DOM position should fall between Academic and Campus Life headers
      const position = professorLink.compareDocumentPosition(academicHeader)
      expect(position & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
      const posVsCampus = professorLink.compareDocumentPosition(campusLifeHeader)
      expect(posVsCampus & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('does not render Settings or Sign Out for student role', () => {
      renderSidebar()
      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })

    it('shows the SnapLocate logo and role OS label in the mobile header row', () => {
      renderSidebar()
      expect(screen.getByText('SnapLocate')).toBeInTheDocument()
      expect(screen.getByText('student OS')).toBeInTheDocument()
      expect(screen.queryByText('MENU')).not.toBeInTheDocument()
    })

    it('does not render a plain "MENU" label anywhere', () => {
      renderSidebar()
      expect(screen.queryByText(/^MENU$/)).not.toBeInTheDocument()
    })
  })

  describe('faculty role', () => {
    beforeEach(() => { mockUser = { role: 'faculty', full_name: 'Test Faculty' } })

    it('renders section headers Overview, Teaching, Campus', () => {
      renderSidebar()
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Teaching')).toBeInTheDocument()
      expect(screen.getByText('Campus')).toBeInTheDocument()
    })

    it('lists Professors under the Teaching section, not Campus', () => {
      renderSidebar()
      const teachingHeader = screen.getByText('Teaching')
      const campusHeader = screen.getByText('Campus')
      const professorsLink = screen.getByText('Professors').closest('a')

      const posVsTeaching = professorsLink.compareDocumentPosition(teachingHeader)
      expect(posVsTeaching & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
      const posVsCampus = professorsLink.compareDocumentPosition(campusHeader)
      expect(posVsCampus & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('does not render Settings or Sign Out for faculty role', () => {
      renderSidebar()
      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })

    it('shows FACULTY OS label in the mobile header row', () => {
      renderSidebar()
      expect(screen.getByText('faculty OS')).toBeInTheDocument()
    })
  })

  describe('admin role', () => {
    beforeEach(() => { mockUser = { role: 'admin', full_name: 'Test Admin' } })

    it('still renders Settings and Sign Out for admin role', () => {
      renderSidebar()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('calls logout and does not throw when Sign Out is clicked', async () => {
      const { default: userEvent } = await import('@testing-library/user-event')
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByText('Sign Out'))
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('responsive behavior', () => {
    beforeEach(() => { mockUser = { role: 'student', full_name: 'Test Student' } })

    it('is translated off-screen on mobile by default and pinned static on large screens', () => {
      const { container } = renderSidebar({ isOpen: false })
      const aside = container.querySelector('aside')
      expect(aside.className).toMatch(/-translate-x-full/)
      expect(aside.className).toMatch(/lg:static/)
      expect(aside.className).toMatch(/lg:translate-x-0/)
    })

    it('slides into view on mobile when isOpen is true', () => {
      const { container } = renderSidebar({ isOpen: true })
      const aside = container.querySelector('aside')
      expect(aside.className).toMatch(/translate-x-0/)
      expect(aside.className).not.toMatch(/-translate-x-full/)
    })

    it('hides the mobile close button and header row on large screens', () => {
      const { container } = renderSidebar()
      const mobileHeaderRow = container.querySelector('.flex.lg\\:hidden.items-center.justify-between')
      expect(mobileHeaderRow).toBeTruthy()
      expect(mobileHeaderRow.className).toMatch(/lg:hidden/)
    })
  })

  describe('mobile overlay behavior', () => {
    beforeEach(() => { mockUser = { role: 'student', full_name: 'Test Student' } })

    it('renders a backdrop overlay when isOpen is true', () => {
      const { container } = renderSidebar({ isOpen: true })
      expect(container.querySelector('.fixed.inset-0')).toBeTruthy()
    })

    it('does not render a backdrop overlay when isOpen is false', () => {
      const { container } = renderSidebar({ isOpen: false })
      expect(container.querySelector('.fixed.inset-0')).toBeFalsy()
    })
  })
})
