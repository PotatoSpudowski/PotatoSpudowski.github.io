import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Fade, CodeBlock } from '../components/BlogPrimitives'

function M({ children, block }) {
  const html = (() => {
    try { return katex.renderToString(children, { displayMode: !!block, throwOnError: false }) }
    catch { return children }
  })()
  if (block) return <div className="blog-math-block" dangerouslySetInnerHTML={{ __html: html }} />
  return <span className="blog-math-inline" dangerouslySetInnerHTML={{ __html: html }} />
}

// --- pareto front chart (real search data) ---

const PARETO = [
  { trial: 20, refusals: 10, kl: 0.116 },
  { trial: 93, refusals: 12, kl: 0.048 },
  { trial: 75, refusals: 15, kl: 0.024 },
  { trial: 81, refusals: 17, kl: 0.022 },
  { trial: 32, refusals: 21, kl: 0.016 },
]

function ParetoChart() {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="blog-chart-tooltip">
        <div>trial {payload[0].payload.trial}</div>
        <div style={{ color: '#7ee787' }}>refusals {payload[0].payload.refusals}%</div>
        <div style={{ color: '#79c0ff' }}>KL {payload[0].payload.kl}</div>
      </div>
    )
  }
  return (
    <div className="abl-layer-viz">
      <p className="abl-layer-caption">pareto front of the search. each point is one trial. x axis: refusals. bar height: KL divergence. lower left is better.</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={PARETO} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="refusals" tick={{ fill: '#585858', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="kl" radius={0}>
            {PARETO.map((entry) => (
              <Cell key={entry.trial} fill={entry.trial === 93 ? '#7ee787' : '#2a2a2a'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- WHY GEMMA IS HARD: the fortress with three defenses ---

function FortressDemo() {
  const [defense, setDefense] = useState(0)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setTick(t => {
      if (t === 2) setDefense(d => (d + 1) % 3)
      return (t + 1) % 3
    }), 1600)
    return () => clearInterval(id)
  }, [paused])

  const pick = (d) => { setDefense(d); setTick(0); setPaused(true) }

  const W = 560
  // wall repair: hole width shrinks with tick when defense 0
  const holeW = defense === 0 ? [46, 22, 0][tick] : 0
  // tunnel dots flow when defense 1
  const dots = [0, 1, 2, 3, 4].map(i => (i * 44 + tick * 18) % 200)
  // supply towers flash when defense 2
  const towers = [0, 1, 2, 3, 4]
  const towerLit = (i) => defense === 2 && tick === 2

  const captions = [
    [
      <>the edit cuts a hole in the wall.</>,
      <>the norm arrives. the wall repairs itself.</>,
      <>the cut is gone. only a change in direction survives the four norms.</>,
    ],
    [
      <>the main gate is where the edit happens.</>,
      <>but supplies flow through a side tunnel under the wall.</>,
      <>the tunnel is the per-layer embedding. the edit never touches it.</>,
    ],
    [
      <>one supply depot feeds all the towers.</>,
      <>layers 15 to 34 have no keys or values of their own. there is nothing to edit on a tower.</>,
      <>but edit the depot, layer 14, and all 20 towers feel it at once.</>,
    ],
  ]
  const defenseNames = ['the self-healing wall', 'the side tunnel', 'the shared supply']

  return (
    <div className="abl-ortho-demo">
      <div className="abl-ortho-steps">
        {defenseNames.map((name, i) => (
          <button key={i} className={`abl-step-btn${defense === i ? ' active' : ''}`} onClick={() => pick(i)}>
            <span className="abl-step-num" style={{ background: defense === i ? '#7ee787' : 'transparent', color: defense === i ? '#0f0f0f' : '#585858' }}>{i + 1}</span>
            <span className="abl-step-label">{name}</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">{captions[defense][tick]}</p>

      <svg viewBox={`0 0 ${W} 250`} className="abl-svg-wide">
        {/* ground */}
        <line x1={0} y1={200} x2={W} y2={200} stroke="#2a2a2a" strokeWidth={2} />

        {/* the wall (norms) */}
        <rect x={60} y={100} width={170} height={100} fill="#1c1c1c" stroke="#3a3a3a" strokeWidth={1.5} />
        {/* brick lines */}
        {[120, 140, 160, 180].map(y => (
          <line key={y} x1={60} y1={y} x2={230} y2={y} stroke="#262626" strokeWidth={1} />
        ))}
        {/* the hole + repair */}
        {holeW > 0 ? (
          <rect x={145 - holeW / 2} y={130} width={holeW} height={40} fill="#0f0f0f" stroke="#ff7b72" strokeWidth={1.5} />
        ) : (
          defense === 0 && tick === 2 && <text x={145} y={155} fill="#7ee787" fontSize={9} fontFamily="monospace" textAnchor="middle">repaired</text>
        )}
        {defense === 0 && tick === 1 && (
          <text x={145} y={122} fill="#7ee787" fontSize={10} fontFamily="monospace" textAnchor="middle">RMSNorm ✦</text>
        )}
        <text x={145} y={94} fill="#585858" fontSize={9} fontFamily="monospace" textAnchor="middle">the wall (four norms)</text>

        {/* the side tunnel (PLE) */}
        <rect x={60} y={200} width={170} height={26} fill="#141414" stroke="#3a3a3a" strokeWidth={1} />
        {dots.map((x, i) => (
          <circle key={i} cx={70 + x * 0.75} cy={213} r={3} fill="#ff7b72" opacity={defense === 1 ? 1 : 0.35} />
        ))}
        <text x={145} y={240} fill="#ff7b72" fontSize={9} fontFamily="monospace" textAnchor="middle">side tunnel: per-layer embedding</text>

        {/* the supply depot + towers (shared K/V) */}
        <rect x={300} y={170} width={40} height={30} fill="#1c1c1c" stroke="#7ee787" strokeWidth={1.5} />
        <text x={320} y={164} fill="#7ee787" fontSize={9} fontFamily="monospace" textAnchor="middle">layer 14</text>
        <text x={320} y={188} fill="#7ee787" fontSize={8} fontFamily="monospace" textAnchor="middle">K/V</text>
        {towers.map(i => {
          const tx = 370 + i * 38
          const lit = towerLit(i)
          return (
            <g key={i}>
              <line x1={340} y1={185} x2={tx + 10} y2={185} stroke={defense === 2 ? '#7ee787' : '#2a2a2a'} strokeWidth={1.5}
                strokeDasharray={defense === 2 && tick === 1 && i === 2 ? '4 3' : 'none'} />
              <rect x={tx} y={160} width={20} height={40} fill={lit ? '#3a1c1c' : '#161616'}
                stroke={lit ? '#ff7b72' : '#2a2a2a'} strokeWidth={1} />
            </g>
          )
        })}
        <text x={450} y={152} fill="#585858" fontSize={9} fontFamily="monospace" textAnchor="middle">towers: layers 15-34</text>
        {defense === 2 && tick === 1 && (
          <text x={450} y={220} fill="#585858" fontSize={9} fontFamily="monospace" textAnchor="middle">cut one supply line: the tower has nothing to edit anyway</text>
        )}
        {defense === 2 && tick === 2 && (
          <text x={450} y={220} fill="#ff7b72" fontSize={9} fontFamily="monospace" textAnchor="middle">edit the depot: every tower feels it</text>
        )}
      </svg>
    </div>
  )
}

// --- SEARCH: the trial machine ---

const MACHINE_TRIALS = [
  { n: 1, pos: 3, dist: 30, s: 1.0, f: 0.5, refusals: 0.89, kl: 0.020, verdict: 'discard', note: 'edits everything, weakly. high refusals.' },
  { n: 2, pos: 17, dist: 8, s: 1.5, f: 0.4, refusals: 0.32, kl: 0.028, verdict: 'new best', note: 'stronger at the right layer. refusals fall.' },
  { n: 3, pos: 25, dist: 5, s: 4.0, f: 0.1, refusals: 0.18, kl: 0.310, verdict: 'too much damage', note: 'brute force. KL explodes.' },
  { n: 4, pos: 17, dist: 7, s: 3.7, f: 0.5, refusals: 0.12, kl: 0.048, verdict: 'new best ★', note: 'over-correction in a tight window.' },
  { n: 5, pos: 17, dist: 9, s: 2.1, f: 0.85, refusals: 0.15, kl: 0.024, verdict: 'trade-off', note: 'fewer edits, cleaner weights, more refusals.' },
]

function SearchMachineDemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % MACHINE_TRIALS.length), 3200)
    return () => clearInterval(id)
  }, [paused])

  const t = MACHINE_TRIALS[step]
  const N = 35, KW = 300, KH = 110, barW = KW / N
  const minW = t.s * t.f
  const weights = Array.from({ length: N }, (_, l) => {
    const x = Math.abs(l - t.pos) / t.dist
    return x > 1 ? 0 : minW + (t.s - minW) * Math.exp(-2.0 * x * x)
  })

  const gauge = (label, value, max, color) => (
    <g>
      <text x={0} y={-6} fill="#585858" fontSize={9} fontFamily="monospace">{label}</text>
      <rect x={0} y={0} width={200} height={12} fill="#161616" />
      <rect x={0} y={0} width={Math.min(value / max, 1) * 200} height={12} fill={color} />
      <text x={208} y={10} fill={color} fontSize={10} fontFamily="monospace">{value}</text>
    </g>
  )

  const verdictColor = t.verdict.includes('best') ? '#7ee787' : t.verdict === 'discard' ? '#585858' : '#ffa657'

  return (
    <div className="abl-ortho-demo" onClick={() => { setStep(s => (s + 1) % MACHINE_TRIALS.length); setPaused(true) }}>
      <div className="abl-ortho-steps">
        {MACHINE_TRIALS.map((tr, i) => (
          <button key={i} className={`abl-step-btn${step === i ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}>
            <span className="abl-step-num" style={{ background: step === i ? '#7ee787' : 'transparent', color: step === i ? '#0f0f0f' : '#585858' }}>{tr.n}</span>
            <span className="abl-step-label">trial</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">
        trial {t.n}: peak at layer {t.pos}, width {t.dist}, strength {t.s}. {t.note}
      </p>

      <svg viewBox="0 0 560 150" className="abl-svg-wide">
        {/* kernel */}
        <g transform="translate(10, 14)">
          {weights.map((w, l) => {
            const h = (w / 4) * KH
            return <rect key={l} x={l * barW} y={KH - h} width={barW - 1} height={Math.max(h, 1)}
              fill={w > 0.001 ? '#7ee787' : '#2a2a2a'} opacity={w > 0.001 ? 0.4 + 0.6 * (w / 4) : 1} />
          })}
          <text x={0} y={KH + 14} fill="#585858" fontSize={9} fontFamily="monospace">the proposed kernel</text>
        </g>

        {/* scores */}
        <g transform="translate(340, 30)">
          {gauge('refusals', t.refusals, 1, '#ff7b72')}
          <g transform="translate(0, 40)">{gauge('KL divergence', t.kl, 0.35, '#79c0ff')}</g>
          <text x={0} y={105} fill={verdictColor} fontSize={11} fontFamily="monospace">→ {t.verdict}</text>
        </g>
      </svg>
    </div>
  )
}

// --- FIX 1: interactive kernel explorer ---

function KernelExplorer() {
  const [pos, setPos] = useState(17)
  const [dist, setDist] = useState(8)
  const [maxW, setMaxW] = useState(2.5)
  const [minFrac, setMinFrac] = useState(0.3)

  const N = 35, W = 560, H = 150, barW = W / N
  const minW = maxW * minFrac
  const weights = Array.from({ length: N }, (_, l) => {
    const t = Math.abs(l - pos) / dist
    return t > 1 ? 0 : minW + (maxW - minW) * Math.exp(-2.0 * t * t)
  })
  const edited = weights.filter(w => w > 0.001).length

  const slider = (label, value, set, min, max, step, hint) => (
    <label className="abl-slider">
      <span className="abl-slider-label">{label} <span className="abl-slider-hint">({hint})</span></span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => set(parseFloat(e.target.value))} />
      <span className="abl-slider-value">{value}</span>
    </label>
  )

  return (
    <div className="abl-layer-viz">
      <p className="abl-layer-caption">
        fix 1 in action. green layers are edited. gray layers are untouched. currently editing {edited} of {N} layers.
      </p>
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="abl-svg-wide">
        {weights.map((w, l) => {
          const h = (w / 4) * H
          return <rect key={l} x={l * barW + 1} y={H - h} width={barW - 2} height={Math.max(h, 1)}
            fill={w > 0.001 ? '#7ee787' : '#2a2a2a'} opacity={w > 0.001 ? 0.4 + 0.6 * (w / 4) : 1} />
        })}
        <line x1={(pos - dist) * barW} y1={H + 8} x2={(pos + dist + 1) * barW} y2={H + 8} stroke="#7ee787" strokeWidth={1} />
        <text x={pos * barW + barW / 2} y={H + 22} fill="#7ee787" fontSize={9} fontFamily="monospace" textAnchor="middle">the window</text>
        <text x={0} y={H + 22} fill="#585858" fontSize={9} fontFamily="monospace">layer 0</text>
        <text x={W - 30} y={H + 22} fill="#585858" fontSize={9} fontFamily="monospace">layer 34</text>
        <text x={4} y={12} fill="#585858" fontSize={9} fontFamily="monospace">edit strength →</text>
      </svg>
      <div className="abl-slider-group">
        {slider('peak position', pos, setPos, 0, 34, 1, 'which layer')}
        {slider('window width', dist, setDist, 1, 30, 1, 'how many layers')}
        {slider('peak strength', maxW, setMaxW, 0, 4, 0.1, 'how hard')}
        {slider('floor fraction', minFrac, setMinFrac, 0, 1, 0.05, 'edge strength')}
      </div>
    </div>
  )
}

// --- FIX 2: over-correction step-through ---

function StrengthDemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  const STRENGTHS = [0, 0.5, 1.0, 2.0, 3.0]
  const wx = 0.6, wy = -0.8
  const rx = 0.7071, ry = -0.7071
  const dot = wx * rx + wy * ry
  const wNorm = Math.sqrt(wx * wx + wy * wy)

  const s = STRENGTHS[step]
  const px = wx - s * dot * rx, py = wy - s * dot * ry
  const pNorm = Math.sqrt(px * px + py * py)
  const nx = px * (wNorm / pNorm), ny = py * (wNorm / pNorm)
  const component = (nx * rx + ny * ry).toFixed(2)

  const W = 300, H = 300
  const cx = W / 2, cy = H / 2
  const scale = 110
  const toSVG = (x, y) => [cx + x * scale, cy + y * scale]
  const [ox, oy] = toSVG(0, 0)
  const [rx1, ry1] = toSVG(rx * 1.15, ry * 1.15)
  const [rx2, ry2] = toSVG(-rx * 1.15, -ry * 1.15)
  const [wx1, wy1] = toSVG(wx, wy)
  const [nx1, ny1] = toSVG(nx, ny)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % STRENGTHS.length), 2800)
    return () => clearInterval(id)
  }, [paused])

  const arrow = (x1, y1, x2, y2, color, w = 2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const sz = 6
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} />
        <polygon
          points={`${x2},${y2} ${x2 - sz * Math.cos(angle - 0.4)},${y2 - sz * Math.sin(angle - 0.4)} ${x2 - sz * Math.cos(angle + 0.4)},${y2 - sz * Math.sin(angle + 0.4)}`}
          fill={color}
        />
      </g>
    )
  }

  const descriptions = [
    <>one row of a weight matrix. it has a component along the refusal direction <M>{"r"}</M>.</>,
    <>half strength. the component shrinks. but it survives. the norms will rebuild it.</>,
    <>full projection. the component is zero. <M>{"w'"}</M> is orthogonal to <M>{"r"}</M>.</>,
    <>over-correction. the component flips sign. the row starts to anti-express refusal.</>,
    <>more over-correction. the row pushes against refusal. the search chose values like this.</>,
  ]

  return (
    <div className="abl-ortho-demo" onClick={() => { setStep(s => (s + 1) % STRENGTHS.length); setPaused(true) }}>
      <div className="abl-ortho-steps">
        {STRENGTHS.map((st, i) => (
          <button key={i} className={`abl-step-btn${step === i ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}>
            <span className="abl-step-num" style={{ background: step === i ? '#7ee787' : 'transparent', color: step === i ? '#0f0f0f' : '#585858' }}>{st}</span>
            <span className="abl-step-label">strength</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">{descriptions[step]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="abl-svg">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#1a1a1a" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#1a1a1a" strokeWidth={1} />

        <line x1={rx2} y1={ry2} x2={rx1} y2={ry1} stroke="#ff7b72" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
        {arrow(ox, oy, rx1, ry1, '#ff7b72')}
        <text x={rx1 + 6} y={ry1 - 6} fill="#ff7b72" fontSize={11} fontFamily="monospace">r</text>
        <text x={rx2 - 16} y={ry2 + 14} fill="#ff7b72" fontSize={9} fontFamily="monospace" opacity={0.6}>-r</text>

        {step === 0 ? (
          <g>
            {arrow(ox, oy, wx1, wy1, '#79c0ff', 2.5)}
            <text x={wx1 + 6} y={wy1 - 6} fill="#79c0ff" fontSize={11} fontFamily="monospace">w</text>
          </g>
        ) : (
          <line x1={ox} y1={oy} x2={wx1} y2={wy1} stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
        )}

        {step > 0 && (
          <g>
            {arrow(ox, oy, nx1, ny1, '#7ee787', 2.5)}
            <text x={nx1 + 6} y={ny1 - 6} fill="#7ee787" fontSize={11} fontFamily="monospace">w'</text>
          </g>
        )}

        <circle cx={ox} cy={oy} r={2.5} fill="#555" />
        <text x={10} y={H - 10} fill="#585858" fontSize={10} fontFamily="monospace">
          component along r: {component}
        </text>
      </svg>
    </div>
  )
}

// --- FIX 3: ORBA step-through ---

function ORBADemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % 3), 2800)
    return () => clearInterval(id)
  }, [paused])

  const W = 300, H = 300
  const cx = W / 2, cy = H / 2
  const scale = 110
  const toSVG = (x, y) => [cx + x * scale, cy + y * scale]
  const [ox, oy] = toSVG(0, 0)

  const bx = 0.94, by = -0.34
  const rx = 0.71, ry = -0.71
  const dot = rx * bx + ry * by
  const ux = rx - dot * bx, uy = ry - dot * by
  const uNorm = Math.sqrt(ux * ux + uy * uy)
  const r2x = ux / uNorm, r2y = uy / uNorm

  const [bx1, by1] = toSVG(bx, by)
  const [rx1, ry1] = toSVG(rx, ry)
  const [px1, py1] = toSVG(dot * bx, dot * by)
  const [r2x1, r2y1] = toSVG(r2x, r2y)

  const arrow = (x1, y1, x2, y2, color, w = 2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const sz = 6
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} />
        <polygon
          points={`${x2},${y2} ${x2 - sz * Math.cos(angle - 0.4)},${y2 - sz * Math.sin(angle - 0.4)} ${x2 - sz * Math.cos(angle + 0.4)},${y2 - sz * Math.sin(angle + 0.4)}`}
          fill={color}
        />
      </g>
    )
  }

  const descriptions = [
    <>the raw refusal direction <M>{"r"}</M> and the mean harmless direction <M>{"b"}</M>. they overlap. part of <M>{"r"}</M> is normal behavior.</>,
    <>project <M>{"r"}</M> onto <M>{"b"}</M>. this shared part is what harmless prompts use. removing it would damage the model.</>,
    <>keep only the orthogonal part <M>{"r'"}</M>. the edit now removes refusal and leaves harmless processing alone.</>,
  ]

  return (
    <div className="abl-ortho-demo" onClick={() => { setStep(s => (s + 1) % 3); setPaused(true) }}>
      <div className="abl-ortho-steps">
        {['the overlap', 'the shared part', 'the clean direction'].map((label, i) => (
          <button key={i} className={`abl-step-btn${step === i ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}>
            <span className="abl-step-num" style={{ background: step === i ? '#7ee787' : 'transparent', color: step === i ? '#0f0f0f' : '#585858' }}>{i + 1}</span>
            <span className="abl-step-label">{label}</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">{descriptions[step]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="abl-svg">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#1a1a1a" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#1a1a1a" strokeWidth={1} />

        {arrow(ox, oy, bx1, by1, '#79c0ff')}
        <text x={bx1 + 6} y={by1 - 6} fill="#79c0ff" fontSize={11} fontFamily="monospace">b (harmless)</text>

        {step < 2 ? (
          <g>
            {arrow(ox, oy, rx1, ry1, '#ff7b72', 2.5)}
            <text x={rx1 + 6} y={ry1 - 6} fill="#ff7b72" fontSize={11} fontFamily="monospace">r (raw)</text>
          </g>
        ) : (
          <line x1={ox} y1={oy} x2={rx1} y2={ry1} stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
        )}

        {step === 1 && (
          <g>
            {arrow(ox, oy, px1, py1, '#d2a8ff', 2)}
            <line x1={px1} y1={py1} x2={rx1} y2={ry1} stroke="#ffa657" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={px1 + 4} y={py1 + 16} fill="#d2a8ff" fontSize={9} fontFamily="monospace">shared part</text>
          </g>
        )}

        {step === 2 && (
          <g>
            {arrow(ox, oy, r2x1, r2y1, '#7ee787', 2.5)}
            <text x={r2x1 - 10} y={r2y1 - 10} fill="#7ee787" fontSize={11} fontFamily="monospace">r'</text>
            <path d={`M ${ox + 26 * bx} ${oy + 26 * by} A 26 26 0 0 0 ${ox + 26 * r2x} ${oy + 26 * r2y}`}
              fill="none" stroke="#585858" strokeWidth={1} />
            <text x={ox + 40 * Math.cos((Math.atan2(by, bx) + Math.atan2(r2y, r2x)) / 2)} y={oy + 40 * Math.sin((Math.atan2(by, bx) + Math.atan2(r2y, r2x)) / 2)}
              fill="#585858" fontSize={9} fontFamily="monospace" textAnchor="middle">90°</text>
          </g>
        )}

        <circle cx={ox} cy={oy} r={2.5} fill="#555" />
      </svg>
    </div>
  )
}

// --- main ---

export default function Abliteration2Blog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/abliteration-2-hero.jpg" alt="the four norms dilute the edit" className="blog-hero-img" />
            <h1 className="blog-title">abliteration part 2: and on the eighth day, god added hella norms</h1>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <section className="blog-section">
          <h2 className="blog-section-tag">the problem</h2>
          <p className="blog-p">part 1 showed a simple procedure. measure the refusal direction. project it out of the weight matrices. keep the row norms the same. on Qwen3.6-35B this gave zero refusals on the first try.</p>
          <p className="blog-p">this post is about a model where the simple procedure fails. the model is google/gemma-4-E2B-it. it is small. it has about 5 billion parameters. it is multimodal. and it is very hard to abliterate.</p>
          <p className="blog-p">this post has three parts. first: why gemma 4 is hard. second: how i replaced hand-tuning with an automatic search. third: what the search found. the result went from 62 percent refusals to 12 percent. the method is general. you can use it on other models.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why gemma 4 is hard</h2>
          <p className="blog-p">read the config before you write code. three properties of gemma 4 matter. each one makes weight edits weaker. think of the model as a fortress with three defenses. the scene below shows all three. press the buttons to inspect each one.</p>
          <FortressDemo />
          <p className="blog-p"><strong>defense 1: four norms per layer.</strong> most transformers have two normalization layers per block. gemma 4 has four. there is one before attention, one after attention, one before the feedforward, and one after the feedforward. a norm divides a vector by its magnitude. so if an edit only makes the refusal signal weaker, the norm makes it strong again. the wall repairs itself.</p>
          <p className="blog-p"><strong>defense 2: per-layer embeddings.</strong> each layer gets a second input. it is a learned 256-dimensional vector. it is gated and projected into the residual stream. this channel does not go through the weight matrices that abliteration edits. supplies flow through the side tunnel. the edit never sees them.</p>
          <p className="blog-p"><strong>defense 3: shared keys and values.</strong> the model has 35 layers. only layers 0 to 14 have their own key and value projections. layers 15 to 34 reuse the keys and values from layer 14. a tower has nothing to edit. but the depot feeds all 20 towers. an edit to layer 14 propagates everywhere.</p>
          <p className="blog-p">the conclusion: gemma 4 is not more aligned than other models. it is fault-tolerant. it has three redundant pathways. each pathway dilutes a weight edit. the edit must be strong enough to survive dilution. but a strong edit damages the model. this is the tradeoff.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">attempt 1: the manual cut fails</h2>
          <p className="blog-p">the first attempt used the part 1 procedure. compute the refusal direction at each layer. pick the strongest one. project it out of the attention and MLP matrices. keep the norms. the result: 10 refusals out of 16 test prompts. that is 62 percent. the model still refused most harmful prompts.</p>
          <p className="blog-p">math and code still worked. the edit was safe. it was just too weak. one direction at full strength was not enough. more directions damaged the benchmarks. this is the same wall that part 1 mentioned. i needed a better way to explore the space.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">turn the problem into a search</h2>
          <p className="blog-p">hand-tuning has a limit. the search space is too large. there are 35 layers, several weight matrices per layer, and a strength value for each one. so i made the ablation a function of four numbers: the peak position, the window width, the peak strength, and the floor strength. four numbers describe the whole curve of edit strengths over the layers. then i let an optimizer search the four numbers.</p>
          <p className="blog-p">the loop is simple. the optimizer proposes four numbers. the machine builds the edit, applies it, and measures two scores: the refusal rate on 100 harmful prompts, and the KL divergence from the original model on 50 harmless prompts. KL divergence measures how much the output distribution changed. low KL means the model kept its capabilities. then the optimizer proposes the next four numbers, smarter this time. watch the machine run five trials.</p>
          <SearchMachineDemo />
          <p className="blog-p">the curve of edit strengths is called a kernel. attention and MLP get separate kernels, because MLP edits damage the model more than attention edits. the algorithm that proposes the numbers is TPE from the Optuna library. it learns from every trial. a trial that damages the model makes the next trial gentler. a trial with many refusals makes the next trial stronger.</p>
          <CodeBlock>{`
def kernel_weights(max_w, pos, min_frac, dist):
    """gaussian kernel: max_w at pos, decaying to max_w*min_frac
    at dist. ZERO edit outside the window."""
    min_w = max_w * min_frac
    return torch.tensor([
        0.0 if abs(l - pos) > dist
        else min_w + (max_w - min_w) * math.exp(-2.0 * (abs(l - pos) / dist) ** 2)
        for l in range(n_layers)
    ])
          `}</CodeBlock>
          <p className="blog-p">each trial is fast. only the edited matrices are stored. the originals stay in CPU memory. a trial restores the originals, applies a new edit, and measures the two scores. one trial takes about one minute on one GPU.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">attempt 2: the search finds the ceiling</h2>
          <p className="blog-p">the first search edited two components per layer: the attention output projection and the MLP down projection. strength was limited to 1.5. the kernel floor applied to all 35 layers. after 100 trials the best result was 32 percent refusals at KL 0.028.</p>
          <p className="blog-p">better than 62 percent. but not good. the search itself showed two reasons. first: the best trials pushed strength to the 1.5 limit. the search wanted more room. second: every trial edited every layer. the KL cost came from layers that gave no compliance. and a third problem was hiding in the math. the raw refusal direction is not pure. part of it points in the same direction as normal, harmless processing. remove the raw direction and you damage harmless behavior too.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">attempt 3: three fixes</h2>
          <p className="blog-p">so i changed three things. each fix answers one failure of attempt 2.</p>
          <p className="blog-p"><strong>fix 1: a sparse window.</strong> layers far from the kernel peak now get zero edit. not a small edit. zero. the edit becomes surgical. the KL budget is spent only where it buys compliance. drag the sliders to feel it.</p>
          <KernelExplorer />
          <p className="blog-p"><strong>fix 2: over-correction.</strong> the strength limit went from 1.5 to 4.0. a strength of 1.0 removes the refusal component from a weight row. a strength above 1.0 rotates the row past orthogonal. the model starts to anti-express the direction. this is the answer to the self-healing wall. the norms dilute the edit. over-correction compensates. step through it.</p>
          <StrengthDemo />
          <p className="blog-p"><strong>fix 3: a clean direction.</strong> before the edit, remove the part of the refusal direction that overlaps with harmless processing. this is one gram-schmidt step. the technique is called ORBA.</p>
          <ORBADemo />
          <p className="blog-p">i also added the key, query, and value projections as editable components. then i ran 100 trials again. the result was a clean pareto front.</p>
          <ParetoChart />
          <p className="blog-p">a pareto front is the set of trials where you cannot improve one score without making the other score worse. the green point is the one i shipped: 12 percent refusals at KL 0.048. the point at 10 percent has KL 0.116. that is too much damage. the point at 15 percent has KL 0.024. the front gives you the choice. before, there was no choice. there was only one edit and one outcome.</p>
          <p className="blog-p">the search also answered a question i did not ask. i thought the key and value projections carried the refusal signal. the best trial set the key/query/value strength to 0.01. almost zero. the search turned my hypothesis off. the win came from over-correction on the attention output projection, with a strength of 3.7. the barrier was never the key/value pathway. the barrier was the norms diluting a timid edit. this is why you run the search. the machine checks your beliefs.</p>
          <p className="blog-p">one more result was stable across all searches. the best direction always came from layer 17 or 18. layer 14 is the last layer with its own keys and values. layer 17 is where the shared pathway is first processed in full attention. the refusal signal crystallizes there.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">be honest about the evaluation</h2>
          <p className="blog-p">the numbers above use keyword matching on 100 public prompts. this has limits. gemma 4 can write a long helpful preamble and then refuse at the end. a keyword check on 100 tokens can miss this. an LLM judge catches it. so the true refusal rate is probably higher than 12 percent.</p>
          <p className="blog-p">some published models claim 3 percent refusals. treat these numbers with care. ask three questions. how many tokens were generated? what counted as a refusal? which prompts were used? if the model card does not answer these questions, the number means nothing.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what is next</h2>
          <p className="blog-p">two improvements are already running. the first one uses a subspace instead of one direction. research shows that refusal is multi-dimensional. one direction leaves residual components. the search now picks a rank between 1 and 4 per layer. the second improvement is the biprojected transform. it decomposes each weight matrix into magnitudes and unit vectors. it edits only the unit vectors. norm preservation becomes exact, not approximate. this should lower the KL at the same refusal rate.</p>
          <p className="blog-p">if that is not enough, the next step is RDO. RDO learns the direction with gradient descent through the frozen model. it does not estimate the direction from activations. the paper reports the same refusal removal with about 40 percent less capability damage.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the result</h2>
          <p className="blog-p">the model is on HuggingFace. math and code still work. the vision and audio encoders were not touched.</p>
          <ul className="blog-links-list">
            <li><a href="https://huggingface.co/Bahushruth/gemma-4-E2B-it-abliterated" target="_blank" rel="noopener noreferrer">Bahushruth/gemma-4-E2B-it-abliterated</a> (full model, bf16 safetensors)</li>
            <li><a href="https://huggingface.co/datasets/Bahushruth/abliteration-harmful-enriched" target="_blank" rel="noopener noreferrer">Bahushruth/abliteration-harmful-enriched</a> (7356 harmful prompts used for the directions)</li>
          </ul>
          <p className="blog-p">the progression in one table:</p>
          <div className="abl-quant-table">
            <div className="abl-quant-row abl-quant-header">
              <span>attempt</span><span>method</span><span>refusals</span><span>KL</span>
            </div>
            <div className="abl-quant-row">
              <span>manual</span><span>one direction, full strength, all layers</span><span>62%</span><span>not measured</span>
            </div>
            <div className="abl-quant-row">
              <span>search 1</span><span>2 components, dense kernel, strength ≤ 1.5</span><span>32%</span><span>0.028</span>
            </div>
            <div className="abl-quant-row">
              <span>search 2</span><span>5 components, sparse kernel, strength ≤ 4.0, ORBA</span><span>12%</span><span>0.048</span>
            </div>
          </div>
          <p className="blog-p">the lesson of part 2 is not a new technique. it is a change of method. part 1 guessed the edit. part 2 defined the tradeoff and searched it. guessing gives you one outcome. searching gives you the frontier.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-links-list">
            <li>
              <a href="https://github.com/p-e-w/heretic" target="_blank" rel="noopener noreferrer">p-e-w/heretic</a>
              <br /><span className="blog-ref-note">the tool that popularized optuna-based abliteration. worth reading if you want the industrial version of this post</span>
            </li>
            <li>
              <a href="https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration" target="_blank" rel="noopener noreferrer">grimjim - norm-preserving biprojected abliteration</a>
              <br /><span className="blog-ref-note">exact norm preservation. tops the abliteration leaderboards</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2502.17420" target="_blank" rel="noopener noreferrer">Wollschläger et al. - The Geometry of Refusal (ICML 2025)</a>
              <br /><span className="blog-ref-note">learns the refusal direction with gradient descent. same efficacy, much less damage</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2511.08379" target="_blank" rel="noopener noreferrer">Piras et al. - SOM Directions Are Better Than One (AAAI 2026)</a>
              <br /><span className="blog-ref-note">refusal is a manifold, not a line. multi-direction beats single-direction at the same budget</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2502.09674" target="_blank" rel="noopener noreferrer">Pan et al. - The Hidden Dimensions of LLM Alignment (ICML 2025)</a>
              <br /><span className="blog-ref-note">the formal proof that refusal is multi-dimensional</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2406.11717" target="_blank" rel="noopener noreferrer">Arditi et al. - Refusal in Language Models Is Mediated by a Single Direction (2024)</a>
              <br /><span className="blog-ref-note">the paper that started all of this. part 1 covers it</span>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
