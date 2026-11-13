"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, register as apiRegister, deleteAccount as apiDeleteAccount } from "../lib/api/auth";
import { ROLE_HOME_ROUTES } from "../config/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load persistent token and user on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("nirmay_token");
      const storedUser = localStorage.getItem("nirmay_user");

      if (storedToken && storedUser) {
        // Quick check for JWT expiration
        try {
          const payloadPart = storedToken.split(".")[1];
          if (payloadPart) {
            const payload = JSON.parse(atob(payloadPart));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              // Expired
              localStorage.removeItem("nirmay_token");
              localStorage.removeItem("nirmay_user");
              setToken(null);
              setUser(null);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // If token parsing fails, ignore and proceed
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // LocalStorage access issues
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async ({ email, password, redirectTo = null }) => {
      setIsLoading(true);
      try {
        const data = await apiLogin({ email, password });
        // data has: { access_token, token_type, user_id, role }
        const userInfo = {
          id: data.user_id,
          email,
          role: data.role,
        };

        setToken(data.access_token);
        setUser(userInfo);

        localStorage.setItem("nirmay_token", data.access_token);
        localStorage.setItem("nirmay_user", JSON.stringify(userInfo));

        const destination = redirectTo || ROLE_HOME_ROUTES[data.role] || "/";
        router.push(destination);
        return userInfo;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const registerPatient = useCallback(
    async ({ email, password, full_name, redirectTo = null }) => {
      setIsLoading(true);
      try {
        // Register patient
        await apiRegister({ email, password, full_name, role: "patient" });
        // Automatically log in after registration
        return await login({ email, password, redirectTo: redirectTo || "/patient" });
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const registerStaff = useCallback(
    async ({ email, password, full_name, role }) => {
      // Admin registering doctor, health_worker, or admin
      const currentToken = token || localStorage.getItem("nirmay_token");
      return await apiRegister({ email, password, full_name, role }, currentToken);
    },
    [token]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("nirmay_token");
    localStorage.removeItem("nirmay_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const deleteMyAccount = useCallback(async () => {
    await apiDeleteAccount();
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        registerPatient,
        registerStaff,
        logout,
        deleteMyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
