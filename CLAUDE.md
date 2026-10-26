# Project: Bahushruth's Personal Portfolio

## Tech Stack

- React 19 + Vite 8
- React Router v7 (client-side routing)
- Recharts (bar charts in blog posts)
- marked + KaTeX (markdown articles with math)
- Deployed to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- SPA routing handled by `public/404.html` redirect trick

## Folder Structure

```
├── index.html              # Vite entry point (has SPA redirect script)
├── vite.config.js
├── package.json
├── public/
│   ├── potato.svg          # Site favicon/logo
│   ├── .nojekyll           # Tells GitHub Pages not to use Jekyll
│   ├── 404.html            # SPA redirect for GitHub Pages
│   └── articles/           # Markdown articles fetched at runtime
│       └── why-this-site-exists.md
├── src/
│   ├── main.jsx            # Entry point, BrowserRouter wrapper
│   ├── App.jsx             # Route definitions
│   ├── styles.css          # Single stylesheet for entire site
│   ├── components/
│   │   ├── Nav.jsx         # Top nav (potato logo + Articles link)
│   │   ├── Footer.jsx      # Email, social links, copyright
│   │   └── Timeline.jsx    # Interactive career timeline with scroll animations
│   └── pages/
│       ├── Home.jsx        # Hero + Timeline
│       ├── Articles.jsx    # Article listing page
│       ├── Article.jsx     # Markdown article renderer (fetches from /articles/*.md)
│       └── VJEPABlog.jsx   # V-JEPA 2 deep dive (React component, not markdown)
└── .github/workflows/
    └── deploy.yml          # Build + deploy to GitHub Pages on push to main
```

## Design System

- Background: dark charcoal `#0f0f0f`, secondary `#161616`, tertiary `#1c1c1c`
- Text: off-white `#e0e0e0`, secondary `#909090`, muted `#585858`
- Borders: `#222222`
- Cards/code blocks: `#0a0a0a` bg
- Font: system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- Monospace: `Monaco, Menlo, "Ubuntu Mono", monospace`
- Tag colors (GitHub dark theme palette): green `#7ee787`, blue `#79c0ff`, orange `#ffa657`, purple `#d2a8ff`, pink `#f778ba`, red `#ff7b72`
- Syntax highlighting: keywords `#ff7b72`, strings `#a5d6ff`, comments `#8b949e`, functions `#d2a8ff`, numbers `#79c0ff`, properties `#7ee787`

## Adding Articles

Two types of articles:

1. **Markdown articles**: Create `public/articles/your-slug.md` with frontmatter (title, date, readtime, tags). Add entry to `ARTICLES` array in `src/pages/Articles.jsx`. Rendered by `Article.jsx`.

2. **Rich React articles** (like the V-JEPA blog): Create a component in `src/pages/`, add a route in `App.jsx` (before the `:slug` catch-all), add entry to `ARTICLES` array.

## Blog Writing Style (updated October 2026)

Recent published posts are the source of truth. Read `EngramBlog.jsx` for the current editorial style, `DSparkBlog.jsx` for first-principles explanations and interactive demonstrations, and `RadioBlog.jsx` for personal engineering investigations before drafting. Do not infer the voice from an old markdown post alone.

### Editorial approach

- For personal engineering posts, start from the authors actual goal when requested. A first-person opening is welcome. Do not force a TLDR ahead of the story.
- Center technical investigations on the causal mechanism: what requirement failed, what changed, and why that change addresses it. Downloading a package and inspecting it are methods, not the explanation. Minor debugging mistakes should not become the thesis unless the author asks for that angle.

- Lead with the mechanism or a concrete thesis. The Engram post uses a compact `tldr.` in the hero. Use that when it gives readers the argument upfront.
- Explain the underlying constraint, then show why the proposed solution changes it. First principles means a useful causal explanation, not an introductory glossary.
- Use connected paragraphs with varied sentence lengths. A short paragraph can land a point, but do not turn every sentence into a slogan.
- Be conversational and technically specific. Casual language and occasional swearing should come from the story, not a quota. Do not manufacture slang to impersonate the author.
- Personal work should describe what we observed, changed and learned. Credit upstream authors. Clearly distinguish logs, direct tests, inference and untested claims without repeating a disclaimer after every paragraph.
- Use numbers and source references where they support the argument. Move long hashes and raw diagnostic dumps out of the main narrative unless the bytes themselves matter.
- Explain acronyms or unfamiliar concepts when the reader needs them. Do not apply blanket prohibitions.
- Existing posts often omit apostrophes and use lowercase headings. Follow their natural cadence without deliberately introducing grammatical errors or banning normal punctuation.
- No canned opening or closing, forced analogies, or inflated claims. End on the technical implication or the unresolved experiment.

### Presentation

- Substantial technical posts use a dedicated React page, not the generic markdown renderer. Reuse `blog-main`, `blog-hero-layout`, `blog-title`, `blog-body`, `blog-section`, `blog-section-tag` and `blog-p`.
- Headings are descriptive, lowercase and usually unnumbered. The previous mandatory `01 — topic` format is obsolete.
- Reuse `Fade`, `Fig`, `PaperFig` and `CodeBlock` from `BlogPrimitives.jsx`. Reuse existing typography and spacing before adding scoped CSS.
- Use `blog-hl` for a small number of important phrases and `blog-p--key` for central deductions. Do not highlight whole sections.
- Diagrams and interactive figures should teach the actual mechanism or expose a tradeoff. No decorative dashboards or invented measurements. Label illustrative data and distinguish it from observed results.
- Give evidence images useful captions and alt text. Preserve their aspect ratio if cropping would remove evidence.
- Code should be short, explained and tied to a source file or log in its caption. Use the shared syntax-highlighted CodeBlock.
- Prose is the default. Lists are appropriate for references or an index, and tables when comparisons need them. There is no blanket ban on lists, emphasis or semantic headings.
- Link primary sources near technical claims and use the existing `blog-refs` treatment for references.

### Integration and verification

- Add the rich article route before `:slug` in `src/App.jsx`.
- Keep `src/pages/Articles.jsx` and `scripts/prerender-meta.mjs` aligned with the title, description and image.
- Run the production build and inspect the actual page at desktop and narrow widths. Check diagrams, code overflow and figure readability.
- A draft remains local until publication is requested. Preserve unrelated work.
