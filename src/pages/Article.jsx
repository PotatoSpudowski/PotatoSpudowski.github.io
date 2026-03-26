import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function renderMath(html) {
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try { return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }) }
    catch { return '$$' + tex + '$$' }
  })
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }) }
    catch { return '$' + tex + '$' }
  })
  return html
}

export default function Article() {
  const { slug } = useParams()
  const [meta, setMeta] = useState({})
  const [html, setHtml] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/articles/${slug}.md`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then(text => {
        let body = text
        const m = {}
        if (text.startsWith('---')) {
          const end = text.indexOf('---', 3)
          if (end !== -1) {
            text.substring(3, end).trim().split('\n').forEach(line => {
              const idx = line.indexOf(':')
              if (idx !== -1) {
                m[line.substring(0, idx).trim()] = line.substring(idx + 1).trim()
              }
            })
            body = text.substring(end + 3).trim()
          }
        }
        setMeta(m)
        document.title = (m.title || 'Article') + ' - Bahushruth CS'
        setHtml(marked.parse(renderMath(body)))
      })
      .catch(() => setError(true))
  }, [slug])

  if (error) {
    return (
      <main className="main">
        <Link to="/articles" className="back-link">&larr; Back to articles</Link>
        <p>Article not found.</p>
      </main>
    )
  }

  const metaParts = []
  if (meta.date) metaParts.push(meta.date)
  if (meta.readtime) metaParts.push(meta.readtime)

  return (
    <main className="main">
      <Link to="/articles" className="back-link">&larr; Back to articles</Link>
      <article className="article-full">
        <div className="article-header">
          <h1 className="article-title-large">{meta.title}</h1>
          {metaParts.length > 0 && (
            <p className="article-meta-large">{metaParts.join(' \u00b7 ')}</p>
          )}
        </div>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
        {meta.tags && (
          <div className="article-tags">
            {meta.tags.split(',').map(t => (
              <span key={t.trim()} className="tag">{t.trim()}</span>
            ))}
          </div>
        )}
      </article>
    </main>
  )
}
