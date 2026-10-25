"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process redirect result if browser used redirect flow
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
      }
    }).catch((err) => {
      console.warn('Redirect auth result error:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      // Set prompt to select account each time
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
      const res = await signInWithPopup(auth, googleProvider);
      return !!res.user;
    } catch (error: any) {
      console.warn('Google Sign-In error:', error?.code, error?.message);

      // Handle common Firebase Auth deployment errors
      if (error?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
        alert(`Authentication domain unauthorized:\n"${domain}" is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.\n\nPlease add "${domain}" to your Firebase Authorized Domains to enable Google Sign-In.`);
        return false;
      }

      // Popup blocked or not supported on some mobile browsers: fallback to redirect
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        if (error?.code === 'auth/popup-blocked') {
          try {
            await signInWithRedirect(auth, googleProvider);
            return false;
          } catch (redirectErr) {
            console.error('Redirect sign-in error:', redirectErr);
          }
        }
        return false;
      }

      if (error?.message) {
        alert(`Google Sign-In could not complete: ${error.message}`);
      }
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

