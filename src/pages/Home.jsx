import { Link } from 'react-router-dom'

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
    title: 'surgically removing refusal tendencies in LLMs',
    date: 'June 13, 2026',
    readtime: '30 min read',
    image: '/abliteration-hero.jpg',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    date: 'April 13, 2026',
    readtime: '20 min read',
    image: '/radio-hero.png',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 26, 2026',
    readtime: '25 min read',
    image: '/vjepa-hero.jpg',
  },
  {
    slug: 'cosfly-track',
    title: 'training drones to track things without crashing',
    date: 'June 21, 2026',
    readtime: '15 min read',
    image: '/cosfly-hero.jpg',
  },
]

const RECOMMENDED_BOOKS = [
  {
    title: 'Thinking in Bets',
    author: 'Annie Duke',
    cover: '/books/thinking-in-bets.jpg',
    slug: 'thinking-in-bets',
  },
  {
    title: 'The Art of Doing Science and Engineering',
    author: 'Richard Hamming',
    cover: '/books/hamming.jpg',
    slug: 'the-art-of-doing-science-and-engineering',
  },
  {
    title: 'Neuromancer',
    author: 'William Gibson',
    cover: '/books/neuromancer.png',
    slug: 'neuromancer',
  },
]

export default function Home() {
  return (
    <main className="main home-main">
      <div className="home-hero home-dict">
        <div className="home-dict-entry">
          <div className="home-dict-header">
            <p className="home-dict-word">Ba·hu·shruth</p>
            <button className="home-dict-speak" onClick={() => new Audio('/bahushruth.mp3').play()} title="Listen to pronunciation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            </button>
          </div>
          <p className="home-dict-phonetic">/bɑː.huː.ʃruːt/</p>
          <p className="home-dict-pos">noun, Sanskrit</p>
          <div className="home-dict-defs">
            <div className="home-dict-def">
              <span className="home-dict-num">1.</span> a person of wide-ranging knowledge or learning; a polymath. <span className="home-dict-etym">[Skt. <i>bahu</i> many, much + <i>śruta</i> heard, learned. lit. "one who has heard much."]</span>
            </div>
            <div className="home-dict-def">
              <span className="home-dict-num">2.</span> <span className="home-dict-informal">informal</span> see <span className="home-dict-aka">Bunty</span>
            </div>
            <div className="home-dict-def">
              <span className="home-dict-num">3.</span> ML Engineer. Ex Founder. FPV Drone Pilot.
            </div>
          </div>
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
      </div>

      <div className="home-pinned">
        <p className="home-pinned-label">recommended read</p>
        <div className="home-pinned-list">
          {PINNED.map(post => (
            <Link key={post.slug} to={`/articles/${post.slug}`} className="home-pinned-card">
              {post.image && <img src={post.image} alt="" className="home-pinned-img" />}
              <div className="home-pinned-text">
                <span className="home-pinned-title">{post.title}</span>
                <span className="home-pinned-meta">{post.date} &middot; {post.readtime}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/articles" className="view-all">view all articles</Link>
      </div>

      <div className="home-books">
        <p className="home-pinned-label">recommended books</p>
        <div className="home-pinned-list">
          {RECOMMENDED_BOOKS.map(book => (
            <Link key={book.title} to={`/books?highlight=${book.slug}`} className="home-pinned-card home-book-card">
              {book.cover && <img src={book.cover} alt="" className="home-book-img" />}
              <div className="home-pinned-text">
                <span className="home-pinned-title">{book.title}</span>
                <span className="home-pinned-meta">{book.author}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/books" className="view-all">view all books</Link>
      </div>
    </main>
  )
}
