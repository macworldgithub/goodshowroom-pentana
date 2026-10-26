"use client";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

type AuthStateListener = (event: "SIGNED_IN" | "SIGNED_OUT") => void;

const SESSION_STORAGE_KEY = "goodshowroom_auth_session";
const COOKIE_NAME = "gs_session";

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

class AuthClient {
  private listeners = new Set<AuthStateListener>();

  getSession(): { data: { session: AuthSession | null }; error: Error | null } {
    if (typeof window === "undefined") {
      return { data: { session: null }, error: null };
    }
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return { data: { session: null }, error: null };
      const session = JSON.parse(stored) as AuthSession;
      return { data: { session }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    const { data } = this.getSession();
    return { data: { user: data.session?.user ?? null }, error: null };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const response = await fetch("/api/backend/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(result?.message)
        ? result.message.join(". ")
        : result?.message || "Invalid email or password";
      return { data: { user: null, session: null }, error: new Error(message) };
    }

    const session: AuthSession = {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setCookie(COOKIE_NAME, session.access_token);
    }

    this.notify("SIGNED_IN");
    return { data: { user: session.user, session }, error: null };
  }

  async refreshSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    const current = this.getSession().data.session;
    if (!current?.refresh_token) {
      return { data: { session: null }, error: new Error("No refresh token available") };
    }

    try {
      const response = await fetch("/api/backend/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refresh_token }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        await this.signOut();
        return { data: { session: null }, error: new Error(result?.message || "Session expired") };
      }

      const newSession: AuthSession = {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user ?? current.user,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        setCookie(COOKIE_NAME, newSession.access_token);
      }

      return { data: { session: newSession }, error: null };
    } catch (cause) {
      return { data: { session: null }, error: cause instanceof Error ? cause : new Error("Failed to refresh session") };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    const current = this.getSession().data.session;
    if (current?.refresh_token) {
      void fetch("/api/backend/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refresh_token }),
      }).catch(() => {});
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      deleteCookie(COOKIE_NAME);
    }

    this.notify("SIGNED_OUT");
    return { error: null };
  }

  async resetPasswordForEmail(email: string) {
    const response = await fetch("/api/backend/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return { error: new Error(result?.message || "Failed to send reset link") };
    }
    return { error: null };
  }

  async updateUser({ password, token }: { password: string; token?: string }) {
    const response = await fetch("/api/backend/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return { error: new Error(result?.message || "Failed to update password") };
    }
    return { error: null };
  }

  async acceptInvitation({
    invitationId,
    token,
    password,
    fullName,
  }: {
    invitationId: string;
    token: string;
    password: string;
    fullName?: string;
  }) {
    const response = await fetch("/api/backend/auth/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId, token, password, fullName }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, error: new Error(result?.message || "Failed to accept invitation") };
    }

    const session: AuthSession = {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: result.user,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setCookie(COOKIE_NAME, session.access_token);
    }

    this.notify("SIGNED_IN");
    return { data: session, error: null };
  }

  onAuthStateChange(callback: AuthStateListener): { data: { subscription: { unsubscribe: () => void } } } {
    this.listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }

  private notify(event: "SIGNED_IN" | "SIGNED_OUT") {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {}
    }
  }
}

export const authClient = new AuthClient();

export function createClient() {
  return {
    auth: authClient,
  };
}
