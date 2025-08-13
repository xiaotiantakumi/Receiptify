'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UploadResult {
  receiptId: string;
  blobUrl: string;
  fileName: string;
}

interface ReceiptUploaderProps {
  onUploadComplete: (results: UploadResult[]) => void;
  onUploadError: (error: string) => void;
}

export default function ReceiptUploader({ onUploadComplete, onUploadError }: ReceiptUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadFiles = useCallback(async (files: FileList) => {
    if (!user) {
      onUploadError('ログインが必要です');
      return;
    }

    setUploading(true);
    const results: UploadResult[] = [];

    try {
      for (const file of Array.from(files)) {
        // ファイルタイプチェック
        if (!file.type.startsWith('image/')) {
          onUploadError(`${file.name} は画像ファイルではありません`);
          continue;
        }

        // ファイルサイズチェック (10MB制限)
        if (file.size > 10 * 1024 * 1024) {
          onUploadError(`${file.name} のサイズが大きすぎます (最大10MB)`);
          continue;
        }

        // SASトークンを取得
        const tokenResponse = await fetch('/api/issue-sas-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!tokenResponse.ok) {
          throw new Error(`SASトークンの取得に失敗しました: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();

        // Blob Storageに直接アップロード
        const uploadResponse = await fetch(tokenData.sasUrl, {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`ファイルのアップロードに失敗しました: ${uploadResponse.statusText}`);
        }

        results.push({
          receiptId: tokenData.receiptId,
          blobUrl: tokenData.blobUrl,
          fileName: file.name,
        });
      }

      onUploadComplete(results);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      onUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [user, onUploadComplete, onUploadError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  }, [uploadFiles]);

  if (!user) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 mb-4">レシートをアップロードするにはログインしてください</p>
        <a
          href="/.auth/login/aad"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          開発用ログイン
        </a>
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
          : 'border-gray-300 dark:border-gray-600'
      } ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-400'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        id="file-upload"
        type="file"
        className="sr-only"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        disabled={uploading}
      />
      
      {uploading ? (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">アップロード中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              />
            </svg>
          </div>
          <div>
            <label
              htmlFor="file-upload"
              className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              レシート画像をアップロード
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              またはファイルをドラッグ&ドロップ
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PNG、JPG、JPEG対応（最大10MB、複数選択可）
          </p>
        </div>
      )}
    </div>
  );
}