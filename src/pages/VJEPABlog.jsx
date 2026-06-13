import { useState, useEffect, useRef } from 'react'
import { Highlight } from 'prism-react-renderer'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// ============ DIAGRAM BUILDING BLOCKS ============
const dc = { green: '#7ee787', blue: '#79c0ff', orange: '#ffa657', purple: '#d2a8ff', cyan: '#a5d6ff' }

function DBox({ color, dashed, children, style }) {
  return (
    <div style={{
      border: `1.5px ${dashed ? 'dashed' : 'solid'} ${color || '#333'}`,
      borderRadius: 8, padding: '14px 16px', background: '#111', ...style,
    }}>{children}</div>
  )
}

function DLabel({ children, color, size, mono, bold, style }) {
  return (
    <div style={{
      color: color || '#e6edf3', fontSize: size || 13, textAlign: 'center',
      fontFamily: mono ? "'Monaco','Menlo',monospace" : 'inherit',
      fontWeight: bold ? 600 : 400, lineHeight: 1.5, ...style,
    }}>{children}</div>
  )
}

function DArrow({ direction = 'down', color = '#555', label, style }) {
  const isDown = direction === 'down'
  return (
    <div style={{ textAlign: 'center', padding: isDown ? '4px 0' : '0 6px', display: isDown ? 'block' : 'flex', alignItems: 'center', ...style }}>
      {label && <span style={{ fontSize: 11, color: color, marginRight: isDown ? 0 : 4 }}>{label} </span>}
      <span style={{ fontSize: 18, color, lineHeight: 1 }}>{isDown ? '↓' : '→'}</span>
    </div>
  )
}

function DLayerStack({ count, label, color, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array(Math.min(count, 6)).fill(0).map((_, i) => (
        <div key={i} style={{
          padding: '5px 10px', borderRadius: 4, textAlign: 'center',
          background: `${color}12`, border: `1px solid ${color}30`,
          fontSize: 11, color, fontFamily: "'Monaco','Menlo',monospace",
        }}>{i === 0 ? label : i < Math.min(count, 6) - 1 ? label : `× ${count} total`}</div>
      ))}
      {sub && <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Fade({ children }) {
  const r = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setV(true)
    }, { threshold: 0.08 })
    if (r.current) o.observe(r.current)
    return () => o.disconnect()
  }, [])
  return (
    <div
      ref={r}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  )
}

const siteTheme = {
  plain: {
    color: '#e6edf3',
    backgroundColor: '#0a0a0a',
  },
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
    { types: ['decorator', 'annotation'], style: { color: '#ffa657' } },
    { types: ['variable', 'parameter'], style: { color: '#ffa657' } },
  ],
}

