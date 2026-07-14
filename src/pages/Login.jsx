import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Destination to redirect after login (default is Dashboard)
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 overflow-hidden px-4">
      <div className="w-full max-w-[460px] z-10 space-y-7 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <img src="/assets/logo.png" alt="PM Auto Mobiles Logo" className="w-16 h-16 object-contain mb-1" />
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">PM Auto Mobiles</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Auto-Service Operations Management Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-9 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-blue-900/5">
          {loading && (
            <div className="absolute top-0 inset-x-0 h-1 overflow-hidden bg-blue-50">
              <div className="h-full bg-blue-600 animate-progress"></div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-700 font-bold leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@pmautomobiles.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-12 pr-4 block w-full rounded-xl text-[15px] text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-slate-400 bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-12 pr-4 block w-full rounded-xl text-[15px] text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-slate-400 bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full flex items-center justify-center rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick seeded credential helper info */}
          <div className="mt-6.5 pt-6 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Demo Credentials</span>
            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 inline-block font-mono leading-relaxed">
              <span className="text-blue-600 font-bold">ID:</span> admin@pmautomobiles.com <br />
              <span className="text-blue-600 font-bold">PW:</span> admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
