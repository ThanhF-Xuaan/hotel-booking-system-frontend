import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { User as AuthUser } from '../../../types/auth';

interface JwtPayload {
  sub?: string;
  roles?: string;
  exp?: number;
  iss?: string;
  iat?: number;
}

const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (e) {
    console.error('Failed to parse JWT payload:', e);
    return null;
  }
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ username: username.trim(), password });

      if (response && response.authenticated && response.token) {
        const decoded = decodeJwt(response.token);
        if (decoded) {
          const user: AuthUser = {
            username: username.trim(),
            fullName: decoded.sub || 'Staff User',
            role: decoded.roles || 'STAFF'
          };
          loginStore(response.token, user);
          navigate('/admin/hotels');
        } else {
          setError('Failed to process authentication credentials.');
        }
      } else {
        setError('Authentication failed. Access denied.');
      }
    } catch (err: unknown) {
      console.error(err);
      // Under strict compiler mode, err must be safely inspected or cast
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errData = axiosError.response?.data;
      if (errData && errData.message) {
        setError(errData.message);
      } else {
        setError('Unable to authenticate. Please verify your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white border border-neutral-200 p-8 rounded-lg shadow-xl animate-scale-in">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-3 border border-red-100">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-black uppercase tracking-wider">
            Hotel System
          </h2>
          <p className="mt-2 text-sm text-neutral-500 font-semibold uppercase tracking-wider">
            Staff Portal Administration
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-650 p-4 rounded flex items-start space-x-3 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-bold text-red-750">
              <h5 className="text-sm font-extrabold text-red-800 uppercase tracking-wide">Login Error</h5>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="mt-6 space-y-6">
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="pl-10 w-full px-3 py-2.5 border border-neutral-300 rounded text-sm bg-white text-black font-semibold placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-shadow"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 w-full px-3 py-2.5 border border-neutral-300 rounded text-sm bg-white text-black font-semibold placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-extrabold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
