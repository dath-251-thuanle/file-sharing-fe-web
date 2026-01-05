import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AdminPolicyPage from '@/app/admin/policy/page'
import AdminCleanupPage from '@/app/admin/cleanup/page'
import { adminApi } from '@/lib/api/admin'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/admin')
jest.mock('sonner')

jest.mock('@/components/admin/AdminShell', () => ({
    AdminShell: ({ children, title }: { children: React.ReactNode, title: string }) => (
        <div data-testid="admin-shell">
            <h1>{title}</h1>
            {children}
        </div>
    )
}))

jest.mock('@/components/admin/NumberField', () => ({
    NumberField: ({ label, value, onChange }: any) => (
        <label>
            {label}
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </label>
    )
}))

jest.mock('@/components/admin/CleanupButton', () => ({
    CleanupButton: ({ variant }: any) => <button>Cleanup Button</button>
}))

const mockPolicy = {
    maxFileSizeMB: 50,
    minValidityHours: 1,
    maxValidityDays: 7,
    defaultValidityDays: 1,
    requirePasswordMinLength: 6
};

function testPolicyLoading() {
    it('renders loading state initially', () => {
        (adminApi.getPolicy as jest.Mock).mockReturnValue(new Promise(() => {}));
        render(<AdminPolicyPage />);
        expect(screen.getByText('Đang tải System Policy...')).toBeInTheDocument();
    })
}

function testPolicyFormRendering() {
    it('renders policy form with data', async () => {
        (adminApi.getPolicy as jest.Mock).mockResolvedValue(mockPolicy);

        render(<AdminPolicyPage />);

        await waitFor(() => {
            expect(screen.getByText('System Policy')).toBeInTheDocument();
            expect(screen.getByLabelText(/Max file size/i)).toHaveValue(50);
            expect(screen.getByLabelText(/Max validity/i)).toHaveValue(7);
        });
    })
}

function testPolicyUpdate() {
    it('updates policy successfully', async () => {
        (adminApi.getPolicy as jest.Mock).mockResolvedValue(mockPolicy);
        (adminApi.updatePolicy as jest.Mock).mockResolvedValue({
            success: true,
            message: 'Updated',
            policy: { ...mockPolicy, maxFileSizeMB: 100 }
        });

        render(<AdminPolicyPage />);

        await waitFor(() => {
            expect(screen.getByLabelText(/Max file size/i)).toHaveValue(50);
        });

        fireEvent.change(screen.getByLabelText(/Max file size/i), { target: { value: '100' } });
        fireEvent.click(screen.getByText('Lưu System Policy'));

        await waitFor(() => {
            expect(adminApi.updatePolicy).toHaveBeenCalledWith(expect.objectContaining({ maxFileSizeMB: 100 }));
            expect(toast.success).toHaveBeenCalledWith('Updated');
        });
    })
}

describe('Admin Policy Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    jest.clearAllMocks();
  })

  testPolicyLoading()
  testPolicyFormRendering()
  testPolicyUpdate()
})

describe('Admin Cleanup Page', () => {
    it('renders cleanup page content', () => {
        render(<AdminCleanupPage />);
        expect(screen.getByText('Cleanup file hết hạn')).toBeInTheDocument();
        expect(screen.getByText('Hệ thống đã có cơ chế auto-cleanup theo lịch trình.')).toBeInTheDocument();
        expect(screen.getByText('Cleanup Button')).toBeInTheDocument();
    })
})