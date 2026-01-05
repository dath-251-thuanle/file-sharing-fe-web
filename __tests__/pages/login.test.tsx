import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'
import { login } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { navigateTo } from '@/lib/utils/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/auth')
jest.mock('sonner')
jest.mock('@/lib/utils/navigation', () => ({
  navigateTo: jest.fn(),
}))
jest.mock('@/lib/api/helper', () => ({
  setAccessToken: jest.fn(),
  setCurrentUser: jest.fn(),
  setLoginChallengeId: jest.fn(),
  getErrorMessage: jest.fn((err) => err.message || 'Error'),
}))

function testSuccessfulLogin() {
    it('handles successful login', async () => {
        (login as jest.Mock).mockResolvedValue({
            accessToken: 'fake-token',
            user: { id: 1, username: 'test' }
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        
        fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

        await waitFor(() => {
            expect(login).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password'
            })
            expect(navigateTo).toHaveBeenCalledWith('/dashboard')
            expect(toast.success).toHaveBeenCalledWith('Đăng nhập thành công!')
        })
    })
}

function testTotpRequirement(mockRouter: any) {
    it('handles TOTP requirement', async () => {
        (login as jest.Mock).mockResolvedValue({
            requireTOTP: true,
            cid: 'challenge-id'
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        
        fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/login/totp'))
        })
    })
}

function testLoginFailure() {
    it('handles login failure', async () => {
        (login as jest.Mock).mockRejectedValue(new Error('Login failed'))

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'wrong@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), { target: { value: 'password' } })
        
        fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Login failed')
        })
    })
}

describe('LoginPage', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter)
    jest.clearAllMocks()
  })

  testSuccessfulLogin()
  testTotpRequirement(mockRouter)
  testLoginFailure()
})
