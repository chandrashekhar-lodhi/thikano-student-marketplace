import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SupabaseSetupBanner } from '../components/SupabaseSetupBanner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isFullScreenMap = location.pathname === '/map';

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5EF] text-[#202820]">
      {!isFullScreenMap && <SupabaseSetupBanner />}
      <Navbar />
      <main className="flex-1">{children}</main>
      {!isFullScreenMap && <Footer />}
    </div>
  );
}
