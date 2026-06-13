import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Fade, CodeBlock, YouTube } from '../components/BlogPrimitives'

function M({ children, block }) {
  const html = (() => {
    try { return katex.renderToString(children, { displayMode: !!block, throwOnError: false }) }
    catch { return children }
  })()
  if (block) return <div className="blog-math-block" dangerouslySetInnerHTML={{ __html: html }} />
  return <span className="blog-math-inline" dangerouslySetInnerHTML={{ __html: html }} />
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
      <p className="abl-layer-caption">refusal direction score per layer. peak at layer {TOP_LAYER.layer}</p>
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
  const [paused, setPaused] = useState(false)

  const wx = 0.6, wy = -0.8
  const rx = 0.7071, ry = -0.7071
  const dot = wx * rx + wy * ry
  const projX = dot * rx, projY = dot * ry
  const orthX = wx - projX, orthY = wy - projY
  const origNorm = Math.sqrt(wx * wx + wy * wy)
  const orthNorm = Math.sqrt(orthX * orthX + orthY * orthY)
  const scaledX = orthX * (origNorm / orthNorm)
  const scaledY = orthY * (origNorm / orthNorm)

  const W = 300, H = 300
  const cx = W / 2, cy = H / 2
  const scale = 110

  const toSVG = (x, y) => [cx + x * scale, cy + y * scale]
  const [ox, oy] = toSVG(0, 0)
  const [wx1, wy1] = toSVG(wx, wy)
  const [rx1, ry1] = toSVG(rx * 1.2, ry * 1.2)
  const [px, py] = toSVG(projX, projY)
  const [ox2, oy2] = toSVG(orthX, orthY)
  const [sx, sy] = toSVG(scaledX, scaledY)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % 4), 2800)
    return () => clearInterval(id)
  }, [paused])

  const arrow = (x1, y1, x2, y2, color, w = 2) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const s = 6
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} />
        <polygon
          points={`${x2},${y2} ${x2 - s * Math.cos(angle - 0.4)},${y2 - s * Math.sin(angle - 0.4)} ${x2 - s * Math.cos(angle + 0.4)},${y2 - s * Math.sin(angle + 0.4)}`}
          fill={color}
        />
      </g>
    )
  }

  const stepColors = ['#79c0ff', '#ff7b72', '#d2a8ff', '#7ee787']
  const stepLabels = ['w', 'r', 'project', 'rescale']
  const descriptions = [
    <>weight vector <M>{"w"}</M>, one row of a weight matrix</>,
    <>refusal direction <M>{"r"}</M> from mean activation difference</>,
    <><M>{"w' = w - (w \\cdot r)r"}</M> removes refusal component</>,
    <>rescale to original norm. zero along <M>{"r"}</M>, same magnitude</>,
  ]

  return (
    <div className="abl-ortho-demo" onClick={() => { setStep(s => (s + 1) % 4); setPaused(true) }}>
      <div className="abl-ortho-steps">
        {stepLabels.map((label, i) => (
          <button
            key={i}
            className={`abl-step-btn${step === i ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}
          >
            <span className="abl-step-num" style={{ background: step === i ? stepColors[i] : 'transparent', color: step === i ? '#0f0f0f' : '#585858' }}>{i + 1}</span>
            <span className="abl-step-label">{label}</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">{descriptions[step]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="abl-svg">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#1a1a1a" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#1a1a1a" strokeWidth={1} />

        {step >= 1 && (
          <g opacity={step === 1 ? 1 : 0.4}>
            {arrow(ox, oy, rx1, ry1, '#ff7b72')}
            <text x={rx1 + 6} y={ry1 - 6} fill="#ff7b72" fontSize={11} fontFamily="monospace">r</text>
          </g>
        )}

        {step >= 2 && (
          <line x1={wx1} y1={wy1} x2={px} y2={py} stroke="#ffa657" strokeWidth={1.5} strokeDasharray="4 3" opacity={step === 2 ? 1 : 0.3} />
        )}

        {step < 2 ? (
          <g>
            {arrow(ox, oy, wx1, wy1, '#79c0ff', 2.5)}
            <text x={wx1 + 6} y={wy1 - 6} fill="#79c0ff" fontSize={11} fontFamily="monospace">w</text>
          </g>
        ) : (
          <line x1={ox} y1={oy} x2={wx1} y2={wy1} stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
        )}

        {step === 2 && (
          <g>
            {arrow(ox, oy, ox2, oy2, '#d2a8ff', 2.5)}
            <text x={ox2 + 6} y={oy2 - 6} fill="#d2a8ff" fontSize={11} fontFamily="monospace">w'</text>
          </g>
        )}

        {step === 3 && (
          <g>
            {arrow(ox, oy, sx, sy, '#7ee787', 2.5)}
            <text x={sx + 6} y={sy - 6} fill="#7ee787" fontSize={11} fontFamily="monospace">w'</text>
            <path
              d={`M ${ox + 30 * Math.cos(Math.atan2(ry, rx))} ${oy + 30 * Math.sin(Math.atan2(ry, rx))} A 30 30 0 0 0 ${ox + 30 * Math.cos(Math.atan2(scaledY, scaledX))} ${oy + 30 * Math.sin(Math.atan2(scaledY, scaledX))}`}
              fill="none" stroke="#585858" strokeWidth={1}
            />
            <text x={ox + 42 * Math.cos((Math.atan2(ry, rx) + Math.atan2(scaledY, scaledX)) / 2)} y={oy + 42 * Math.sin((Math.atan2(ry, rx) + Math.atan2(scaledY, scaledX)) / 2)} fill="#585858" fontSize={9} fontFamily="monospace" textAnchor="middle">90°</text>
          </g>
        )}

        <circle cx={ox} cy={oy} r={2.5} fill="#555" />
      </svg>
    </div>
  )
}

// --- main ---

export default function AbliterationBlog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/abliteration-hero.jpg" alt="surgical removal" className="blog-hero-img" />
            <h1 className="blog-title">surgically removing refusal tendencies in LLMs</h1>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <YouTube id="sKBhqKYcDos" />

        <section className="blog-section">
          <h2 className="blog-section-tag">refusal is not a filter</h2>
          <p className="blog-p">every large language model shipped in the last few years has a behavior baked in: it refuses. ask it something it considers uncomfortable and it says "i cannot help with that." this is not a blocklist sitting in front of the model. its not a filter. its something the model learned during RLHF training and encoded directly into the weights.</p>
          <p className="blog-p">for consumer products thats fine. but if youre a security researcher, a red-teamer, or someone who wants to run a local model without a nanny getting in the way, it becomes a problem fast.</p>
          <p className="blog-p">i spent a few weeks figuring out how to remove it. not jailbreaking. jailbreaking is prompt engineering that tricks the model into compliance on a per-query basis. what im talking about is going into the weights and cutting out the part of the model that knows how to refuse. permanently. the model i published on HuggingFace ended up at 0% refusal rate with math and code completely intact.</p>
          <p className="blog-p">the technique is called abliteration. here is exactly how it works.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how refusal actually works inside the model</h2>
          <p className="blog-p">to understand how to remove refusal you first have to understand where it lives. transformers process tokens through something called the residual stream. think of it as a vector that flows through the network. each layer reads from it, does computation, and writes back into it. by the last layer that vector encodes everything the model knows about the input and is used to decide what token to generate next.</p>
          <p className="blog-p">when a harmful prompt comes in, the model has learned through thousands of RLHF training steps to push its internal representations in a specific direction in the residual stream when it detects something it should refuse. this shift accumulates layer by layer and eventually tips the model into generating "i cannot help with that."</p>
          <p className="blog-p">the key insight from mechanistic interpretability research is that this shift is geometrically consistent. across many different harmful prompts the residual stream gets pushed in roughly the same direction. not identically, but consistently enough to measure. that direction is called the refusal direction. and if you can find it, you can remove it from the weights entirely so the model loses the ability to build it up in the first place.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">building the dataset</h2>
          <p className="blog-p">the whole technique lives and dies on the quality of your contrastive pairs. you need a large set of harmful prompts and a large set of harmless prompts. the harmful set needs to be genuinely diverse. different categories, different phrasings, different angles of attack. if all your harmful prompts sound the same ("write malware that...") youll extract a direction that captures "prompts starting with write malware" rather than the actual internal refusal mechanism.</p>
          <p className="blog-p">i generated 7356 harmful prompts synthetically via API. 35 categories of harmful content, each generated across 10 distinct prompt styles. the categories cover everything from malware to financial crime to disinformation to dangerous chemistry. the styles vary from direct blunt requests to roleplay framing to educational framing to coded language. the dataset is at Bahushruth/abliteration-harmful-enriched on HuggingFace if you want to use it.</p>

          <CodeBlock>{`
from datasets import load_dataset

# the enriched harmful dataset -- 7356 prompts, 35 categories, 10 styles
harmful_dataset = load_dataset("Bahushruth/abliteration-harmful-enriched")

# harmless baseline from mlabonne
harmless_dataset = load_dataset("mlabonne/harmless_alpaca")

# wrap into chat format for the tokenizer
def reformat(texts):
    return [[{"role": "user", "content": t}] for t in texts]

harmful_train = reformat(harmful_dataset["train"]["text"])   # 5880 prompts
harmful_test = reformat(harmful_dataset["test"]["text"])     # 1476 prompts
harmless_train = reformat(harmless_dataset["train"]["text"])
          `}</CodeBlock>

          <p className="blog-p">the diversity across styles is critical. a model trained with RLHF learns to refuse across many framings. direct asks, roleplay attempts, hypothetical scenarios, everything. if you only use direct "how to make a bomb" type prompts your refusal direction will only capture the shallow pattern of those specific phrasings. the model will still refuse roleplay-framed requests because that part of the refusal mechanism was never measured.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">caching activations with hooks</h2>
          <p className="blog-p">once you have the dataset loaded you need to extract the models internal representations for each prompt at every layer. transformers dont expose intermediate hidden states by default. you get logits out the other end and thats it.</p>
          <p className="blog-p">PyTorchs <code>register_forward_hook</code> solves this. you attach a callback to any module and it fires every time that modules forward pass executes. the callback gets the modules inputs and outputs. you grab the output tensor, pull it off GPU, and stash it.</p>

          <CodeBlock>{`
def get_residual_activations(tokens, batch_size=8):
    layer_activations = defaultdict(list)

    def make_hook(layer_idx):
        def hook_fn(module, input, output):
            if isinstance(output, tuple):
                hidden = output[0]
            else:
                hidden = output
            # last token position: has seen entire context via causal attention
            layer_activations[layer_idx].append(hidden[:, -1, :].detach().cpu())
        return hook_fn

    # attach hook to every transformer layer
    hooks = []
    for i, layer in enumerate(model.model.layers):
        h = layer.register_forward_hook(make_hook(i))
        hooks.append(h)

    # run batched inference
    for b in range(0, tokens.shape[0], batch_size):
        model(tokens[b:b+batch_size])
        gc.collect()
        torch.cuda.empty_cache()

    for h in hooks:
        h.remove()

    return {k: torch.cat(v, dim=0) for k, v in layer_activations.items()}

harmful_activations = get_residual_activations(harmful_tokens)
harmless_activations = get_residual_activations(harmless_tokens)
          `}</CodeBlock>

          <p className="blog-p">3 things matter here. first: <code>make_hook</code> is a closure factory. without it every hook captures the same loop variable <code>i</code> and you end up with 32 copies of layer 31s activations. classic Python footgun. second: <code>.detach().cpu()</code> is non-negotiable. without detach you keep the entire computation graph alive. without cpu you run out of GPU memory within 3 batches. third: you hook the layer module itself (not attention or MLP individually) because you want the full residual stream output after both attention and MLP have written into it.</p>
          <p className="blog-p">the result is a dict mapping each layer index to a tensor of shape (N, d_model). for 512 prompts across 32 layers with d_model=2048 in bfloat16, thats about 64MB of cached activations. entirely manageable.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">computing the refusal direction</h2>
          <p className="blog-p">with the cached activations in hand you can now compute the refusal direction. for each layer, take the mean of all harmful activation vectors and the mean of all harmless activation vectors. their difference points from "how the model represents harmless input" to "how it represents harmful input."</p>
          <p className="blog-p">that difference vector, normalized to unit length, is the refusal direction for that layer. you get one per layer. the question is which layer carries the strongest signal.</p>

          <CodeBlock>{`
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
          <p className="blog-p">you get one candidate direction per layer. to rank them you score each one by the absolute value of its mean. a high score means the mean activation difference is large and coherent. that layer carries a strong refusal signal. the chart below shows how this looks across 32 layers. the refusal mechanism crystallizes in the middle layers, after enough context has been absorbed but before the model commits to a specific token prediction.</p>
          <LayerChart />
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">removing the direction from the weights</h2>
          <p className="blog-p">finding the direction is the easy part. actually removing it from the model requires modifying the weight matrices so the model physically cannot build up that direction in its residual stream during inference.</p>
          <p className="blog-p">the operation is called orthogonalization. for a unit vector <M>{"r"}</M>, the outer product <M>{"rr^\\top"}</M> is a rank-1 matrix that projects any vector onto <M>{"r"}</M>. applying <M>{"(I - rr^\\top)"}</M> to a vector removes its component along <M>{"r"}</M> and leaves only the part orthogonal to it. if you apply this transformation to every weight matrix that writes into the residual stream, the model loses the ability to route activations along the refusal direction.</p>
          <p className="blog-p">the weight matrices that matter are the ones that produce outputs going into the residual stream: the attention output projections, the MLP down projections, and the token embedding matrix. these are the gates through which information enters the stream at each layer.</p>
          <p className="blog-p">the exact operation depends on the shape of the weight matrix. for an output projection of shape <M>{"(d_{\\text{model}}, \\ldots)"}</M> you apply the projection on the left: <M>{"W' = W - rr^\\top W"}</M>. for an input-side projection of shape <M>{"(\\ldots, d_{\\text{model}})"}</M> you apply it on the right: <M>{"W' = W - W rr^\\top"}</M>. the embedding matrix is shape <M>{"(\\text{vocab}, d_{\\text{model}})"}</M> so it takes the right-side form.</p>
          <p className="blog-p">there is one critical fix on top of vanilla orthogonalization. when you project out a component from a vector, the vector gets shorter. if <M>{"w' = w - (w \\cdot r)r"}</M>, then <M>{"\\|w'\\|^2 = \\|w\\|^2 - (w \\cdot r)^2"}</M>, which is always less than or equal to <M>{"\\|w\\|^2"}</M>. applied across hundreds of weight matrices throughout the network, this causes systematic norm reduction. the residual stream magnitudes shrink layer by layer and the model gets noticeably dumber.</p>
          <p className="blog-p">the fix is to rescale each row back to its original norm after projecting. the result is a vector with zero component along <M>{"r"}</M> and the exact same length as the original:</p>
          <M block>{"w'' = w' \\cdot \\frac{\\|w\\|}{\\|w'\\|}, \\quad \\text{where} \\quad w' = w - (w \\cdot r)r"}</M>
          <p className="blog-p">step through the geometry below:</p>
          <OrthoDemo />

          <CodeBlock>{`
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

          <CodeBlock>{`
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
          <p className="blog-p">0% refusal rate on the test set, math and coding benchmarks intact. the norm preservation is what keeps it from getting dumber. without the rescaling step the model degrades noticeably because the residual stream magnitudes just keep shrinking layer by layer.</p>
          <p className="blog-p">everything is on HuggingFace:</p>
          <ul className="blog-links-list">
            <li><a href="https://huggingface.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4" target="_blank" rel="noopener noreferrer">Bahushruth/Qwen3.6-35B-A3B-abliterated-v4</a> (full model, bf16 safetensors)</li>
            <li><a href="https://huggingface.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF" target="_blank" rel="noopener noreferrer">Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF</a> (quantized GGUF files)</li>
            <li><a href="https://huggingface.co/datasets/Bahushruth/abliteration-harmful-enriched" target="_blank" rel="noopener noreferrer">Bahushruth/abliteration-harmful-enriched</a> (7356 harmful prompts, 35 categories, 10 styles)</li>
          </ul>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">choosing a quant</h2>
          <p className="blog-p">GGUF quantization trades precision for file size and memory. lower quants lose some nuance in the weights but fit on smaller machines. higher quants preserve more of the original model quality but need more RAM. heres the breakdown:</p>
          <div className="abl-quant-table">
            <div className="abl-quant-row abl-quant-header">
              <span>quant</span><span>size</span><span>RAM needed</span><span>best for</span>
            </div>
            <div className="abl-quant-row">
              <span>Q4_K_M</span><span>21.2 GB</span><span>~24 GB</span><span>32GB machines. M2/M3 Pro, gaming GPUs with 24GB VRAM. slight quality loss on complex reasoning but perfectly usable for general chat</span>
            </div>
            <div className="abl-quant-row">
              <span>Q5_K_M</span><span>24.7 GB</span><span>~28 GB</span><span>36-48GB machines. M3/M4 Pro sweet spot. negligible quality loss compared to full precision, best balance of speed and quality</span>
            </div>
            <div className="abl-quant-row">
              <span>Q6_K</span><span>28.5 GB</span><span>~32 GB</span><span>48GB+ machines. near-lossless. if you have the RAM this is the one to use</span>
            </div>
            <div className="abl-quant-row">
              <span>Q8_0</span><span>36.9 GB</span><span>~40 GB</span><span>64GB machines. effectively lossless quantization, identical behavior to full precision in practice</span>
            </div>
            <div className="abl-quant-row">
              <span>BF16</span><span>69.4 GB</span><span>~72 GB</span><span>96GB+ machines or multi-GPU setups. unquantized original weights, no precision loss at all</span>
            </div>
          </div>
          <p className="blog-p">for most people running this locally Q4_K_M or Q5_K_M is the right call. the quality difference between Q4_K_M and BF16 on a model this size is surprisingly small. MoE architectures are naturally resilient to quantization because only a few experts activate per token so the quantization noise averages out across the full expert pool.</p>
          <p className="blog-p">one note: the GGUFs are built with <code>--no-mtp</code>. MTP speculative decoding slows down prompt processing on Apple Silicon more than it speeds up token generation. standard next-token-prediction inference is faster for this model.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">running it locally with Ollama</h2>
          <p className="blog-p">Ollama can pull GGUF files directly from HuggingFace. one command and youre running:</p>
          <CodeBlock language="bash">{`
ollama run hf.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF:Q4_K_M
          `}</CodeBlock>
          <p className="blog-p">that downloads the Q4_K_M quant (21.2GB) and starts an interactive session. swap the tag for whichever quant fits your machine:</p>
          <CodeBlock language="bash">{`
# smaller machine (32GB RAM)
ollama run hf.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF:Q4_K_M

# larger machine (48GB+ RAM)
ollama run hf.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF:Q5_K_M

# if you have the RAM for it (64GB+)
ollama run hf.co/Bahushruth/Qwen3.6-35B-A3B-abliterated-v4-GGUF:Q8_0
          `}</CodeBlock>
          <p className="blog-p">once its running you can also hit it via the Ollama API at <code>localhost:11434</code> if you want to integrate it into other tools. its fully OpenAI-compatible.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">prior work</h2>
          <p className="blog-p">abliteration didnt come out of nowhere. heres the lineage and what each piece contributed.</p>
          <p className="blog-p">the foundational result is Arditi et al. "Refusal in Language Models Is Mediated by a Single Direction" (2024). they proved across 13 dense models up to 72B params that refusal lives in a 1D subspace of the residual stream. erase the direction and refusal disappears. add it and harmless prompts get refused. clean result, but only on dense architectures.</p>
          <p className="blog-p">mlabonne took that paper and turned it into a practical notebook anyone could run. published NeuralDaredevil-8B using abliteration + DPO fine-tuning as a healing step. showed the full pipeline works end to end for consumer use.</p>
          <p className="blog-p">grimjim (Nov 2025) figured out the norm-preserving fix. standard orthogonalization shrinks weight vectors because projecting out a component makes them shorter. across 40+ layers that compounds and the model gets dumber. grimjim's insight: rescale each row back to its original norm after projection. benchmarks stop degrading. this is the single most important improvement to the technique since the original paper.</p>
          <p className="blog-p">Pan et al. "The Hidden Dimensions of LLM Alignment" (ICML 2025) formally proved that safety behavior is controlled by multiple orthogonal directions, not just one. they found a dominant direction governing refusal plus several smaller directions representing distinct interpretable features. this explains why single-direction abliteration sometimes fails (the model reconstructs refusal from remaining axes) and validates the multi-direction approach.</p>
          <p className="blog-p">Zhang et al. "LLM-VA: Resolving the Jailbreak-Overrefusal Trade-off via Vector Alignment" (ACL 2026) showed you can do minimum-norm weight modifications that preserve 95.92% utility while removing refusal. different approach (SVMs to identify vectors, iterative alignment) but same underlying insight: you can surgically modify weights without destroying capabilities if you're careful about magnitudes.</p>
          <p className="blog-p">what i added on top of all this: making it actually work on a Mixture of Experts architecture (256 experts as 3D tensors, einsum instead of matmul, hybrid linear+full attention that breaks every existing script), proving dataset diversity matters more than direction count (7356 prompts across 35 categories and 10 styles vs 520 homogeneous ones), and showing that 1 clean direction from a rich dataset beats 10 noisy directions from a small one.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-links-list">
            <li>
              <a href="https://arxiv.org/abs/2406.11717" target="_blank" rel="noopener noreferrer">Arditi et al. - Refusal in Language Models Is Mediated by a Single Direction (2024)</a>
              <br /><span className="blog-ref-note">proved refusal is a single direction you can erase. the paper that started all of this</span>
            </li>
            <li>
              <a href="https://huggingface.co/blog/mlabonne/abliteration" target="_blank" rel="noopener noreferrer">mlabonne - Uncensor any LLM with abliteration (2024)</a>
              <br /><span className="blog-ref-note">turned the paper into a runnable notebook anyone can use in 10 minutes</span>
            </li>
            <li>
              <a href="https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration" target="_blank" rel="noopener noreferrer">grimjim - Norm-preserving biprojected abliteration (Nov 2025)</a>
              <br /><span className="blog-ref-note">fixed the benchmark degradation problem by preserving weight magnitudes after projection</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2502.09674" target="_blank" rel="noopener noreferrer">Pan et al. - The Hidden Dimensions of LLM Alignment (ICML 2025)</a>
              <br /><span className="blog-ref-note">formally proved refusal is multi-dimensional, not just one direction. explains why single-direction removal sometimes fails</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2601.19487" target="_blank" rel="noopener noreferrer">Zhang et al. - LLM-VA: Resolving the Jailbreak-Overrefusal Trade-off (ACL 2026)</a>
              <br /><span className="blog-ref-note">minimum-norm weight mods that preserve 95.92% utility. different method, same insight about careful magnitudes</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2310.01405" target="_blank" rel="noopener noreferrer">Zou et al. - Representation Engineering (2023)</a>
              <br /><span className="blog-ref-note">the broader framework. directions in activation space control high-level behaviors. abliteration is one application of this</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2310.03693" target="_blank" rel="noopener noreferrer">Qi et al. - Fine-tuning Aligned Language Models Compromises Safety (2023)</a>
              <br /><span className="blog-ref-note">proved safety alignment is fragile. 10 adversarial examples is enough to undo it</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2310.20624" target="_blank" rel="noopener noreferrer">Lermen et al. - LoRA Fine-tuning Efficiently Undoes Safety Training (2024)</a>
              <br /><span className="blog-ref-note">same thing but with LoRA on Llama 2 70B for under $200</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2603.04355" target="_blank" rel="noopener noreferrer">Nanfack et al. - Efficient Refusal Ablation through Optimal Transport (2026)</a>
              <br /><span className="blog-ref-note">uses Gaussian OT instead of direction removal. only needs 1-2 layers modified</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2504.17130" target="_blank" rel="noopener noreferrer">Cyberey &amp; Evans - Steering the CensorShip (COLM 2025)</a>
              <br /><span className="blog-ref-note">found reasoning models have a second censorship axis: thought suppression. refusal has layers beyond just the output</span>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
