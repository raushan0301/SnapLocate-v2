import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'

const mockLogout = vi.fn()
let mockUser = { role: 'student', full_name: 'Test Student', email: 'test@example.com' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}))

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ success: true, data: [] })) },
}))

const mockSetTheme = vi.fn()
let mockTheme = 'light'
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}))

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <Header onMenuClick={() => {}} {...props} />
    </MemoryRouter>
  )
}

describe('Header', () => {
  beforeEach(() => {
    mockLogout.mockClear()
    mockSetTheme.mockClear()
    mockTheme = 'light'
    mockUser = { role: 'student', full_name: 'Test Student', email: 'test@example.com' }
  })

  describe('theme toggle', () => {
    it('shows "Dark mode" in the dropdown when currently light', async () => {
      const user = userEvent.setup()
      renderHeader()
      await user.click(screen.getByLabelText('Profile menu'))
      expect(screen.getByText('Dark mode')).toBeInTheDocument()
    })

    it('shows "Light mode" in the dropdown when currently dark', async () => {
      mockTheme = 'dark'
      const user = userEvent.setup()
      renderHeader()
      await user.click(screen.getByLabelText('Profile menu'))
      expect(screen.getByText('Light mode')).toBeInTheDocument()
    })

    it('calls setTheme("dark") when toggled from light', async () => {
      const user = userEvent.setup()
      renderHeader()
      await user.click(screen.getByLabelText('Profile menu'))
      await user.click(screen.getByText('Dark mode'))
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })
  })

  it('shows the STUDENT OS label for a student user', () => {
    renderHeader()
    expect(screen.getByText('student OS')).toBeInTheDocument()
  })

  it('shows the FACULTY OS label for a faculty user', () => {
    mockUser = { role: 'faculty', full_name: 'Test Faculty', email: 'fac@example.com' }
    renderHeader()
    expect(screen.getByText('faculty OS')).toBeInTheDocument()
  })

  it('opens the profile dropdown with Settings, Support, and Sign out on avatar click', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByLabelText('Profile menu'))
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('calls logout when Sign out is clicked in the profile dropdown', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByLabelText('Profile menu'))
    await user.click(screen.getByText('Sign out'))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('renders the mobile hamburger button that calls onMenuClick', async () => {
    const onMenuClick = vi.fn()
    const user = userEvent.setup()
    renderHeader({ onMenuClick })
    await user.click(screen.getByLabelText('Open navigation menu'))
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  describe('responsive behavior', () => {
    it('hides the hamburger button on large screens', () => {
      renderHeader()
      const hamburger = screen.getByLabelText('Open navigation menu')
      expect(hamburger.className).toMatch(/lg:hidden/)
    })

    it('hides the user name/role block on small screens', () => {
      renderHeader()
      const nameBlock = screen.getByText('Test Student').closest('div')
      expect(nameBlock.className).toMatch(/hidden/)
      expect(nameBlock.className).toMatch(/sm:flex/)
    })
  })
})
