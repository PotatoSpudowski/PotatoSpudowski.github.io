import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ENTRIES = [
  { year: 2025, month: 11, tag: 'work', title: 'Co-founded Cassian, AI infrastructure for commercial lending',
    md: `Came out of EF with a cofounder and an idea. We're building AI that takes messy borrower docs and turns them into something lenders can actually work with. Commercial lending is stuck in the stone age and we're trying to fix that.

Raised from [Entrepreneurs First](https://www.joinef.com/) and [Transpose VC](https://www.transpose.vc/).

### What we're doing

- Automating borrower onboarding for commercial lenders
- Parsing messy, incomplete loan submissions with LLMs
- Turning them into clean, decision-ready packages

The whole pipeline uses a mix of **document understanding** and **structured extraction**. Think of it as going from a pile of PDFs to a spreadsheet a lender can actually use.` },
  { year: 2025, month: 9, tag: 'work', title: "Entrepreneurs First, Fall '25",
    md: `Second time at EF. Moved to London. Explored vertical AI in legal tech (time tracking for lawyers) and lending before landing on Cassian.

The EF model is basically: throw smart people in a room, see what sticks. It worked.` },
  { year: 2026, month: 2, tag: 'milestone', title: 'Middle East escalates' },
  { year: 2022, month: 11, tag: 'milestone', title: 'ChatGPT launches' },
  { year: 2022, month: 10, tag: 'work', title: 'MLOps at QuillBot',
    md: `First MLOps hire. Kept the GPU infra running, deployed models that served millions of users every day. Learned what production ML actually looks like when things break at 3am.

Stayed for almost 3 years. Longest job I've had.` },
  { year: 2022, month: 5, tag: 'milestone', title: 'Crypto winter' },
  { year: 2022, month: 3, tag: 'milestone', title: 'ZIRP ends, rates start rising' },
  { year: 2022, month: 2, tag: 'milestone', title: 'War in Europe' },
  { year: 2021, month: 12, tag: 'work', title: 'Founding engineer at Flippy',
    md: `YC backed crypto startup. Handled the entire backend. EC2 microservices, NoSQL DBs, event-driven serverless stuff with EventBridge, Lambdas, SQS.

The startup didn't make it but I learned more in those 10 months than most people learn in a year.` },
  { year: 2021, month: 10, tag: 'work', title: 'ML at Amikus AI',
    md: `Short stint. Built an MVP for contract review lawyers using encoder models for NER. Needle in haystack type detection in legal docs.

The MVP helped them get early customers and raise pre-seed from EF.` },
  { year: 2021, month: 7, tag: 'research', title: 'IBM Research, round two',
    md: `Back at IBM. This time working on multimodal information retrieval. Text and images together.

Published papers at AAAI workshops and ACM SIGKDD.` },
  { year: 2021, month: 6, tag: 'milestone', title: 'Graduated BTech' },
  { year: 2021, month: 2, tag: 'work', title: 'Entrepreneurs First, first time',
    md: `BA5 cohort. Explored ideas in information retrieval and generative AI before it was mainstream.

Didn't find a cofounder that time. Came back 4 years later.` },
  { year: 2020, month: 7, tag: 'research', title: 'IBM Research intern',
    md: `NLP and Graph ML research. First real research experience.

Papers published at AAAI workshops, ACM SIGKDD workshops, and Complex Networks conference.` },
  { year: 2020, month: 3, tag: 'milestone', title: 'COVID hits' },
  { year: 2019, month: 2, tag: 'project', title: 'malnou - IBM Call for Code semifinalist',
    links: [{ text: 'GitHub', url: 'https://github.com/malnou-org/malnou' }],
    md: `Built IoT devices and a platform to monitor children's healthcare data to combat malnutrition.

Made it to the global semifinals of IBM Call for Code 2019.` },
  { year: 2018, month: 9, tag: 'work', title: 'Freelance data science on Topcoder',
    md: `Part-time freelance work during 2nd year of college. Clients from petroleum, insurance, and finance.

Made 5 figures in USD while still in college. That was a good year.` },
  { year: 2017, month: 8, tag: 'milestone', title: 'Started BTech' },
  { year: 2017, month: 6, tag: 'project', title: 'Glaucoma detection, the hard way',
    md: `12th grade. I was at the Indian Institute of Science for a student program. Saw researchers detecting glaucoma from eye images using OpenCV. Edge detection, thresholding, that sort of thing.

I'd already done CS231n by then. So I thought, why not try deep learning?

Wrote a CNN in PyTorch. The dataset was maybe 200 retinal images that students had collected. Trained it on my laptop. It worked, sort of. Good enough accuracy on the test set, though looking back the test set was tiny so who knows.

Ended up presenting it at IISc's Open Day. I wasn't even a student there, just some high schooler who showed up with a project. But the professors were interested enough to let me demo it. That was the first time I pitched something technical to people who actually knew what they were talking about.` },
  { year: 2016, month: 9, tag: 'research', title: 'CS231n changed how I thought about ML',
    links: [{ text: 'Course', url: 'https://cs231n.stanford.edu/' }],
    md: `Found Stanford's CS231n lectures online. Andrej Karpathy, Fei-Fei Li, Justin Johnson teaching CNNs and deep learning for computer vision.

This was the first time someone explained backprop in a way that made sense. How gradients flow. Why certain architectures work. The whole thing clicked.

Watched the lectures, did the assignments, trained models on my laptop. By the end I actually understood what I was doing instead of just copying code.` },
  { year: 2016, month: 3, tag: 'project', title: 'Hacking the school computers',
    md: `10th-11th grade. I was writing VBS scripts to mess with school computers. Fake error messages, CD trays popping open. The IT admin was not happy.

Somewhere in there I found out about machine learning. Code that learns. Programs that get better without you rewriting them. That sounded way more interesting than pranking the computer lab.

I didn't understand the math. Couldn't tell you what a gradient was. But I knew I wanted to figure it out.` },
  { year: 2015, month: 1, tag: 'project', title: 'Harvesting radio waves for power',
    links: [{ text: 'Times of India Feature', url: 'https://timesofindia.indiatimes.com/city/bengaluru/young-scientists-discover-traffic-solutions-generate-energy/articleshow/45926161.cms' }],
    md: `10th grade. Radio waves are everywhere. FM, cell towers, WiFi. All that energy just sitting in the air.

Built a thing to capture it. Schottky diodes, a circuit, nothing fancy. It could charge a small capacitor, light up one of those old flashlight bulbs, or give a phone maybe a few seconds of juice. Not useful, but it worked.

Ended up in the finals of Teenovators 2014 at Manipal with this.` },
  { year: 2014, month: 6, tag: 'project', title: 'Arduino and the end of soldering',
    md: `9th grade. I'd been building circuits from hobby kits. Proximity sensors, alarms, basic stuff. Every change meant more soldering, more wires, more burnt fingers.

Then I got an Arduino. Later a Raspberry Pi.

Want to change how something works? Edit a few lines of code. No rewiring. The hardware stays the same, the behavior changes. Software could replace circuits. I didn't have to solder everything from scratch anymore.` },
  { year: 2013, month: 4, tag: 'project', title: 'RC planes that mostly crashed',
    md: `8th grade. I wanted to build something that flies.

Bought brushless motors, speed controllers, a radio transmitter. Cut the frame from foam board. Followed build guides online. Crashed it. Rebuilt it. Crashed it again.

Most of it was just following instructions, but getting something you built to actually leave the ground, even for a few seconds before it nosedives, that felt like real engineering.` },
]

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

