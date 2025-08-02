'use client';

interface ReceiptItem {
  name: string;
  price: number;
  category?: string;
  accountSuggestion?: string;
  taxNote?: string;
}

interface ReceiptResult {
  receiptId: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  receiptImageUrl?: string;
  items?: ReceiptItem[];
  totalAmount?: number;
  receiptDate?: string;
  errorMessage?: string;
  createdAt: string;
}

interface ResultsTableProps {
  results: ReceiptResult[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ResultsTable({ results, loading, onRefresh }: ResultsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportCSV = (items: ReceiptItem[], fileName: string) => {
    const csvHeaders = ['品目名', '金額', '勘定科目', '税務上の注意点'];
    const csvRows = items.map(item => [
      item.name,
      item.price.toString(),
      item.accountSuggestion || '',
      item.taxNote || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName.replace(/\.[^/.]+$/, '')}_解析結果.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin mr-1"></div>
            解析中
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ 完了
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            ✗ 失敗
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-500 dark:text-gray-400">データを読み込み中...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 64 64">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6l2 7h30l4-7H15M21 21v6a2 2 0 002 2h18a2 2 0 002-2v-6M15 21h34M27 33h10"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          まだレシートがアップロードされていません
        </p>
        <p className="text-sm text-gray-400">
          上のフォームからレシート画像をアップロードして始めましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          解析結果 ({results.length}件)
        </h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          更新
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.receiptId}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {result.fileName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(result.createdAt)}
                </p>
              </div>
              {getStatusBadge(result.status)}
            </div>

            {result.status === 'failed' && result.errorMessage && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">
                  エラー: {result.errorMessage}
                </p>
              </div>
            )}

            {result.status === 'completed' && result.items && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    レシート日付: {result.receiptDate || '不明'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    合計: {result.totalAmount ? formatCurrency(result.totalAmount) : '不明'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleExportCSV(result.items || [], result.fileName)}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CSVダウンロード</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            品目
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            金額
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            勘定科目
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            税務上の注意点
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="py-2 px-3">
                              {item.accountSuggestion && (
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                                  {item.accountSuggestion}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">
                              {item.taxNote && (
                                <div className="max-w-xs">
                                  <span className="inline-block bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                                    {item.taxNote}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}