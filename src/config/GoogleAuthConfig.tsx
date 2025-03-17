/** @jsxImportSource react */
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://pixigo.app',
  'https://main.d88cqprqpemh7.amplifyapp.com'
];

export const GoogleAuthConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Verify current origin is allowed
    const currentOrigin = window.location.origin;
    if (!ALLOWED_ORIGINS.includes(currentOrigin)) {
      console.warn(`Warning: Current origin ${currentOrigin} is not in the allowed list for Google OAuth`);
    }

    // Handle potential Google Sign-In errors gracefully
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out known Google Sign-In errors in development
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('GSI_LOGGER') || 
         args[0].includes('Failed to execute \'postMessage\'') ||
         args[0].includes('Error retrieving a token'))
      ) {
        // Log warning instead of error in development
        if (import.meta.env.DEV) {
          console.warn('Google Sign-In development warning:', args[0]);
          return;
        }
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    console.warn("Google Client ID is missing. OAuth features will be disabled.");
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => {
        console.warn("Google Sign-In script failed to load");
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
};