function renderMarkdown(md) {
  return marked.parse(renderMath(md))
}

function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function Card({ entry }) {
  const [open, setOpen] = useState(false)
  const md = entry.md || ''
  const lines = md.trim().split('\n').filter(l => l.trim())
  const isShort = lines.length <= 2
  const html = renderMarkdown(md)

  if (entry.tag === 'milestone') {
    return (
      <div className="tl-milestone">
        <span className="tl-milestone-title">{entry.title}</span>
      </div>
    )
  }

  return (
    <div
      className={`tl-card${!isShort ? ' tl-card--expandable' : ''}${open ? ' tl-card--open' : ''}`}
      onClick={(e) => {
        if (isShort || e.target.closest('a')) return
        setOpen(o => !o)
      }}
    >
      <h3>{entry.title}</h3>
      <div className="tl-body" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="tl-card-footer">
        {entry.tag && <span className={`tl-tag tag-${entry.tag}`}>{entry.tag}</span>}
        {entry.links && (
          <div className="tl-links">
            {entry.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer">{l.text}</a>
            ))}
          </div>
        )}
        {!isShort && <span className="tl-expand-hint">read more</span>}
      </div>
    </div>
  )
}

export default function Timeline() {
  const [reversed, setReversed] = useState(false)
  const tlRef = useRef(null)

  // Group entries by year-month
  const grouped = {}
  let minYear = Infinity, maxYear = -Infinity
  for (const e of ENTRIES) {
    if (e.year < minYear) minYear = e.year
    if (e.year > maxYear) maxYear = e.year
    const key = `${e.year}-${e.month}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  const years = []
  const yStart = reversed ? minYear : maxYear
  const yEnd = reversed ? maxYear : minYear
  const yStep = reversed ? 1 : -1
  for (let y = yStart; reversed ? y <= yEnd : y >= yEnd; y += yStep) {
    years.push(y)
  }

  // Scroll progress
  useEffect(() => {
    function update() {
      const tl = tlRef.current
      if (!tl) return
      const rect = tl.getBoundingClientRect()
      const wh = window.innerHeight
      const scrolled = wh * 0.8 - rect.top
      const total = rect.height - (wh * 0.8 - wh * 0.5)
      const progress = Math.max(0, Math.min(100, (scrolled / total) * 100))
      tl.style.setProperty('--scroll-progress', progress + '%')
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [reversed])

  return (
    <section className="timeline-section">
      <div className="timeline-header">
        <h2 className="section-title">The Story So Far</h2>
        <button
          className="timeline-toggle"
          onClick={() => setReversed(r => !r)}
        >
          {reversed ? 'Back to present' : 'Start from the beginning'}
        </button>
      </div>
      <div className="timeline" ref={tlRef}>
        {years.map(year => (
          <YearBlock key={`${year}-${reversed}`} year={year} grouped={grouped} reversed={reversed} />
        ))}
      </div>
    </section>
  )
}

function YearBlock({ year, grouped, reversed }) {
  const [ref, inView] = useInView()
  const months = []
  const mStart = reversed ? 1 : 12
  const mEnd = reversed ? 12 : 1
  const mStep = reversed ? 1 : -1
  for (let m = mStart; reversed ? m <= mEnd : m >= mEnd; m += mStep) {
    months.push(m)
  }

  return (
    <div className="tl-year">
      <div ref={ref} className={`tl-year-marker${inView ? ' tl-in-view' : ''}`}>
        <span>{year}</span>
      </div>
      {months.map(month => {
        const key = `${year}-${month}`
        const entries = grouped[key]
        return (
          <MonthBlock key={key} month={month} entries={entries} />
        )
      })}
    </div>
  )
}

function MonthBlock({ month, entries }) {
  const [tickRef, tickInView] = useInView()
  const hasEntries = entries && entries.length > 0

  return (
    <div className={`tl-month${hasEntries ? ' tl-month--active' : ''}`}>
      <div ref={tickRef} className={`tl-month-tick${tickInView ? ' tl-in-view' : ''}`}>
        <span>{MONTHS[month - 1]}</span>
      </div>
      {hasEntries && entries.map((entry, i) => (
        <EntryBlock key={i} entry={entry} />
      ))}
    </div>
  )
}

function EntryBlock({ entry }) {
  const [ref, inView] = useInView({ rootMargin: '0px 0px -100px 0px' })
  return (
    <div ref={ref} className={`tl-entry${inView ? ' tl-visible' : ''}`}>
      <Card entry={entry} />
    </div>
  )
}
