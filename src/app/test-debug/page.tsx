'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TestDebugPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setTestResults(null);
    
    try {
      const response = await fetch('/api/debug/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'An error occurred during the test');
        return;
      }

      setTestResults(data);
    } catch (error) {
      console.error('Error during fetch test:', error);
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-white">Debug Fetch Test</h1>
        <Link 
          href="/"
          className="text-white hover:text-gray-200 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Test URL Fetching</h2>
          <form onSubmit={handleTest} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL to Test
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#8B2020] text-white px-4 py-2 rounded-md hover:bg-[#701A1A] disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test URL'}
            </button>
          </form>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[var(--primary)] rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600">Testing URL...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Test Results</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700">URL Information</h3>
                <div className="bg-gray-50 p-4 rounded-md mt-2">
                  <p className="text-gray-800 break-all">{testResults.url}</p>
                  <p className="text-gray-500 text-sm mt-1">Tested at: {testResults.timestamp}</p>
                </div>
              </div>
              
              {Object.entries(testResults.methods).map(([methodName, methodResult]: [string, any]) => (
                <div key={methodName} className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-700 capitalize mb-2">{methodName.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  
                  {methodResult.success ? (
                    <div>
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Success</span>
                        {methodResult.responseTime && (
                          <span className="text-gray-500 text-sm ml-2">{methodResult.responseTime}ms</span>
                        )}
                      </div>
                      
                      {methodResult.status && (
                        <p className="text-gray-600 text-sm mt-2">Status: {methodResult.status}</p>
                      )}
                      
                      {methodResult.contentLength !== undefined && (
                        <p className="text-gray-600 text-sm">Content Length: {methodResult.contentLength} characters</p>
                      )}
                      
                      {methodResult.preview && (
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm font-medium">Content Preview:</p>
                          <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1 overflow-x-auto">{methodResult.preview}</pre>
                        </div>
                      )}
                      
                      {/* URL Analysis specific fields */}
                      {methodName === 'urlAnalysis' && (
                        <div className="mt-3 space-y-1">
                          {Object.entries(methodResult).map(([key, value]: [string, any]) => (
                            key !== 'success' && (
                              <p key={key} className="text-gray-600 text-sm">
                                <span className="font-medium capitalize">{key}:</span> {String(value)}
                              </p>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Failed</span>
                      <p className="text-red-600 text-sm mt-2">{methodResult.error}</p>
                      {methodResult.stack && (
                        <details className="mt-2">
                          <summary className="text-gray-600 text-sm cursor-pointer">Show Error Stack</summary>
                          <pre className="bg-gray-50 p-2 rounded-md text-xs mt-1 overflow-x-auto text-red-800">{methodResult.stack}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 