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
          containerName: 'receipts',
          directoryPrefix: 'user123/2025',
          fiscalYear: 2025,
          sasToken: 'sv=2022-11-02&ss=b&srt=sco&sp=rwdlacupiytfx&se=2025-08-14T02:37:36Z&st=2025-08-14T01:37:36Z&spr=https&sig=example',
          containerUrl: 'https://test.blob.core.windows.net/receipts',
          expiresAt: '2025-08-14T02:37:36.455Z',
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
      expect(mockOnUploadComplete).toHaveBeenCalledTimes(1);
      const callArgs = mockOnUploadComplete.mock.calls[0][0];
      
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toMatchObject({
        fileName: 'test.jpg',
      });
      
      // UUIDの形式を確認（具体的な値ではなく形式のみ）
      expect(callArgs[0].receiptId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      
      // blob URLの形式を確認
      expect(callArgs[0].blobUrl).toMatch(new RegExp(
        `^https://test\\.blob\\.core\\.windows\\.net/receipts/user123/2025/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/receipt-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.jpg$`
      ));
    });
  });

  it('should handle non-image file error', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    // ファイル検証はSASトークン取得前に実行されるため、モックは不要

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

    // SASトークン取得のAPI呼び出しは実行されないことを確認
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle large file error', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    // ファイルサイズ検証はSASトークン取得前に実行されるため、モックは不要

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

    // SASトークン取得のAPI呼び出しは実行されないことを確認
    expect(mockFetch).not.toHaveBeenCalled();
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
            containerName: 'receipts',
            directoryPrefix: 'user123/2025',
            fiscalYear: 2025,
            sasToken: 'sv=2022-11-02&ss=b&srt=sco&sp=rwdlacupiytfx&se=2025-08-14T02:37:36Z&st=2025-08-14T01:37:36Z&spr=https&sig=example',
            containerUrl: 'https://test.blob.core.windows.net/receipts',
            expiresAt: '2025-08-14T02:37:36.455Z',
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