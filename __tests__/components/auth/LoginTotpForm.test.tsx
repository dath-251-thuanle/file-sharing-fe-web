import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginTotpForm from '@/components/auth/LoginTotpForm'

function testLoginTotpRendering(mockProps: any) {
  it('renders login totp form correctly', () => {
    render(<LoginTotpForm {...mockProps} />)
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument()
    expect(screen.getByText('Enter the code from your authenticator app.')).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockProps.email)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify & login/i })).toBeInTheDocument()
  })
}

function testLoginTotpCodeInput(mockProps: any) {
  it('calls updateField on code input change', () => {
    render(<LoginTotpForm {...mockProps} />)
    const input = screen.getByPlaceholderText('6-digit code')
    fireEvent.change(input, { target: { value: '123456' } })
    expect(mockProps.updateField).toHaveBeenCalledWith('code', '123456')
  })
}

function testLoginTotpSubmission(mockProps: any) {
  it('calls handleSubmit on form submission', () => {
    const propsWithCode = { ...mockProps, formData: { code: '123456' } }
    render(<LoginTotpForm {...propsWithCode} />)

    const button = screen.getByRole('button', { name: /verify & login/i })
    expect(button).not.toBeDisabled()

    fireEvent.submit(button.closest('form')!)
    expect(mockProps.handleSubmit).toHaveBeenCalled()
  })
}

function testLoginTotpButtonState(mockProps: any) {
  it('disables button when code is incomplete or verifying', () => {
    const { rerender } = render(<LoginTotpForm {...mockProps} />)
    const button = screen.getByRole('button', { name: /verify & login/i })
    expect(button).toBeDisabled()

    const verifyingProps = { ...mockProps, formData: { code: '123456' }, verifying: true }
    rerender(<LoginTotpForm {...verifyingProps} />)
    expect(screen.getByRole('button', { name: /verify & login/i })).toBeDisabled()
  })
}

describe('LoginTotpForm Component', () => {
  const mockFormData = {
    code: '',
  }
  const mockProps = {
    email: 'test@example.com',
    formData: mockFormData,
    updateField: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    verifying: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  testLoginTotpRendering(mockProps)
  testLoginTotpCodeInput(mockProps)
  testLoginTotpSubmission(mockProps)
  testLoginTotpButtonState(mockProps)
})
