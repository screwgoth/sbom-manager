import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Shield, LogOut, User, Menu, X } from 'lucide-react';
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

  // Navigation structure with sections like the reference
  const navSections = [
    {
      label: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/projects', label: 'Projects', icon: FolderOpen },
      ],
    },
    {
      label: 'AUDIT',
      items: [
        { path: '/scanner', label: 'Vulnerability Audit', icon: Shield },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-navy-900 border-r border-navy-600">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-navy-600">
          <Shield className="h-8 w-8 text-blue-400" />
          <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
        </div>

        {/* Navigation with sections */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      isActive(path)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-navy-600 p-3">
          <Link
            to="/profile"
            className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 mb-1 ${
              isActive('/profile')
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-navy-800 hover:text-white'
            }`}
          >
            <User className="h-5 w-5 mr-3" />
            <span className="truncate">{user?.name || user?.email || 'Profile'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-navy-800 hover:text-white transition-all duration-150"
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
          <aside className="fixed inset-y-0 left-0 w-64 bg-navy-900 border-r border-navy-600 z-50 lg:hidden">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-navy-600">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-400" />
                <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation with sections */}
            <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.label}>
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map(({ path, label, icon: Icon }) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                          isActive(path)
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* User Section */}
            <div className="border-t border-navy-600 p-3">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 mb-1 ${
                  isActive('/profile')
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
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
                className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-navy-800 hover:text-white transition-all duration-150"
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
        <header className="lg:hidden bg-navy-900 border-b border-navy-600">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="ml-3 text-lg font-bold text-white">SBOM Manager</h1>
            </div>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full bg-navy-950">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-navy-900 border-t border-navy-600">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-500">
              SBOM Manager v1.0.0 - CERT-In Compliant
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
