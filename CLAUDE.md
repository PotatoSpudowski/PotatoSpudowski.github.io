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

## Blog Writing Style

Match Bahushruth's voice exactly. Conversational, direct, no bullshit. Like explaining something to a smart friend over coffee.

### Voice
- First principles always. Explain WHY before HOW
- Natural swearing where it adds weight ("thats not just X, thats fucking X")
- Casual slang sparingly: "cooked", "goes hard", "wild", "insane", "ngl", "tbh"
- Analogies from everyday experience, one per concept max
- Call out what matters vs what doesnt explicitly

### Grammar
- Skip apostrophes: "dont" "its" "thats" "doesnt" "youre" "cant" "wont"
- Numbers as digits always: "3 not three", "16 layers", "75%"
- No bold text ever
- No bullet points in prose — write lists into sentences
- No ## headers in blog body — use styled section labels like "01 — the architecture"
- No sign-offs, no "in conclusion", posts just end
- Minimal punctuation. No semicolons. Rare commas. Short sentences for emphasis
- Paragraphs are the primary structure unit

### Never Do
- "delve", "utilize", "leverage", "facilitate", "comprehensive", "robust"
- "in conclusion", "to summarize", "in this article we explored"
- Emojis in blog posts
- "Note:" or "Important:" callouts
- Passive voice when active works
- Explain obvious acronyms (GPU, API, LLM, SOTA, EMA)
- "without further ado", "lets dive in"
- Start a blog post with "I"

### Code Blocks
- Always have a filename/path label
- Explain what code does before or after showing it
- Reference actual source (repo, file, function name)
- Code is evidence/proof, surrounding text is the explanation

### Structure
- Section labels: "01 — topic name" (lowercase, numbered)
- Flow: problem → why existing sucks → core insight → how it works (with code) → why it matters
- Every paragraph earns its place. No filler
- Vary sentence length. Short after long for emphasis
- Technical sections longer, opinion sections punchier

