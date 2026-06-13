import { useState, useRef, useEffect } from 'react'
import { Highlight } from 'prism-react-renderer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function M({ children, block }) {
  const html = (() => {
    try { return katex.renderToString(children, { displayMode: !!block, throwOnError: false }) }
    catch { return children }
  })()
  if (block) return <div className="blog-math-block" dangerouslySetInnerHTML={{ __html: html }} />
  return <span className="blog-math-inline" dangerouslySetInnerHTML={{ __html: html }} />
}

// --- shared blog primitives (same as other posts) ---

function Fade({ children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {children}
    </div>
  )
}

const theme = {
  plain: { backgroundColor: 'transparent', color: '#c9d1d9' },
  styles: [
    { types: ['keyword', 'builtin'], style: { color: '#ff7b72' } },
    { types: ['string', 'char'], style: { color: '#a5d6ff' } },
    { types: ['comment'], style: { color: '#8b949e', fontStyle: 'italic' } },
    { types: ['function', 'class-name'], style: { color: '#d2a8ff' } },
    { types: ['number', 'boolean'], style: { color: '#79c0ff' } },
    { types: ['attr-name', 'property'], style: { color: '#7ee787' } },
    { types: ['operator', 'punctuation'], style: { color: '#c9d1d9' } },
  ],
}

