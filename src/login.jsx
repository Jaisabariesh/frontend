import React, { useState, useEffect } from 'react';
import './Login.css';
import { supabase } from './supabase';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const COOKIE_EXPIRY_YEARS = 10;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  const persistSessionInCookies = (session) => {
    if (session) {
      Cookies.set('sb-access-token', session.access_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
      Cookies.set('sb-refresh-token', session.refresh_token, { expires: COOKIE_EXPIRY_YEARS * 365 });
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (window.location.hash.includes('type=recovery')) {
        setAuthMode('reset');
        return;
      }

      const access_token = Cookies.get('sb-access-token');
      const refresh_token = Cookies.get('sb-refresh-token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        const { data } = await supabase.auth.getUser();
        if (data?.user) navigate(`/${data.user.id}`);
      }
    };
    restoreSession();
  }, [navigate]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) persistSessionInCookies(session);
      if (event === 'PASSWORD_RECOVERY') setAuthMode('reset');
      if (event === 'SIGNED_IN' && session?.user) {
        navigate(`/${session.user.id}`);
      }
    });
    return () => authListener?.subscription?.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Login error: ${error.message}`);
    } else if (data?.session && data?.user) {
      persistSessionInCookies(data.session);
      navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Please agree to the Terms and Conditions before signing up.');
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(`Signup error: ${error.message}`);
    } else if (data?.session && data?.user) {
      persistSessionInCookies(data.session);
      navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert(`Reset error: ${error.message}`);
    } else {
      alert('Password reset link sent to your email.');
      setAuthMode('login');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(`Error updating password: ${error.message}`);
    } else {
      alert('Password updated successfully!');
      if (data?.user) navigate(`/${data.user.id}`);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (authMode === 'signup' && !acceptedTerms) {
      alert('Please agree to the Terms and Conditions before signing up with Google.');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert(`Google sign in error: ${error.message}`);
  };

  const renderContent = () => {
    switch (authMode) {
      case 'signup':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Create account</h1>
              <p className="auth-subtitle">Get started with Luna today</p>
            </div>
            <form className="auth-form" onSubmit={handleSignup}>
              <input 
                type="email" 
                placeholder="Email" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-pill" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div className="terms-checkbox-container">
                <input 
                  type="checkbox" 
                  id="terms-checkbox"
                  className="terms-checkbox"
                  checked={acceptedTerms} 
                  onChange={(e) => setAcceptedTerms(e.target.checked)} 
                  required 
                />
                <label htmlFor="terms-checkbox" className="terms-label">
                  I agree to the <button type="button" className="terms-link-btn" onClick={() => setShowTermsModal(true)}>Terms & Conditions</button>
                </label>
              </div>
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <div className="divider"><span>OR</span></div>
            <button className="btn-pill btn-secondary" onClick={handleGoogleSignIn}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
              Continue with Google
            </button>
            <div className="auth-footer">
              Already have an account? 
              <button className="auth-link" onClick={() => setAuthMode('login')}>Sign in</button>
            </div>
          </>
        );
      case 'forgot':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">Enter your email to receive a reset link</p>
            </div>
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send reset link'}
              </button>
            </form>
            <div className="auth-footer">
              Remember your password? 
              <button className="auth-link" onClick={() => setAuthMode('login')}>Sign in</button>
            </div>
          </>
        );
      case 'reset':
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-subtitle">Enter your new secured password below</p>
            </div>
            <form className="auth-form" onSubmit={handleUpdatePassword}>
              <input 
                type="password" 
                placeholder="New Password" 
                className="input-pill" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        );
      default:
        return (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to your account</p>
            </div>
            <form className="auth-form" onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Email" 
                className="input-pill" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-pill" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-pill btn-primary" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <button type="button" className="forgot-pwd-btn" onClick={() => setAuthMode('forgot')}>
                Forgot password?
              </button>
            </form>
            <div className="divider"><span>OR</span></div>
            <button className="btn-pill btn-secondary" onClick={handleGoogleSignIn}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
              Continue with Google
            </button>
            <div className="auth-footer">
              Don't have an account? 
              <button className="auth-link" onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper">
        <div className="auth-logo">
          <img src="/logo.png" alt="Luna" className="auth-logo-img" />
          Luna
        </div>
        {renderContent()}
      </div>

      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>Terms & Conditions</h2>
              <button className="terms-modal-close" onClick={() => setShowTermsModal(false)}>&times;</button>
            </div>
            <div className="terms-modal-body">
              <h3>Welcome to Luna</h3>
              <p>
                Luna is a next-generation interactive learning workspace designed for students, researchers, and professionals in STEM fields. By creating an account, you agree to these Terms and Conditions.
              </p>

              <h3>1. Interactive STEM Features</h3>
              <p>
                Luna provides an integrated suite of tools to visualize and study complex scientific concepts:
              </p>
              <ul>
                <li><strong>Rich Text Notes:</strong> A custom TipTap note taking editor allowing structured content layout.</li>
                <li><strong>Math Equation Editor:</strong> Real-time LaTeX compilation and formula display.</li>
                <li><strong>Molecular Visualizer:</strong> Draw, modify, and inspect chemical molecular structures in 2D via the integrated JSME editor.</li>
                <li><strong>Graph Plotter:</strong> Functional plot builder for visual math/coordinate functions.</li>
                <li><strong>Drawing Canvas:</strong> Sketch, draw diagrams, draw shapes, and build annotations dynamically using a Konva canvas.</li>
                <li><strong>Mind Maps:</strong> Create logic connections and hierarchy graphs between concepts.</li>
              </ul>

              <h3>2. AI-Assisted Blurting Mode & Credits</h3>
              <p>
                Luna includes a special active-recall study method called <strong>"Blurting Mode"</strong>. In this mode, users can hide their notes and attempt to recall the content. The recall version is sent to the Gemini AI API for evaluation.
              </p>
              <ul>
                <li>Evaluation requires AI credits depending on the content length processed.</li>
                <li>New accounts are granted 50 free model/AI credits.</li>
                <li>Credits can be top-up purchased securely using the Razorpay billing gateway. Refund/chargeback requests are handled according to our standard refund flow.</li>
              </ul>

              <h3>3. User Ownership & Acceptable Use</h3>
              <p>
                You retain complete ownership of all notes, math equations, chemistry structures, and diagrams you create. Luna does not claim any intellectual property rights over your workspace content. You agree not to use Luna for publishing illegal, plagiarized, or malicious content, or spamming the AI evaluation layer.
              </p>

              <h3>4. Verification of System Output</h3>
              <p>
                AI-generated feedback and formula rendering are provided for educational purposes. We advise verification of critical STEM calculations, chemical formulas, and mathematical proofs via standard textbooks or official reference sources.
              </p>

              <h3>5. Security & Authentication</h3>
              <p>
                All account creations and logins are securely brokered via Supabase Auth services. You are responsible for maintaining the confidentiality of your credentials.
              </p>
            </div>
            <div className="terms-modal-footer">
              <button 
                className="btn-pill btn-primary btn-modal-agree"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Agree & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
