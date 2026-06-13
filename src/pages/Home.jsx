import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ROLES = ['ML Engineer', 'Ex founder', 'FPV drone pilot']

function CyclingRole() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % ROLES.length)
        setVisible(true)
      }, 200)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  return (
    <span style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}>
      {ROLES[idx]}
    </span>
  )
}

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const PINNED = [
  {
    slug: 'abliteration',
    title: 'how to surgically remove the ability of LLMs to refuse',
    date: 'May 2026',
    readtime: '30 min read',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    date: 'April 2026',
    readtime: '20 min read',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 2026',
    readtime: '25 min read',
  },
]

export default function Home() {
  return (
    <main className="main home-main">
      <div className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-heading">Hi, my name is Bahushruth</h1>
          <p className="home-roles"><CyclingRole /></p>

          <p className="home-bio">
            i build ML systems that ship. not demos, not research prototypes — things that run at scale and keep running when you stop looking. spent years doing MLOps for millions of users, did research at IBM, built a YC-backed startup from scratch. now running Cassian, trying to fix the part of commercial lending that still runs on faxes and spreadsheets. when im not doing that im flying FPV through gaps that probably should have hurt more than they did.
          </p>

          <div className="home-socials">
            <a href="https://github.com/bahushruth" target="_blank" rel="noreferrer" className="home-social" title="GitHub">
              <GithubIcon />
            </a>
            <a href="https://x.com/Bahushruth" target="_blank" rel="noreferrer" className="home-social" title="X / Twitter">
              <XIcon />
            </a>
            <a href="https://www.linkedin.com/in/bahushruth/" target="_blank" rel="noreferrer" className="home-social" title="LinkedIn">
              <LinkedinIcon />
            </a>
          </div>
        </div>

        <div className="home-hero-photo">
          <img src="/profile.jpg" alt="Bahushruth" className="home-photo" />
        </div>
      </div>

      <div className="home-pinned">
        <p className="home-pinned-label">recommended read</p>
        <div className="home-pinned-list">
          {PINNED.map(post => (
            <Link key={post.slug} to={`/articles/${post.slug}`} className="home-pinned-card">
              <span className="home-pinned-title">{post.title}</span>
              <span className="home-pinned-meta">{post.date} &middot; {post.readtime}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
