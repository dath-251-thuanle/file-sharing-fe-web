import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import LoginTotpPage from '@/app/(auth)/login/totp/page'
import { loginTotp } from '@/lib/api/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { navigateTo } from '@/lib/utils/navigation'
import { getLoginChallengeId } from '@/lib/api/helper'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))
jest.mock('@/lib/api/auth')
jest.mock('sonner')
jest.mock('@/lib/utils/navigation', () => ({
  navigateTo: jest.fn(),
}))
jest.mock('@/lib/api/helper', () => ({
  setAccessToken: jest.fn(),
  setCurrentUser: jest.fn(),
  clearLoginChallengeId: jest.fn(),
  getLoginChallengeId: jest.fn(),
  getErrorMessage: jest.fn((err) => err.message || 'Error'),
}))

function testInvalidSessionRedirect(mockRouter: any, mockSearchParams: any) {
    it('redirects to login if no challenge id found', async () => {
        (getLoginChallengeId as jest.Mock).mockReturnValue(null);
        mockSearchParams.get.mockReturnValue('test@example.com');

        render(<LoginTotpPage />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid session. Please login again.');
            expect(mockRouter.push).toHaveBeenCalledWith('/login');
        });
    })
}

function testFormRendering(mockSearchParams: any) {
    it('renders form correctly when session is valid', async () => {
        (getLoginChallengeId as jest.Mock).mockReturnValue('valid-cid');
        mockSearchParams.get.mockReturnValue('test@example.com');

        render(<LoginTotpPage />);

        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toHaveValue('test@example.com');
        expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument();
    })
}

function testSuccessfulVerification(mockSearchParams: any) {
    it('handles successful TOTP verification', async () => {
        (getLoginChallengeId as jest.Mock).mockReturnValue('valid-cid');
        mockSearchParams.get.mockReturnValue('test@example.com');
        (loginTotp as jest.Mock).mockResolvedValue({
            accessToken: 'fake-token',
            user: { id: 1, username: 'test' }
        });

        render(<LoginTotpPage />);

        fireEvent.change(screen.getByPlaceholderText('6-digit code'), { target: { value: '123456' } });
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('6-digit code')).toHaveValue('123456');
        });

        fireEvent.click(screen.getByRole('button', { name: /Verify & Login/i }));

        await waitFor(() => {
            expect(loginTotp).toHaveBeenCalledWith({
                cid: 'valid-cid',
                code: '123456'
            });
            expect(navigateTo).toHaveBeenCalledWith('/dashboard');
            expect(toast.success).toHaveBeenCalledWith('Đăng nhập thành công!');
        });
    })
}

function testFailedVerification(mockSearchParams: any) {
    it('handles failed TOTP verification', async () => {
        (getLoginChallengeId as jest.Mock).mockReturnValue('valid-cid');
        mockSearchParams.get.mockReturnValue('test@example.com');
        (loginTotp as jest.Mock).mockRejectedValue(new Error('Invalid code'));

        render(<LoginTotpPage />);

        fireEvent.change(screen.getByPlaceholderText('6-digit code'), { target: { value: '000000' } });
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('6-digit code')).toHaveValue('000000');
        });

        fireEvent.click(screen.getByRole('button', { name: /Verify & Login/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid code');
        });
    })
}

describe('LoginTotpPage', () => {
  const mockRouter = { push: jest.fn() }
  const mockSearchParams = { get: jest.fn() }

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    jest.clearAllMocks();
  })

  testInvalidSessionRedirect(mockRouter, mockSearchParams)
  testFormRendering(mockSearchParams)
  testSuccessfulVerification(mockSearchParams)
  testFailedVerification(mockSearchParams)
})