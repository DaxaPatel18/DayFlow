import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for real Supabase
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isRealSupabaseConfigured =
  typeof envUrl === 'string' &&
  envUrl.startsWith('https://') &&
  !envUrl.toLowerCase().includes('placeholder') &&
  !envUrl.toLowerCase().includes('your_project') &&
  !envUrl.toLowerCase().includes('your-project') &&
  !envUrl.toLowerCase().includes('your-supabase') &&
  typeof envKey === 'string' &&
  !envKey.includes('YOUR_REAL_ANON_PUBLIC_KEY') &&
  !envKey.toLowerCase().includes('placeholder') &&
  !envKey.toLowerCase().includes('anon-public-key') &&
  envKey.length > 20;

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    role?: string;
    avatar_url?: string;
  };
  created_at: string;
  email_confirmed_at?: string | null;
}

export interface MockSession {
  access_token: string;
  user: MockUser;
}

const MOCK_USERS_STORAGE_KEY = 'dayflow_mock_users_v2';
const MOCK_SESSION_STORAGE_KEY = 'dayflow_mock_session_v2';
const MOCK_TABLE_PREFIX = 'dayflow_supabase_table_v2_';

// Stored mock users for optional local development mode (starts empty, populated on signUp)
function getStoredMockUsers(): (MockUser & { password: string })[] {
  try {
    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

function saveStoredMockUsers(users: (MockUser & { password: string })[]): void {
  try {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getStoredMockSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

function saveStoredMockSession(session: MockSession | null): void {
  try {
    if (session) {
      localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

type AuthCallback = (event: string, session: MockSession | null) => void;
const authListeners = new Set<AuthCallback>();

function emitAuthChange(event: string, session: MockSession | null) {
  authListeners.forEach((listener) => listener(event, session));
}

// Client abstraction that satisfies Supabase auth API interface
class MockSupabaseAuth {
  async getSession() {
    const session = getStoredMockSession();
    return { data: { session }, error: null };
  }

  async getUser() {
    const session = getStoredMockSession();
    return { data: { user: session?.user || null }, error: null };
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { full_name?: string; role?: string }; emailRedirectTo?: string };
  }) {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredMockUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return {
        data: { user: null, session: null },
        error: { message: 'An account with this email address already exists. Please log in.' },
      };
    }

    const newUser: MockUser & { password: string } = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      email,
      password,
      user_metadata: {
        full_name: options?.data?.full_name || email.split('@')[0],
        role: options?.data?.role || 'Student / Developer',
        avatar_url: '',
      },
      created_at: new Date().toISOString(),
      email_confirmed_at: null,
    };

    users.push(newUser);
    saveStoredMockUsers(users);

    // Mock requires email confirmation by default like Supabase
    return {
      data: { user: newUser, session: null },
      error: null,
    };
  }

  async resend({
    type: _type,
    email,
    options: _options,
  }: {
    type: string;
    email: string;
    options?: { emailRedirectTo?: string };
  }) {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return {
      data: { user: found || null },
      error: null,
    };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid email or password.' },
      };
    }

    if (found.password !== password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Incorrect password. Please try again.' },
      };
    }

    if (found.email_confirmed_at === null) {
      return {
        data: { user: null, session: null },
        error: {
          message: 'Email not confirmed',
          code: 'email_not_confirmed',
        },
      };
    }

    const session: MockSession = {
      access_token: 'mock_jwt_' + Math.random().toString(36).substring(2),
      user: found,
    };

    saveStoredMockSession(session);
    emitAuthChange('SIGNED_IN', session);

    return {
      data: { user: found, session },
      error: null,
    };
  }

  async signOut() {
    await new Promise((r) => setTimeout(r, 50));
    saveStoredMockSession(null);
    emitAuthChange('SIGNED_OUT', null);
    return { error: null };
  }

  async resetPasswordForEmail(email: string, _options?: { redirectTo?: string }) {
    await new Promise((r) => setTimeout(r, 150));
    const users = getStoredMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { error: { message: 'No account found with this email.' } };
    }
    return { data: {}, error: null };
  }

  async updateUser(attributes: { data?: { full_name?: string; role?: string; avatar_url?: string } }) {
    const session = getStoredMockSession();
    if (!session) {
      return { data: { user: null }, error: { message: 'Not authenticated' } };
    }

    const users = getStoredMockUsers();
    const updatedUsers = users.map((u) => {
      if (u.id === session.user.id) {
        return {
          ...u,
          user_metadata: {
            ...u.user_metadata,
            ...(attributes.data || {}),
          },
        };
      }
      return u;
    });

    saveStoredMockUsers(updatedUsers);

    const updatedUser = updatedUsers.find((u) => u.id === session.user.id)!;
    const nextSession: MockSession = {
      ...session,
      user: updatedUser,
    };

    saveStoredMockSession(nextSession);
    emitAuthChange('USER_UPDATED', nextSession);

    return { data: { user: updatedUser }, error: null };
  }

  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  }
}

