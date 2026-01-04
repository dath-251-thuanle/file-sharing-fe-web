import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Navbar from '@/components/layout/Navbar'
import { logout } from '@/lib/api/auth'
import { _isLoggedIn, _isAdmin } from '@/lib/api/helper'
import { navigateTo } from '@/lib/utils/navigation'

// Mock dependencies
jest.mock('next/link', () => {
    return ({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) => {
        return <a href={href} className={className}>{children}</a>
    }
})
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))
jest.mock('@/lib/api/auth', () => ({
    logout: jest.fn(),
}))
jest.mock('@/lib/api/helper', () => ({
    _isLoggedIn: jest.fn(),
    _isAdmin: jest.fn(),
}))
jest.mock('@/lib/utils/navigation', () => ({
    navigateTo: jest.fn(),
}))

describe('Navbar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('renders guest links when not logged in', () => {
        (_isLoggedIn as jest.Mock).mockReturnValue(false);
        (_isAdmin as jest.Mock).mockReturnValue(false);

        render(<Navbar />);

        expect(screen.getByText('SecureShare')).toBeInTheDocument();
        expect(screen.getByText('Upload Mới')).toBeInTheDocument();
        expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
        expect(screen.getByText('Đăng ký')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    })

    it('renders user links when logged in', () => {
        (_isLoggedIn as jest.Mock).mockReturnValue(true);
        (_isAdmin as jest.Mock).mockReturnValue(false);

        render(<Navbar />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.queryByText('Đăng nhập')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    })

    it('renders admin link when logged in as admin', () => {
        (_isLoggedIn as jest.Mock).mockReturnValue(true);
        (_isAdmin as jest.Mock).mockReturnValue(true);

        render(<Navbar />);

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Admin Dashboard')).toHaveAttribute('href', '/admin');
    })

    it('handles logout', () => {
        (_isLoggedIn as jest.Mock).mockReturnValue(true);
        render(<Navbar />);

        fireEvent.click(screen.getByText('Logout'));

        expect(logout).toHaveBeenCalled();
        expect(navigateTo).toHaveBeenCalledWith('/login');
    })
})
