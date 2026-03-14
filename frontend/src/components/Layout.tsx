import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Shield, Scan, LogOut, User, Menu, X } from 'lucide-react';
import { authApi } from '../lib/api';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: FolderOpen },
    { path: '/scanner', label: 'Scanner', icon: Scan },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-800 border-r border-gray-700">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-700">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <Link
            to="/profile"
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2 ${
              isActive('/profile')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <User className="h-5 w-5 mr-3" />
            <span className="truncate">{user?.name || user?.email || 'Profile'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700 z-50 lg:hidden">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-500" />
                <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="border-t border-gray-700 p-4">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2 ${
                  isActive('/profile')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                <span className="truncate">{user?.name || user?.email || 'Profile'}</span>
              </Link>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500" />
              <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
            </div>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-400">
              SBOM Manager v1.0.0 - CERT-In Compliant
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
