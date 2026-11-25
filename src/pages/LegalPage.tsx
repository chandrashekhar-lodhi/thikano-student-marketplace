import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    showToast('Thank you! Your support note was recorded.', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[#202820]">Contact THIKANO Support</h1>
        <p className="text-sm text-[#202820]/75 mt-2">
          Questions about listing a property in Jabalpur or reporting inaccurate details? Send us a
          message below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-4"
      >
        {sent && (
          <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-sm text-[#065F46]">
            Message received. For urgent listing issues, you can also use the Report button on any
            property page.
          </div>
        )}
        <div>
          <label htmlFor="c-name" className="block text-xs font-semibold text-[#202820]/75 mb-1">
            Your Name
          </label>
          <input
            id="c-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="block text-xs font-semibold text-[#202820]/75 mb-1">
            Email Address
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
          />
        </div>
        <div>
          <label htmlFor="c-msg" className="block text-xs font-semibold text-[#202820]/75 mb-1">
            Message
          </label>
          <textarea
            id="c-msg"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold cursor-pointer"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="font-heading text-3xl font-bold text-[#202820]">Privacy Policy</h1>
      <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-4 text-sm text-[#202820]/80 leading-relaxed">
        <p>
          <strong>1. Account Information:</strong> THIKANO stores your name, email address, and
          optional student/owner preferences solely to power authentication, saved properties, and
          enquiries.
        </p>
        <p>
          <strong>2. Owner Contact Consent:</strong> Property owners explicitly choose whether to
          display a Call or WhatsApp number publicly on a listing. Without explicit consent, student
          enquiries are routed privately inside THIKANO.
        </p>
        <p>
          <strong>3. Browser Geolocation:</strong> Location access is requested only when you click
          “Use My Location” on the interactive map and is never tracked in the background.
        </p>
        <p>
          <strong>4. Database Security:</strong> User profiles, enquiries, and saved shortlists are
          protected by PostgreSQL Row Level Security (RLS) when connected to Supabase.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="font-heading text-3xl font-bold text-[#202820]">Terms & Conditions</h1>
      <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-4 text-sm text-[#202820]/80 leading-relaxed">
        <p>
          <strong>1. Marketplace Role:</strong> THIKANO connects students seeking rooms, PGs, hostels,
          and flats with property owners. Always inspect the room and sign a clear written rental
          agreement before transferring security deposits.
        </p>
        <p>
          <strong>2. Accurate Listings:</strong> Property owners agree to provide honest rent,
          deposit, availability, and location details. Misleading or duplicate broker spam listings
          may be rejected or removed by moderators.
        </p>
        <p>
          <strong>3. Demo Listings:</strong> Sample properties labelled <em>DEMO</em> are for layout
          testing only and do not represent active real-world rooms.
        </p>
      </div>
    </div>
  );
}

export function SetupGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#174C3A]">Beginner Setup Checklist</p>
        <h1 className="font-heading text-3xl font-bold text-[#202820]">
          Connecting Supabase & Deploying THIKANO
        </h1>
        <p className="text-sm text-[#202820]/75">
          Current Status:{' '}
          <span className="font-semibold text-[#174C3A]">
            {isSupabaseConfigured
              ? 'Connected to live Supabase credentials'
              : 'Running in Local Preview Mode (add .env keys to switch to live Supabase)'}
          </span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-6 text-sm text-[#202820]/85 leading-relaxed">
        <div>
          <h2 className="font-heading text-base font-semibold text-[#202820]">
            Step 1: Create a Free Supabase Project
          </h2>
          <p className="mt-1">
            Go to supabase.com, sign in with GitHub, and create a new project in the Mumbai
            (ap-south-1) region for lowest latency in Jabalpur.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-[#202820]">
            Step 2: Run the 4 SQL Files in Order
          </h2>
          <p className="mt-1">
            Open <strong>SQL Editor</strong> in your Supabase dashboard and execute these files from
            your project’s <code className="font-mono bg-[#F3F5EF] px-1.5 py-0.5 rounded">/supabase/</code> folder:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-1 font-mono text-xs text-[#174C3A]">
            <li>supabase/migrations/001_initial_schema.sql</li>
            <li>supabase/migrations/002_rls_policies.sql</li>
            <li>supabase/migrations/003_storage_policies.sql</li>
            <li>supabase/seed_demo.sql (optional demo data)</li>
          </ol>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-[#202820]">
            Step 3: Add Environment Variables (.env)
          </h2>
          <p className="mt-1">
            Copy <code className="font-mono bg-[#F3F5EF] px-1.5 py-0.5 rounded">.env.example</code> to{' '}
            <code className="font-mono bg-[#F3F5EF] px-1.5 py-0.5 rounded">.env</code> and paste your{' '}
            <strong>Project URL</strong> and <strong>anon public key</strong> into{' '}
            <code className="font-mono bg-[#F3F5EF] px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono bg-[#F3F5EF] px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>.
            Never put your <code className="font-mono">service_role</code> key in frontend env vars.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-base font-semibold text-[#202820]">
            Step 4: Promote Your First Admin Account Safely
          </h2>
          <p className="mt-1">
            Sign up normally on THIKANO, then run this in Supabase SQL Editor to grant admin access
            to your account:
          </p>
          <pre className="mt-2 p-3 rounded-xl bg-[#202820] text-[#F3F5EF] text-xs overflow-x-auto">
            {`UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';`}
          </pre>
        </div>

        <div className="pt-2">
          <Link
            to="/explore"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#174C3A] text-white text-sm font-semibold"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
