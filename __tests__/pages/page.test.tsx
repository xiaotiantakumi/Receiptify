import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../../app/page';

// Mock all the components
jest.mock('../../app/components/header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../app/components/theme-toggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

jest.mock('../../app/components/receipt-uploader', () => {
  return function MockReceiptUploader({ onUploadComplete, onUploadError }: any) {
    return (
      <div data-testid="receipt-uploader">
        <button
          onClick={() => onUploadComplete([
            { receiptId: '123', blobUrl: 'blob://test', fileName: 'test.jpg' }
          ])}
        >
          Upload Complete
        </button>
        <button onClick={() => onUploadError('Upload failed')}>
          Upload Error
        </button>
      </div>
    );
  };
});

jest.mock('../../app/components/results-table', () => {
  return function MockResultsTable({ results, loading, onRefresh }: any) {
    return (
      <div data-testid="results-table">
        <div>Results: {results.length}</div>
        <div>Loading: {loading.toString()}</div>
        <button onClick={onRefresh}>Refresh</button>
      </div>
    );
  };
});

jest.mock('../../app/components/update-prompt', () => {
  return function MockUpdatePrompt() {
    return <div data-testid="update-prompt">Update Prompt</div>;
  };
});

jest.mock('../../app/contexts/auth-context', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../app/hooks/use-service-worker', () => ({
  useServiceWorker: () => ({
    requestNotificationPermission: jest.fn(),
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render all main components', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-uploader')).toBeInTheDocument();
    expect(screen.getByTestId('results-table')).toBeInTheDocument();
    expect(screen.getByTestId('update-prompt')).toBeInTheDocument();
  });

  it('should render main navigation and upload sections', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText('レシートアップロード')).toBeInTheDocument();
  });

  it('should fetch results on initial load', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [
        { receiptId: '1', fileName: 'test.jpg', status: 'completed' }
      ] }),
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/get-receipt-results?limit=50&offset=0');
    });
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should handle 401 authentication error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await act(async () => {
      render(<Home />);
    });

    // Should not show error for 401, just clear results
    expect(screen.queryByText(/データの取得に失敗しました/)).not.toBeInTheDocument();
  });

  it('should handle 404 API not available error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await act(async () => {
      render(<Home />);
    });

    // Should not show error for 404, just clear results
    expect(screen.queryByText(/データの取得に失敗しました/)).not.toBeInTheDocument();
  });

  it('should handle upload complete', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    const uploadCompleteButton = screen.getByText('Upload Complete');
    fireEvent.click(uploadCompleteButton);

    await waitFor(() => {
      expect(screen.getByText('Results: 1')).toBeInTheDocument();
    });
  });

  it('should handle upload error', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    const uploadErrorButton = screen.getByText('Upload Error');
    fireEvent.click(uploadErrorButton);

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('should dismiss error message when close button is clicked', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    // Trigger an error
    const uploadErrorButton = screen.getByText('Upload Error');
    fireEvent.click(uploadErrorButton);

    expect(screen.getByText('Upload failed')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Upload failed')).not.toBeInTheDocument();
  });

  it('should handle refresh', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await act(async () => {
      render(<Home />);
    });

    // Clear previous fetch calls
    mockFetch.mockClear();

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/get-receipt-results?limit=50&offset=0');
    });
  });
});