import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'
import { getUserProfile } from '@/lib/api/auth'
import { getUserFiles, getAvailableFiles } from '@/lib/api/file'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/auth')
jest.mock('@/lib/api/file')
jest.mock('sonner')
jest.mock('@/lib/api/helper', () => ({
  setCurrentUser: jest.fn(),
  getErrorMessage: jest.fn((err) => err.message || 'Error'),
}))

const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    totpEnabled: false
}

const mockFiles = {
    files: [
        { id: '1', fileName: 'test.txt', status: 'active', createdAt: '2023-01-01', shareToken: 'abc' }
    ],
    summary: { activeFiles: 1, pendingFiles: 0, expiredFiles: 0, deletedFiles: 0 },
    pagination: { currentPage: 1, totalPages: 1, totalFiles: 1, limit: 20 }
}

const mockAvailableFiles = {
    files: [],
    pagination: { currentPage: 1, totalPages: 1, totalFiles: 0, limit: 10 }
}

function testDashboardRendering(mockRouter: any) {
    it('renders dashboard with user info and files', async () => {
        (getUserProfile as jest.Mock).mockResolvedValue({ user: mockUser });
        (getUserFiles as jest.Mock).mockResolvedValue(mockFiles);
        (getAvailableFiles as jest.Mock).mockResolvedValue(mockAvailableFiles);

        render(<Dashboard />);

        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
            expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
            expect(screen.getByText('test.txt')).toBeInTheDocument();
            
            const ones = screen.getAllByText('1');
            expect(ones.length).toBeGreaterThan(0);
            
            const actives = screen.getAllByText('Active');
            expect(actives.length).toBeGreaterThan(0);
        });
    })
}

function testUnauthorizedRedirect(mockRouter: any) {
    it('redirects to login on unauthorized error', async () => {
        (getUserProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

        render(<Dashboard />);

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/login');
        });
    })
}

function testFetchError(mockRouter: any) {
    it('displays error message on fetch failure', async () => {
        (getUserProfile as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch dashboard data.')).toBeInTheDocument();
        });
    })
}

describe('Dashboard Page', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  })

  testDashboardRendering(mockRouter)
  testUnauthorizedRedirect(mockRouter)
  testFetchError(mockRouter)
})