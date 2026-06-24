/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { createContext, useContext, useState } from 'react';
import { type User } from 'firebase/auth';

// TO RE-ENABLE FIREBASE OAUTH:
// 1. Uncomment the imports below:
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from '../config/firebase';
// import { useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Developer Mode Dummy User profile to allow bypassing login.
// (Comment this out and set initial state to null if re-enabling OAuth)
const dummyUser = {
  uid: 'dummy-uid',
  email: 'dummy@google.com',
  displayName: 'Developer Mode',
  photoURL: '',
  getIdToken: async () => 'dummy-token',
} as unknown as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // By default, authentication is bypassed by initializing state with dummyUser.
  // TO RE-ENABLE OAUTH: Change initial user state to null, and loading to true.
  const [user, setUser] = useState<User | null>(dummyUser);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // TO RE-ENABLE OAUTH: Uncomment the useEffect block below to listen to Firebase auth changes:
  /*
  useEffect(() => {
    console.log('[AuthContext] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('[AuthContext] onAuthStateChanged fired', { 
        uid: currentUser?.uid, 
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified
      });
      if (currentUser) {
        const email = currentUser.email;
        const isValidDomain = email && (email.endsWith('@google.com') || email.endsWith('@demart.altostrat.com'));
        if (isValidDomain) {
          console.log('[AuthContext] Valid user detected:', email);
          setUser(currentUser);
          setError(null);
        } else {
          console.log('[AuthContext] Invalid user domain. Signing out...', email);
          setUser(null);
          setError('Access restricted to @google.com or @demart.altostrat.com accounts only.');
          signOut(auth).then(() => {
            console.log('[AuthContext] signOut completed');
          }).catch((err) => {
            console.error('[AuthContext] signOut failed', err);
          });
        }
      } else {
        console.log('[AuthContext] No user detected (null)');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('[AuthContext] Unsubscribing from onAuthStateChanged');
      unsubscribe();
    };
  }, []);
  */

  const logout = async () => {
    console.log('[AuthContext] logout called');
    setUser(null);

    // TO RE-ENABLE OAUTH: Uncomment the Firebase signOut block below:
    /*
    setLoading(true);
    try {
      await signOut(auth);
      console.log('[AuthContext] logout successful');
      setError(null);
    } catch (err) {
      console.error('[AuthContext] logout failed', err);
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
