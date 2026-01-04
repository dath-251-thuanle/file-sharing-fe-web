import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UploadPage from '@/app/upload/page'
import { uploadFile, ApiError } from '@/lib/api/file'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { _isLoggedIn } from '@/lib/api/helper'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/lib/api/file')
jest.mock('sonner')
jest.mock('@/lib/api/helper', () => ({
  _isLoggedIn: jest.fn(),
}))

describe('Upload Page', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
    (_isLoggedIn as jest.Mock).mockReturnValue(true);
  })

  const mockFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });

  it('renders upload form correctly', () => {
    render(<UploadPage />);
    expect(screen.getByText('Upload File Bảo Mật')).toBeInTheDocument();
    expect(screen.getByText('1. Chọn file')).toBeInTheDocument();
  })

  it('handles file selection', async () => {
    render(<UploadPage />);
    const fileInput = screen.getByLabelText(/Kéo thả file vào đây/i); // Label wraps input
    
    // We need to target the input itself. 
    // The label has htmlFor="fileInput", and the input has id="fileInput"
    // However, the input is hidden. strict-mode might complain about visibility if using userEvent, 
    // but fireEvent should work on hidden inputs.
    // Let's find by ID directly or by the label text association.
    const input = document.getElementById('fileInput') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  })

  it('validates missing file', async () => {
    render(<UploadPage />);
    
    const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Vui lòng chọn một file để upload.');
    });
  })

  it('validates password length', async () => {
    render(<UploadPage />);
    const input = document.getElementById('fileInput') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [mockFile] } });

    // Enable password
    const toggleBtns = screen.getAllByRole('button', { pressed: false });
    // Finding the specific toggle for password is tricky without specific label text association in the component structure provided.
    // Looking at component: "Bảo vệ bằng mật khẩu" is followed by the button.
    // Let's find the button near "Bảo vệ bằng mật khẩu"
    // Actually, the button has `aria-pressed`.
    // The code structure:
    // <div className="flex-1">...<Lock /> Bảo vệ bằng mật khẩu...</label> ... <button ... onClick={setPasswordEnabled} ...>
    
    // We can use the text to find the container, then the button.
    const passwordLabels = screen.getAllByText('Bảo vệ bằng mật khẩu');
    // The second one is likely the form label (first is summary header)
    const passwordLabel = passwordLabels[1]; 
    
    // The button is a sibling of the parent div's parent div? No, flex container.
    // Container: flex items-start justify-between
    //   Div (flex-1) -> Label
    //   Button
    const passwordToggle = passwordLabel.closest('div.flex-1')?.nextElementSibling as HTMLButtonElement;
    fireEvent.click(passwordToggle);

    // Enter short password
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu bảo vệ (tối thiểu 6 ký tự)');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /Upload ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Mật khẩu phải có tối thiểu 6 ký tự.');
    });
  })

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
})
