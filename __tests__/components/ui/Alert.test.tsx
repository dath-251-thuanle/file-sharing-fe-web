import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert } from '@/components/ui/Alert'

describe('Alert Component', () => {
  it('renders message correctly', () => {
    render(<Alert type="info" message="This is an info" />)
    expect(screen.getByText('This is an info')).toBeInTheDocument()
  })

  it('applies success styles', () => {
    render(<Alert type="success" message="Success!" />)
    const alert = screen.getByText('Success!').closest('div')
    expect(alert).toHaveClass('bg-green-100')
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('applies error styles', () => {
    render(<Alert type="error" message="Error!" />)
    const alert = screen.getByText('Error!').closest('div')
    expect(alert).toHaveClass('bg-red-100')
    expect(screen.getByText('❌')).toBeInTheDocument()
  })
})
