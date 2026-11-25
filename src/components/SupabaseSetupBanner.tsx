import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, X } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export function SupabaseSetupBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (isSupabaseConfigured || dismissed) return null;

  return (
    <div className="bg-[#174C3A] text-white text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Database className="w-4 h-4 text-[#E9A45B] shrink-0" aria-hidden="true" />
          <p className="truncate sm:whitespace-normal">
            <span className="font-semibold">Local Preview Mode:</span> Showing clearly labelled DEMO data.
            Connect your Supabase project keys in <code className="font-mono text-[#E9A45B]">.env</code> when ready.{' '}
            <Link to="/setup-guide" className="underline font-semibold text-[#E9A45B] hover:text-white">
              Open Setup Guide
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss setup notice"
          className="p-1 rounded hover:bg-white/10 shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
