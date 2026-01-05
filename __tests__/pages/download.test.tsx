import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Page from '@/app/(public)/f/[token]/page'
import { getFileByToken, downloadFile, loadFilePreview, canPreviewFile, formatFileSize } from '@/lib/api/fileService'
import { useParams } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}))
jest.mock('@/lib/api/fileService')
jest.mock('@/components/ui/Alert', () => ({
    Alert: ({ message }: { message: string }) => <div data-testid="alert">{message}</div>
}))

const mockToken = 'abc-123';

function testDownloadLoading() {
    it('renders loading state initially', () => {
        (getFileByToken as jest.Mock).mockReturnValue(new Promise(() => {}));
        render(<Page />);
        expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    })
}

function testDownloadInfo() {
    it('renders file info correctly', async () => {
        (getFileByToken as jest.Mock).mockResolvedValue({
            fileName: 'test.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            status: 'active',
            hasPassword: false
        });

        render(<Page />);

        await waitFor(() => {
            const fileNames = screen.getAllByText('test.pdf');
            expect(fileNames.length).toBeGreaterThan(0);
            expect(screen.getByText('1024 B • application/pdf')).toBeInTheDocument();
            expect(screen.getByText('🟢 Khả dụng')).toBeInTheDocument();
        });
    })
}

function testPasswordProtectedDownload() {
    it('handles password protected file download', async () => {
        (getFileByToken as jest.Mock).mockResolvedValue({
            fileName: 'secret.txt',
            status: 'active',
            hasPassword: true
        });

        render(<Page />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Nhập mật khẩu...')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('⬇️ Tải xuống'));
        await waitFor(() => {
             expect(screen.getByTestId('alert')).toHaveTextContent('Vui lòng nhập mật khẩu.');
        });

        fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu...'), { target: { value: 'password123' } });
        
        (downloadFile as jest.Mock).mockResolvedValue(true);
        fireEvent.click(screen.getByText('⬇️ Tải xuống'));

        await waitFor(() => {
            expect(downloadFile).toHaveBeenCalledWith(mockToken, 'secret.txt', 'password123');
            expect(screen.getByTestId('alert')).toHaveTextContent('Đã bắt đầu tải file thành công!');
        });
    })
}

function testExpiredFile() {
    it('handles expired file', async () => {
        (getFileByToken as jest.Mock).mockResolvedValue({
            fileName: 'expired.txt',
            status: 'expired',
            availableTo: new Date().toISOString()
        });

        render(<Page />);

        await waitFor(() => {
            expect(screen.getByText('🔴 Hết hạn')).toBeInTheDocument();
            expect(screen.getByText('🔴 File đã hết hạn.')).toBeInTheDocument();
            expect(screen.queryByText('⬇️ Tải xuống')).not.toBeInTheDocument();
        });
    })
}

function testPendingFile() {
    it('handles pending file with countdown', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        (getFileByToken as jest.Mock).mockResolvedValue({
            fileName: 'future.txt',
            status: 'pending',
            availableFrom: futureDate.toISOString()
        });

        render(<Page />);

        await waitFor(() => {
            expect(screen.getByText('🟡 Chưa mở')).toBeInTheDocument();
            expect(screen.getByText('🟡 Chưa đến thời gian mở khóa')).toBeInTheDocument();
        });
    })
}

function testFilePreview() {
    it('displays preview for supported files', async () => {
        (getFileByToken as jest.Mock).mockResolvedValue({
            fileName: 'image.png',
            mimeType: 'image/png',
            status: 'active'
        });
        (canPreviewFile as jest.Mock).mockReturnValue(true);
        (loadFilePreview as jest.Mock).mockResolvedValue('blob:http://localhost/image.png');

        render(<Page />);

        await waitFor(() => {
            expect(screen.getByText('Tải Preview')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Tải Preview'));

        await waitFor(() => {
            expect(loadFilePreview).toHaveBeenCalled();
            const img = screen.getByAltText('image.png');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'blob:http://localhost/image.png');
        });
    })
}

describe('Download Page', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ token: mockToken });
    jest.clearAllMocks();
    (formatFileSize as jest.Mock).mockImplementation((size) => `${size} B`);
    (canPreviewFile as jest.Mock).mockReturnValue(false);
  })

  testDownloadLoading()
  testDownloadInfo()
  testPasswordProtectedDownload()
  testExpiredFile()
  testPendingFile()
  testFilePreview()
})