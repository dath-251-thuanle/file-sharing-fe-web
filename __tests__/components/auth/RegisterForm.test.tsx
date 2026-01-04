import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RegisterForm from '@/components/auth/RegisterForm'

describe('RegisterForm Component', () => {
  const mockFormData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  }
  const mockUpdateField = jest.fn()
  const mockHandleSubmit = jest.fn((e) => e.preventDefault())

  it('renders register form correctly', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    expect(screen.getByPlaceholderText('Tên đăng nhập')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mật khẩu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Xác nhận mật khẩu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng ký/i })).toBeInTheDocument()
  })

  it('calls updateField on input change', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Tên đăng nhập'), { target: { value: 'newuser' } })
    expect(mockUpdateField).toHaveBeenCalledWith('username', 'newuser')
  })

  it('calls handleSubmit on form submission', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )
    
    fireEvent.submit(screen.getByRole('button', { name: /đăng ký/i }).closest('form')!)
    expect(mockHandleSubmit).toHaveBeenCalled()
  })
})
