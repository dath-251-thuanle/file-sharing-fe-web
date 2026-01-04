import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Page from '@/app/(public)/f/[token]/page'
import { getFileByToken, downloadFile, loadFilePreview, canPreviewFile, formatFileSize } from '@/lib/api/fileService'
import { useParams } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}))
jest.mock('@/lib/api/fileService')
jest.mock('@/components/ui/Alert', () => ({
    Alert: ({ message }: { message: string }) => <div data-testid="alert">{message}</div>
}))

describe('Download Page', () => {
  const mockToken = 'abc-123';
  
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ token: mockToken });
    jest.clearAllMocks();
    (formatFileSize as jest.Mock).mockImplementation((size) => `${size} B`);
    (canPreviewFile as jest.Mock).mockReturnValue(false); // Default no preview
  })

  it('renders loading state initially', () => {
    // Mock promise that never resolves immediately to check loading
    (getFileByToken as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<Page />);
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  })

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
        // Filename appears in header and card title
        const fileNames = screen.getAllByText('test.pdf');
        expect(fileNames.length).toBeGreaterThan(0);
        expect(screen.getByText('1024 B • application/pdf')).toBeInTheDocument();
        expect(screen.getByText('🟢 Khả dụng')).toBeInTheDocument();
    });
  })

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

    // Try download without password
    fireEvent.click(screen.getByText('⬇️ Tải xuống'));
    // Should show error (managed locally in component state passed to Alert?)
    // Actually the component sets Error state which renders Alert.
    await waitFor(() => {
         expect(screen.getByTestId('alert')).toHaveTextContent('Vui lòng nhập mật khẩu.');
    });

    // Enter password
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu...'), { target: { value: 'password123' } });
    
    // Download success
    (downloadFile as jest.Mock).mockResolvedValue(true);
    fireEvent.click(screen.getByText('⬇️ Tải xuống'));

    await waitFor(() => {
        expect(downloadFile).toHaveBeenCalledWith(mockToken, 'secret.txt', 'password123');
        expect(screen.getByTestId('alert')).toHaveTextContent('Đã bắt đầu tải file thành công!');
    });
  })

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

  it('handles pending file with countdown', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

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
})
