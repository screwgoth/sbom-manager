import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register(email, password, name);
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center py-12 px-6 sm:px-8 lg:px-10">
      <div className="max-w-md w-full space-y-10">
        {/* Theme Toggle - Top Right */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div>
          <div className="flex justify-center">
            <div className="bg-accent-blue p-5 rounded-2xl shadow-lg">
              <Shield className="h-14 w-14 text-white" />
            </div>
          </div>
          <h2 className="mt-8 text-center text-4xl font-bold text-text-primary">
            SBOM Manager
          </h2>
          <p className="mt-3 text-center text-base text-text-secondary">
            Create your account
          </p>
        </div>

        <div className="bg-bg-card rounded-xl shadow-2xl border border-border p-10">
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
              <p className="text-base text-red-200">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-base font-medium text-text-primary mb-2">
                Full Name (optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg shadow-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-base"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-base font-medium text-text-primary mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg shadow-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-base"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium text-text-primary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg shadow-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-base"
                placeholder="••••••••"
              />
              <p className="mt-2 text-sm text-text-tertiary">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-base font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg shadow-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-base"
                placeholder="••••••••"
              />
              {password && confirmPassword && password === confirmPassword && (
                <div className="mt-2 flex items-center text-sm text-green-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Passwords match
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-6 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-accent-blue hover:bg-accent-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-base">
                <span className="px-3 bg-bg-card text-text-secondary">Already have an account?</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/login"
                className="w-full flex justify-center py-3.5 px-6 border border-border rounded-lg shadow-sm text-base font-medium text-text-primary bg-bg-tertiary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
