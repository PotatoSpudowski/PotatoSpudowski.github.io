import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SortBar from '../components/SortBar'

const ARTICLES = [
  {
    slug: 'dspark',
    title: 'speculative decoding that actually survives production traffic',
    date: 'June 29, 2026',
    dateObj: new Date(2026, 5, 29),
    readtime: '20 min read',
    tags: ['ai', 'llm', 'systems', 'research'],
    image: '/dspark-hero.png',
  },
  {
    slug: 'abliteration',
    title: 'surgically removing refusal tendencies in LLMs',
    date: 'June 13, 2026',
    dateObj: new Date(2026, 5, 13),
    readtime: '30 min read',
    tags: ['ml', 'llm', 'research'],
    image: '/abliteration-hero.jpg',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    date: 'April 13, 2026',
    dateObj: new Date(2026, 3, 13),
    readtime: '20 min read',
    tags: ['hardware', 'security', 'esp32'],
    image: '/radio-hero.png',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 26, 2026',
    dateObj: new Date(2026, 2, 26),
    readtime: '25 min read',
    tags: ['ai', 'research', 'computer-vision'],
    image: '/vjepa-hero.jpg',
  },
  {
    slug: 'cosfly-track',
    title: 'training drones to track things without crashing',
    date: 'June 21, 2026',
    dateObj: new Date(2026, 5, 21),
    readtime: '15 min read',
    tags: ['ai', 'drones', 'research', 'computer-vision'],
    image: '/cosfly-hero.jpg',
  },
]

const ALL_TAGS = [...new Set(ARTICLES.flatMap(a => a.tags))].sort()

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'newest' },
  { value: 'date-asc', label: 'oldest' },
  { value: 'title-asc', label: 'a → z' },
]

export default function Articles() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sort, setSort] = useState('date-desc')

  const filtered = useMemo(() => {
    const result = ARTICLES.filter(a => {
      const matchesSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some(t => t.includes(search.toLowerCase()))
      const matchesTag = !activeTag || a.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })

    result.sort((a, b) => {
      switch (sort) {
        case 'date-desc': return b.dateObj - a.dateObj
        case 'date-asc': return a.dateObj - b.dateObj
        case 'title-asc': return a.title.localeCompare(b.title)
        default: return 0
      }
    })

    return result
  }, [search, activeTag, sort])

  return (
    <main className="main">
      <h1 className="page-title">Blog</h1>

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
              placeholder="search posts..."
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

      <div className="article-list">
        {filtered.length === 0 ? (
          <p className="blog-empty">no posts found</p>
        ) : (
          filtered.map(a => (
            <article key={a.slug} className="article-item">
              <Link to={`/articles/${a.slug}`} className="article-link">
                {a.image && <img src={a.image} alt="" className="article-thumb" />}
                <div className="article-text">
                  <h2 className="article-title">{a.title}</h2>
                  <p className="article-meta">{a.date} &middot; {a.readtime}</p>
                  <div className="article-tags-inline">
                    {a.tags.map(t => (
                      <span key={t} className="article-tag-chip">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
    </main>
  )
}
