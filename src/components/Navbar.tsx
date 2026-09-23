import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { ThemeToggle } from './ThemeToggle';
import { Z_INDEX } from '../constants/zIndex';
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
  Mic,
  Home,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { selectedCompareIds } = useAnalysis();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Handle closing menus on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
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
        { name: 'Features', path: '/features' },
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'About', path: '/about' },
      ];

  return (
    <header className={`sticky top-0 ${Z_INDEX.GLOBAL_NAV} bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - ALWAYS navigates to "/" */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              id="nav-brand-logo"
              aria-label="Go to VentureLens AI home"
              title="Go to VentureLens AI home"
            >
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
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
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
          <div className="hidden md:flex items-center gap-2.5">
            {/* Live Voice Advisor Quick Launch */}
            <button
              id="nav-voice-advisor-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-advisor', { detail: { mode: 'voice' } }));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs cursor-pointer"
              title="Launch Live Voice AI Advisor (Gemini 3.8 Live)"
              aria-label="Launch Live Voice AI Advisor"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Voice Advisor</span>
              <span className="bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-[9px] font-extrabold px-1 rounded uppercase tracking-wider">
                Live
              </span>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle id="nav-theme-toggle-desktop" />

            {user ? (
              <>
                <Link
                  to="/new-analysis"
                  id="nav-btn-new-analysis"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Validate Idea</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    id="nav-user-dropdown-btn"
                    aria-label="Open user menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
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
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="nav-user-dropdown-btn"
                      className={`absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 ${Z_INDEX.NAV_DROPDOWN} animate-in fade-in zoom-in-95 duration-100`}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {profile?.organization || 'Founder'}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        id="dropdown-link-profile"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>Founder Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        id="dropdown-link-settings"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        id="dropdown-btn-logout"
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer"
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
                  to="/new-analysis"
                  id="nav-btn-signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all hover:shadow-md"
                >
                  Validate My Idea
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
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-1">
            {/* Global Home link in mobile menu */}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {navLinks.map((link) => {
              const Icon = (link as any).icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {/* Mobile AI Advisor (Chat) button */}
            <button
              type="button"
              id="mobile-nav-ai-advisor-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-advisor', { detail: { mode: 'chat' } }));
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Launch AI Advisor</span>
            </button>

            {/* Mobile Voice Advisor button */}
            <button
              type="button"
              id="mobile-nav-voice-advisor-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-advisor', { detail: { mode: 'voice' } }));
              }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Launch Voice Advisor (Gemini 3.8 Live)</span>
            </button>

            {user ? (
              <>
                <Link
                  to="/new-analysis"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Validate Idea</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Founder Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/new-analysis"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  Validate My Idea
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
