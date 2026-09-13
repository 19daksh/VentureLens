import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { ThemeToggle } from './ThemeToggle';
import {
  Compass,
  PlusCircle,
  BarChart3,
  History,
  GitCompare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, isConfiguredWithSupabase } = useAuth();
  const { selectedCompareIds } = useAnalysis();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = user
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
        { name: 'History', path: '/history', icon: History },
        {
          name: 'Compare',
          path: '/compare',
          icon: GitCompare,
          badge: selectedCompareIds.length > 0 ? selectedCompareIds.length : null,
        },
      ]
    : [
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'Features', path: '/features' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'About', path: '/about' },
      ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group" id="nav-brand-logo">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight font-['Space_Grotesk',sans-serif]">
                    VentureLens
                  </span>
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide border border-indigo-200 dark:border-indigo-800/60">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:inline">
                  Idea Validation Engine
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = (link as any).icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle id="nav-theme-toggle-desktop" />

            {/* Supabase connection indicator pill */}
            <Link
              to="/settings"
              title={isConfiguredWithSupabase ? 'Connected to live Supabase PostgreSQL' : 'Local Storage mode (Configure Supabase in Settings)'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-[11px] hidden lg:inline">
                {isConfiguredWithSupabase ? 'Supabase Live' : 'Supabase Ready'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isConfiguredWithSupabase ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            </Link>

            {user ? (
              <>
                <Link
                  to="/new-analysis"
                  id="nav-btn-new-analysis"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all hover:shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Validate Idea</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    id="nav-user-dropdown-btn"
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-700">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'F'}
                    </div>
                    <div className="hidden xl:flex flex-col text-xs leading-tight">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {profile?.full_name || 'Founder'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{profile?.organization || 'Founder'}</p>
                      </div>

                      <Link
                        to="/profile"
                        id="dropdown-link-profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Founder Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        id="dropdown-link-settings"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings & Supabase</span>
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        id="dropdown-btn-logout"
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="nav-btn-login"
                  className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  id="nav-btn-signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all hover:shadow-md"
                >
                  Start Validating
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle id="nav-theme-toggle-mobile" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="mobile-menu-toggle-btn"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/new-analysis"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold"
                >
                  Validate New Idea
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Settings & DB
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold"
                >
                  Start Validating Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
