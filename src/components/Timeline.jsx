import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ENTRIES = [
  { year: 2025, month: 11, tag: 'work', title: 'Co-founded Cassian, AI infrastructure for commercial lending',
    md: `came out of EF with a cofounder and an idea. were building AI that takes messy borrower docs and turns them into something lenders can actually work with. commercial lending is stuck in the stone age and were trying to fix that.

raised from [Entrepreneurs First](https://www.joinef.com/) and [Transpose VC](https://www.transpose.vc/).

the whole thing is borrower onboarding automation for commercial lenders. parsing messy, incomplete loan submissions with LLMs and turning them into clean, decision-ready packages. going from a pile of PDFs to a spreadsheet a lender can actually use.` },
  { year: 2025, month: 9, tag: 'work', title: "Entrepreneurs First, Fall '25",
    md: `second time at EF. moved to London. explored vertical AI in legal tech and lending before landing on Cassian.

the EF model is basically: throw smart people in a room, see what sticks. it worked.` },
  { year: 2026, month: 2, tag: 'milestone', title: 'Middle East escalates' },
  { year: 2022, month: 11, tag: 'milestone', title: 'ChatGPT launches' },
  { year: 2022, month: 10, tag: 'work', title: 'MLOps at QuillBot',
    md: `first MLOps hire. kept the GPU infra running, deployed models that served millions of users every day. learned what production ML actually looks like when things break at 3am.

stayed for almost 3 years. longest job ive had.` },
  { year: 2022, month: 5, tag: 'milestone', title: 'Crypto winter' },
  { year: 2022, month: 3, tag: 'milestone', title: 'ZIRP ends, rates start rising' },
  { year: 2022, month: 2, tag: 'milestone', title: 'War in Europe' },
  { year: 2021, month: 12, tag: 'work', title: 'Founding engineer at Flippy',
    md: `YC backed crypto startup that came out of my EF batch. handled the entire backend. EC2 microservices, NoSQL DBs, event-driven serverless stuff with EventBridge, Lambdas, SQS.

the startup didnt make it but i learned more in those 10 months than most people learn in a year.` },
  { year: 2021, month: 10, tag: 'work', title: 'ML at Amikus AI',
    md: `short stint. built an MVP for contract review lawyers using encoder models for NER. needle in haystack type detection in legal docs.

the MVP helped them get early customers and raise pre-seed from EF.` },
  { year: 2021, month: 7, tag: 'research', title: 'IBM Research, round two',
    md: `back at IBM. this time working on multimodal information retrieval. text and images together.

published papers at AAAI workshops and ACM SIGKDD.` },
  { year: 2021, month: 6, tag: 'milestone', title: 'Graduated BTech' },
  { year: 2021, month: 2, tag: 'work', title: 'Entrepreneurs First, first time',
    md: `BA5 cohort. explored ideas in information retrieval and generative AI before it was mainstream.

didnt find a cofounder that time. came back 4 years later.` },
  { year: 2020, month: 7, tag: 'research', title: 'IBM Research intern',
    md: `NLP and Graph ML research. first real research experience.

papers published at AAAI workshops, ACM SIGKDD workshops, and Complex Networks conference.` },
  { year: 2020, month: 3, tag: 'milestone', title: 'COVID hits' },
  { year: 2019, month: 2, tag: 'project', title: 'malnou - IBM Call for Code semifinalist',
    links: [{ text: 'GitHub', url: 'https://github.com/malnou-org/malnou' }],
    md: `built IoT devices and a platform to monitor childrens healthcare data to combat malnutrition.

made it to the global semifinals of IBM Call for Code 2019.` },
  { year: 2018, month: 9, tag: 'work', title: 'Freelance data science on Topcoder',
    md: `part-time freelance during 2nd year of college. clients from petroleum, insurance, and finance.

made 5 figures in USD while still in college. that was a good year.` },
  { year: 2017, month: 8, tag: 'milestone', title: 'Started BTech' },
  { year: 2017, month: 6, tag: 'project', title: 'Glaucoma detection, the hard way',
    md: `12th grade. i was at the Indian Institute of Science for a student program. saw researchers detecting glaucoma from eye images using OpenCV. edge detection, thresholding, that sort of thing.

id already done CS231n by then. so i thought, why not try deep learning?

wrote a CNN in PyTorch. the dataset was maybe 200 retinal images. trained it on my laptop. it worked, sort of. good enough accuracy on the test set, though looking back the test set was tiny so who knows.

ended up presenting it at IIScs Open Day. i wasnt even a student there, just some high schooler who showed up with a project. the professors were interested enough to let me demo it. that was the first time i pitched something technical to people who actually knew what they were talking about.` },
  { year: 2016, month: 9, tag: 'research', title: 'CS231n changed how I thought about ML',
    links: [{ text: 'Course', url: 'https://cs231n.stanford.edu/' }],
    md: `found Stanfords CS231n lectures online. Andrej Karpathy, Fei-Fei Li, Justin Johnson teaching CNNs and deep learning for computer vision.

first time someone explained backprop in a way that made sense. how gradients flow. why certain architectures work. the whole thing clicked.

watched the lectures, did the assignments, trained models on my laptop. by the end i actually understood what i was doing instead of just copying code.` },
  { year: 2016, month: 3, tag: 'project', title: 'Hacking the school computers',
    md: `10th-11th grade. i was writing VBS scripts to mess with school computers. fake error messages, CD trays popping open. the IT admin was not happy.

somewhere in there i found out about machine learning. code that learns. programs that get better without you rewriting them. that sounded way more interesting than pranking the computer lab.

i didnt understand the math. couldnt tell you what a gradient was. but i knew i wanted to figure it out.` },
  { year: 2015, month: 1, tag: 'project', title: 'Harvesting radio waves for power',
    links: [{ text: 'Times of India Feature', url: 'https://timesofindia.indiatimes.com/city/bengaluru/young-scientists-discover-traffic-solutions-generate-energy/articleshow/45926161.cms' }],
    md: `10th grade. radio waves are everywhere. FM, cell towers, WiFi. all that energy just sitting in the air.

built a thing to capture it. Schottky diodes, a circuit, nothing fancy. it could charge a small capacitor, light up one of those old flashlight bulbs, or give a phone maybe a few seconds of juice. not useful, but it worked.

ended up in the finals of Teenovators 2014 at Manipal with this.` },
  { year: 2014, month: 6, tag: 'project', title: 'Arduino and the end of soldering',
    md: `9th grade. id been building circuits from hobby kits. proximity sensors, alarms, basic stuff. every change meant more soldering, more wires, more burnt fingers.

then i got an Arduino. later a Raspberry Pi.

want to change how something works? edit a few lines of code. no rewiring. the hardware stays the same, the behavior changes. software could replace circuits. i didnt have to solder everything from scratch anymore.` },
  { year: 2013, month: 4, tag: 'project', title: 'RC planes that mostly crashed',
    md: `8th grade. i wanted to build something that flies.

bought brushless motors, speed controllers, a radio transmitter. cut the frame from foam board. followed build guides online. crashed it. rebuilt it. crashed it again.

most of it was just following instructions, but getting something you built to actually leave the ground, even for a few seconds before it nosedives, that felt like real engineering.` },
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
