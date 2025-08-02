'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/header';
import ThemeToggle from './components/theme-toggle';
import ReceiptUploader from './components/receipt-uploader';
import ResultsTable from './components/results-table';
import UpdatePrompt from './components/update-prompt';
import { AuthProvider } from './contexts/auth-context';
import { useServiceWorker } from './hooks/use-service-worker';

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

interface UploadResult {
  receiptId: string;
  blobUrl: string;
  fileName: string;
}

export default function Home() {
  const [results, setResults] = useState<ReceiptResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { requestNotificationPermission } = useServiceWorker();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/get-receipt-results');
      
      if (!response.ok) {
        if (response.status === 401) {
          // 認証が必要な場合は空の結果を返す
          setResults([]);
          setIsAuthenticated(false);
          return;
        }
        if (response.status === 404) {
          // 開発環境でAPIが起動していない場合
          setResults([]);
          setIsAuthenticated(false);
          return;
        }
        throw new Error(`Failed to fetch results: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults(data.results || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUploadComplete = useCallback((uploadResults: UploadResult[]) => {
    // アップロード完了時に新しい処理中のレシートを結果リストに追加
    const newResults: ReceiptResult[] = uploadResults.map(upload => ({
      receiptId: upload.receiptId,
      fileName: upload.fileName,
      status: 'processing' as const,
      receiptImageUrl: upload.blobUrl,
      createdAt: new Date().toISOString()
    }));
    
    setResults(prev => [...newResults, ...prev]);
    
    // 少し遅延してから結果を再取得（処理完了を確認するため）
    setTimeout(fetchResults, 2000);
  }, [fetchResults]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchResults();
  }, [fetchResults]);

  // 初回ロード時に結果を取得
  useEffect(() => {
    if (!initialLoadDone) {
      setInitialLoadDone(true);
      fetchResults();
      // 通知権限をリクエスト
      requestNotificationPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 定期的に結果を更新（認証済みかつ処理中のアイテムがある場合）
  useEffect(() => {
    const hasProcessing = results.some(result => result.status === 'processing');
    
    if (isAuthenticated && hasProcessing) {
      const interval = setInterval(fetchResults, 5000); // 5秒ごと
      return () => clearInterval(interval);
    }
  }, [results, fetchResults, isAuthenticated]);

  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col">
        {/* Top navigation bar */}
        <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-end space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Header />

            {error && (
              <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex">
                  <div className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Upload Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  レシートアップロード
                </h2>
                <ReceiptUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />
              </div>

              {/* Results Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <ResultsTable
                  results={results}
                  loading={loading}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          </div>
        </div>
        
        <UpdatePrompt />
      </main>
    </AuthProvider>
  );
}