"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { apiFetch } from "../lib/api/client";
import {
  login as legacyLogin,
  register as apiRegister,
  deleteAccount as apiDeleteAccount,
} from "../lib/api/auth";
import { ROLE_HOME_ROUTES } from "../config/roles";

const AuthContext = createContext(null);

function persistSession(idToken, user) {
  localStorage.setItem("nirmay_token", idToken);
  localStorage.setItem("nirmay_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("nirmay_token");
  localStorage.removeItem("nirmay_user");
}

async function backendUser(idToken) {
  return apiFetch("/me", { token: idToken });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          const profile = await backendUser(idToken);
          if (!active) return;
          const userInfo = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
          };
          persistSession(idToken, userInfo);
          setToken(idToken);
          setUser(userInfo);
        } else {
          const storedToken = localStorage.getItem("nirmay_token");
          const storedUser = localStorage.getItem("nirmay_user");
          if (storedToken && storedUser) {
            try {
              const payloadPart = storedToken.split(".")[1];
              const payload = payloadPart ? JSON.parse(atob(payloadPart)) : null;
              if (payload?.exp && Date.now() >= payload.exp * 1000) {
                clearSession();
              } else {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
              }
            } catch {
              clearSession();
            }
          }
        }
      } catch {
        if (firebaseUser) {
          clearSession();
          await signOut(firebaseAuth);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password, redirectTo = null }) => {
    setIsLoading(true);
    try {
      let idToken;
      let profile;
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        idToken = await credential.user.getIdToken(true);
        profile = await backendUser(idToken);
      } catch {
        // Existing SQL accounts and seeded demo accounts may not have Firebase Auth users yet.
        if (firebaseAuth.currentUser) await signOut(firebaseAuth);
        const legacySession = await legacyLogin({ email: email.trim(), password });
        idToken = legacySession.access_token;
        profile = await backendUser(idToken);
      }
      const userInfo = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      };
      persistSession(idToken, userInfo);
      setToken(idToken);
      setUser(userInfo);
      router.push(redirectTo || ROLE_HOME_ROUTES[profile.role] || "/");
      return userInfo;
    } catch (error) {
      if (firebaseAuth.currentUser) await signOut(firebaseAuth);
      clearSession();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const registerPatient = useCallback(async ({ email, password, full_name, redirectTo = null }) => {
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await updateProfile(credential.user, { displayName: full_name.trim() });
      const idToken = await credential.user.getIdToken(true);
      const profile = await apiFetch("/auth/firebase/profile", {
        method: "POST",
        token: idToken,
        body: { full_name: full_name.trim() },
      });
      const userInfo = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      };
      persistSession(idToken, userInfo);
      setToken(idToken);
      setUser(userInfo);
      router.push(redirectTo || ROLE_HOME_ROUTES[profile.role] || "/patient");
      return userInfo;
    } catch (error) {
      if (firebaseAuth.currentUser) await signOut(firebaseAuth);
      clearSession();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const registerStaff = useCallback(async ({ email, password, full_name, role }) => {
    const currentToken = firebaseAuth.currentUser
      ? await firebaseAuth.currentUser.getIdToken()
      : token || localStorage.getItem("nirmay_token");
    return apiRegister({ email, password, full_name, role }, currentToken);
  }, [token]);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    clearSession();
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const deleteMyAccount = useCallback(async () => {
    await apiDeleteAccount();
    await logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      registerPatient,
      registerStaff,
      logout,
      deleteMyAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
