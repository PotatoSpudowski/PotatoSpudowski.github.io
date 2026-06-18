import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const ARTICLES = [
  {
    slug: 'kaiba-techno-optimism',
    title: 'this man turned a weapons company into a card game company and nobody questions it',
    date: 'June 2026',
    readtime: '8 min read',
    tags: ['anime', 'tech', 'culture'],
    image: '/kaiba-hero.jpg',
  },
  {
    slug: 'abliteration',
    title: 'surgically removing refusal tendencies in LLMs',
    date: 'May 2026',
    readtime: '30 min read',
    tags: ['ml', 'llm', 'research'],
    image: '/abliteration-hero.jpg',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    date: 'April 2026',
    readtime: '20 min read',
    tags: ['hardware', 'security', 'esp32'],
    image: '/radio-hero.png',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 2026',
    readtime: '25 min read',
    tags: ['ai', 'research', 'computer-vision'],
    image: '/vjepa-hero.jpg',
  },
]

const ALL_TAGS = [...new Set(ARTICLES.flatMap(a => a.tags))].sort()

export default function Articles() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      const matchesSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some(t => t.includes(search.toLowerCase()))
      const matchesTag = !activeTag || a.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [search, activeTag])

  return (
    <main className="main">
      <h1 className="page-title">Blog</h1>

      <div className="blog-filters">
        <input
          type="text"
          className="blog-search"
          placeholder="search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
