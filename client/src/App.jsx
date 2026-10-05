import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import TodaySlots from './pages/TodaySlots'
import Rankings from './pages/Rankings'
import Tournaments from './pages/Tournaments'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import UserLogin from './pages/UserLogin'
import PaymentStatus from './pages/PaymentStatus'
import Profile from './pages/Profile'
import DropListPage from './pages/DropListPage'
import BottomNav from './components/BottomNav'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
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
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App
