import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import TodaySlots from './pages/TodaySlots'
import Rankings from './pages/Rankings'
import Tier from './pages/Tier'
import Tournaments from './pages/Tournaments'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/slots" element={<TodaySlots />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/tier" element={<Tier />} />
            <Route path="/tournaments" element={<Tournaments />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