function CodeBlock({ file, children, language = 'python' }) {
  const code = typeof children === 'string' ? children.trim() : String(children).trim()
  return (
    <div className="blog-code-block">
      {file && <div className="blog-code-file">{file}</div>}
      <Highlight theme={siteTheme} code={code} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre className="blog-code-pre" style={{ ...style, backgroundColor: 'transparent' }}>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}

function Fig({ children, cap }) {
  return (
    <div className="blog-fig">
      <div className="blog-fig-inner">{children}</div>
      {cap && <div className="blog-fig-cap">{cap}</div>}
    </div>
  )
}

// ============ ARCHITECTURE DIAGRAM ============
function Arch() {
  return (
    <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ROW 1: Input pipeline */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 8 }}>
        <DBox color="#555" style={{ flex: 1 }}>
          <DLabel bold size={15}>Raw Video</DLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, margin: '10px auto', maxWidth: 130 }}>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} style={{ height: 12, borderRadius: 2, background: `rgba(255,255,255,${0.04 + Math.floor(i/4)*0.02})`, border: '1px solid #333' }} />
            ))}
          </div>
          <DLabel size={10} color="#888" mono>64 frames × 256×256</DLabel>
        </DBox>
        <DArrow direction="right" />
        <DBox color={dc.cyan} style={{ flex: 1 }}>
          <DLabel bold size={15} color={dc.cyan}>Tokenizer</DLabel>
          <div style={{ margin: '8px 0 4px', padding: '6px 10px', borderRadius: 5, border: `1px solid ${dc.cyan}30`, background: `${dc.cyan}0a` }}>
            <DLabel size={12} color={dc.cyan} mono>PatchEmbed3D (video)</DLabel>
          </div>
          <div style={{ padding: '6px 10px', borderRadius: 5, border: `1px solid ${dc.cyan}30`, background: `${dc.cyan}0a` }}>
            <DLabel size={12} color={dc.cyan} mono>PatchEmbed (images)</DLabel>
          </div>
          <DLabel size={10} color="#888" mono style={{ marginTop: 8 }}>→ 8192 tokens × 1408d</DLabel>
        </DBox>
        <DArrow direction="right" />
        <DBox color="#555" dashed style={{ flex: 1 }}>
          <DLabel bold size={15}>Masking</DLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, margin: '10px auto', maxWidth: 140 }}>
            {Array(20).fill(0).map((_, i) => {
              const vis = i % 4 === 0
              return <div key={i} style={{ height: 12, borderRadius: 2, background: vis ? `${dc.green}40` : 'rgba(255,255,255,0.03)', border: `1px solid ${vis ? dc.green + '60' : '#222'}` }} />
            })}
          </div>
          <DLabel size={10} color="#888">~75% masked / 25% visible</DLabel>
        </DBox>
      </div>

      {/* Routing arrows */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 10px' }}>
        <div style={{ textAlign: 'center' }}>
          <DLabel size={11} color={dc.green}>visible tokens</DLabel>
          <div style={{ color: dc.green, fontSize: 16 }}>↓</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <DLabel size={11} color={dc.blue}>context + mask tokens</DLabel>
          <div style={{ color: dc.blue, fontSize: 16 }}>↓</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <DLabel size={11} color={dc.orange}>full unmasked</DLabel>
          <div style={{ color: dc.orange, fontSize: 16, letterSpacing: 2 }}>⤓</div>
        </div>
      </div>

      {/* ROW 2: Three main components */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        {/* Context Encoder */}
        <DBox color={dc.green} style={{ flex: 2 }}>
          <DLabel bold size={16}>Context Encoder</DLabel>
          <DLabel size={12} color={dc.green} mono>VisionTransformer (ViT-G)</DLabel>
          <DLabel size={11} color="#888" mono>dim=1408 · depth=40 · heads=22 · SiLU · RoPE</DLabel>
          <div style={{ margin: '12px 0 8px' }}>
            <DLayerStack count={40} label="Self-Attn + SiLU MLP" color={dc.green} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '6px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: dc.purple }} />
            <DLabel size={10} color={dc.purple}>deep supervision taps at intermediate layers</DLabel>
          </div>
          <DLabel size={11} color={dc.green} mono style={{ marginTop: 8 }}>output: [B, N_vis, 1408]</DLabel>
        </DBox>

        {/* Arrow encoder → predictor */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <DLabel size={10} color={dc.blue} mono>ctx</DLabel>
            <div style={{ color: dc.blue, fontSize: 18 }}>→</div>
          </div>
        </div>

        {/* Predictor */}
        <DBox color={dc.blue} style={{ flex: 2 }}>
          <DLabel bold size={16}>Predictor</DLabel>
          <DLabel size={12} color={dc.blue} mono>VisionTransformerPredictor</DLabel>
          <DLabel size={11} color="#888" mono>depth=24 · dim=384 · heads=12</DLabel>
          <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              '1. Linear(1408 → 384)',
              '2. + pos_embed',
              '3. mask tokens + pos',
              '4. concat + argsort',
            ].map(s => (
              <div key={s} style={{ padding: '4px 8px', borderRadius: 4, background: `${dc.blue}10`, border: `1px solid ${dc.blue}25`, fontSize: 11, color: dc.blue, fontFamily: "'Monaco','Menlo',monospace", textAlign: 'center' }}>{s}</div>
            ))}
            <DLayerStack count={24} label="Self-Attn + MLP" color={dc.blue} />
            <div style={{ padding: '4px 8px', borderRadius: 4, background: `${dc.blue}10`, border: `1px solid ${dc.blue}25`, fontSize: 11, color: dc.blue, fontFamily: "'Monaco','Menlo',monospace", textAlign: 'center' }}>5. Linear(384 → 1408)</div>
          </div>
          <div style={{ padding: '4px 8px', borderRadius: 4, background: `${dc.blue}15`, border: `1px solid ${dc.blue}30`, textAlign: 'center', marginBottom: 6 }}>
            <DLabel size={11} mono>return_all_tokens = True</DLabel>
          </div>
          <DLabel size={11} color={dc.blue} mono>output: predicted z</DLabel>
        </DBox>

        {/* Target Encoder */}
        <DBox color={dc.orange} dashed style={{ flex: 1 }}>
          <DLabel bold size={14}>Target Encoder</DLabel>
          <DLabel size={12} color={dc.orange} mono>EMA copy</DLabel>
          <div style={{ margin: '12px 0' }}>
            <DLayerStack count={40} label="(same as encoder)" color={dc.orange} sub="dashed = no gradients" />
          </div>
          <DLabel size={11} color="#888" mono style={{ lineHeight: 1.8 }}>
            θ_t = m·θ_t + (1-m)·θ_enc{'\n'}m = 0.99925
          </DLabel>
          <DLabel size={11} color="#888" style={{ marginTop: 8 }}>processes full video</DLabel>
          <DLabel size={11} color="#888" mono>+ layer_norm</DLabel>
          <DLabel size={11} color={dc.orange} mono style={{ marginTop: 8 }}>output: target h</DLabel>
        </DBox>
      </div>

      {/* Arrows to loss */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 4 }}>
        <div style={{ textAlign: 'center' }}><DLabel size={11} color={dc.blue} mono>z (predicted)</DLabel><div style={{ color: dc.purple, fontSize: 16 }}>↓</div></div>
        <div style={{ textAlign: 'center' }}><DLabel size={11} color={dc.orange} mono>h (target)</DLabel><div style={{ color: dc.purple, fontSize: 16 }}>↓</div></div>
      </div>

      {/* Loss */}
      <DBox color={dc.purple} style={{ maxWidth: 480, margin: '0 auto 16px' }}>
        <DLabel bold size={16}>Loss</DLabel>
        <DLabel size={14} color={dc.purple} mono style={{ margin: '6px 0' }}>L = mean( |z - h|^p ) / p</DLabel>
        <DLabel size={11} color="#888">L1 loss (p=1.0) · all mask groups · applied at multiple encoder layers</DLabel>
      </DBox>

      {/* Model variants */}
      <div style={{ background: '#111', borderRadius: 8, padding: '12px', border: '1px solid #333' }}>
        <DLabel size={12} color="#888" style={{ marginBottom: 8 }}>Model Variants</DLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { n: 'ViT-L', p: '300M', d: '1024', l: '24', hl: false },
            { n: 'ViT-H', p: '600M', d: '1280', l: '32', hl: false },
            { n: 'ViT-g', p: '1B', d: '1408', l: '40', hl: false },
            { n: 'ViT-G', p: '1.4B', d: '1408', l: '40', hl: true },
          ].map(m => (
            <div key={m.n} style={{ padding: '8px', borderRadius: 6, background: m.hl ? `${dc.green}0d` : 'rgba(255,255,255,0.02)', border: `${m.hl ? 1.5 : 1}px solid ${m.hl ? dc.green : dc.green + '30'}`, textAlign: 'center' }}>
              <DLabel size={14} color={dc.green} bold>{m.n}</DLabel>
              <DLabel size={10} color="#888">{m.p}</DLabel>
              <DLabel size={10} color="#888" mono>d={m.d} · L={m.l}</DLabel>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ ROBOT PIPELINE DIAGRAM ============
function RobotArch() {
  return (
    <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 20, maxWidth: 520, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Two inputs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
        <DBox color={dc.cyan} style={{ flex: 1 }}>
          <DLabel bold size={15} color={dc.cyan}>Camera Feed</DLabel>
          <DLabel size={11} color="#888">current observation</DLabel>
        </DBox>
        <DBox color={dc.orange} style={{ flex: 1 }}>
          <DLabel bold size={15} color={dc.orange}>Goal Image</DLabel>
          <DLabel size={11} color="#888">desired world state</DLabel>
        </DBox>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 80 }}>
        <div style={{ color: '#555', fontSize: 16, textAlign: 'center' }}>↘</div>
        <div style={{ color: '#555', fontSize: 16, textAlign: 'center' }}>↙</div>
      </div>

      <DBox color={dc.green}>
        <DLabel bold size={15} color={dc.green}>Frozen Encoder (ViT-G)</DLabel>
        <DLabel size={12} color="#888">encode both views → latent representations</DLabel>
        <DLabel size={10} color="#888" mono>no gradients, pretrained weights locked</DLabel>
      </DBox>
      <DArrow />

      <DBox color={dc.blue}>
        <DLabel bold size={15} color={dc.blue}>Action-Conditioned Predictor</DLabel>
        <DLabel size={12} color={dc.blue} mono>VisionTransformerPredictorAC</DLabel>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
          {['action', 'state', 'patch₁', 'patch₂', '...', 'patchₙ'].map((t, i) => (
            <div key={t} style={{ padding: '3px 8px', borderRadius: 3, background: `${i < 2 ? dc.purple : dc.blue}15`, border: `1px solid ${i < 2 ? dc.purple : dc.blue}30`, fontSize: 10, color: i < 2 ? dc.purple : dc.blue, fontFamily: "'Monaco','Menlo',monospace" }}>{t}</div>
          ))}
        </div>
        <DLabel size={11} color="#888">causal attention, each frame sees only past + current</DLabel>
        <DLabel size={11} color="#888">simulates action sequences in embedding space</DLabel>
        <DLabel size={10} color="#888" mono style={{ marginTop: 4 }}>post-trained on DROID dataset</DLabel>
      </DBox>
      <DArrow />

      <DBox color={dc.purple}>
        <DLabel bold size={15} color={dc.purple}>Best Action Sequence</DLabel>
        <DLabel size={12} color="#888">7-DoF joint commands via latent planning</DLabel>
      </DBox>
      <DArrow />

      <DBox color="#666">
        <DLabel bold size={15}>Robot Executes</DLabel>
        <DLabel size={12} color="#888">Franka Panda arm, zero-shot, no fine-tuning</DLabel>
      </DBox>
    </div>
  )
}

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="blog-chart-tooltip">
      <div style={{ color: '#fff', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  )
}

