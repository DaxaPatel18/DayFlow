import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Send,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DayFlowLogo } from '../components/DayFlowLogo';

export const SignUpPage: React.FC = () => {
  const { signUp, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email confirmation view state
  const [isConfirmationSent, setIsConfirmationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Strict validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const { error, needsEmailConfirmation } = await signUp(
        fullName.trim(),
        email.trim(),
        password
      );

      if (error) {
        const lower = error.message?.toLowerCase() || '';
        if (lower.includes('already registered') || lower.includes('exists')) {
          setErrorMessage('An account with this email already exists. Please log in instead.');
        } else {
          setErrorMessage(error.message || 'Failed to create account. Please try again.');
        }
      } else if (needsEmailConfirmation) {
        // Show confirmation screen and instructions
        setRegisteredEmail(email.trim());
        setIsConfirmationSent(true);
      } else {
        // Automatically logged in (no confirmation required or mock auth auto-confirm)
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 600);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network failure. Please check your internet connection.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;

    setIsResending(true);
    setResendStatus('idle');
    setResendMessage(null);

    try {
      const { error } = await resendConfirmationEmail(registeredEmail);
      if (error) {
        setResendStatus('error');
        setResendMessage(error.message || 'Failed to resend confirmation email.');
      } else {
        setResendStatus('success');
        setResendMessage('Confirmation email resent! Please check your inbox and spam folder.');
      }
    } catch {
      setResendStatus('error');
      setResendMessage('Network failure sending confirmation email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <DayFlowLogo size={42} />
          <span className="font-extrabold text-2xl text-white tracking-tight">DayFlow</span>
        </div>
        <h2 className="mt-4 text-center text-xl sm:text-2xl font-bold tracking-tight text-white">
          {isConfirmationSent ? 'Check your email' : 'Create your DayFlow account'}
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400">
          {isConfirmationSent
            ? 'We sent a verification link to activate your account.'
            : 'Get started with your personalized tasks, routines, and calendar.'}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full">
        <div className="bg-slate-800/80 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-8 border border-slate-700/60 shadow-2xl rounded-2xl">
          {/* CONFIRMATION SCREEN */}
          {isConfirmationSent ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Envelope illustration badge */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-800 shadow">
                    <Send className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Email details */}
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-300">
                  A confirmation link has been dispatched to:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-semibold text-indigo-300">
                  {registeredEmail}
                </div>
              </div>

              {/* Primary Instruction Message Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <strong className="block text-white mb-0.5">Please confirm your email before signing in.</strong>
                  Check your inbox for the confirmation link. Click the link inside the email to activate your account.
                </div>
              </div>

              {/* Helpful tips */}
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Next steps:</span>
                </div>
                <p>1. Open your email client and check your inbox.</p>
                <p>2. If you don't see it within 2 minutes, check your spam/junk folder.</p>
                <p>3. Once confirmed, sign in to start using DayFlow.</p>
              </div>

              {/* Resend status messages */}
              {resendStatus === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resendMessage}</span>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{resendMessage}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { email: registeredEmail } })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700/60 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isResending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-slate-300/30 border-t-white rounded-full animate-spin" />
                      Sending confirmation link...
                    </span>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Resend confirmation email</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmationSent(false);
                      setResendStatus('idle');
                      setResendMessage(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Need to use a different email address?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* SIGNUP FORM */
            <>
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-red-200">Registration failed</span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300">
                    Full Name
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="block w-full pl-9 pr-3 py-2 text-xs text-white bg-slate-900/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Email */}
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

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="block w-full pl-9 pr-10 py-2 text-xs text-white bg-slate-900/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none focus:text-indigo-400 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Confirm Password
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="block w-full pl-9 pr-10 py-2 text-xs text-white bg-slate-900/60 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none focus:text-indigo-400 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
                        Creating account...
                      </span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Link to Sign In */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
