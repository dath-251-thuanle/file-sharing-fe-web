import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import RegisterPage from '@/app/(auth)/register/page'
import { register } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/auth')
jest.mock('sonner')
jest.mock('@/lib/api/helper', () => ({
  getErrorMessage: jest.fn((err) => err.message || 'Error'),
}))

function testSuccessfulRegistration(mockRouter: any) {
    it('handles successful registration', async () => {
        (register as jest.Mock).mockResolvedValue({ success: true })

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('Tên đăng nhập'), { target: { value: 'user1' } })
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        fireEvent.change(screen.getByPlaceholderText('Xác nhận mật khẩu'), { target: { value: 'password' } })
        
        fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }))

        await waitFor(() => {
            expect(register).toHaveBeenCalledWith({
                username: 'user1',
                email: 'test@example.com',
                password: 'password'
            })
            expect(mockRouter.push).toHaveBeenCalledWith('/login')
            expect(toast.success).toHaveBeenCalled()
        })
    })
}

function testPasswordMismatch() {
    it('shows error when passwords do not match', async () => {
        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('Tên đăng nhập'), { target: { value: 'user1' } })
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        fireEvent.change(screen.getByPlaceholderText('Xác nhận mật khẩu'), { target: { value: 'different' } })
        
        fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }))

        await waitFor(() => {
            expect(register).not.toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith('Mật khẩu và xác nhận mật khẩu không khớp.')
        })
    })
}

function testRegistrationFailure() {
    it('handles registration failure', async () => {
        (register as jest.Mock).mockRejectedValue(new Error('Registration failed'))

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('Tên đăng nhập'), { target: { value: 'user1' } })
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        fireEvent.change(screen.getByPlaceholderText('Xác nhận mật khẩu'), { target: { value: 'password' } })

        fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Registration failed')
        })
    })
}

describe('RegisterPage', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  testSuccessfulRegistration(mockRouter)
  testPasswordMismatch()
  testRegistrationFailure()
})