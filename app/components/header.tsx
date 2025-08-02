'use client';

import { useAuth } from '@/contexts/auth-context';
import { login, logout } from '@/lib/auth';

interface HeaderProps {
  title?: string;
  description?: string;
}

export default function Header({ 
  title = "Receiptify",
  description = "レシートをAIで解析して確定申告を効率化"
}: HeaderProps): JSX.Element {
  const { user, loading } = useAuth();

  return (
    <header className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.userDetails}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => login('google')}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Googleでログイン
              </button>
              <button
                onClick={() => login('aad')}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Microsoftでログイン
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
