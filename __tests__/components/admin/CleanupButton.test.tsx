import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CleanupButton } from '@/components/admin/CleanupButton'
import { adminApi } from '@/lib/api/admin'
import { toast } from 'sonner'

jest.mock('@/lib/api/admin')
jest.mock('sonner')

function testCleanupSuccess() {
    it('handles cleanup success', async () => {
        (adminApi.cleanupExpiredFiles as jest.Mock).mockResolvedValue({
            message: 'Cleanup successful',
            deletedFiles: 5,
            timestamp: new Date().toISOString()
        });

        render(<CleanupButton />);
        
        const button = screen.getByText('Cleanup file hết hạn');
        fireEvent.click(button);
        
        expect(screen.getByText('Đang cleanup...')).toBeInTheDocument();

        await waitFor(() => {
            expect(adminApi.cleanupExpiredFiles).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Cleanup successful'));
            expect(screen.getByText('Cleanup file hết hạn')).toBeInTheDocument();
        });
    })
}

function testCleanupFailure() {
    it('handles cleanup failure', async () => {
        (adminApi.cleanupExpiredFiles as jest.Mock).mockRejectedValue(new Error('Failed'));

        render(<CleanupButton />);
        
        fireEvent.click(screen.getByText('Cleanup file hết hạn'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
            expect(screen.getByText('Cleanup file hết hạn')).toBeInTheDocument();
        });
    })
}

describe('CleanupButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    testCleanupSuccess();
    testCleanupFailure();
})