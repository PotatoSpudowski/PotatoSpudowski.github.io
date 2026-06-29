import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Articles from './pages/Articles'
import Article from './pages/Article'
import VJEPABlog from './pages/VJEPABlog'
import RadioBlog from './pages/RadioBlog'
import AbliterationBlog from './pages/AbliterationBlog'
import CosFlyTrackBlog from './pages/CosFlyTrackBlog'
import DSparkBlog from './pages/DSparkBlog'
import Books from './pages/Books'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="app-layout">
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/radio-security-from-scratch" element={<RadioBlog />} />
        <Route path="/articles/abliteration" element={<AbliterationBlog />} />
        <Route path="/articles/vjepa2-deep-dive" element={<VJEPABlog />} />
        <Route path="/articles/cosfly-track" element={<CosFlyTrackBlog />} />
        <Route path="/articles/dspark" element={<DSparkBlog />} />
        <Route path="/books" element={<Books />} />
        <Route path="/articles/:slug" element={<Article />} />
      </Routes>
      <Footer />
    </div>
  )
}
