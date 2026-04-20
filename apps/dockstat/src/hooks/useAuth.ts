import { useEffect, useState } from "react";

interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3030";

  // Check if user is already authenticated (on mount)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Initiate login with a specific provider
  const login = (providerId: string) => {
    // Store the current location to redirect back after auth
    localStorage.setItem("auth_redirect", window.location.pathname);
    // Redirect to your Elysia auth endpoint
    window.location.href = `${API_BASE}/auth/${providerId}/login`;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return { user, loading, error, login, logout };
}
