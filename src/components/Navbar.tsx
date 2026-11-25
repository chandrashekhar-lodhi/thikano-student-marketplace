import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'owner'
      ? '/owner/dashboard'
      : '/student/dashboard';

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
      isActive
        ? 'text-[#174C3A] underline underline-offset-8 decoration-2'
        : 'text-[#202820]/80 hover:text-[#174C3A] hover:underline hover:underline-offset-8'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#202820]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link to="/" aria-label="THIKANO Home" className="shrink-0">
          <Logo />
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-7">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/explore" className={navLinkClass}>
            Explore Rooms
          </NavLink>
          <NavLink to="/map" className={navLinkClass}>
            Map View
          </NavLink>
          <NavLink to="/owner/dashboard" className={navLinkClass}>
            List Your Property
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About Us
          </NavLink>
        </nav>

        {/* Zone 3: Single primary auth / dashboard zone */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="text-sm font-medium text-[#174C3A] hover:underline whitespace-nowrap shrink-0"
              >
                {user.role === 'admin'
                  ? 'Admin Panel'
                  : user.role === 'owner'
                  ? 'Owner Dashboard'
                  : 'My Dashboard'}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-[#202820] border border-[#202820]/15 rounded-lg hover:bg-[#F3F5EF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth?mode=login"
                className="text-sm font-medium text-[#202820]/85 hover:text-[#174C3A] whitespace-nowrap shrink-0"
              >
                Login
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-4 py-2 text-sm font-medium text-white bg-[#174C3A] hover:bg-[#11392B] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden p-2 rounded-lg text-[#202820] hover:bg-[#F3F5EF] cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#202820]/10 px-4 py-4 space-y-2 shadow-sm">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#202820] hover:bg-[#F3F5EF]"
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#202820] hover:bg-[#F3F5EF]"
          >
            Explore Rooms
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#202820] hover:bg-[#F3F5EF]"
          >
            Map View
          </Link>
          <Link
            to="/owner/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#202820] hover:bg-[#F3F5EF]"
          >
            List Your Property
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-medium text-[#202820] hover:bg-[#F3F5EF]"
          >
            About Us
          </Link>
          <div className="pt-3 mt-2 border-t border-[#202820]/10 flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#174C3A] text-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[#202820]/20 text-[#202820]"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium border border-[#202820]/20 text-[#202820]"
                >
                  Login
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#174C3A] text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
