import { Link } from 'react-router-dom'

const ARTICLES = [
  {
    slug: 'how-i-keep-winning',
    title: 'how i keep winning',
    date: 'May 2026',
    readtime: '8 min read',
    excerpt: '',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    date: 'April 2026',
    readtime: '20 min read',
    excerpt: '',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 2026',
    readtime: '25 min read',
    excerpt: '',
  },
]

export default function Articles() {
  return (
    <main className="main">
      <h1 className="page-title">Articles</h1>
      <div className="article-list">
        {ARTICLES.map(a => (
          <article key={a.slug} className="article-item">
            <Link to={`/articles/${a.slug}`} className="article-link">
              <h2 className="article-title">{a.title}</h2>
              <p className="article-meta">{a.date} &middot; {a.readtime}</p>
              {a.excerpt && <p className="article-excerpt">{a.excerpt}</p>}
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
