import { useMemo } from 'react'

export default function Footer() {
  const email = useMemo(() => {
    const u = 'bahushruth.bahushruth'
    const d = 'gmail.com'
    return { href: `mailto:${u}@${d}`, text: `${u}@${d}` }
  }, [])

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-reach">
          Want to reach out? Drop me an email at{' '}
          <a className="footer-link" href={email.href}>{email.text}</a>{' '}
          or DM me on{' '}
          <a href="https://x.com/Bahushruth" target="_blank" rel="noreferrer" className="footer-link">X/Twitter</a>.
          I check both.
        </p>
        <div className="footer-bottom">
          <p className="footer-text">&copy; 2026 Bahushruth CS</p>
          <div className="footer-social">
            <a href="https://github.com/bahushruth" target="_blank" rel="noreferrer" className="footer-link">GitHub</a>
            <a href="https://x.com/Bahushruth" target="_blank" rel="noreferrer" className="footer-link">X/Twitter</a>
            <a href="https://www.linkedin.com/in/bahushruth/" target="_blank" rel="noreferrer" className="footer-link">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
