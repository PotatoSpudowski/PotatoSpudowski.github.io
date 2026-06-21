import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import SortBar from '../components/SortBar'

const BOOKS = [
  {
    title: 'Thinking in Bets',
    author: 'Annie Duke',
    cover: '/books/thinking-in-bets.jpg',
    tags: ['decision-making', 'psychology', 'poker'],
    slug: 'thinking-in-bets',
    review: 'life is poker not chess. good decisions can have bad outcomes and thats fine. changed how i think about uncertainty.',
  },
  {
    title: 'The Art of Doing Science and Engineering',
    author: 'Richard Hamming',
    cover: '/books/hamming.jpg',
    tags: ['science', 'engineering', 'career'],
    slug: 'the-art-of-doing-science-and-engineering',
    review: 'skip the math chapters. the meta-lessons on what separates great work from good work are worth rereading every year.',
  },
  {
    title: 'The Mom Test',
    author: 'Rob Fitzpatrick',
    cover: '/books/mom-test.jpg',
    tags: ['startups', 'user-research', 'product'],
    slug: 'the-mom-test',
    review: 'never tell people your idea. only ask about their problems. everyone lies to you otherwise, especially your mom.',
  },
  {
    title: 'Neuromancer',
    author: 'William Gibson',
    cover: '/books/neuromancer.png',
    tags: ['science-fiction', 'cyberpunk', 'technology'],
    slug: 'neuromancer',
    review: 'invented cyberpunk in 1984. predicted the internet, VR, corporate megacities. dense poetic writing. read this one first.',
  },
  {
    title: 'Snow Crash',
    author: 'Neal Stephenson',
    cover: '/books/snow-crash.jpg',
    tags: ['science-fiction', 'cyberpunk', 'technology'],
    slug: 'snow-crash',
    review: 'coined the metaverse. first half is some of the best sci-fi ever written. second half gets weird but who cares.',
  },
  {
    title: 'Blue Ocean Strategy',
    author: 'W. Chan Kim & Renée Mauborgne',
    cover: '/books/blue-ocean.jpg',
    tags: ['strategy', 'business', 'startups'],
    slug: 'blue-ocean-strategy',
    review: 'dont compete, create new markets. framework is simple. book is padded. worth skimming not reading cover to cover.',
  },
  {
    title: 'Chip War',
    author: 'Chris Miller',
    cover: '/books/chip-war.png',
    tags: ['technology', 'geopolitics', 'semiconductors'],
    slug: 'chip-war',
    review: 'a tiny island controls the future of everything. makes you realize how fragile the global chip supply chain actually is.',
  },
  {
    title: 'The Innovator\'s Dilemma',
    author: 'Clayton Christensen',
    cover: '/books/innovators-dilemma.jpg',
    tags: ['innovation', 'business', 'strategy'],
    slug: 'the-innovators-dilemma',
    review: 'why good companies die. they listen to customers too well and miss the shitty-but-disruptive thing that eats them.',
  },
  {
    title: 'Diary of a Wimpy Kid: Rodrick Rules',
    author: 'Jeff Kinney',
    cover: '/books/rodrick-rules.jpg',
    tags: ['fiction', 'comedy', 'ya'],
    slug: 'rodrick-rules',
    review: 'best book in the series and i will die on that hill.',
  },
]

const SORTED_BOOKS = [...BOOKS].sort((a, b) => a.title.localeCompare(b.title))
const ALL_TAGS = [...new Set(BOOKS.flatMap(b => b.tags))].sort()

const SORT_OPTIONS = [
  { value: 'title-asc', label: 'a → z' },
  { value: 'title-desc', label: 'z → a' },
  { value: 'author-asc', label: 'author' },
]

export default function Books() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('title-asc')
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')
  const highlightRef = useRef(null)

  const filtered = useMemo(() => {
    const result = SORTED_BOOKS.filter(b => {
      const matchesSearch = !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.tags.some(t => t.includes(search.toLowerCase()))
      const matchesTag = !activeTag || b.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'title-asc': return a.title.localeCompare(b.title)
        case 'title-desc': return b.title.localeCompare(a.title)
        case 'author-asc': return a.author.localeCompare(b.author)
        default: return 0
      }
    })

    return result
  }, [search, activeTag, sort])

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
          <SortBar options={SORT_OPTIONS} active={sort} onChange={setSort} />
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
