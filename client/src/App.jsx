import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for fast initial bundle and instant page load on mobile
const Home = lazy(() => import('./pages/Home'));
const TodaySlots = lazy(() => import('./pages/TodaySlots'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserLogin = lazy(() => import('./pages/UserLogin'));
const PaymentStatus = lazy(() => import('./pages/PaymentStatus'));
const Profile = lazy(() => import('./pages/Profile'));
const DropListPage = lazy(() => import('./pages/DropListPage'));
const RequirementsPage = lazy(() => import('./pages/RequirementsPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function PageLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#c084fc',
          animation: 'spin 0.75s linear infinite',
        }}
      />
    </div>
  );
}

function MainLayout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? "admin-main" : "main-content has-bottom-nav"}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <MainLayout>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/slots" element={<TodaySlots />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/leaderboard" element={<Navigate to="/rankings" replace />} />
            <Route path="/tier" element={<Navigate to="/" replace />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wallet" element={<Navigate to="/profile" replace />} />
            <Route path="/droplist" element={<DropListPage />} />
            <Route path="/droplist/:slotId" element={<DropListPage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/results" element={<ResultsPage />} />

            {/* User Auth Routes & Aliases */}
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/login" element={<Navigate to="/user/login" replace />} />
            <Route path="/register" element={<Navigate to="/user/login" replace />} />
            <Route path="/signup" element={<Navigate to="/user/login" replace />} />
            <Route path="/signin" element={<Navigate to="/user/login" replace />} />

            {/* Matches & Slots Aliases */}
            <Route path="/my-matches" element={<Navigate to="/slots?tab=my" replace />} />
            <Route path="/matches" element={<Navigate to="/slots" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </Router>
  );
}

export default App;
