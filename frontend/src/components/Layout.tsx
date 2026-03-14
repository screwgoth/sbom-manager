import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Shield, LogOut, User, Menu, X } from 'lucide-react';
import { authApi } from '../lib/api';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

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
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-bg-secondary border-r border-border">
        {/* Logo */}
        <div className="flex items-center h-20 px-8 border-b border-border">
          <Shield className="h-9 w-9 text-accent-blue" />
          <h1 className="ml-4 text-xl font-bold text-text-primary">SBOM Manager</h1>
        </div>

        {/* Navigation with sections */}
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <h3 className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                {section.label}
              </h3>
              <div className="space-y-2">
                {section.items.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-150 ${
                      isActive(path)
                        ? 'bg-accent-blue text-white shadow-lg'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section & Theme Toggle */}
        <div className="border-t border-border p-4 space-y-2">
          {/* Theme Toggle */}
          <div className="flex justify-center mb-4">
            <ThemeToggle />
          </div>
          
          <Link
            to="/profile"
            className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-150 ${
              isActive('/profile')
                ? 'bg-accent-blue text-white shadow-lg'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <User className="h-5 w-5 mr-4" />
            <span className="truncate">{user?.name || user?.email || 'Profile'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all duration-150"
          >
            <LogOut className="h-5 w-5 mr-4" />
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
          <aside className="fixed inset-y-0 left-0 w-72 bg-bg-secondary border-r border-border z-50 lg:hidden">
            {/* Logo */}
            <div className="flex items-center justify-between h-20 px-8 border-b border-border">
              <div className="flex items-center">
                <Shield className="h-9 w-9 text-accent-blue" />
                <h1 className="ml-4 text-xl font-bold text-text-primary">SBOM Manager</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation with sections */}
            <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.label}>
                  <h3 className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                    {section.label}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map(({ path, label, icon: Icon }) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-150 ${
                          isActive(path)
                            ? 'bg-accent-blue text-white shadow-lg'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-4" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* User Section & Theme Toggle */}
            <div className="border-t border-border p-4 space-y-2">
              {/* Theme Toggle */}
              <div className="flex justify-center mb-4">
                <ThemeToggle />
              </div>
              
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-150 ${
                  isActive('/profile')
                    ? 'bg-accent-blue text-white shadow-lg'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <User className="h-5 w-5 mr-4" />
                <span className="truncate">{user?.name || user?.email || 'Profile'}</span>
              </Link>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-all duration-150"
              >
                <LogOut className="h-5 w-5 mr-4" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-bg-secondary border-b border-border">
          <div className="flex items-center justify-between h-20 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-secondary hover:text-text-primary"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Shield className="h-9 w-9 text-accent-blue" />
              <h1 className="ml-4 text-xl font-bold text-text-primary">SBOM Manager</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full bg-bg-primary">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-bg-secondary border-t border-border">
          <div className="px-6 sm:px-8 lg:px-10 py-6">
            <p className="text-center text-base text-text-secondary">
              SBOM Manager v1.0.0 - CERT-In Compliant
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
