import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Input } from "@dockstat/ui";
import { useEffect, useState } from "react";
import {useSearchParams, useNavigate} from "react-router"

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const providerId = window.location.pathname.split("/").pop(); // Extract provider from URL

    if (!code || !state) {
      setError("Missing authorization parameters");
      return;
    }

    api.auth({ providerId: String(providerId) }).callback.get({
      query: { code, state }, fetch: {
      credentials: "include"
    }})
      .then((res) => {
        if (res.status !== 200 || res.data === "Invalid state" || res.data === null) throw new Error("Auth failed");
        return res.data;
      })
      .then((data) => {
        // Store user info
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect back to original page
        const redirect = localStorage.getItem("auth_redirect") || "/";
        localStorage.removeItem("auth_redirect");
        navigate(redirect);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="error">
        <h2>Authentication Failed</h2>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="loading">
      <p>Completing authentication...</p>
    </div>
  );
}

export function LoginButtons() {
  const { login, user, logout } = useAuth();
  const [provider, setProvider] = useState<string>("")

  if (user) {
    return (
      <div>
        <span>Welcome, {user.name || user.email}</span>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="login-buttons">
      <button onClick={() => login(provider)}>
        Login
        </button>
        <Input onChange={(v) => setProvider(v)}/>
    </div>
  );
}
