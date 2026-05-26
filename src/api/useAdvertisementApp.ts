import { getMe, login, logout, register } from "@/api/appApi";
import { useEffect, useState } from "react";
import type { User } from "./types";

const TOKEN_KEY = "ad-app-token";

export function useAdvertisementApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAuthenticated = !!user;

  function storeToken(nextToken: string | null) {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  }

  function clearNotices() {
    setMessage("");
    setError("");
  }

  async function loadSession() {
    setSessionReady(false);
    if (!token) {
      setUser(null);
      setSessionReady(true);
      return;
    }

    try {
      const response = await getMe(token);
      setUser(response.user);
    } catch {
      storeToken(null);
      setUser(null);
    } finally {
      setSessionReady(true);
    }
  }

  async function submitAuth() {
    clearNotices();

    try {
      if (loginMode === "login") {
        const response = await login(authEmail, authPassword);
        storeToken(response.token);
        setUser(response.user);
        setMessage(`Welcome back, ${response.user.name}.`);
      } else {
        const response = await register(authName, authEmail, authPassword);
        storeToken(response.token);
        setUser(response.user);
        setMessage(`Account created. Hello, ${response.user.name}.`);
      }

      setAuthPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  async function submitLogout() {
    clearNotices();
    try {
      await logout(token);
    } catch {
      // Local logout should still continue if API request fails.
    }

    storeToken(null);
    setUser(null);
    setMessage("You have been logged out.");
  }

  useEffect(() => {
    loadSession().catch(err => {
      setError(err instanceof Error ? err.message : "Failed to load session");
      setSessionReady(true);
    });
  }, [token]);

  return {
    state: {
      sessionReady,
      isAuthenticated,
      user,
      message,
      error,
      loginMode,
      authName,
      authEmail,
      authPassword,
    },
    actions: {
      setLoginMode,
      setAuthName,
      setAuthEmail,
      setAuthPassword,
      submitAuth,
      submitLogout,
    },
  };
}
