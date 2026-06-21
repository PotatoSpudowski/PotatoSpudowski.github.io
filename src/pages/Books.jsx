import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const BOOKS = [
  {
    title: 'Thinking in Bets',
    author: 'Annie Duke',
    cover: '/books/thinking-in-bets.jpg',
    tags: ['decision-making', 'psychology', 'poker'],
    slug: 'thinking-in-bets',
    review: 'annie duke is a professional poker player and this book is about making decisions when you dont have all the information. the core idea is that life is more like poker than chess. result quality and decision quality arent the same thing. good framework for thinking about uncertainty.',
  },
  {
    title: 'The Art of Doing Science and Engineering',
    author: 'Richard Hamming',
    cover: '/books/hamming.jpg',
    tags: ['science', 'engineering', 'career'],
    slug: 'the-art-of-doing-science-and-engineering',
    review: 'hamming taught a course at the naval postgraduate school and this is basically the book version. covers how to think about research and technical work. chapters on filters, coding, simulation, and math are fine but the real value is the meta-lessons about style of thinking and what makes great work.',
  },
  {
    title: 'The Mom Test',
    author: 'Rob Fitzpatrick',
    cover: '/books/mom-test.jpg',
    tags: ['startups', 'user-research', 'product'],
    slug: 'the-mom-test',
    review: 'short book on how to talk to customers. the core lesson is that everyone lies to you, especially your mom. you should never tell people about your idea, only ask about their life and problems. good rules for conducting customer interviews without leading the witness.',
  },
  {
    title: 'Neuromancer',
    author: 'William Gibson',
    cover: '/books/neuromancer.png',
    tags: ['science-fiction', 'cyberpunk', 'technology'],
    slug: 'neuromancer',
    review: 'the book that invented cyberpunk. case is a washed-up console cowboy (hacker) who gets one last job to pull off the ultimate hack. gibson wrote this in 1984 and somehow predicted the internet, virtual reality, and corporate-dominated megacities. the writing is dense and poetic, not your typical sci-fi. if you only read one cyberpunk novel make it this one.',
  },
  {
    title: 'Snow Crash',
    author: 'Neal Stephenson',
    cover: '/books/snow-crash.jpg',
    tags: ['science-fiction', 'cyberpunk', 'technology'],
    slug: 'snow-crash',
    review: 'hiro protagonist delivers pizza and hacks the metaverse. neal stephenson wrote this in 1992 and basically coined the term metaverse. its a satire of corporate america, religion, and language theory wrapped in a ridiculous action plot. the first half is some of the best sci-fi ever written. the second half gets weird but who cares.',
  },
  {
    title: 'Blue Ocean Strategy',
    author: 'W. Chan Kim & Renée Mauborgne',
    cover: '/books/blue-ocean.jpg',
    tags: ['strategy', 'business', 'startups'],
    slug: 'blue-ocean-strategy',
    review: 'the idea is that instead of competing in existing markets (red oceans full of sharks), you should create new market spaces where theres no competition (blue oceans). uses examples like cirque du soleil and southwest airlines. the framework is simple but the book is padded out. worth skimming.',
  },
  {
    title: 'Chip War',
    author: 'Chris Miller',
    cover: '/books/chip-war.png',
    tags: ['technology', 'geopolitics', 'semiconductors'],
    slug: 'chip-war',
    review: 'the history of semiconductors and why chips are the most critical technology on the planet. traces the industry from the transistor to taiwans tsmc dominance and the us-china chip war. makes you realize how fragile the global supply chain is and why a tiny island in the pacific controls the future of everything.',
  },
  {
    title: 'The Innovator\'s Dilemma',
    author: 'Clayton Christensen',
    cover: '/books/innovators-dilemma.jpg',
    tags: ['innovation', 'business', 'strategy'],
    slug: 'the-innovators-dilemma',
    review: 'explains why successful companies fail. they do everything right by listening to customers and investing in sustaining innovations, but then get blindsided by disruptive technologies that start out worse but eventually take over. disk drive industry is the main case study. the framework applies to a lot of industries.',
  },
  {
    title: 'Diary of a Wimpy Kid: Rodrick Rules',
    author: 'Jeff Kinney',
    cover: '/books/rodrick-rules.jpg',
    tags: ['fiction', 'comedy', 'ya'],
    slug: 'rodrick-rules',
    review: 'honestly the best book in the series and i will die on that hill.',
  },
]

const SORTED_BOOKS = [...BOOKS].sort((a, b) => a.title.localeCompare(b.title))
const ALL_TAGS = [...new Set(BOOKS.flatMap(b => b.tags))].sort()

export default function Books() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')
  const highlightRef = useRef(null)

  const filtered = useMemo(() => {
    return SORTED_BOOKS.filter(b => {
      const matchesSearch = !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.tags.some(t => t.includes(search.toLowerCase()))
      const matchesTag = !activeTag || b.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [search, activeTag])

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight, filtered])

  return (
    <main className="main">
      <h1 className="page-title">Books</h1>

      <div className="blog-filters">
        <div className="blog-filters-row">
          <div className="blog-search-wrap">
            <svg className="blog-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="blog-search"
              placeholder="search books..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="blog-tags">
          <button
            className={`blog-tag-btn${!activeTag ? ' active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            all
          </button>
          {ALL_TAGS.map(t => (
            <button
              key={t}
              className={`blog-tag-btn${activeTag === t ? ' active' : ''}`}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="books-list">
        {filtered.length === 0 ? (
          <p className="blog-empty">no books found</p>
        ) : (
          filtered.map(b => (
            <article
              key={b.title}
              className={`book-card${highlight === b.slug ? ' book-highlighted' : ''}`}
              ref={highlight === b.slug ? highlightRef : null}
            >
              <div className="book-cover-wrap">
                <img src={b.cover} alt={b.title} className="book-cover" />
              </div>
              <div className="book-info">
                <h2 className="book-title">{b.title}</h2>
                <p className="book-author">{b.author}</p>
                <div className="book-tags">
                  {b.tags.map(t => (
                    <span key={t} className="article-tag-chip">{t}</span>
                  ))}
                </div>
                <p className="book-review">{b.review}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  )
}
