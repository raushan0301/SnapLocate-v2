import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PageLayout from './PageLayout'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'student', full_name: 'Test Student' }, logout: vi.fn() }),
}))

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ success: true, data: [] })) },
}))

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

function renderLayout(children) {
  return render(
    <MemoryRouter>
      <PageLayout>{children}</PageLayout>
    </MemoryRouter>
  )
}

describe('PageLayout', () => {
  it('renders children inside the scrollable main content area', () => {
    renderLayout(<div>Page Content</div>)
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('wraps children in a max-width centered container', () => {
    const { container } = renderLayout(<div>Page Content</div>)
    const wrapper = container.querySelector('.max-w-\\[1400px\\]')
    expect(wrapper).toBeTruthy()
    expect(wrapper.className).toMatch(/mx-auto/)
  })

  it('renders the Header and Sidebar shell around the content', () => {
    renderLayout(<div>Page Content</div>)
    expect(screen.getAllByText('SnapLocate').length).toBeGreaterThan(0)
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })
})
