import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Shield, Scan, LogOut, User } from 'lucide-react';
import { authApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">SBOM Manager</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="inline-block w-4 h-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/projects"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/projects')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="inline-block w-4 h-4 mr-1" />
                Projects
              </Link>
              <Link
                to="/scanner"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/scanner')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Scan className="inline-block w-4 h-4 mr-1" />
                Scanner
              </Link>
              
              <div className="border-l border-gray-300 h-6 mx-2"></div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center px-3 py-2 text-sm text-gray-700">
                  <User className="inline-block w-4 h-4 mr-1" />
                  {user?.name || user?.email || 'User'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="inline-block w-4 h-4 mr-1" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            SBOM Manager v1.0.0 - CERT-In Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}
