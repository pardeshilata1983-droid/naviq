import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { glassModal, glassInput, emeraldBtnSolid, emeraldBtn } from '../lib/styles';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthProps {
  onSuccess: (user: UserProfile) => void;
  onBackToLanding: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onBackToLanding }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('user@naviq.ai');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const res = await api.register(email, password, name || 'Naviq User');
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Attempt login with default demo account
      const res = await api.login('user@naviq.ai', 'password123');
      onSuccess(res.user);
    } catch {
      // If demo user wasn't registered yet, register it
      try {
        const reg = await api.register('user@naviq.ai', 'password123', 'Naviq User');
        onSuccess(reg.user);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to initialize demo access');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className={`w-full max-w-md rounded-2xl ${glassModal} p-6 sm:p-8 shadow-2xl border border-emerald-500/20 relative`}>
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" className="mb-4" onClick={onBackToLanding} />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create your Naviq Account' : 'Welcome back to Naviq'}
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs">
            {isSignUp
              ? 'Empower your autonomous AI agent to resolve digital tasks for you.'
              : 'Sign in to access your ongoing fixes, vault documents, and agent activity.'}
          </p>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Access Button */}
        <div className="mb-6">
          <button
            id="auth-guest-demo-btn"
            type="button"
            onClick={handleDemoAccess}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold ${emeraldBtnSolid} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isLoading ? 'Accessing Naviq...' : 'Instant Demo Access (No Password)'}</span>
          </button>
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 bg-[#04150f] text-[11px] text-gray-400 uppercase tracking-wider">
              or continue with email
            </span>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                id="auth-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm ${glassInput}`}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm ${glassInput}`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-300">Password</label>
              {!isSignUp && (
                <span className="text-[11px] text-gray-500">
                  Demo default: password123
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm ${glassInput}`}
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 mt-2 rounded-xl text-xs font-medium ${emeraldBtn} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign in to Naviq'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}
            className="text-emerald-400 font-semibold hover:text-emerald-300 underline underline-offset-4 ml-1"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Vault & Private Autonomous Agent</span>
        </div>
      </div>
    </div>
  );
};

