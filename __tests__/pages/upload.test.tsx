import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UploadPage from '@/app/upload/page'
import { uploadFile } from '@/lib/api/file'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { _isLoggedIn } from '@/lib/api/helper'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/file')
jest.mock('sonner')
jest.mock('@/lib/api/helper', () => ({
  _isLoggedIn: jest.fn(),
}))

function testUploadFormRendering() {
    it('renders upload form correctly', () => {
        render(<UploadPage />);
        expect(screen.getByText('Upload File Bảo Mật')).toBeInTheDocument();
        expect(screen.getByText('1. Chọn file')).toBeInTheDocument();
    })
}

function testFileSelection(mockFile: File) {
    it('handles file selection', async () => {
        render(<UploadPage />);
        
        const input = document.getElementById('fileInput') as HTMLInputElement;

        fireEvent.change(input, { target: { files: [mockFile] } });

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });
    })
}

function testMissingFileValidation() {
    it('validates missing file', async () => {
        render(<UploadPage />);
        
        const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Vui lòng chọn một file để upload.');
        });
    })
}

function testPasswordValidation(mockFile: File) {
    it('validates password length', async () => {
        render(<UploadPage />);
        const input = document.getElementById('fileInput') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [mockFile] } });

        const passwordLabels = screen.getAllByText('Bảo vệ bằng mật khẩu');
        const passwordLabel = passwordLabels[1]; 
        
        const passwordToggle = passwordLabel.closest('div.flex-1')?.nextElementSibling as HTMLButtonElement;
        fireEvent.click(passwordToggle);

        const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu bảo vệ (tối thiểu 6 ký tự)');
        fireEvent.change(passwordInput, { target: { value: '123' } });

        const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Mật khẩu phải có tối thiểu 6 ký tự.');
        });
    })
}

function testSuccessfulUpload(mockFile: File) {
    it('handles successful upload', async () => {
        (uploadFile as jest.Mock).mockResolvedValue({
            success: true,
            message: 'File uploaded',
            file: {
                fileName: 'test.txt',
                shareToken: 'token123',
                shareLink: 'http://localhost/f/token123'
            }
        });

        render(<UploadPage />);
        const input = document.getElementById('fileInput') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [mockFile] } });

        const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(uploadFile).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Upload thành công!');
            expect(screen.getByText('Upload thành công!')).toBeInTheDocument();
            expect(screen.getByText('token123')).toBeInTheDocument();
        });
    })
}

function testUploadError(mockFile: File) {
    it('handles upload error', async () => {
        (uploadFile as jest.Mock).mockRejectedValue(new Error('Network Error'));

        render(<UploadPage />);
        const input = document.getElementById('fileInput') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [mockFile] } });

        const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Network Error');
        });
    })
}

describe('Upload Page', () => {
  const mockRouter = { push: jest.fn() }
  const mockFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
    (_isLoggedIn as jest.Mock).mockReturnValue(true);
  })

  testUploadFormRendering()
  testFileSelection(mockFile)
  testMissingFileValidation()
  testPasswordValidation(mockFile)
  testSuccessfulUpload(mockFile)
  testUploadError(mockFile)
})