import { useState, useRef, useEffect } from 'react'
import { Highlight } from 'prism-react-renderer'

const theme = {
  plain: { color: '#e6edf3', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#8b949e', fontStyle: 'italic' } },
    { types: ['keyword', 'operator', 'boolean'], style: { color: '#ff7b72' } },
    { types: ['string', 'char', 'attr-value'], style: { color: '#a5d6ff' } },
    { types: ['function', 'class-name'], style: { color: '#d2a8ff' } },
    { types: ['number'], style: { color: '#79c0ff' } },
    { types: ['property', 'constant', 'symbol'], style: { color: '#7ee787' } },
    { types: ['builtin', 'tag'], style: { color: '#ff7b72' } },
    { types: ['attr-name'], style: { color: '#79c0ff' } },
    { types: ['punctuation'], style: { color: '#8b949e' } },
    { types: ['decorator', 'annotation', 'variable', 'parameter'], style: { color: '#ffa657' } },
  ],
}

export function Fade({ children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.08 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {children}
    </div>
  )
}

export function CodeBlock({ language = 'python', children }) {
  const [copied, setCopied] = useState(false)
  const code = (typeof children === 'string' ? children : String(children)).trim()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="blog-code-block">
      <button className="blog-code-copy" onClick={handleCopy} title="Copy code">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        )}
      </button>
      <Highlight code={code} language={language} theme={theme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="blog-code-pre">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, j) => <span key={j} {...getTokenProps({ token })} />)}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

export function Fig({ children, cap }) {
  return (
    <div className="blog-fig">
      <div className="blog-fig-inner">{children}</div>
      {cap && <div className="blog-fig-cap">{cap}</div>}
    </div>
  )
}

export function PaperFig({ src, alt }) {
  return <img src={src} alt={alt || ''} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
}
