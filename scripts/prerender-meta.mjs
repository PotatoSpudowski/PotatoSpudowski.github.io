/**
 * Postbuild: emit a static index.html per article route with correct
 * Open Graph / Twitter card meta, so link previews work on GitHub Pages
 * (crawlers do not run JavaScript, so SPA-injected meta is invisible to them).
 *
 * Each dist/articles/<slug>/index.html is the normal app HTML with the
 * <title>, description, og:* and twitter:* tags swapped for the article's.
 * GitHub Pages serves it at /articles/<slug>; the React router renders the
 * same route client-side, so humans and crawlers both get the right page.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SITE = 'https://potatospudowski.github.io'
const DIST = new URL('../dist/', import.meta.url).pathname

const ARTICLES = [
  {
    slug: 'abliteration-2',
    title: 'abliteration part 2: and on the eighth day, god added hella norms',
    description: 'gemma 4 repairs every edit you make. four norms, per-layer embeddings, shared keys and values. this is how an automatic search beat the defenses: 62% refusals down to 12%.',
    image: '/abliteration-2-hero.jpg',
  },
  {
    slug: 'dspark',
    title: 'DSpark: speculative decoding that actually works in prod',
    description: 'speculative decoding that survives production traffic.',
    image: '/dspark-hero.png',
  },
  {
    slug: 'abliteration',
    title: 'surgically removing refusal tendencies in LLMs',
    description: 'refusal is a direction in the residual stream. measure it, project it out, keep the norms. 0% refusals, benchmarks intact.',
    image: '/abliteration-hero.jpg',
  },
  {
    slug: 'radio-security-from-scratch',
    title: 'building a secure radio link on two esp32s',
    description: 'a secure radio link built from scratch on two esp32s.',
    image: '/radio-hero.png',
  },
  {
    slug: 'vjepa2-deep-dive',
    title: 'what the fuck is a JEPA?',
    description: 'a deep dive into joint embedding predictive architectures.',
    image: '/vjepa-hero.jpg',
  },
]

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

function metaFor({ slug, title, description, image }) {
  const url = `${SITE}/articles/${slug}`
  const imageUrl = `${SITE}${image}`
  return `<title>${title} — Bahushruth CS</title>
    <meta name="description" content="${description}">
    <link rel="icon" type="image/svg+xml" href="/potato.svg">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Bahushruth CS">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1672">
    <meta property="og:image:height" content="941">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">`
}

// Replace everything from <title> up to (not including) the SPA redirect script.
const HEAD_RE = /<title>[\s\S]*?<!-- SPA redirect handler for GitHub Pages -->/

for (const article of ARTICLES) {
  const html = template.replace(HEAD_RE, `${metaFor(article)}\n\n    <!-- SPA redirect handler for GitHub Pages -->`)
  const dir = join(DIST, 'articles', article.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  console.log(`articles/${article.slug}/index.html`)
}

console.log(`done: ${ARTICLES.length} article pages with link previews`)
