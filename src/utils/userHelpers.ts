/**
 * Helper to generate 1-2 uppercase avatar initials from a user's full name.
 * e.g. "Daxa Antiya" -> "DA", "Jane Doe" -> "JD", "Marcus" -> "MA"
 */
export function getInitials(name?: string): string {
  if (!name) return 'U';
  const clean = name.trim();
  if (!clean) return 'U';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a time-of-day appropriate greeting.
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