const bench = [
  { name: 'SSv2', vjepa2: 77.3, prev: 69.7 },
  { name: 'EK100', vjepa2: 39.7, prev: 27.6 },
  { name: 'Diving48', vjepa2: 90.2, prev: 86.4 },
  { name: 'MVP', vjepa2: 44.5, prev: 39.9 },
  { name: 'TempCompass', vjepa2: 76.9, prev: 75.3 },
]

const ablation = [
  { name: 'V-JEPA 2', seg: 22.2, cls: 72.8 },
  { name: '+ Context Loss', seg: 33.8, cls: 62.5 },
  { name: '+ Deep Self-Sup.', seg: 38.6, cls: 72.1 },
  { name: '+ Data Scaling', seg: 40.8, cls: 72.6 },
  { name: '+ Multi-modal Tok.', seg: 41.4, cls: 72.6 },
  { name: '+ Model Scaling', seg: 47.1, cls: 76.1 },
  { name: '+ Hi-Res Anneal', seg: 47.9, cls: 77.7 },
]

function PaperFig({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', borderRadius: 6, display: 'block' }}
      loading="lazy"
    />
  )
}

const robot = [
  { task: 'Reach', vjepa: 100, octo: 100, cosmos: 80 },
  { task: 'Grasp Cup', vjepa: 60, octo: 10, cosmos: 0 },
  { task: 'Grasp Box', vjepa: 20, octo: 0, cosmos: 20 },
  { task: 'P&P Cup', vjepa: 80, octo: 10, cosmos: 0 },
  { task: 'P&P Box', vjepa: 50, octo: 10, cosmos: 0 },
]

