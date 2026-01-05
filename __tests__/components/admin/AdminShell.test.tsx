import React from 'react'
import { render, screen } from '@testing-library/react'
import { AdminShell } from '@/components/admin/AdminShell'

function testAdminShellRendering() {
  it('renders title and children correctly', () => {
    render(
      <AdminShell title="Test Title">
        <div>Test Child</div>
      </AdminShell>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })
}

function testAdminShellDescription() {
  it('renders description when provided', () => {
    render(
      <AdminShell title="Test Title" description="Test Description">
        <div>Test Child</div>
      </AdminShell>
    )
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })
}

function testAdminShellActions() {
  it('renders actions when provided', () => {
    render(
      <AdminShell 
        title="Test Title" 
        actions={<button>Action Button</button>}
      >
        <div>Test Child</div>
      </AdminShell>
    )
    expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
  })
}

describe('AdminShell Component', () => {
  testAdminShellRendering()
  testAdminShellDescription()
  testAdminShellActions()
})
