'use client';

import { useState } from 'react';
import Header from './components/header';
import ThemeToggle from './components/theme-toggle';

export default function Home() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/hello?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setResponse(data.message);
    } catch (error) {
      setResponse('Error: Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-end space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Header />

      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
              PWA Starter Template
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Next.js + Azure Static Web Apps + Azure Functions
            </p>
          </div>

          <div className="mt-16">
            <div className="mx-auto max-w-md">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Enter your name"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Say Hello'}
                </button>
              </form>

              {response && (
                <div className="mt-8 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
                  <p className="text-center text-lg font-medium text-gray-900 dark:text-gray-100">
                    {response}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}