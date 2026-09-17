import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL, setApiOrganizationId } from "../services/api";
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

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

      throw error;
    }
  };


  const register = async (username, email, password, department, role, inviteToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, username, email, password, role, inviteToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("mock_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("mock_user");
    localStorage.removeItem("token");
    localStorage.removeItem("activeOrganization");
    setApiOrganizationId(null);
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
