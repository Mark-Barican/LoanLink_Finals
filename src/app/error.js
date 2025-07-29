'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
          <p className="text-white/60 mb-6">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="bg-green-400 hover:bg-green-300 text-slate-900 rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}