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
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Account actions</h2>
          <p className="mt-1 text-sm text-gray-400">
            Quick access to common tasks for your account.
          </p>
          <div className="mt-4 space-y-4">
            <Link
              to="/dashboard"
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-300 bg-navy-700 border border-gray-600 rounded-md hover:bg-gray-600"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Back to dashboard
              </span>
              <span className="text-gray-500">↗</span>
            </Link>

            <div className="rounded-md bg-blue-900/30 border border-blue-700 p-4">
              <p className="text-sm font-medium text-blue-300">Security</p>
              <p className="mt-1 text-sm text-blue-200">
                For enterprise use, ensure your password is unique and rotated regularly.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-navy-800 shadow-lg rounded-lg border border-navy-600 overflow-hidden">
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Name</p>
                <p className="mt-1 text-base font-semibold text-white">{user?.name || '—'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Email</p>
                <p className="mt-1 text-base font-semibold text-white">{user?.email || '—'}</p>
              </div>
            </div>

            {user?.createdAt && (
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Member since</p>
                  <p className="mt-1 text-base font-semibold text-white">
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
