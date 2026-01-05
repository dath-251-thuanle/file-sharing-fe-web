import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RegisterForm from '@/components/auth/RegisterForm'

function testRegisterPageRendering(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
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
}

function testRegisterPageUsernameInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on username input change', () => {
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
}

function testRegisterPageEmailInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on email input change', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'newuser@example.com' } })
    expect(mockUpdateField).toHaveBeenCalledWith('email', 'newuser@example.com')
  })
}

function testRegisterPagePasswordInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on password input change', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password123' } })
    expect(mockUpdateField).toHaveBeenCalledWith('password', 'password123')
  })
}

function testRegisterPageConfirmPasswordInput(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
  it('calls updateField on password confirmation input change', () => {
    render(
      <RegisterForm
        formData={mockFormData}
        updateField={mockUpdateField}
        handleSubmit={mockHandleSubmit}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Xác nhận mật khẩu'), { target: { value: 'password123' } })
    expect(mockUpdateField).toHaveBeenCalledWith('confirmPassword', 'password123')
  })
}

function testRegisterPageFormSubmission(mockFormData: any, mockUpdateField: jest.Mock, mockHandleSubmit: jest.Mock) {
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
}

describe('RegisterForm Component', () => {
  const mockFormData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  }
  const mockUpdateField = jest.fn()
  const mockHandleSubmit = jest.fn((e) => e.preventDefault())

  testRegisterPageRendering(mockFormData, mockUpdateField, mockHandleSubmit)
  testRegisterPageUsernameInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testRegisterPageEmailInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testRegisterPagePasswordInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testRegisterPageConfirmPasswordInput(mockFormData, mockUpdateField, mockHandleSubmit)
  testRegisterPageFormSubmission(mockFormData, mockUpdateField, mockHandleSubmit)
  
})