// Mock Supabase Query Builder to handle .from(table).select().eq().order() etc.
function getTableStorage(tableName: string): any[] {
  try {
    const raw = localStorage.getItem(MOCK_TABLE_PREFIX + tableName);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function setTableStorage(tableName: string, rows: any[]): void {
  try {
    localStorage.setItem(MOCK_TABLE_PREFIX + tableName, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

class MockQueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private filters: { col: string; val: any }[] = [];
  private orderField?: string;
  private orderAscending: boolean = true;
  private isSingle: boolean = false;
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_columns: string = '*') {
    this.action = 'select';
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.payload = data;
    return this.execute();
  }

  upsert(data: any | any[], _options?: any) {
    this.action = 'upsert';
    this.payload = data;
    return this.execute();
  }

  update(updates: any) {
    this.action = 'update';
    this.payload = updates;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  neq(col: string, val: any) {
    // For simplicity store as special filter
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  // Thenable to allow `await supabase.from(...).select(...)`
  then(resolve: (val: any) => void, reject?: (err: any) => void) {
    return this.execute().then(resolve, reject);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const tableRows = getTableStorage(this.tableName);

    if (this.action === 'select') {
      let filtered = tableRows.filter((row) =>
        this.filters.every((f) => String(row[f.col]) === String(f.val))
      );

      if (this.orderField) {
        filtered.sort((a, b) => {
          const valA = a[this.orderField!];
          const valB = b[this.orderField!];
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      if (this.isSingle) {
        return { data: filtered[0] || null, error: null };
      }
      return { data: filtered, error: null };
    }

    if (this.action === 'insert') {
      const toAdd = Array.isArray(this.payload) ? this.payload : [this.payload];
      const nextRows = [...tableRows, ...toAdd];
      setTableStorage(this.tableName, nextRows);
      return { data: toAdd, error: null };
    }

    if (this.action === 'upsert') {
      const toUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      let currentRows = [...tableRows];

      for (const item of toUpsert) {
        const idCol = item.id !== undefined ? 'id' : item.user_id ? 'user_id' : null;
        let foundIdx = -1;

        if (this.tableName === 'routine_completions' && item.user_id && item.routine_id && item.date) {
          foundIdx = currentRows.findIndex(
            (r) => r.user_id === item.user_id && r.routine_id === item.routine_id && r.date === item.date
          );
        } else if (idCol) {
          foundIdx = currentRows.findIndex((r) => r[idCol] === item[idCol]);
        }

        if (foundIdx >= 0) {
          currentRows[foundIdx] = { ...currentRows[foundIdx], ...item };
        } else {
          currentRows.push(item);
        }
      }

      setTableStorage(this.tableName, currentRows);
      return { data: toUpsert, error: null };
    }

    if (this.action === 'update') {
      const updatedRows = tableRows.map((row) => {
        const matches = this.filters.every((f) => String(row[f.col]) === String(f.val));
        if (matches) {
          return { ...row, ...this.payload };
        }
        return row;
      });
      setTableStorage(this.tableName, updatedRows);
      return { data: this.payload, error: null };
    }

    if (this.action === 'delete') {
      const remainingRows = tableRows.filter((row) => {
        const matches = this.filters.every((f) => String(row[f.col]) === String(f.val));
        return !matches;
      });
      setTableStorage(this.tableName, remainingRows);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }
}

// Development mock authentication opt-in flag (default is false)
export const isMockAuthExplicitlyEnabled = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

// Mock client is ONLY activated if explicitly opted into for local development AND real Supabase is unconfigured
export const isUsingMockSupabase = isMockAuthExplicitlyEnabled && !isRealSupabaseConfigured;

export const supabase: SupabaseClient | any = isUsingMockSupabase
  ? {
      auth: new MockSupabaseAuth(),
      from: (table: string) => new MockQueryBuilder(table),
    }
  : createClient(
      isRealSupabaseConfigured ? envUrl : (envUrl || 'https://unconfigured.supabase.co'),
      isRealSupabaseConfigured ? envKey : (envKey || 'unconfigured_public_anon_key')
    );
