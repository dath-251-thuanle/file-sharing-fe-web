import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CleanupButton } from '@/components/admin/CleanupButton'
import { adminApi } from '@/lib/api/admin'
import { toast } from 'sonner'

jest.mock('@/lib/api/admin')
jest.mock('sonner')

describe('CleanupButton', () => {
    it('handles cleanup success', async () => {
        (adminApi.cleanupExpiredFiles as jest.Mock).mockResolvedValue({
            message: 'Cleanup successful',
            deletedFiles: 5,
            timestamp: new Date().toISOString()
        });

        render(<CleanupButton />);
        
        fireEvent.click(screen.getByText('Cleanup file hết hạn'));
        
        expect(screen.getByText('Đang cleanup...')).toBeInTheDocument();

        await waitFor(() => {
            expect(adminApi.cleanupExpiredFiles).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Cleanup successful'));
            expect(screen.getByText('Cleanup file hết hạn')).toBeInTheDocument();
        });
    })

    it('handles cleanup failure', async () => {
        (adminApi.cleanupExpiredFiles as jest.Mock).mockRejectedValue(new Error('Failed'));

        render(<CleanupButton />);
        
        fireEvent.click(screen.getByText('Cleanup file hết hạn'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    })
})
