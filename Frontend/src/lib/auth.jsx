import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on refresh
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("mock_user");
      const token = localStorage.getItem("token");
      
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally verify token with backend here
        } catch (e) {
          console.error("Auth init error", e);
          localStorage.removeItem("token");
          localStorage.removeItem("mock_user");
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // REAL LOGIN — backend on port 5001 (matches .env PORT=5001)
  // BACKEND URL — use VITE_API_URL from environment or fallback to localhost
  const API_BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : "http://localhost:5001";

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("mock_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Login error:", error);

      // ── Demo / offline fallback ──
      // Covers all known demo credentials so the app works even if backend is unreachable
      const email = usernameOrEmail.toLowerCase().trim();
      const DEMO_ACCOUNTS = [
        {
          match: ["manager@peoplestat.com", "manager@example.com", "manager"],
          user: { id: "demo-mgr-1", username: "manager", email: "manager@peoplestat.com", role: "manager" },
        },
        {
          match: ["employee@peoplestat.com", "employee@example.com", "employee"],
          user: { id: "demo-emp-1", username: "employee", email: "employee@peoplestat.com", role: "employee" },
        },
      ];

      const DEMO_PASSWORDS = ["pass1234", "password123", "pass123"];

      if (DEMO_PASSWORDS.includes(password)) {
        const account = DEMO_ACCOUNTS.find((a) => a.match.includes(email));
        if (account) {
          const fallbackUser = account.user;
          localStorage.setItem("mock_user", JSON.stringify(fallbackUser));
          localStorage.setItem("token", "demo-token-" + fallbackUser.role);
          setUser(fallbackUser);
          return fallbackUser;
        }
      }

      throw error;
    }
  };


  // MOCK REGISTER
  const register = async (username, email, password, department, role) => {
    const newUser = { username, email, password, department, role };
    const registeredUsers = JSON.parse(localStorage.getItem("mock_registered_users") || "[]");

    if (registeredUsers.some(u => u.username === username || u.email === email)) {
      throw new Error("User already exists");
    }

    registeredUsers.push(newUser);
    localStorage.setItem("mock_registered_users", JSON.stringify(registeredUsers));

    // Auto-login after registration
    const { password: _, ...userWithoutPassword } = newUser;
    localStorage.setItem("mock_user", JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
  };

  const logout = () => {
    localStorage.removeItem("mock_user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
