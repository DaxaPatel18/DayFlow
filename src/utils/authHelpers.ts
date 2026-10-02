/**
 * Auth helper utilities for detecting Supabase authentication states and errors.
 */

export const EMAIL_NOT_CONFIRMED_MESSAGE =
  'Please confirm your email before signing in. Check your inbox for the confirmation link.';

/**
 * Checks whether an error returned from Supabase authentication indicates
 * that the user's email address has not yet been confirmed.
 */
export function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    return (
      lower.includes('email not confirmed') ||
      lower.includes('email_not_confirmed') ||
      lower.includes('confirm your email') ||
      lower.includes('email is not confirmed')
    );
  }

  if (typeof error === 'object') {
    const err = error as { message?: string; code?: string; error_description?: string; msg?: string };
    const msg = (err.message || err.error_description || err.msg || '').toLowerCase();
    const code = (err.code || '').toLowerCase();

    return (
      code === 'email_not_confirmed' ||
      msg.includes('email not confirmed') ||
      msg.includes('email_not_confirmed') ||
      msg.includes('confirm your email') ||
      msg.includes('email is not confirmed') ||
      msg.includes('unconfirmed')
    );
  }

  return false;
}
