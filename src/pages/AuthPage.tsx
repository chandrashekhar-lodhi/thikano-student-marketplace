import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, signUp } = useAuth();
  const { showToast } = useToast();

  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
  const initialRole = searchParams.get('role') === 'owner' ? 'owner' : 'student';
  const nextPath = searchParams.get('next');

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<'student' | 'owner'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paramMode = (searchParams.get('mode') as AuthMode) || 'login';
    setMode(paramMode);
    if (searchParams.get('role') === 'owner') setRole('owner');
  }, [searchParams]);

  useEffect(() => {
    if (user && mode !== 'reset') {
      if (nextPath) {
        navigate(nextPath, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, mode, nextPath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const loggedIn = await login(email, password);
        showToast(`Welcome back, ${loggedIn.full_name}!`, 'success');
      } else if (mode === 'signup') {
        const res = await signUp({ full_name: fullName, email, password, role });
        if (res.needsEmailVerification) {
          setInfoMessage(
            'Account created! Please check your email inbox and click the verification link before logging in.'
          );
        } else {
          showToast('Your THIKANO account is ready!', 'success');
        }
      } else if (mode === 'forgot') {
        const msg = await authService.requestPasswordReset(
          email,
          !isSupabaseConfigured && newPassword ? newPassword : undefined
        );
        setInfoMessage(msg);
      } else if (mode === 'reset') {
        await authService.updatePassword(newPassword);
        showToast('Password updated successfully. You can now continue.', 'success');
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillPreview = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setSubmitting(true);
    try {
      const loggedIn = await login(demoEmail, demoPassword);
      showToast(`Signed in as ${loggedIn.full_name}`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-2xl border border-[#202820]/10 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#202820]">
            {mode === 'login'
              ? 'Log in to THIKANO'
              : mode === 'signup'
              ? 'Create your THIKANO account'
              : mode === 'forgot'
              ? 'Forgot Password'
              : 'Set a New Password'}
          </h1>
          <p className="text-sm text-[#202820]/70 mt-1">
            {mode === 'login'
              ? 'Access saved rooms, enquiries, or manage your Jabalpur listings.'
              : mode === 'signup'
              ? 'Join as a student searching for stays or a property owner listing vacant rooms.'
              : 'Recover access to your account safely.'}
          </p>
        </div>

        {/* Mode Tabs */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F5EF]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                mode === 'login' ? 'bg-white text-[#174C3A] shadow-sm' : 'text-[#202820]/70'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                mode === 'signup' ? 'bg-white text-[#174C3A] shadow-sm' : 'text-[#202820]/70'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-sm text-[#065F46]">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <p className="block text-xs font-semibold text-[#202820]/75 mb-1.5">
                  I am joining as
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold cursor-pointer ${
                      role === 'student'
                        ? 'border-[#174C3A] bg-[#174C3A] text-white'
                        : 'border-[#202820]/15 bg-[#F3F5EF] text-[#202820]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold cursor-pointer ${
                      role === 'owner'
                        ? 'border-[#174C3A] bg-[#174C3A] text-white'
                        : 'border-[#202820]/15 bg-[#F3F5EF] text-[#202820]'
                    }`}
                  >
                    Property Owner
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
                />
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
          )}

          {(mode === 'reset' || (mode === 'forgot' && !isSupabaseConfigured)) && (
            <div>
              <label htmlFor="auth-new-pw" className="block text-xs font-semibold text-[#202820]/75 mb-1">
                New Password {!isSupabaseConfigured && mode === 'forgot' ? '(Optional for Preview Reset)' : ''}
              </label>
              <input
                id="auth-new-pw"
                type="password"
                required={mode === 'reset'}
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3F5EF] border border-[#202820]/10 text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#174C3A] text-white text-sm font-semibold hover:bg-[#11392B] transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting
              ? 'Please wait…'
              : mode === 'login'
              ? 'Log In'
              : mode === 'signup'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Send Reset Instructions'
              : 'Update Password'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-[#202820]/70 pt-2">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
              }}
              className="text-[#174C3A] font-semibold hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-[#174C3A] font-semibold hover:underline cursor-pointer"
            >
              Back to Login
            </button>
          )}
        </div>

        {/* Preview-mode quick tester accounts (hidden automatically when live Supabase is connected) */}
        {!isSupabaseConfigured && (
          <div className="pt-5 border-t border-[#202820]/10 space-y-2.5">
            <p className="text-xs font-semibold text-[#202820]/75">
              Local Preview Quick-Test Accounts (Supabase not connected yet)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFillPreview('student@thikano.demo', 'student123')}
                className="py-2 px-3 rounded-lg bg-[#F3F5EF] hover:bg-[#E4EAE0] text-xs font-semibold text-[#174C3A] cursor-pointer"
              >
                Test as Student
              </button>
              <button
                type="button"
                onClick={() => quickFillPreview('owner@thikano.demo', 'owner123')}
                className="py-2 px-3 rounded-lg bg-[#F3F5EF] hover:bg-[#E4EAE0] text-xs font-semibold text-[#174C3A] cursor-pointer"
              >
                Test as Owner
              </button>
              <button
                type="button"
                onClick={() => quickFillPreview('admin@thikano.demo', 'admin123')}
                className="py-2 px-3 rounded-lg bg-[#F3F5EF] hover:bg-[#E4EAE0] text-xs font-semibold text-[#174C3A] cursor-pointer"
              >
                Test as Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
