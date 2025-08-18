"use client"; // This directive is crucial for client-side functionality

import React, { createContext, useContext, useEffect, useState } from 'react';
 // Import our Firebase Auth instance
import { auth } from '../lib/firebaseClient';
 // Import the listener for auth state changes
import { onAuthStateChanged } from 'firebase/auth';

// 1. Create the Context
// This will hold the user object and a loading state
const AuthContext = createContext({
  user: null,
  loading: true, // Initially true, as we're checking the auth state
});

// 2. Create the AuthProvider Component
// This component will wrap our application and provide the auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect to listen for Firebase auth state changes
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // firebaseUser will be null if not logged in, or the user object if logged in
      setLoading(false); // Auth state has been determined, so loading is false
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount



  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create a Custom Hook for Easy Consumption
// This hook makes it easy for any component to access the auth state
export const useAuth = () => {
  return useContext(AuthContext);
};
