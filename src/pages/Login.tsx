import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DayFlowLogo } from '../components/DayFlowLogo';
import { isEmailNotConfirmedError, EMAIL_NOT_CONFIRMED_MESSAGE } from '../utils/authHelpers';

export const LoginPage: React.FC = () => {
  const { login, resetPassword, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email confirmation state
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Prefill email if redirected from SignUp
  useEffect(() => {
    const navState = location.state as { email?: string; unconfirmed?: boolean } | null;
    if (navState?.email) {
      setEmail(navState.email);
    }
    if (navState?.unconfirmed) {
      setIsEmailNotConfirmed(true);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsEmailNotConfirmed(false);
    setResendStatus('idle');
    setResendMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await login(email.trim(), password);
      if (error) {
        if (error.isEmailNotConfirmed || isEmailNotConfirmedError(error)) {
          // Explicitly treat unconfirmed email with special confirmation prompt
          setIsEmailNotConfirmed(true);
          setErrorMessage(null);
        } else {
          setErrorMessage(error.message || 'Invalid login credentials. Please check your email and password.');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (isEmailNotConfirmedError(err)) {
        setIsEmailNotConfirmed(true);
        setErrorMessage(null);
      } else {
        const msg =
          err instanceof Error ? err.message : 'Network failure. Please check your internet connection.';
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResendStatus('error');
      setResendMessage('Please enter your email address to resend the confirmation link.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    setResendMessage(null);

    try {
      const { error } = await resendConfirmationEmail(targetEmail);
      if (error) {
        setResendStatus('error');
        setResendMessage(error.message || 'Failed to resend confirmation email.');
      } else {
        setResendStatus('success');
        setResendMessage('Confirmation email resent! Please check your inbox (and spam folder).');
      }
    } catch {
      setResendStatus('error');
      setResendMessage('Network failure sending confirmation email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotMessage('Please enter your email address.');
      setForgotStatus('error');
      return;
    }

    setForgotStatus('loading');
    setForgotMessage(null);

    try {
      const { error } = await resetPassword(forgotEmail.trim());
      if (error) {
        setForgotStatus('error');
        setForgotMessage(error.message || 'Failed to send password reset email.');
      } else {
        setForgotStatus('success');
        setForgotMessage('Password reset link sent! Check your inbox.');
      }
    } catch {
      setForgotStatus('error');
      setForgotMessage('Network failure sending password reset link.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <DayFlowLogo size={42} />
          <span className="font-extrabold text-2xl text-white tracking-tight">DayFlow</span>
        </div>
        <h2 className="mt-4 text-center text-xl sm:text-2xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400">
          Welcome back! Manage your daily tasks, routines, and progress.
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full">
        <div className="bg-slate-800/80 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-8 border border-slate-700/60 shadow-2xl rounded-2xl">
          {/* SPECIAL EMAIL CONFIRMATION REQUIRED BANNER */}
          {isEmailNotConfirmed && (
            <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div>
                    <span className="font-semibold block text-amber-100 text-sm">
                      Email confirmation required
                    </span>
                    <p className="text-amber-200/90 mt-1 leading-relaxed font-normal">
                      {EMAIL_NOT_CONFIRMED_MESSAGE}
                    </p>
                  </div>

                  {/* Resend Confirmation Action */}
                  <div className="pt-0.5">
                    {resendStatus === 'success' ? (
                      <div className="flex items-center gap-2 text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-lg font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{resendMessage}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={isResending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white font-medium transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                        >
                          {isResending ? (
                            <>
                              <span className="w-3 h-3 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                              Sending confirmation email...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              Resend confirmation email
                            </>
                          )}
                        </button>
                        {resendStatus === 'error' && (
                          <p className="text-red-300 text-[11px]">{resendMessage}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GENERIC ERROR BANNER (FOR INVALID PASSWORD OR CREDENTIALS) */}
          {errorMessage && !isEmailNotConfirmed && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-red-200">Sign in failed</span>
                {errorMessage}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs text-white bg-slate-900/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotStatus('idle');
                    setForgotMessage(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs text-white bg-slate-900/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Link to Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
              >
                Sign up free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset your password</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {forgotStatus === 'success' ? (
              <div className="my-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{forgotMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-3">
                {forgotStatus === 'error' && forgotMessage && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    {forgotMessage}
                  </div>
                )}
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus === 'loading'}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                  >
                    {forgotStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotStatus === 'success' && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
