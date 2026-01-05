import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TotpSetupForm from '@/components/auth/TotpSetupForm'

function testTotpSetupLoading(baseProps: any) {
  it('renders loading state', () => {
    render(<TotpSetupForm {...baseProps} loading={true} />)
    expect(screen.getByText('Loading Security Setup...')).toBeInTheDocument()
  })
}

function testTotpSetupError(baseProps: any) {
  it('renders error state', () => {
    render(<TotpSetupForm {...baseProps} error="Something went wrong" qrCode={null} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go back to home/i })).toBeInTheDocument()
  })
}

function testTotpSetupRendering(baseProps: any) {
  it('renders setup form correctly with QR code', () => {
    render(<TotpSetupForm {...baseProps} />)
    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument()
    expect(screen.getByAltText('TOTP QR Code')).toBeInTheDocument()
    expect(screen.getByText('TEST_SECRET')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify & enable/i })).toBeInTheDocument()
  })
}

function testTotpSetupCodeInput(baseProps: any) {
  it('calls updateField on code input change', () => {
    render(<TotpSetupForm {...baseProps} />)
    const input = screen.getByPlaceholderText('6-digit code')
    fireEvent.change(input, { target: { value: '123456' } })
    expect(baseProps.updateField).toHaveBeenCalledWith('totpCode', '123456')
  })
}

function testTotpSetupSubmission(baseProps: any) {
  it('calls handleSubmit on form submission', () => {
    const propsWithCode = { ...baseProps, formData: { totpCode: '123456' } }
    render(<TotpSetupForm {...propsWithCode} />)
    
    const button = screen.getByRole('button', { name: /verify & enable/i })
    expect(button).not.toBeDisabled()
    
    fireEvent.submit(button.closest('form')!)
    expect(baseProps.handleSubmit).toHaveBeenCalled()
  })
}

function testTotpSetupButtonState(baseProps: any) {
    it('disables button when code is incomplete or verifying', () => {
        const { rerender } = render(<TotpSetupForm {...baseProps} />)
        const button = screen.getByRole('button', { name: /verify & enable/i })
        expect(button).toBeDisabled()

        const verifyingProps = { ...baseProps, formData: { totpCode: '123456' }, verifying: true }
        rerender(<TotpSetupForm {...verifyingProps} />)
        expect(screen.getByRole('button', { name: /verify & enable/i })).toBeDisabled()
    })
}

describe('TotpSetupForm Component', () => {
  const mockFormData = {
    totpCode: '',
  }
  const baseProps = {
    formData: mockFormData,
    updateField: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    qrCode: 'data:image/png;base64,fakeqr',
    secret: 'TEST_SECRET',
    loading: false,
    error: null,
    verifying: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  testTotpSetupLoading(baseProps)
  testTotpSetupError(baseProps)
  testTotpSetupRendering(baseProps)
  testTotpSetupCodeInput(baseProps)
  testTotpSetupSubmission(baseProps)
  testTotpSetupButtonState(baseProps)
})