export default function VJEPABlog() {
  return (
    <main className="main blog-main">

      {/* hero */}
      <div className="blog-hero">
        <Fade>
          <h1 className="blog-title">what the fuck is a JEPA?</h1>
        </Fade>
      </div>

      <div className="blog-body">

        {/* ====== 01 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">introduction</h2>
          <p className="blog-p">lets start from first principles because everyone talks about this model without explaining the actual insight behind it.</p>
          <p className="blog-p">most video models try to predict future frames at the pixel level. like, you show the model 10 frames and ask it to generate frame 11. the problem with this is that the physical world is full of shit thats basically unpredictable at the pixel level: leaves rustling, water rippling, lighting changing. if you force the model to predict all of that, it wastes most of its capacity on noise instead of learning the actual physics of whats happening.</p>
          <p className="blog-p">JEPA (joint embedding predictive architecture) flips this. instead of predicting pixels, you predict in representation space. you take some of the video, encode it into abstract vectors, hide other parts, and train the model to predict the abstract representations of the hidden parts. the model never has to reconstruct actual pixels. it just has to predict the meaning.</p>
          <p className="blog-p">this is yann lecuns whole thesis and honestly its a really clean idea. by learning in latent space the model is forced to understand the underlying structure: how objects interact, how gravity works, how hands grasp things. without getting bogged down in surface-level visual noise.</p>
          <p className="blog-p">v-jepa 2 applies this to video. v-jepa 2.1 (dropped march 16, like 10 days ago) fixes some problems with the original and is now SOTA on basically everything. both are open source.</p>

          <Fig cap="PCA of patch features mapped to RGB. V-JEPA 2 features are noisy and fragmented. V-JEPA 2.1 produces spatially coherent representations where similar objects map to the same colors. source: Mur-Labadia et al. 2026, arxiv:2603.14482">
            <PaperFig src="/diagrams/paper/fig1-pca-features-crop.png" alt="PCA feature visualization comparing V-JEPA 2 vs V-JEPA 2.1 dense features" />
          </Fig>
        </section>

        {/* ====== 02 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the problem 2.1 actually solves</h2>
          <p className="blog-p">video AI has been stuck in this annoying tradeoff that nobody could crack until now.</p>
          <p className="blog-p">on one side you have video-first models (like the original v-jepa 2). these are great at understanding motion. the model gets that "person reaches for cup, lifts cup, drinks" is one continuous action. it understands temporal dynamics really well. but its shit at spatial detail. the object boundaries are blurry, depth estimation is mediocre, segmentation is grainy. it knows things are moving but cant tell you exactly where they are.</p>
          <p className="blog-p">on the other side you have image-first models like DINOv2 and DINOv3. these have pixel-perfect spatial understanding. incredible segmentation, depth, object boundaries. but theyre trained on static images so they have literally zero understanding of time. they dont know what "reaching for a cup" means as a sequence.</p>
          <p className="blog-p">so youre fucked either way. you get motion OR spatial precision. never both. and for anything useful. like a robot that needs to track an object, predict where its going, and physically grab it. you need both.</p>
          <p className="blog-p">v-jepa 2.1 finally cracks this. it beats DINOv3 (a 7 billion parameter image specialist) on depth estimation with only 2B params while simultaneously being SOTA on action recognition. one model does everything.</p>
        </section>

        {/* ====== 03 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the architecture (mapped to actual code)</h2>
          <p className="blog-p">ok heres the architecture. i cloned the repo and went through the source so everything here maps to actual classes and methods in <code>facebookresearch/vjepa2</code>.</p>

          <Fig cap="V-JEPA 2.1 architecture from the paper. x-encoder processes visible tokens, predictor fills in the rest, y-encoder (EMA) provides targets. two losses: L1 on masked predictions + distance-weighted L1 on context tokens. source: Mur-Labadia et al. 2026, arxiv:2603.14482">
            <PaperFig src="/diagrams/paper/fig4-architecture-crop.png" alt="V-JEPA 2.1 detailed architecture diagram from the paper" />
          </Fig>

          <Fig cap="same architecture mapped to actual code. each box = a real class in src/models/">
            <img src="/diagrams/vjepa21-architecture.svg" alt="V-JEPA 2.1 architecture diagram mapped to code" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <p className="blog-p">lets walk through it piece by piece.</p>
          <p className="blog-p">first, tokenization. your video comes in as a tensor of shape B×3×T×H×W (batch × channels × frames × height × width). for a typical input thats 64 frames at 256×256. the tokenizer chops this into 3D patches called tubelets. each one is 2 frames × 16×16 pixels. thats a Conv3d under the hood. for a 64-frame 256×256 video you get 32×16×16 = 8192 tokens. each token represents a little chunk of spacetime.</p>
          <p className="blog-p">the clever thing in 2.1 is that images get their own 2D tokenizer (a Conv2d) instead of being faked as 16x-duplicated video clips like in v-jepa 2. this is dumb simple but it matters. the old approach wasted compute and confused the model.</p>

          <CodeBlock file="src/models/vision_transformer.py: how tokenization works">
{`# in VisionTransformer.__init__()
if self.is_video:
    self.patch_embed = PatchEmbed3D(
        patch_size=16, tubelet_size=2,
        in_chans=3, embed_dim=1408  # for ViT-G
    )
    # (64 // 2) * (256 // 16) * (256 // 16) = 8192 tokens
else:
    self.patch_embed = PatchEmbed(
        patch_size=16, in_chans=3, embed_dim=1408
    )`}
          </CodeBlock>

          <p className="blog-p">then about 75% of those 8192 tokens get masked out. the model only sees ~25%, random sparse patches scattered across space and time. the masking config uses 2 strategies simultaneously: 8 small spatiotemporal blocks (15% spatial scale) and 2 large blocks (70% spatial scale). this forces both local and global predictions.</p>

          <Fig cap="the masking strategy. 8 small blocks force local prediction, 2 large blocks force global prediction. ~75% of tokens are masked total.">
            <img src="/diagrams/vjepa21-masking.svg" alt="V-JEPA 2.1 multi-block masking strategy" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>
          <p className="blog-p">the visible patches go through the encoder. for ViT-G thats a 40-layer vision transformer with 1408-dim embeddings, 22 attention heads, and 3D rotary position embeddings (RoPE). heres the actual constructor:</p>

          <CodeBlock file="src/models/vision_transformer.py: ViT-G definition">
{`def vit_giant_xformers(patch_size=16, **kwargs):
    return VisionTransformer(
        embed_dim=1408,     # token dimension
        depth=40,           # 40 transformer blocks
        num_heads=22,       # attention heads
        mlp_ratio=48/11,    # ~4.36x FFN expansion
        use_rope=True,      # 3D rotary pos embeddings
        use_silu=True,      # SiLU activation (not GELU)
    )`}
          </CodeBlock>

          <p className="blog-p">the key thing in 2.1 is the <code>out_layers</code> parameter. when you set this, the encoder taps intermediate layer outputs in addition to the final output. this is how deep self-supervision works. the loss gets applied at multiple points in the network, not just the end. in v-jepa 2 the loss only hit the final layer, and by that point all the fine-grained spatial info had been abstracted away. applying loss at intermediate layers forces spatial structure to propagate through the whole network.</p>

          <Fig cap="deep self-supervision: tap encoder at layers 24, 32, 40. layernorm each, concat to 4224d, MLP fuse back to 1408d. loss applied at every tap.">
            <img src="/diagrams/vjepa21-deep-supervision.svg" alt="Deep self-supervision tap mechanism" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock file="src/models/vision_transformer.py: forward() with deep supervision">
{`def forward(self, x, masks=None):
    x = self.patch_embed(x)       # tokenize
    if masks is not None:
        x = apply_masks(x, masks) # keep only visible tokens

    outs = []
    for i, blk in enumerate(self.blocks):
        x = blk(x, mask=masks)    # transformer block
        # tap intermediate outputs for deep supervision
        if self.out_layers is not None and i in self.out_layers:
            outs.append(self.norm(x))

    if self.out_layers is not None:
        return outs  # list of outputs at each tapped layer
    return self.norm(x)`}
          </CodeBlock>
        </section>

        {/* ====== 04 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the predictor (where the magic happens)</h2>
          <p className="blog-p">the predictor is a separate, smaller transformer defined in <code>src/models/predictor.py</code>. its job is to take the context embeddings from the encoder and predict what the hidden patches look like in representation space.</p>

          <Fig cap="the full predictor forward pass. project down, add positions, create mask tokens, concat and sort, run through 12 transformer blocks, project back up.">
            <img src="/diagrams/vjepa21-predictor-flow.svg" alt="Predictor forward pass step by step" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>
          <p className="blog-p">heres how it actually works step by step. it projects the context tokens down from 1408-dim to 384-dim (saves compute). creates learnable mask tokens that carry positional info about where the hidden patches are. concatenates everything together, sorts by position so the transformer sees tokens in spatial order, runs it through 24 transformer blocks (for ViT-G), then projects back up to 1408-dim.</p>

          <CodeBlock file="src/models/predictor.py: the forward pass simplified">
{`def forward(self, x, masks_x, masks_y, mask_index=1):
    # x = context tokens from encoder
    # masks_x = where visible tokens are
    # masks_y = where hidden tokens are

    B = len(x) // len(masks_x)

    # project down: 1408 → 384
    x = self.predictor_embed(x)

    # add positional embedding to visible tokens
    x += apply_masks(self.predictor_pos_embed, masks_x)

    # create mask tokens for hidden positions
    pred_tokens = self.mask_tokens[mask_index]  # learned [1,1,384]
    pred_tokens = pred_tokens.repeat(B, self.num_patches, 1)
    pred_tokens = apply_masks(pred_tokens, masks_y)
    pred_tokens += apply_masks(self.predictor_pos_embed, masks_y)

    # concatenate and sort by position
    x = torch.cat([x, pred_tokens], dim=1)
    argsort = torch.argsort(masks, dim=1)
    x = x[argsort]  # now in spatial order

    # run through predictor transformer (24 blocks for ViT-G)
    for blk in self.predictor_blocks:
        x = blk(x, mask=masks)

    # project back up: 384 → 1408
    x = self.predictor_proj(self.predictor_norm(x))
    return x`}
          </CodeBlock>

          <p className="blog-p">the <code>return_all_tokens</code> flag is the switch between v-jepa 2 and 2.1 behavior. when False (v-jepa 2 default) it only returns predictions for the masked tokens. when True (2.1) it returns predictions for ALL tokens, both visible and hidden. this is what enables the dense predictive loss. the model gets supervised on every single token, not just the ones it had to guess.</p>
          <p className="blog-p">think about it like this. in v-jepa 2, the visible tokens just had to pass through the encoder well enough for the predictor to reconstruct the hidden ones. but the encoder was never directly told "hey, your representation of this visible patch needs to be accurate." so it took shortcuts. it could be sloppy about spatial details in visible patches because nobody was checking. v-jepa 2.1 checks everything.</p>

          <Fig cap="the difference is dramatic. top row: original images. middle: V-JEPA 2 PCA features are noisy garbage. bottom: adding the context loss produces clean, semantically coherent feature maps. dog heads map to the same color, car wheels map to the same color. source: arxiv:2603.14482">
            <PaperFig src="/diagrams/paper/fig3-context-loss-crop.png" alt="Effect of context loss on feature map quality" />
          </Fig>
        </section>

        {/* ====== 05 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the loss function</h2>
          <p className="blog-p">the actual loss is in <code>app/vjepa/train.py</code> and its dead simple. its an L1 loss (or generalized Lp loss) between the predicted embeddings and the target embeddings. nothing fancy.</p>

          <Fig cap="the complete training loop. 4 steps repeated for 800 epochs: target encoder on full video, encoder+predictor on masked, loss computation, EMA update.">
            <img src="/diagrams/vjepa21-training-loop.svg" alt="V-JEPA 2.1 training loop" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock file="app/vjepa/train.py: the full training step">
{`def train_step():
    scheduler.step()
    wd_scheduler.step()

    # 1. target encoder processes FULL video (no mask)
    with torch.no_grad():
        h = target_encoder(clips)  # full unmasked
        h = [F.layer_norm(hi, (hi.size(-1),)) for hi in h]

    # 2. context encoder + predictor process MASKED video
    z = encoder(clips, masks_enc)       # encode visible only
    z = predictor(z, masks_enc, masks_pred)  # predict hidden

    # 3. loss: how close are predictions to targets?
    def loss_fn(z, h):
        h = [apply_masks(hi, mi) for hi, mi in zip(h, masks_pred)]
        loss, n = 0, 0
        for zi, hi in zip(z, h):
            for zij, hij in zip(zi, hi):
                loss += torch.mean(torch.abs(zij - hij) ** 1.0)
                n += 1
        return loss / n  # average over all mask groups

    loss = loss_fn(z, h)
    loss.backward()
    optimizer.step()

    # 4. EMA update target encoder
    m = 0.99925  # momentum
    with torch.no_grad():
        for p_enc, p_tgt in zip(encoder.parameters(),
                                 target_encoder.parameters()):
            p_tgt.mul_(m).add_(p_enc, alpha=1-m)`}
          </CodeBlock>

          <p className="blog-p">ok let me break down what each of these 4 steps actually does because this is the whole training loop.</p>
          <p className="blog-p">step 1. the target encoder is an exponential moving average copy of the main encoder. its weights are a slow-moving average: 99.925% old weights + 0.075% new encoder weights every step. this gives you stable targets that dont collapse. its the same trick from BYOL and DINO. it processes the FULL unmasked video so the targets represent what the patches actually look like.</p>
          <p className="blog-p">step 2. the context encoder only sees the ~25% visible patches (masked input). it encodes those, and the predictor takes those encoded patches and tries to predict the representations of the hidden ~75%. in v-jepa 2.1 with return_all_tokens=True, it predicts everything.</p>
          <p className="blog-p">step 3. the loss is literally just the absolute difference between predicted embeddings (z) and target embeddings (h), averaged across all mask groups. the <code>loss_exp</code> is 1.0 which makes it an L1 loss. thats it. no contrastive learning, no negative pairs, no complicated shit. just "predict the representation and minimize the distance."</p>
          <p className="blog-p">step 4. after each step, the target encoder weights get nudged slightly toward the current encoder weights. this slow-moving target is what prevents representation collapse (where everything maps to the same embedding). its a beautifully simple design.</p>
        </section>

        {/* ====== 06 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">fine-tuning (its barely any code)</h2>
          <p className="blog-p">after pretraining you freeze the encoder. done. never touch those weights again. for downstream tasks you train a tiny attentive probe on top. its defined in <code>src/models/attentive_pooler.py</code> and its hilariously simple.</p>

          <CodeBlock file="src/models/attentive_pooler.py: the whole probe">
{`class AttentiveClassifier(nn.Module):
    def __init__(self, embed_dim, num_heads, num_classes):
        super().__init__()
        # learned query token that cross-attends to features
        self.pooler = AttentivePooler(
            num_queries=1,       # single query token
            embed_dim=embed_dim, # 1408 for ViT-G
            num_heads=num_heads,
            depth=1,
        )
        self.linear = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.pooler(x).squeeze(1)  # [B, 1408]
        return self.linear(x)           # [B, num_classes]`}
          </CodeBlock>

          <p className="blog-p">thats the entire fine-tuning architecture. a single learned query token that cross-attends to all the frozen encoder features, then a linear layer. the loss is standard cross-entropy. only the probe weights get gradients. the encoder is behind a <code>torch.no_grad()</code> wall.</p>

          <CodeBlock file="evals/video_classification_frozen/eval.py: fine-tuning loop">
{`criterion = torch.nn.CrossEntropyLoss()

for clips, labels in data_loader:
    with torch.no_grad():
        features = encoder(clips)  # frozen, no gradients

    logits = classifier(features)  # only this trains
    loss = criterion(logits, labels)
    loss.backward()  # gradients only through classifier
    optimizer.step()`}
          </CodeBlock>

          <p className="blog-p">this is why the pretraining matters so much. the entire downstream performance depends on the quality of the frozen features. if the encoder learned good representations during self-supervised pretraining, a trivially simple probe on top should perform well. and it does: 77.3% on SSv2, 90.2% on Diving48, 39.7% on EPIC-KITCHENS. all with this tiny attentive probe.</p>
        </section>

        {/* ====== 07 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">zero-shot robot control</h2>
          <p className="blog-p">the robot stuff uses a separate action-conditioned predictor (<code>VisionTransformerPredictorAC</code>) thats post-trained on the DROID dataset. this is where it gets wild.</p>

          <Fig cap="robot planning pipeline. frozen encoder + action-conditioned world model">
            <img src="/diagrams/vjepa21-robot-pipeline.svg" alt="Zero-shot robot control pipeline" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <p className="blog-p">the AC predictor is like the regular predictor but it also takes robot actions and joint states as input. at each timestep it interleaves action tokens, state tokens, and visual tokens, then uses a causal attention mask so it cant peek at future frames:</p>

          <CodeBlock file="src/models/ac_predictor.py: interleaving actions with vision">
{`def forward(self, x, actions, states):
    x = self.predictor_embed(x)  # visual tokens
    a = self.action_encoder(actions)  # Linear(7, 1024)
    s = self.state_encoder(states)    # Linear(7, 1024)

    x = x.view(B, T, H*W, D)
    # per frame: [action, state, patch_1, patch_2, ...]
    x = torch.cat([a, s, x], dim=2).flatten(1, 2)

    # causal mask: each frame sees only past + current
    attn_mask = self.attn_mask[:x.size(1), :x.size(1)]

    for blk in self.predictor_blocks:
        x = blk(x, attn_mask=attn_mask)

    # strip action/state tokens, keep visual predictions
    x = x.view(B, T, 2+H*W, D)[:, :, 2:, :]
    return self.predictor_proj(x)`}
          </CodeBlock>

          <p className="blog-p">at inference time the robot does this: encode current camera view with the frozen encoder. encode goal image (what you want the world to look like). use the AC predictor to simulate different action sequences in embedding space: "if i move my arm this way, the world state embedding becomes X, if i then do Y it becomes Z." pick the action sequence that gets the predicted final state closest to the goal state. execute.</p>
          <p className="blog-p">the franka panda robot arm has never seen these objects before. zero fine-tuning on specific objects. it learned general physics from watching millions of videos of humans doing stuff and it just transfers to robot control. the pick-and-place success rate is 80% on cups vs 10% for Octo and 0% for Cosmos.</p>
        </section>

        {/* ====== 08 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the numbers</h2>
          <p className="blog-p">official results from the repo. v-jepa 2 vs previous SOTA on video understanding benchmarks (frozen encoder + attentive probes):</p>

          <Fig>
            <div style={{ padding: '22px 14px 6px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bench} barGap={6} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <Bar dataKey="prev" name="prev SOTA" fill="#666" opacity={0.5} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="vjepa2" name="V-JEPA 2" fill="#79c0ff" opacity={0.6} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Fig>

          <p className="blog-p">each innovation in the 2.1 training recipe adds measurable gains. heres the ablation from ViT-L showing how segmentation (ADE20K mIoU) and classification (SSv2 accuracy) improve as you stack each component:</p>

          <Fig cap="ablation of V-JEPA 2.1 training recipe. context loss unlocks segmentation but initially hurts classification. deep self-supervision recovers it. model scaling + hi-res annealing push both to SOTA.">
            <div style={{ padding: '22px 14px 6px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ablation} barGap={4} barCategoryGap="16%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 9, fontFamily: 'monospace' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} angle={-25} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 80]} label={{ value: 'mIoU', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[50, 80]} label={{ value: 'Acc %', angle: 90, position: 'insideRight', fill: '#555', fontSize: 10 }} />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="seg" name="Segmentation (ADE20K)" fill="#79c0ff" opacity={0.5} radius={[2, 2, 0, 0]} />
                  <Bar yAxisId="right" dataKey="cls" name="Classification (SSv2)" fill="#ffa657" opacity={0.5} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Fig>

          <p className="blog-p">the EK100 number is insane: 39.7% vs 27.6% previous best. thats the "predict what the human does 1 second from now" task. 12 point absolute improvement on egocentric action anticipation. directly relevant for AR headsets.</p>
          <p className="blog-p">robot manipulation zero-shot:</p>

          <Fig>
            <div style={{ padding: '22px 14px 6px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={robot} barGap={4} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="task" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 11 }} />
                  <Bar dataKey="octo" name="Octo" fill="#666" opacity={0.4} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cosmos" name="Cosmos" fill="#ffa657" opacity={0.4} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="vjepa" name="V-JEPA 2-AC" fill="#7ee787" opacity={0.6} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Fig>

          <p className="blog-p">pick and place cup: 80% vs 10% (Octo) vs 0% (Cosmos). these are real robot arms picking up real objects theyve never seen before. no fine-tuning on specific objects.</p>
        </section>

        {/* ====== 09 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">running it</h2>
          <CodeBlock file="setup + loading" language="bash">
{`git clone https://github.com/facebookresearch/vjepa2
cd vjepa2 && pip install .

# load via torch hub
import torch
encoder = torch.hub.load('facebookresearch/vjepa2', 'vjepa2_vit_giant')
processor = torch.hub.load('facebookresearch/vjepa2', 'vjepa2_preprocessor')

# or huggingface
from transformers import AutoModel, AutoVideoProcessor
model = AutoModel.from_pretrained("facebook/vjepa2-vitg-fpc64-256")`}
          </CodeBlock>
          <CodeBlock file="pretraining (128 GPUs lol)" language="bash">
{`python -m app.main_distributed \\
  --fname configs/train/vitg16/pretrain-256px-16f.yaml \\
  --time 6000 --account my_account

# training eval probes
python -m evals.main \\
  --fname configs/eval/vitl/ssv2.yaml \\
  --devices cuda:0 cuda:1`}
          </CodeBlock>
        </section>

        {/* ====== 10 ====== */}
        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">bottom line</h2>
          <p className="blog-p">v-jepa 2 is the best self-supervised video encoder out right now. the frozen features give you action recognition, depth, segmentation, tracking, and robot control from a single backbone with no architecture changes between tasks. just swap the probe on top.</p>
          <p className="blog-p">the codebase is clean as fuck. encoder, predictor, and loss are all readable and well-structured. the only "tricks" are the masking strategy and the EMA target encoder. everything else is standard transformer machinery. that means improvements to ViTs in general directly benefit this model.</p>
          <p className="blog-p">for anyone working on video understanding, temporal reasoning, or embodied AI. this is probably the foundation you want to build on. the encoder trained on 163M samples is hard to beat with smaller-scale training. and the latent world model approach for robot planning (simulating in embedding space instead of pixel space) is the more interesting long-term direction.</p>
          <p className="blog-p">code and weights at github.com/facebookresearch/vjepa2. model variants from 300M to 1.4B params. MIT license. go nuts</p>
        </section>

      </div>
    </main>
  )
}
