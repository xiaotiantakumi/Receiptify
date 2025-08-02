import { render, screen, fireEvent } from '@testing-library/react';
import ResultsTable from '../../app/components/results-table';

const mockReceiptResults = [
  {
    receiptId: '1',
    fileName: 'receipt1.jpg',
    status: 'completed' as const,
    receiptImageUrl: 'blob:receipt1',
    items: [
      {
        name: 'コーヒー',
        price: 300,
        category: '飲食',
        accountSuggestion: '会議費',
        taxNote: '軽減税率対象',
      },
      {
        name: 'サンドイッチ',
        price: 500,
        category: '飲食',
        accountSuggestion: '会議費',
        taxNote: '軽減税率対象',
      },
    ],
    totalAmount: 800,
    receiptDate: '2024-01-15',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    receiptId: '2',
    fileName: 'receipt2.jpg',
    status: 'processing' as const,
    receiptImageUrl: 'blob:receipt2',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    receiptId: '3',
    fileName: 'receipt3.jpg',
    status: 'failed' as const,
    receiptImageUrl: 'blob:receipt3',
    errorMessage: 'テキストが読み取れませんでした',
    createdAt: '2024-01-15T11:30:00Z',
  },
];

describe('ResultsTable', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state', () => {
    render(
      <ResultsTable
        results={[]}
        loading={true}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show empty state when no results', () => {
    render(
      <ResultsTable
        results={[]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('まだレシートがアップロードされていません')).toBeInTheDocument();
    expect(screen.getByText('上のフォームからレシート画像をアップロードして始めましょう')).toBeInTheDocument();
  });

  it('should render results with correct count', () => {
    render(
      <ResultsTable
        results={mockReceiptResults}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('解析結果 (3件)')).toBeInTheDocument();
  });

  it('should render refresh button and handle click', () => {
    render(
      <ResultsTable
        results={mockReceiptResults}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText('更新');
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should render completed result correctly', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[0]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('receipt1.jpg')).toBeInTheDocument();
    expect(screen.getByText('✓ 完了')).toBeInTheDocument();
    expect(screen.getByText('レシート日付: 2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('合計: ¥800')).toBeInTheDocument();
    
    // Check items table
    expect(screen.getByText('コーヒー')).toBeInTheDocument();
    expect(screen.getByText('¥300')).toBeInTheDocument();
    expect(screen.getByText('会議費')).toBeInTheDocument();
    expect(screen.getByText('軽減税率対象')).toBeInTheDocument();
    
    expect(screen.getByText('サンドイッチ')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
  });

  it('should render processing result correctly', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[1]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('receipt2.jpg')).toBeInTheDocument();
    expect(screen.getByText('解析中')).toBeInTheDocument();
    
    // Should show processing spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render failed result correctly', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[2]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('receipt3.jpg')).toBeInTheDocument();
    expect(screen.getByText('✗ 失敗')).toBeInTheDocument();
    expect(screen.getByText('エラー: テキストが読み取れませんでした')).toBeInTheDocument();
  });

  it('should handle CSV export', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[0]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    const csvButton = screen.getByText('CSVダウンロード');
    expect(csvButton).toBeInTheDocument();

    fireEvent.click(csvButton);

    // Check that URL.createObjectURL was called
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    
    // Check that a link element was created and manipulated
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('should format currency correctly', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[0]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('¥300')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
    expect(screen.getByText('¥800')).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(
      <ResultsTable
        results={[mockReceiptResults[0]]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    // Date formatting will depend on locale, but should contain year/month/day/time
    const dateElement = screen.getByText(/2024/);
    expect(dateElement).toBeInTheDocument();
  });

  it('should handle results without total amount or receipt date', () => {
    const resultWithoutData = {
      ...mockReceiptResults[0],
      totalAmount: undefined,
      receiptDate: undefined,
    };

    render(
      <ResultsTable
        results={[resultWithoutData]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('レシート日付: 不明')).toBeInTheDocument();
    expect(screen.getByText('合計: 不明')).toBeInTheDocument();
  });

  it('should handle items without account suggestion or tax note', () => {
    const resultWithMinimalItems = {
      ...mockReceiptResults[0],
      items: [
        {
          name: 'シンプル商品',
          price: 100,
        },
      ],
    };

    render(
      <ResultsTable
        results={[resultWithMinimalItems]}
        loading={false}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('シンプル商品')).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    
    // Account suggestion and tax note cells should be empty but present
    const tableCells = screen.getAllByRole('cell');
    expect(tableCells).toHaveLength(8); // 4 headers + 4 data cells
  });
});