import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ReceiptUploader from '../../app/components/receipt-uploader';
import { AuthProvider } from '../../app/contexts/auth-context';
import * as auth from '../../app/lib/auth';

// Mock auth functions
jest.mock('../../app/lib/auth', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getUserInfo: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockUser = {
  userDetails: 'test@example.com',
  userRoles: ['user'],
  clientPrincipal: {
    userId: '123',
    userDetails: 'test@example.com',
    identityProvider: 'google',
    userRoles: ['user'],
    claims: [],
  },
};

const ReceiptUploaderWithProvider = ({ ...props }: any) => (
  <AuthProvider>
    <ReceiptUploader {...props} />
  </AuthProvider>
);

describe('ReceiptUploader', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should show login message when user is not authenticated', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    expect(screen.getByText('レシートをアップロードするにはログインしてください')).toBeInTheDocument();
  });

  it('should show upload interface when user is authenticated', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    // Wait for auth to complete
    await waitFor(() => {
      expect(screen.getByText('レシート画像をアップロード')).toBeInTheDocument();
    });

    expect(screen.getByText('またはファイルをドラッグ&ドロップ')).toBeInTheDocument();
    expect(screen.getByText('PNG、JPG、JPEG対応（最大10MB、複数選択可）')).toBeInTheDocument();
  });

  it('should render file input with correct attributes', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  it('should handle file upload success', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sasUrl: 'https://test.blob.core.windows.net/container/file?sas=token',
          receiptId: 'receipt-123',
          blobUrl: 'https://test.blob.core.windows.net/container/file',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      
      // Create a mock file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/issue-sas-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith([
        {
          receiptId: 'receipt-123',
          blobUrl: 'https://test.blob.core.windows.net/container/file',
          fileName: 'test.jpg',
        },
      ]);
    });
  });

  it('should handle non-image file error', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      
      // Create a non-image file
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('test.txt は画像ファイルではありません');
    });
  });

  it('should handle large file error', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      
      // Create a large file (over 10MB)
      const file = new File(['test'], 'large.jpg', { 
        type: 'image/jpeg',
      });
      
      // Mock file size to be over 10MB
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
      
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('large.jpg のサイズが大きすぎます (最大10MB)');
    });
  });

  it('should handle SAS token fetch error', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    // Mock failed SAS token response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    });

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('SASトークンの取得に失敗しました: Unauthorized');
    });
  });

  it('should show loading state during upload', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    // Mock slow API response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            sasUrl: 'https://test.blob.core.windows.net/container/file?sas=token',
            receiptId: 'receipt-123',
            blobUrl: 'https://test.blob.core.windows.net/container/file',
          }),
        }), 100)
      )
    );

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    await waitFor(() => {
      const fileInput = screen.getByLabelText('レシート画像をアップロード');
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    // Should show loading state
    expect(screen.getByText('アップロード中...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should handle drag and drop events', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <ReceiptUploaderWithProvider
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );
    });

    const dropZone = await screen.findByText('レシート画像をアップロード').then(el => el.closest('div[onDragEnter]'));
    
    if (dropZone) {
      // Test drag enter
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('border-indigo-500');

      // Test drag leave
      fireEvent.dragLeave(dropZone);
      expect(dropZone).toHaveClass('border-gray-300');
    }
  });
});