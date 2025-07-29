'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-orange-400 text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-white/60 mb-6">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="bg-green-400 hover:bg-green-300 text-slate-900 rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Go home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}