import { Link } from 'react-router-dom'

const ARTICLES = [
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    date: 'March 2026',
    readtime: '25 min read',
    excerpt: 'Architecture, loss, training, fine-tuning, robot deployment. Walked through the actual codebase so you don\'t have to read 15 files yourself.',
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
              <p className="article-excerpt">{a.excerpt}</p>
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
