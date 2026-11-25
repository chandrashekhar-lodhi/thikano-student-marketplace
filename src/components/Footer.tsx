import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-[#202820] text-[#F3F5EF] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2 space-y-4">
            <Logo inverted />
            <p className="text-sm text-white/80 max-w-md leading-relaxed">
              Apni jagah, aasani se. Find Your Place. Feel at Home. Built to help students moving to
              Jabalpur discover rooms, PGs, hostels, and flats with clear rent details and direct owner contact.
            </p>
            <p className="text-xs text-[#E9A45B]">
              Initial Launch City: Jabalpur, Madhya Pradesh
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-sm font-semibold text-white">Marketplace</h3>
            <ul className="space-y-2 text-sm text-white/75">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Rooms & PGs
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">
                  Interactive Jabalpur Map
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/setup-guide" className="hover:text-white transition-colors">
                  Supabase & Launch Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-sm font-semibold text-white">Company & Legal</h3>
            <ul className="space-y-2 text-sm text-white/75">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} THIKANO. Student Accommodation Marketplace — Jabalpur, MP.</p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
