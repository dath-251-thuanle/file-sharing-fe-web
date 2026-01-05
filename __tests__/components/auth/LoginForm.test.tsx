import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '@/components/auth/LoginForm'

function testLoginPageRendering(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('renders login form correctly', () => {
    render(
      <LoginForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mật khẩu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument()
  })
}

function testLoginPageEmailInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on input change', () => {
    render(
      <LoginForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
    expect(mockUpdateField).toHaveBeenCalledWith('email', 'test@example.com')

    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password123' } })
    expect(mockUpdateField).toHaveBeenCalledWith('password', 'password123')
  })
}

function testLoginPagePasswordInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on password input change', () => {
    render(
      <LoginForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password123' } })
    expect(mockUpdateField).toHaveBeenCalledWith('password', 'password123')
  })
}

function testLoginPageSubmit(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls handleSubmit on form submission', () => {
    render(
      <LoginForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    
    fireEvent.submit(screen.getByRole('button', { name: /đăng nhập/i }).closest('form')!)
    expect(mockHandleSubmit).toHaveBeenCalled()
  })
}


describe('LoginForm Component', () => {
  const mockFormData = {
    email: '',
    password: '',
  }
  const mockUpdateField = jest.fn()
  const mockHandleSubmit = jest.fn((e) => e.preventDefault())

  testLoginPageRendering(mockFormData, mockUpdateField, mockHandleSubmit)
  testLoginPageEmailInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testLoginPagePasswordInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testLoginPageSubmit(mockFormData, mockUpdateField, mockHandleSubmit)
})
