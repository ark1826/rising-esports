import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import TodaySlots from './pages/TodaySlots'
import Rankings from './pages/Rankings'
import Tournaments from './pages/Tournaments'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/slots" element={<TodaySlots />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/tournaments" element={<Tournaments />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
