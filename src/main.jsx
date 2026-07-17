window.global = window;
import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import Cookies from 'js-cookie'

import Login from './login.jsx'
import ParentComponent from './LUNA.jsx'
import VaultHome from './VaultHome.jsx'
import ChangePassword from './ChangePassword.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LandingPage from './LandingPage.jsx'
import { supabase } from './supabase.jsx'

// Handles the OAuth redirect hash (#access_token=...) that Supabase sends back
const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) {
      // No OAuth token — render landing page normally
      return;
    }

    // Let Supabase parse the hash and establish session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        Cookies.set('sb-access-token', session.access_token, { expires: 3650 });
        Cookies.set('sb-refresh-token', session.refresh_token, { expires: 3650 });
        navigate(`/${session.user.id}`, { replace: true });
      }
    });
  }, [navigate]);

  return null; // render nothing while redirecting
};

// Keep the cookie token always fresh by listening to Supabase auth state changes.
// Supabase auto-refreshes the access token before it expires — this ensures the
// cookie stays in sync so older cookie-based calls still work.
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    Cookies.set('sb-access-token', session.access_token, { expires: 3650 });
    Cookies.set('sb-refresh-token', session.refresh_token, { expires: 3650 });
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OAuthCallbackWrapper />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:uid"
          element={
            <ProtectedRoute>
              <VaultHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:uid/vault/:vaultId"
          element={
            <ProtectedRoute>
              <ParentComponent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

// Wrapper: if hash has access_token handle OAuth, otherwise show LandingPage
function OAuthCallbackWrapper() {
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    return <OAuthCallback />;
  }
  return <LandingPage />;
}
