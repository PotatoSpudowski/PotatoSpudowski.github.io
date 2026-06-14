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
    title: 'Blue Ocean Strategy',
    author: 'W. Chan Kim & Renée Mauborgne',
    cover: '/books/blue-ocean.jpg',
    tags: ['strategy', 'business', 'startups'],
    slug: 'blue-ocean-strategy',
    review: 'the idea is that instead of competing in existing markets (red oceans full of sharks), you should create new market spaces where theres no competition (blue oceans). uses examples like cirque du soleil and southwest airlines. the framework is simple but the book is padded out. worth skimming.',
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
    title: 'The Hard Thing About Hard Things',
    author: 'Ben Horowitz',
    cover: '/books/hard-thing.jpg',
    tags: ['startups', 'leadership', 'business'],
    slug: 'the-hard-thing-about-hard-things',
    review: 'ben horowitz built opsware and sold it to HP for 1.6B. this book is about the messy parts of running a company that business books dont talk about. firing friends, managing layoffs, keeping morale up when everything is on fire. no frameworks or formulas, just war stories and honest advice.',
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
        <input
          type="text"
          className="blog-search"
          placeholder="search books..."
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
