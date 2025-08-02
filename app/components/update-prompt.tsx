'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';

export default function UpdatePrompt() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            アップデートが利用可能です
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            新しいバージョンが利用可能です。更新してください。
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={updateServiceWorker}
              className="text-xs bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              更新
            </button>
            <button
              onClick={() => {/* 閉じる処理 */}}
              className="text-xs text-blue-100 hover:text-white px-3 py-1 rounded transition-colors"
            >
              後で
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}