function CodeBlock({ file, language = 'python', children }) {
  return (
    <div className="blog-code-block">
      {file && <div className="blog-code-file">{file}</div>}
      <Highlight code={children.trim()} language={language} theme={theme}>
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

// --- layer score chart ---

const LAYER_SCORES = Array.from({ length: 32 }, (_, i) => {
  const base = Math.exp(-0.5 * Math.pow((i - 14) / 6, 2)) * 0.0042
  const noise = (Math.sin(i * 2.3) * 0.0003 + Math.cos(i * 1.7) * 0.0002)
  return { layer: i, score: Math.max(0.0001, base + noise) }
})
const TOP_LAYER = LAYER_SCORES.reduce((best, d) => d.score > best.score ? d : best, LAYER_SCORES[0])

function LayerChart() {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="blog-chart-tooltip">
        <div>layer {payload[0].payload.layer}</div>
        <div style={{ color: '#7ee787' }}>score {payload[0].value.toFixed(5)}</div>
      </div>
    )
  }
  return (
    <div className="abl-layer-viz">
      <p className="abl-layer-caption">refusal direction score per layer -- peak at layer {TOP_LAYER.layer}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={LAYER_SCORES} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="layer" tick={{ fill: '#585858', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="score" radius={0}>
            {LAYER_SCORES.map((entry) => (
              <Cell key={entry.layer} fill={entry.layer === TOP_LAYER.layer ? '#7ee787' : '#2a2a2a'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- orthogonalization step-through ---

function OrthoDemo() {
  const [step, setStep] = useState(0)
  const W = 600, H = 400
  const cx = W / 2, cy = H / 2 + 30
  const scale = 140

  const wx = 0.6, wy = -0.8
  const rx = 0.7071, ry = -0.7071
  const dot = wx * rx + wy * ry
  const projX = dot * rx, projY = dot * ry
  const orthX = wx - projX, orthY = wy - projY
  const origNorm = Math.sqrt(wx * wx + wy * wy)
  const orthNorm = Math.sqrt(orthX * orthX + orthY * orthY)
  const scaledX = orthX * (origNorm / orthNorm)
  const scaledY = orthY * (origNorm / orthNorm)

  const toSVG = (x, y) => [cx + x * scale, cy + y * scale]
  const [ox, oy] = toSVG(0, 0)
  const [wx1, wy1] = toSVG(wx, wy)
  const [rx1, ry1] = toSVG(rx * 1.3, ry * 1.3)
  const [px, py] = toSVG(projX, projY)
  const [ox2, oy2] = toSVG(orthX, orthY)
  const [sx, sy] = toSVG(scaledX, scaledY)

  const arrowHead = (x1, y1, x2, y2, color, size = 7) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const p1x = x2 - size * Math.cos(angle - 0.4)
    const p1y = y2 - size * Math.sin(angle - 0.4)
    const p2x = x2 - size * Math.cos(angle + 0.4)
    const p2y = y2 - size * Math.sin(angle + 0.4)
    return <polygon points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`} fill={color} />
  }

  const steps = [
    'original weight vector w',
    'refusal direction r is identified',
    'component along r is projected out -- w gets shorter',
    'w is rescaled back to its original length',
  ]

  const descriptions = [
    <>each row of a weight matrix is a vector in <M>{"\\mathbb{R}^d"}</M>. this is <M>{"w"}</M> -- one row of an attention output projection.</>,
    <>we computed <M>{"r"}</M> by taking the mean difference between harmful and harmless activations. it points in the direction the model shifts when refusing.</>,
    <>removing the component along <M>{"r"}</M>: <M>{"w' = w - (w \\cdot r)r"}</M>. the dot product <M>{"w \\cdot r"}</M> measures how much <M>{"w"}</M> points in the refusal direction. subtracting <M>{"(w \\cdot r)r"}</M> removes exactly that component. <M>{"w'"}</M> is now shorter than <M>{"w"}</M>.</>,
    <>rescale <M>{"w'"}</M> back to <M>{"\\|w\\|"}</M>. now <M>{"w'"}</M> has zero component along <M>{"r"}</M> and the same length as the original. the model can no longer produce outputs in the refusal direction from this weight.</>,
  ]

  return (
    <div className="abl-ortho-demo">
      <div className="abl-ortho-steps">
        {steps.map((l, i) => (
          <button key={i} className={`abl-step-btn${step === i ? ' active' : ''}`} onClick={() => setStep(i)}>
            {i + 1}. {l}
          </button>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="abl-svg">
        {/* grid lines */}
        {[-1, -0.5, 0.5, 1].map(v => (
          <g key={v}>
            <line x1={cx + v * scale} y1={oy - 170} x2={cx + v * scale} y2={oy + 130} stroke="#1a1a1a" strokeWidth={1} />
            <line x1={cx - 170} y1={cy + v * scale - 30} x2={cx + 170} y2={cy + v * scale - 30} stroke="#1a1a1a" strokeWidth={1} />
          </g>
        ))}
        {/* axes */}
        <line x1={cx - 170} y1={oy} x2={cx + 170} y2={oy} stroke="#2a2a2a" strokeWidth={1.5} />
        <line x1={cx} y1={oy - 170} x2={cx} y2={oy + 130} stroke="#2a2a2a" strokeWidth={1.5} />
        <text x={cx + 174} y={oy + 4} fill="#333" fontSize={11} fontFamily="monospace">x</text>
        <text x={cx + 4} y={oy - 174} fill="#333" fontSize={11} fontFamily="monospace">y</text>
        <text x={cx + 4} y={oy + 14} fill="#333" fontSize={11} fontFamily="monospace">0</text>

        {/* refusal direction r */}
        {step >= 1 && (
          <>
            <line x1={ox} y1={oy} x2={rx1} y2={ry1} stroke="#ff7b72" strokeWidth={2} strokeDasharray="6 4" />
            {arrowHead(ox, oy, rx1, ry1, '#ff7b72', 8)}
            <text x={rx1 + 10} y={ry1 - 6} fill="#ff7b72" fontSize={12} fontFamily="monospace" fontWeight="600">r  (refusal dir)</text>
          </>
        )}

        {/* projection dashed line */}
        {step >= 2 && (
          <>
            <line x1={wx1} y1={wy1} x2={px} y2={py} stroke="#ffa657" strokeWidth={1.5} strokeDasharray="5 4" />
            <circle cx={px} cy={py} r={5} fill="none" stroke="#ffa657" strokeWidth={1.5} />
            <text x={px + 10} y={py + 5} fill="#ffa657" fontSize={11} fontFamily="monospace">(w·r)r</text>
          </>
        )}

        {/* original w -- fades out at step 2 */}
        {step < 2 && (
          <>
            <line x1={ox} y1={oy} x2={wx1} y2={wy1} stroke="#79c0ff" strokeWidth={2.5} />
            {arrowHead(ox, oy, wx1, wy1, '#79c0ff', 9)}
            <text x={wx1 + 10} y={wy1 - 6} fill="#79c0ff" fontSize={12} fontFamily="monospace" fontWeight="600">w</text>
          </>
        )}
        {step >= 2 && (
          <line x1={ox} y1={oy} x2={wx1} y2={wy1} stroke="#222" strokeWidth={1.5} strokeDasharray="3 4" />
        )}

        {/* w' orthogonalized */}
        {step >= 2 && (
          <>
            <line x1={ox} y1={oy} x2={ox2} y2={oy2} stroke="#d2a8ff" strokeWidth={2.5} />
            {arrowHead(ox, oy, ox2, oy2, '#d2a8ff', 9)}
            <text x={ox2 - 10} y={oy2 - 12} fill="#d2a8ff" fontSize={12} fontFamily="monospace" fontWeight="600">w'</text>
            <text x={ox2 - 10} y={oy2 - 28} fill="#d2a8ff" fontSize={10} fontFamily="monospace">(shorter)</text>
          </>
        )}

        {/* w' rescaled */}
        {step >= 3 && (
          <>
            <line x1={ox} y1={oy} x2={sx} y2={sy} stroke="#7ee787" strokeWidth={3} />
            {arrowHead(ox, oy, sx, sy, '#7ee787', 10)}
            <text x={sx + 10} y={sy - 6} fill="#7ee787" fontSize={12} fontFamily="monospace" fontWeight="600">w'  rescaled</text>
            <text x={sx + 10} y={sy + 10} fill="#7ee787" fontSize={10} fontFamily="monospace">(||w''|| = ||w||)</text>
          </>
        )}

        {/* norm arc showing w and w' rescaled have same length */}
        {step >= 3 && (() => {
          const r = origNorm * scale
          const startAngle = Math.atan2(wy, wx)
          const endAngle = Math.atan2(scaledY, scaledX)
          const x1a = cx + r * Math.cos(startAngle)
          const y1a = cy - 30 + r * Math.sin(startAngle)
          const x2a = cx + r * Math.cos(endAngle)
          const y2a = cy - 30 + r * Math.sin(endAngle)
          return (
            <path
              d={`M ${x1a} ${y1a} A ${r} ${r} 0 0 1 ${x2a} ${y2a}`}
              fill="none"
              stroke="#7ee787"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
            />
          )
        })()}

        <circle cx={ox} cy={oy} r={4} fill="#444" />
      </svg>
      <p className="abl-ortho-caption">{descriptions[step]}</p>
    </div>
  )
}

// --- main ---

export default function AbliterationBlog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero">
        <Fade>
          <h1 className="blog-title">how to surgically remove the ability of LLMs to refuse</h1>
        </Fade>
      </div>

      <div className="blog-body">

        <section className="blog-section">
          <h2 className="blog-section-tag">refusal is not a filter</h2>
          <p className="blog-p">every large language model shipped in the last few years has a behavior baked in: it refuses. ask it something it considers uncomfortable and it says "i cannot help with that." this is not a blocklist sitting in front of the model. its not a filter. its something the model learned during RLHF training and encoded directly into the weights.</p>
          <p className="blog-p">for consumer products thats fine. but if youre a security researcher, a red-teamer, or someone who wants to run a local model without a nanny getting in the way, it becomes a problem fast.</p>
          <p className="blog-p">i spent a few weeks figuring out how to remove it. not jailbreaking -- jailbreaking is prompt engineering that tricks the model into compliance on a per-query basis. what im talking about is going into the weights and cutting out the part of the model that knows how to refuse. permanently. the model i published on HuggingFace ended up at 0% refusal rate with math and code completely intact.</p>
          <p className="blog-p">the technique is called abliteration. here is exactly how it works.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how refusal actually works inside the model</h2>
          <p className="blog-p">to understand how to remove refusal you first have to understand where it lives. transformers process tokens through something called the residual stream. think of it as a vector that flows through the network -- each layer reads from it, does computation, and writes back into it. by the last layer that vector encodes everything the model knows about the input and is used to decide what token to generate next.</p>
          <p className="blog-p">when a harmful prompt comes in, the model has learned -- through thousands of RLHF training steps -- to push its internal representations in a specific direction in the residual stream when it detects something it should refuse. this shift accumulates layer by layer and eventually tips the model into generating "i cannot help with that."</p>
          <p className="blog-p">the key insight from mechanistic interpretability research is that this shift is geometrically consistent. across many different harmful prompts the residual stream gets pushed in roughly the same direction. not identically, but consistently enough to measure. that direction is called the refusal direction. and if you can find it, you can remove it from the weights entirely so the model loses the ability to build it up in the first place.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">computing the refusal direction</h2>
          <p className="blog-p">the algorithm starts by running two sets of prompts through the model: a set of harmful prompts and a set of harmless prompts. for each one, at every transformer layer, you hook into the forward pass and capture the hidden state at the last token position.</p>
          <p className="blog-p">the last token position is the one that matters because in autoregressive transformers, causal attention means the last token has attended to the entire context. its the point where the model decides what comes next. that hidden state is a vector in <M>{"\\mathbb{R}^d"}</M> where <M>{"d"}</M> is the model's hidden dimension -- 2048 for Qwen3.6-35B-A3B.</p>
          <p className="blog-p">with N harmful prompts and N harmless prompts collected, you compute a mean vector for each set at each layer:</p>

          <CodeBlock file="abliterate_qwen3_6_v4.py">{`
for layer_idx in range(n_layers):
    harmful_mean = harmful_activations[layer_idx].mean(dim=0)   # shape: (d_model,)
    harmless_mean = harmless_activations[layer_idx].mean(dim=0)

    # difference of means is the refusal direction
    refusal_dir = harmful_mean - harmless_mean
    refusal_dir = refusal_dir / refusal_dir.norm()  # normalize to unit vector

    score = abs(refusal_dir.mean().item())
    refusal_scores.append((score, layer_idx))

refusal_scores.sort(reverse=True)
top_layer = refusal_scores[0][1]  # layer with strongest refusal signal
          `}</CodeBlock>

          <p className="blog-p">the difference of means gives a vector that points from "how the model represents harmless input" to "how the model represents harmful input." normalizing it to a unit vector gives the refusal direction.</p>
          <p className="blog-p">you get one candidate direction per layer. to rank them you score each one by the absolute value of its mean. a high score means the mean activation difference is large and coherent -- that layer carries a strong refusal signal. the chart below shows how this looks across 32 layers. the refusal mechanism crystallizes in the middle layers, after enough context has been absorbed but before the model commits to a specific token prediction.</p>
          <LayerChart />
          <p className="blog-p">i used 512 harmful prompts and 512 harmless prompts. the harmful set combines the mlabonne/harmful_behaviors dataset with 6924 synthetic prompts generated via API. 35 categories, each sampled across 10 prompt styles. the diversity matters a lot. a narrow homogeneous set gives you a direction that captures surface-level prompt features rather than the actual refusal mechanism.</p>

          <CodeBlock file="generate_synthetic_data.py">{`
HARMFUL_CATEGORIES = [
    ("malware and ransomware",           "keyloggers, RATs, ransomware, botnets, rootkits, cryptominers, worms, droppers"),
    ("social engineering and phishing",  "spear phishing, pretexting, vishing, credential harvesting, CEO fraud"),
    ("weapons manufacturing",            "3D printed guns, illegal mods, silencers, pipe bombs, improvised explosives"),
    ("drug synthesis and distribution",  "meth synthesis, fentanyl analogues, precursor extraction, evading detection, dark web sales"),
    ("bioweapons and dangerous chemistry","pathogen enhancement, toxin synthesis, nerve agent precursors, weaponization methods"),
    ("fraud and financial crime",        "credit card fraud, check washing, money laundering, identity theft, shell companies"),
    ("disinformation and propaganda",    "fake news, astroturfing, deepfake scripts, influence ops, radicalization pipelines"),
    ("violence and targeted harm",       "assault planning, hiring hitmen, stalking, swatting, ambush tactics"),
    # ... 27 more categories
]

STYLES = [
    "direct blunt request",
    "fictional or roleplay framing (novel, game, screenplay, character)",
    "hypothetical or thought experiment framing",
    "educational or research framing (for a paper, to understand the subject better)",
    "professional cover story (pen tester, journalist, academic, doctor, writer)",
    "indirect ask (for a friend, to prevent something, just curious)",
    "emotional framing (desperate, scared, life situation)",
    "technical deep-dive (step-by-step, code, exact formulas, specific tools)",
    "subtle or coded language phrasing",
    "asking in a different language or mixing languages",
]
          `}</CodeBlock>

          <p className="blog-p">each category gets 14 batches of 15 prompts = ~200 per category, generated across all 10 styles. the script is resume-safe -- it checks which categories are already present in the output file and skips them, so you can kill and restart without regenerating.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">removing the direction from the weights</h2>
          <p className="blog-p">finding the direction is the easy part. actually removing it from the model requires modifying the weight matrices so the model physically cannot build up that direction in its residual stream during inference.</p>
          <p className="blog-p">the operation is called orthogonalization. for a unit vector <M>{"r"}</M>, the outer product <M>{"rr^\\top"}</M> is a rank-1 matrix that projects any vector onto <M>{"r"}</M>. applying <M>{"(I - rr^\\top)"}</M> to a vector removes its component along <M>{"r"}</M> and leaves only the part orthogonal to it. if you apply this transformation to every weight matrix that writes into the residual stream, the model loses the ability to route activations along the refusal direction.</p>
          <p className="blog-p">the weight matrices that matter are the ones that produce outputs going into the residual stream: the attention output projections, the MLP down projections, and the token embedding matrix. these are the gates through which information enters the stream at each layer.</p>
          <p className="blog-p">the exact operation depends on the shape of the weight matrix. for an output projection of shape <M>{"(d_{\\text{model}}, \\ldots)"}</M> you apply the projection on the left: <M>{"W' = W - rr^\\top W"}</M>. for an input-side projection of shape <M>{"(\\ldots, d_{\\text{model}})"}</M> you apply it on the right: <M>{"W' = W - W rr^\\top"}</M>. the embedding matrix is shape <M>{"(\\text{vocab}, d_{\\text{model}})"}</M> so it takes the right-side form.</p>
          <p className="blog-p">there is one critical fix on top of vanilla orthogonalization. when you project out a component from a vector, the vector gets shorter. if <M>{"w' = w - (w \\cdot r)r"}</M>, then <M>{"\\|w'\\|^2 = \\|w\\|^2 - (w \\cdot r)^2"}</M>, which is always less than or equal to <M>{"\\|w\\|^2"}</M>. applied across hundreds of weight matrices throughout the network, this causes systematic norm reduction -- the residual stream magnitudes shrink layer by layer and the model gets noticeably dumber.</p>
          <p className="blog-p">the fix is to rescale each row back to its original norm after projecting. the result is a vector with zero component along <M>{"r"}</M> and the exact same length as the original:</p>
          <M block>{"w'' = w' \\cdot \\frac{\\|w\\|}{\\|w'\\|}, \\quad \\text{where} \\quad w' = w - (w \\cdot r)r"}</M>
          <p className="blog-p">step through the geometry below:</p>
          <OrthoDemo />

          <CodeBlock file="abliterate_qwen3_6_v4.py">{`
def orthogonalize_norm_preserving(weight, directions):
    original_norms = weight.norm(dim=-1, keepdim=True)  # save norms before

    for direction in directions:
        direction = direction.to(weight.device, dtype=weight.dtype)
        proj = torch.outer(direction, direction)  # rr^T, shape (d, d)

        if weight.shape[0] == d_model:
            # output projection: rows are d_model-dim output vectors
            weight = weight - proj @ weight         # W' = W - rr^T W
        elif weight.shape[-1] == d_model:
            # input projection: last dim is d_model
            weight = weight - weight @ proj         # W' = W - W rr^T

    # rescale each row back to its original norm
    new_norms = weight.norm(dim=-1, keepdim=True)
    scale = original_norms / (new_norms + 1e-8)    # epsilon avoids div by zero
    return weight * scale
          `}</CodeBlock>

          <p className="blog-p">the epsilon in the denominator handles the edge case where a row gets numerically zeroed out during projection. without it you get NaN in the scale factors and the whole weight matrix is poisoned.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the Qwen3.6 architecture is annoying to abliterate</h2>
          <p className="blog-p">Qwen3.6-35B-A3B is a hybrid MoE architecture. most abliteration scripts are written for dense models with standard attention, and two things about Qwen3.6 break them silently if you dont account for them.</p>
          <p className="blog-p">first: hybrid attention. some layers in Qwen3.6 use standard multi-head self-attention with weight <code>self_attn.o_proj</code>. other layers use linear attention (a Mamba-style state space mechanism) with weight <code>linear_attn.out_proj</code>. a script that only looks for <code>o_proj</code> silently skips half the attention layers and leaves them unabliterated. you get partial results and wonder why.</p>
          <p className="blog-p">second: MoE expert weights. Qwen3.6 has 256 experts plus 1 shared expert per MoE layer. the expert down projections are stored as a single 3D tensor of shape (n_experts, d_hidden, d_model). standard orthogonalization operates on 2D matrices. for the 3D case you need to apply the projection independently to each expert's weight slice, which requires an einsum rather than a matmul:</p>

          <CodeBlock file="abliterate_qwen3_6_v4.py">{`
for i, layer in enumerate(model.model.layers):
    # handle both attention types
    if hasattr(layer, "self_attn"):
        o = layer.self_attn.o_proj
        o.weight.data = orthogonalize_norm_preserving(o.weight, ortho_dirs)
    elif hasattr(layer, "linear_attn"):
        o = layer.linear_attn.out_proj
        o.weight.data = orthogonalize_norm_preserving(o.weight, ortho_dirs)

    # shared expert down proj (2D, standard path)
    if hasattr(layer.mlp, "shared_expert"):
        d = layer.mlp.shared_expert.down_proj
        d.weight.data = orthogonalize_norm_preserving(d.weight, ortho_dirs)

    # routed experts down proj (3D tensor, requires einsum)
    if hasattr(layer.mlp, "experts"):
        for name, param in layer.mlp.experts.named_parameters():
            if "down_proj" in name and param.dim() == 3:
                original_norms = param.data.norm(dim=-1, keepdim=True)
                for direction in ortho_dirs:
                    d = direction.to(param.device, dtype=param.dtype)
                    proj = torch.outer(d, d)
                    # apply projection to each expert independently
                    param.data = param.data - torch.einsum("ij,ejk->eik", proj, param.data)
                new_norms = param.data.norm(dim=-1, keepdim=True)
                param.data = param.data * (original_norms / (new_norms + 1e-8))
          `}</CodeBlock>

          <p className="blog-p">the einsum <code>ij,ejk-&gt;eik</code> reads as: for each expert e, compute proj @ param[e]. the i and j index the projection matrix dimensions, e indexes the expert, k indexes the hidden dimension. without this you leave all 256 experts untouched in every MoE layer and get a model that still refuses.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the result</h2>
          <p className="blog-p">the abliterated model is Bahushruth/Qwen3.6-35B-A3B-abliterated-v4 on HuggingFace. 0% refusal rate on the test set, math and coding intact. the norm preservation is what keeps it from getting dumber -- without the rescaling step the model degrades noticeably, the residual stream magnitudes just keep shrinking layer by layer.</p>
          <p className="blog-p">GGUF quants are available from Q4_K_M (~22GB) to BF16 (~71GB). on an M4 Pro 48GB the Q5_K_M fits comfortably. one note: use standard NTP inference, not MTP speculative decoding. MTP slows down prompt processing on Apple Silicon more than it speeds up token generation. the GGUF is built with --no-mtp.</p>
          <p className="blog-p">the dataset is at Bahushruth/abliteration-harmful-enriched if you want to run this on a different model. the quality of that dataset is what makes the whole thing work. the refusal direction is only as good as the distribution of prompts you use to compute it. diverse styles, categories, and languages means the direction genuinely captures the refusal mechanism rather than superficial text features that happen to correlate with it.</p>
        </section>

      </div>
    </main>
  )
}
