import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { MapsProvider } from './components/MapsProvider';
import { MainLayout } from './layouts/MainLayout';
import { IntroSplash } from './components/IntroSplash';
import { ProtectedRoute } from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(({ ExplorePage }) => ({ default: ExplorePage })));
const MapDiscoveryPage = lazy(() =>
  import('./pages/MapDiscoveryPage').then(({ MapDiscoveryPage }) => ({ default: MapDiscoveryPage }))
);
const PropertyDetailsPage = lazy(() =>
  import('./pages/PropertyDetailsPage').then(({ PropertyDetailsPage }) => ({ default: PropertyDetailsPage }))
);
const AuthPage = lazy(() => import('./pages/AuthPage').then(({ AuthPage }) => ({ default: AuthPage })));
const StudentDashboardPage = lazy(() =>
  import('./pages/StudentDashboardPage').then(({ StudentDashboardPage }) => ({ default: StudentDashboardPage }))
);
const OwnerDashboardPage = lazy(() =>
  import('./pages/OwnerDashboardPage').then(({ OwnerDashboardPage }) => ({ default: OwnerDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then(({ AdminDashboardPage }) => ({ default: AdminDashboardPage }))
);
const AboutPage = lazy(() => import('./pages/AboutPage').then(({ AboutPage }) => ({ default: AboutPage })));
const ContactPage = lazy(() => import('./pages/LegalPage').then(({ ContactPage }) => ({ default: ContactPage })));
const PrivacyPage = lazy(() => import('./pages/LegalPage').then(({ PrivacyPage }) => ({ default: PrivacyPage })));
const SetupGuidePage = lazy(() =>
  import('./pages/LegalPage').then(({ SetupGuidePage }) => ({ default: SetupGuidePage }))
);
const TermsPage = lazy(() => import('./pages/LegalPage').then(({ TermsPage }) => ({ default: TermsPage })));

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <MapsProvider>
          <BrowserRouter>
            <IntroSplash />
            {quotaExceeded && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
                <span>
                  Google Maps Platform quota reached. If you are the app owner, visit{' '}
                  <a
                    href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-amber-950 hover:text-amber-800"
                  >
                    maps developer site
                  </a>{' '}
                  for instructions to update your account.
                </span>
              </div>
            )}
            <MainLayout>
              <Suspense
                fallback={
                  <div className="max-w-7xl mx-auto px-4 py-20 text-center" role="status" aria-live="polite">
                    Loading page…
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/map" element={<MapDiscoveryPage />} />
                  <Route path="/property/:id" element={<PropertyDetailsPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/setup-guide" element={<SetupGuidePage />} />

                  <Route
                    path="/student/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['student', 'owner', 'admin']}>
                        <StudentDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/owner/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'admin']}>
                        <OwnerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </MainLayout>
          </BrowserRouter>
        </MapsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
