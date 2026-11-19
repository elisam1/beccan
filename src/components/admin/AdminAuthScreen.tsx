import { AlertCircle, ArrowLeft, KeyRound, Lock, ShieldAlert, Terminal } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, cmsApi } from '../../services/cmsApi';
import { SessionState } from '../../types/cms';
import { SchoolCrest } from '../common/SchoolCrest';

interface AdminAuthScreenProps {
  session: SessionState | null;
  connectionError: string | null;
  onAuthenticated: (nextSession: SessionState) => void;
  onRetrySession: () => void;
}

export function AdminAuthScreen({
  session,
  connectionError,
  onAuthenticated,
  onRetrySession,
}: AdminAuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const next = await cmsApi.login(username, password);
      onAuthenticated(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const next = await cmsApi.setupAdmin({
        setupToken,
        username,
        password,
        confirmPassword,
      });
      onAuthenticated(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Initial setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F213E] flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <SchoolCrest variant="gold" className="w-10 h-10" />
            <span className="font-serif text-3xl font-semibold text-[#FBF9F5]">
              Beccan School
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4B46E]">
            Administration Portal · Dodowa
          </p>
        </div>

        <div className="bg-[#FBF9F5] border border-[#E6DFD3] p-6 sm:p-8 shadow-xl">
          {connectionError ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[#9A3412]">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    PHP Backend Not Connected
                  </h1>
                  <p className="mt-2 text-sm text-[#333D4D] leading-relaxed">
                    {connectionError}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#F4EFE6] border border-[#E6DFD3] text-xs text-[#333D4D] space-y-2">
                <p className="font-semibold text-[#0F213E]">
                  Local PHP Backend Testing:
                </p>
                <p className="font-mono break-all">
                  php -S 127.0.0.1:8080 -t public_html
                </p>
                <p>
                  Then run Vite with{' '}
                  <span className="font-mono">
                    VITE_PHP_API_URL=http://127.0.0.1:8080 npm run dev
                  </span>{' '}
                  or deploy to PHP cPanel hosting.
                </p>
              </div>
              <button
                type="button"
                onClick={onRetrySession}
                className="w-full min-h-[44px] bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : session?.setupRequired && !session.webSetupEnabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Terminal className="w-5 h-5 text-[#8D6A26] shrink-0 mt-1" />
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    Initial Setup Required
                  </h1>
                  <p className="mt-2 text-sm text-[#333D4D] leading-relaxed">
                    No administrator account exists yet. For security, no
                    default password is shipped in source code.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F4EFE6] border border-[#E6DFD3] text-xs text-[#333D4D] space-y-2.5">
                <p className="font-semibold text-[#0F213E]">
                  Option A — Server CLI (SSH / Local):
                </p>
                <p className="font-mono bg-[#FFFFFF] p-2 border border-[#E6DFD3]">
                  php private/cli/setup-admin.php
                </p>
                <p className="font-semibold text-[#0F213E] pt-1">
                  Option B — cPanel File Manager (No SSH):
                </p>
                <p>
                  Create <span className="font-mono">private/config/setup-token.txt</span>{' '}
                  containing a private random string, then refresh this page to
                  complete the one-time setup form.
                </p>
              </div>

              <button
                type="button"
                onClick={onRetrySession}
                className="w-full min-h-[44px] bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer"
              >
                Check Setup Status
              </button>
            </div>
          ) : session?.setupRequired && session.webSetupEnabled ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="flex items-start gap-2.5 mb-2">
                <KeyRound className="w-5 h-5 text-[#8D6A26] shrink-0 mt-1" />
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    One-Time Administrator Setup
                  </h1>
                  <p className="mt-1 text-xs text-[#5B6472]">
                    Enter your private setup token from{' '}
                    <span className="font-mono">setup-token.txt</span> and
                    create the school’s administrator credentials.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 bg-[#FFF5F2] border border-[#E6B8A8] text-xs text-[#9A3412] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="setup-token"
                  className="block text-sm font-medium text-[#0F213E] mb-1"
                >
                  Private Setup Token
                </label>
                <input
                  id="setup-token"
                  type="password"
                  required
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm focus:border-[#0F213E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="setup-user"
                  className="block text-sm font-medium text-[#0F213E] mb-1"
                >
                  Administrator Username
                </label>
                <input
                  id="setup-user"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm focus:border-[#0F213E] focus:outline-none"
                  placeholder="e.g. beccan.admin"
                />
              </div>

              <div>
                <label
                  htmlFor="setup-pass"
                  className="block text-sm font-medium text-[#0F213E] mb-1"
                >
                  Strong Password (10+ chars, upper, lower, number)
                </label>
                <input
                  id="setup-pass"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm focus:border-[#0F213E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="setup-confirm"
                  className="block text-sm font-medium text-[#0F213E] mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="setup-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm focus:border-[#0F213E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Configuring...' : 'Create Administrator Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-[#8D6A26] shrink-0 mt-1" />
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    Administrator Sign In
                  </h1>
                  <p className="mt-1 text-xs text-[#5B6472]">
                    Authorised Beccan School management access only.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 bg-[#FFF5F2] border border-[#E6B8A8] text-xs text-[#9A3412] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-username"
                  className="block text-sm font-medium text-[#0F213E] mb-1.5"
                >
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-[#0F213E] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D4C8B4] text-sm text-[#141B29] focus:border-[#0F213E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-[#0F213E] text-[#FBF9F5] text-sm font-medium tracking-wide hover:bg-[#172E54] transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-[#D4DCE8] hover:text-[#FBF9F5] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Beccan School Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
