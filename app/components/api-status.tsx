'use client';

import { useState, useEffect } from 'react';

export default function ApiStatus() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setApiStatus('healthy');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
      setLastChecked(new Date());
    };

    // 初回チェック
    checkHealth();

    // 30秒ごとにヘルスチェック
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (apiStatus === 'checking') {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      apiStatus === 'healthy' 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        apiStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
      } animate-pulse`} />
      <span>
        API: {apiStatus === 'healthy' ? '正常' : 'エラー'}
      </span>
    </div>
  );
}