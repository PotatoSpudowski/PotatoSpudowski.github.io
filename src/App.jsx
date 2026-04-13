import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Articles from './pages/Articles'
import Article from './pages/Article'
import VJEPABlog from './pages/VJEPABlog'
import RadioBlog from './pages/RadioBlog'

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/radio-security-from-scratch" element={<RadioBlog />} />
        <Route path="/articles/vjepa2-deep-dive" element={<VJEPABlog />} />
        <Route path="/articles/:slug" element={<Article />} />
      </Routes>
      <Footer />
    </>
  )
}
