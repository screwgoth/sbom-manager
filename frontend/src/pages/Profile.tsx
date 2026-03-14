import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';
import PageShell from '../components/PageShell';

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  return (
    <PageShell
      title="My Profile"
      description="Manage your account details and sign out when you're done."
      sidebar={
        <div className="p-8">
          <h2 className="text-xl font-semibold text-text-primary">Account actions</h2>
          <p className="mt-2 text-base text-text-secondary">
            Quick access to common tasks for your account.
          </p>
          <div className="mt-6 space-y-4">
            <Link
              to="/dashboard"
              className="flex items-center justify-between w-full px-5 py-3 text-base font-medium text-text-secondary bg-bg-tertiary border border-border rounded-xl hover:bg-bg-secondary transition-colors"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent-blue" />
                Back to dashboard
              </span>
              <span className="text-text-tertiary">↗</span>
            </Link>

            <div className="rounded-xl bg-blue-900/30 border border-blue-700 p-6">
              <p className="text-base font-medium text-blue-300">Security</p>
              <p className="mt-2 text-sm text-blue-200">
                For enterprise use, ensure your password is unique and rotated regularly.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-bg-card shadow-lg rounded-xl border border-border overflow-hidden">
        <div className="p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                <User className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <p className="text-base font-medium text-text-secondary">Name</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{user?.name || '—'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                <Mail className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <p className="text-base font-medium text-text-secondary">Email</p>
                <p className="mt-2 text-xl font-semibold text-text-primary">{user?.email || '—'}</p>
              </div>
            </div>

            {user?.createdAt && (
              <div className="flex items-start space-x-4">
                <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                  <Calendar className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <p className="text-base font-medium text-text-secondary">Member since</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
