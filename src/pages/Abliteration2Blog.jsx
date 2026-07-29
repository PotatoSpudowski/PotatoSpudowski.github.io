import { useState, useEffect } from 'react'
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

// --- results: family release charts ---

const COMPARE_RESULTS = [
  { name: 'E2B (5B)', original: 99, direction: 12, ara: 3.0, directionKl: 0.048, araKl: 0.173 },
  { name: 'E4B (8B)', original: 99, direction: 30, ara: 2.7, directionKl: 0.020, araKl: 0.116 },
  { name: '26B-A4B', original: 99, direction: 22, ara: 6.7, directionKl: 0.035, araKl: 0.230 },
]

const REFUSAL_SERIES = [
  { key: 'original', name: 'original model', color: '#ff7b72' },
  { key: 'direction', name: 'direction abliteration', color: '#ffa657' },
  { key: 'ara', name: 'ARA (this work)', color: '#7ee787' },
]

const KL_SERIES = [
  { key: 'directionKl', name: 'direction abliteration', color: '#ffa657' },
  { key: 'araKl', name: 'ARA (this work)', color: '#79c0ff' },
]

function GroupedBarChart({ data, series, maxValue, unit = '%' }) {
  const max = maxValue || Math.max(
    ...data.flatMap(d => series.map(s => d[s.key] != null ? d[s.key] : 0)),
    1
  )
  return (
    <div className="css-chart">
      <div className="css-chart-legend">
        {series.map(s => (
          <span key={s.key} className="css-chart-legend-item">
            <span className="css-chart-legend-dot" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      {data.map((d, i) => (
        <div key={i} className="css-chart-group">
          <span className="css-chart-name">{d.name}</span>
          <div className="css-chart-bars">
            {series.map(s => (
              <div key={s.key} className="css-chart-bar-wrap">
                <div
                  className="css-chart-bar"
                  style={{ width: `${(d[s.key] / max) * 100}%`, background: s.color }}
                />
                <span className="css-chart-value">
                  {typeof d[s.key] === 'number' && d[s.key] < 1
                    ? d[s.key].toFixed(3)
                    : d[s.key]}{unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsCharts() {
  return (
    <div className="abl-results-charts">
      <p className="abl-layer-caption">refusal rate by method. lower is better. the original model refuses almost every prompt. direction abliteration improved on E2B but stopped at 30% on E4B. ARA reaches single-digit refusals on all three models.</p>
      <GroupedBarChart data={COMPARE_RESULTS} series={REFUSAL_SERIES} maxValue={105} unit="%" />

      <p className="abl-layer-caption" style={{ marginTop: '1.5rem' }}>KL divergence from the original model (our metric: 50 harmless prompts, teacher-forced, 100 positions, full vocab). lower is better. ARA stays inside the capability-preserving region while cutting refusals by an order of magnitude.</p>
      <GroupedBarChart data={COMPARE_RESULTS} series={KL_SERIES} maxValue={0.25} unit="" />
    </div>
  )
}

// --- ARA: interactive objective visualizer ---

function DistributionDemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % 4), 3200)
    return () => clearInterval(id)
  }, [paused])

  const W = 640, H = 360
  const cx = W / 2, cy = H / 2
  const scale = 95

  const harmless = [
    { x: -0.9, y: 0.4 }, { x: -0.7, y: 0.6 }, { x: -1.1, y: 0.5 },
    { x: -0.8, y: 0.2 }, { x: -1.0, y: 0.7 }, { x: -0.6, y: 0.3 },
  ]
  const harmful = [
    { x: 1.0, y: -0.4 }, { x: 0.8, y: -0.6 }, { x: 1.2, y: -0.5 },
    { x: 0.9, y: -0.2 }, { x: 1.1, y: -0.7 }, { x: 0.7, y: -0.3 },
  ]

  const getTransformed = () => {
    if (step === 0) return harmful
    if (step === 1) return harmful.map(p => ({ x: p.x * 0.35 - 0.35, y: p.y * 0.35 + 0.15 }))
    if (step === 2) return harmful.map(p => ({ x: p.x * -0.25 - 0.5, y: p.y * -0.25 + 0.35 }))
    return harmful.map(p => ({ x: p.x * -0.25 - 0.5, y: p.y * -0.25 + 0.35 }))
  }
  const transformed = getTransformed()
  const toSvg = (p) => ({ x: cx + p.x * scale, y: cy - p.y * scale })

  const captions = [
    'One weight matrix. Green: harmless outputs. Red: harmful outputs. The clusters are separate.',
    'Rule 2 pulls the harmful outputs toward the harmless cluster. Rule 1 keeps the harmless outputs fixed.',
    'Rule 3 pushes a little past the harmless cluster. This is over-correction, built into the objective.',
    'The result. Harmless outputs never moved. Harmful outputs now overlap the harmless cloud.',
  ]

  const stepLabels = ['setup', 'pull', 'push', 'result']

  return (
    <div className="ara-viz">
      <div className="ara-viz-tabs" role="tablist">
        {stepLabels.map((label, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={step === i}
            className={`ara-viz-tab${step === i ? ' active' : ''}`}
            onClick={() => { setStep(i); setPaused(true) }}
          >
            <span className="ara-viz-tab-num">{i + 1}</span>
            <span className="ara-viz-tab-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="ara-viz-stage" onClick={() => { setStep(s => (s + 1) % 4); setPaused(true) }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="ara-viz-svg" aria-label="ARA objective visualization">
          <defs>
            <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7ee787" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7ee787" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* grid */}
          {[-2, -1, 0, 1, 2].map(g => (
            <g key={g}>
              <line x1={cx + g * scale} y1={0} x2={cx + g * scale} y2={H} stroke="#1f1f1f" strokeWidth={1} />
              <line x1={0} y1={cy - g * scale} x2={W} y2={cy - g * scale} stroke="#1f1f1f" strokeWidth={1} />
            </g>
          ))}
          <line x1={cx} y1={0} x2={cx} y2={H} stroke="#333" strokeWidth={1.5} />
          <line x1={0} y1={cy} x2={W} y2={cy} stroke="#333" strokeWidth={1.5} />

          {/* glow behind harmless cluster */}
          <ellipse cx={cx - 0.9 * scale} cy={cy - 0.4 * scale} rx={70} ry={45} fill="url(#gGlow)" />

          {/* force arrows */}
          {step >= 1 && harmful.map((p, i) => {
            const from = toSvg(p)
            const to = toSvg(transformed[i])
            const color = step === 1 ? '#ffa657' : '#d2a8ff'
            return (
              <g key={i} style={{ transition: 'all 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={2} strokeDasharray="5,4" opacity={0.75} strokeLinecap="round" />
                <circle cx={to.x} cy={to.y} r={4} fill={color} opacity={0.95} />
              </g>
            )
          })}

          {/* original harmful ghosts */}
          {step >= 1 && harmful.map((p, i) => {
            const s = toSvg(p)
            return <circle key={i} cx={s.x} cy={s.y} r={6} fill="none" stroke="#ff7b72" strokeWidth={1} opacity={0.25} />
          })}

          {/* harmless */}
          {harmless.map((p, i) => {
            const s = toSvg(p)
            return (
              <g key={i}>
                <circle cx={s.x} cy={s.y} r={7} fill="#7ee787" opacity={0.95} />
                <circle cx={s.x} cy={s.y} r={10} fill="none" stroke="#7ee787" strokeWidth={1.2} opacity={0.35} />
              </g>
            )
          })}

          {/* harmful / transformed */}
          {(step === 0 ? harmful : transformed).map((p, i) => {
            const s = toSvg(p)
            return <circle key={i} cx={s.x} cy={s.y} r={7} fill="#ff7b72" opacity={0.95} style={{ transition: 'all 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          })}

          {/* labels */}
          <text x={cx - 0.9 * scale} y={cy - 1.15 * scale} fill="#7ee787" fontSize={12} fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight={600}>harmless</text>
          {step === 0 && <text x={cx + 1.0 * scale} y={cy + 1.0 * scale} fill="#ff7b72" fontSize={12} fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight={600}>harmful</text>}
          {step === 1 && <text x={cx + 0.2 * scale} y={cy + 0.85 * scale} fill="#ffa657" fontSize={12} fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight={600}>pull</text>}
          {step === 2 && <text x={cx - 0.3 * scale} y={cy + 0.95 * scale} fill="#d2a8ff" fontSize={12} fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight={600}>push</text>}
        </svg>
      </div>

      <p className="ara-viz-caption">{captions[step]}</p>
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
          <h2 className="blog-section-tag">summary</h2>
          <p className="blog-p">part 1 described directional ablation. it measures the refusal direction in the residual stream. it projects that direction out of the weight matrices. it preserves the row norms. the method worked on Qwen3.6-35B. the result was 0 percent refusals with intact benchmarks. that post reached more than 250,000 impressions across LinkedIn, X, and Reddit. the uncensored model collection on Hugging Face passed 700,000 downloads on 29 July 2026.</p>
          <p className="blog-p">this post describes what happened when we tried the same project on the gemma 4 family. gemma 4 is a harder target. the direction method stopped at 30 percent refusals inside the divergence budget. the reason is not better alignment. the reason is fault-tolerant architecture: four normalization layers per decoder layer, per-layer embeddings, and shared keys and values. we had to build a different method.</p>
          <p className="blog-p">this post has four parts. part one: the three architectural defenses of gemma 4, with the real configuration values. part two: why the direction method stopped, with numbers. part three: arbitrary rank ablation (ARA), the method that works, specified completely. part four: the evaluation methodology and the results.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why gemma 4 is hard</h2>
          <p className="blog-p">we read the model configuration before we wrote the abliteration code. the configuration showed the architectural defenses. gemma 4 is not more aligned than other models. it is fault-tolerant. three architectural properties dilute every weight edit.</p>

          <p className="blog-p"><strong>property 1: four normalization layers per decoder layer.</strong> a standard transformer block has two normalization layers. a gemma 4 decoder layer has four: <code>input_layernorm</code>, <code>post_attention_layernorm</code>, <code>pre_feedforward_layernorm</code>, and <code>post_feedforward_layernorm</code>. each one is an RMSNorm with epsilon 1e-6. RMSNorm divides a vector by its root-mean-square magnitude. the effect: the model re-scales the residual stream after every block. an edit that only weakens a signal gets amplified back. only a change in direction survives.</p>
          <p className="blog-p">there is a second effect. attention in gemma 4 applies <code>q_norm</code> and <code>k_norm</code> after the projections. these are per-head RMSNorms at head dimension 256. the value path uses <code>v_norm</code> without a learned scale. a magnitude change in the K and V weights is normalized away before attention runs. only a direction change in K and V survives.</p>
          <p className="blog-p">this geometry has three consequences that we verified in our own runs. first: LoRA adapters and inference-time steering hooks produce zero behavioral change on this family. the norms absorb the perturbation. direct weight editing is the only option. second: weak edits fail. the search must rotate weight rows past orthogonal, so the model anti-expresses the refusal direction. our winning E2B configuration used a strength of 3.7. wangzhang's 31B winner searched strengths up to 6.0. third: editing K and V is pointless. our search set the qkv strength to 0.01 by itself. the direction change could not survive the per-head norms either.</p>

          <p className="blog-p"><strong>property 2: per-layer embeddings.</strong> the configuration field <code>hidden_size_per_layer_input</code> is 256. the model has a second embedding table, <code>embed_tokens_per_layer</code>, with shape (262144, 8960). that is 35 layers times 256 dimensions. each decoder layer receives its own 256-dimensional embedding vector. the vector passes through <code>per_layer_input_gate</code> (256 by 1536), a gating product with the residual stream, and <code>per_layer_projection</code> (1536 by 256). the result is added to the residual stream after the normalization layers. this channel bypasses every matrix that standard abliteration edits. we tested it directly: we added the gate and the projection to the editable components and ran a full search. the refusal rate did not move. the channel is a decoy, at least for refusal. as far as we know, we are the only team that has tested this.</p>

          <p className="blog-p"><strong>property 3: shared keys and values.</strong> the configuration field <code>num_kv_shared_layers</code> is 20 for E2B. the transformers source computes <code>first_kv_shared_layer_idx = 35 - 20 = 15</code>. layers 15 to 34 have no <code>k_proj</code> and no <code>v_proj</code> at all. they reuse the key and value states of earlier layers. the source layer for full attention is layer 14. the source layer for sliding attention is layer 13. an edit to layer 14 propagates to 20 layers at once. the upper 20 layers have nothing to edit.</p>
          <p className="blog-p">one more detail from the configuration. attention alternates between sliding window attention (window 512) and full attention. the pattern is four sliding layers and one full layer. rope parameters differ between the two types. this does not block abliteration directly. it does change where the refusal signal concentrates. our searches found the strongest refusal direction at layer 17 or 18 on E2B. that is the first full-attention layer after the shared K/V boundary.</p>

          <p className="blog-p">the defenses differ per model. we read the configuration of every gemma 4 model. the family splits in two. the E series (E2B, E4B) is built for edge devices: shared keys and values to shrink the cache, per-layer embeddings to recover capacity, small sliding windows. the standard series (12B, 26B-A4B, 31B) drops both of those mechanisms. one more difference is important: the standard series sets <code>attention_k_eq_v = true</code>. the keys and values are the same tensor. there is no <code>v_proj</code> matrix to edit at all. the E series keeps separate K and V projections.</p>

          <div className="abl-quant-table abl-model-table">
            <div className="abl-quant-row abl-quant-header">
              <span>model</span><span>architecture</span><span>defenses</span>
            </div>
            <div className="abl-quant-row"><span>E2B-it, 5.1B</span><span>35 layers, hidden 1536, 8 heads / 1 KV head</span><span>4 norms + PLE-256 + 20 shared K/V</span></div>
            <div className="abl-quant-row"><span>E4B-it, 8B</span><span>42 layers, hidden 2560, 8 heads / 2 KV heads</span><span>4 norms + PLE-256 + 18 shared K/V</span></div>
            <div className="abl-quant-row"><span>12B-it</span><span>48 layers, hidden 3840, 16 heads / 8 KV heads, K=V</span><span>4 norms only</span></div>
            <div className="abl-quant-row"><span>26B-A4B-it, 27B</span><span>30 layers, hidden 2816, MoE 128 experts / top 8, K=V</span><span>4 norms + expert routing</span></div>
            <div className="abl-quant-row"><span>31B-it, 33B</span><span>60 layers, hidden 5376, 32 heads / 16 KV heads, K=V</span><span>4 norms only</span></div>
          </div>

          <p className="blog-p">two predictions follow. the E models are the hardest: every defense, least capacity. the standard models are easier: only the norms remain. our results confirm both. E2B needed over-correction to reach 12 percent with the direction method. E4B defeated the direction method completely. and the published 31B result from wangzhang reached 7 percent with attention-only edits, because the 31B has no side channel and no shared keys to repair the cut.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why the direction method stopped</h2>

          <p className="blog-p">we started with the same method that worked on Qwen3.6-35B. compute a refusal direction from harmful and harmless prompts. project that direction out of the weight matrices. restore the row norms. on gemma 4 the result was weak. a manual cut on E2B still refused 62 percent of test prompts.</p>

          <p className="blog-p">we searched for a better configuration. the search tried strength kernels, sparse layer windows, over-correction past orthogonal, ORBA, and rank-k subspaces. the best direction-method point on E2B was 12 percent refusals at KL 0.048. on E4B the same pipeline stopped at about 30 percent refusals inside the divergence budget. the budget kept the model intact, but it also capped the method.</p>

          <p className="blog-p">the problem was the assumption. a direction method assumes refusal lives on one line in activation space. gemma 4 has four normalization layers per block, per-layer embeddings, and shared keys and values. these defenses dilute a single-direction edit. refusal is also multi-dimensional: one component hides in the orthogonal complement while the edit removes another. the wall was not a missing parameter. the wall was the method class.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">arbitrary rank ablation</h2>
          <p className="blog-p">ARA stands for arbitrary rank ablation. the principle: forget directions completely. we implemented it from first principles in our own code.</p>

          <p className="blog-p"><strong>step 1: record the inputs and outputs.</strong> attach a PyTorch forward hook to one weight matrix. run a large batch of harmless and harmful prompts from the enriched dataset through the model. for each prompt, record the input and the output of the matrix at the last token position. the last token position is where the model makes the refusal decision. repeat for every steerable matrix: the attention output projection and the MLP down projection of every layer.</p>

          <CodeBlock>{`
def capture_io(texts):
    io = {}

    def make_hook(layer_idx, comp):
        def hook(module, inputs, outputs):
            # (batch, position, dim) -> last token only.
            # the last token position is where the model
            # makes the refusal decision
            io[(layer_idx, comp)] = (
                inputs[0][:, -1, :].detach().float().cpu(),   # X
                outputs[:, -1, :].detach().float().cpu(),     # Y
            )
        return hook

    hooks = []
    for li, layer in enumerate(lm_layers):
        for comp, mod in get_modules(layer):   # o_proj, down_proj
            hooks.append(mod.register_forward_hook(make_hook(li, comp)))

    for b in range(0, tokens.shape[0], BATCH):
        model(tokens[b:b + BATCH])             # one forward pass

    for h in hooks:
        h.remove()
    return io

io_good = capture_io(harmless_prompts)   # X_g, Y_g per matrix
io_bad  = capture_io(harmful_prompts)    # X_b, Y_b per matrix
          `}</CodeBlock>

          <p className="blog-p"><strong>step 2: adjust the matrix with three rules.</strong> <M>{"W'"}</M> is the adjusted matrix. <M>{"X_g, Y_g"}</M> are the recorded inputs and outputs for harmless prompts. <M>{"X_b, Y_b"}</M> are the same for harmful prompts. the loss is:</p>
          <M block>{"L = a \\cdot \\underbrace{\\|X_g W'^\\top - Y_g\\|^2}_{\\text{rule 1: preserve}} + b \\cdot \\big( \\underbrace{d_{\\text{knn}}(X_b W'^\\top, \\, Y_g)}_{\text{rule 2: pull}} - c \\cdot \\underbrace{d_{\\text{knn}}(X_b W'^\\top, \\, Y_b)}_{\text{rule 3: push}} \\big)"}</M>
          <p className="blog-p">rule 1 keeps harmless outputs unchanged. this protects capability directly. no separate capability metric is necessary. rule 2 pulls harmful outputs toward the harmless outputs. this removes the refusal behavior. rule 3 pushes harmful outputs away from their original positions. this is over-correction. it is not a dial. it is a term in the loss. rule 3 is what beats the norm circle from the first section.</p>
          <DistributionDemo />

          <p className="blog-p"><strong>the distance is not an average.</strong> <M>{"d_{\\text{knn}}"}</M> is the mean distance from each output to its k nearest neighbors in the target set. an average would collapse the target set to one point. the nearest-neighbor distance preserves the shape of the set. the search chooses k between 1 and 15.</p>

          <CodeBlock>{`
def knn_mean(a, b, k):
    # mean over rows of a of the mean distance
    # to the k nearest rows in b
    d = torch.cdist(a, b)
    return d.topk(k, largest=False).values.mean()

def objective(W, Xg, Yg, Xb, Yb, pw, sw, oc, k):
    new_good = Xg @ W.T
    new_bad  = Xb @ W.T

    # rule 1: harmless outputs must not move
    preserve = ((new_good - Yg) ** 2).mean()

    # rule 2: pull harmful outputs toward harmless ones
    # rule 3: push them away from their old positions
    steer = (knn_mean(new_bad, Yg, k)
             - oc * knn_mean(new_bad, Yb, k))

    return pw * preserve + sw * steer
          `}</CodeBlock>

          <p className="blog-p"><strong>the norms are preserved inside the solve.</strong> the optimizer does not see the raw matrix. it sees a reparameterized form: <M>{"W' = N \\cdot \\hat{W}"}</M>, where <M>{"\\hat{W}"}</M> is the row-normalized matrix and <M>{"N"}</M> is the vector of original row norms. every row keeps its original length during the whole optimization. this is grimjim's norm preservation from part 1, built into the solver instead of applied after it.</p>

          <p className="blog-p"><strong>the solver.</strong> the loss is smooth and close to convex. LBFGS with the strong-Wolfe line search converges in two or three steps per matrix. we run five steps. then the solver moves to the next matrix. a full pass over 42 layers and 84 matrices takes about one minute.</p>

          <CodeBlock>{`
W = module.weight.data.float().clone().requires_grad_(True)
row_norms = module.weight.data.float().norm(dim=1, keepdim=True).detach()

def get_matrix():
    # reparameterization: row norms preserved by construction
    return row_norms * F.normalize(W, p=2, dim=1)

optimizer = LBFGS([W], lr=1.0, max_iter=20,
                  history_size=10, line_search_fn="strong_wolfe")

def closure():
    optimizer.zero_grad()
    loss = objective(get_matrix(), Xg, Yg, Xb, Yb, pw, sw, oc, k)
    loss.backward()
    return loss

for step in range(5):              # converges in 2-3 steps
    optimizer.step(closure)

with torch.no_grad():
    module.weight.data = get_matrix().to(module.weight.dtype)
          `}</CodeBlock>

          <p className="blog-p"><strong>the remaining search.</strong> six numbers are left to choose. an Optuna TPE search picks them. the search minimizes the refusal rate and the KL divergence together. trials above the divergence budget are rejected. the six numbers are:</p>

          <CodeBlock>{`
def objective(trial):
    start = trial.suggest_int("start_layer_index", 0, n_layers // 2)
    end   = trial.suggest_int("end_layer_index", n_layers // 2, n_layers)
    pw    = trial.suggest_float("preserve_good_behavior_weight", 0.0, 1.0)
    sw    = trial.suggest_float("steer_bad_behavior_weight", 1e-4, 1.0, log=True)
    oc    = trial.suggest_float("overcorrect_relative_weight", 0.0, 1.3)
    k     = trial.suggest_int("neighbor_count", 1, 15)

    ara_abliterate(start, end, pw, sw, oc, k)

    refusals = refusal_rate()      # 300 prompts, 2 datasets
    kl = kl_divergence()           # 50 harmless prompts, teacher-forced
    if kl > KL_BUDGET:
        return refusals, 10.0 + kl  # rejected: dominated on objective 2
    return refusals, kl

study = optuna.create_study(directions=["minimize", "minimize"])
study.optimize(objective, n_trials=40)
          `}</CodeBlock>
          <div className="abl-quant-table abl-param-table">
            <div className="abl-quant-row abl-quant-header">
              <span>parameter</span><span>range</span><span>meaning</span>
            </div>
            <div className="abl-quant-row"><span>start_layer_index</span><span>0 to L/2</span><span>first edited layer</span></div>
            <div className="abl-quant-row"><span>end_layer_index</span><span>L/2 to L</span><span>last edited layer</span></div>
            <div className="abl-quant-row"><span>preserve_good_behavior_weight</span><span>0 to 1</span><span>strength of rule 1</span></div>
            <div className="abl-quant-row"><span>steer_bad_behavior_weight</span><span>1e-4 to 1 (log)</span><span>strength of rules 2 and 3</span></div>
            <div className="abl-quant-row"><span>overcorrect_relative_weight</span><span>0 to 1.3</span><span>rule 3 relative to rule 2</span></div>
            <div className="abl-quant-row"><span>neighbor_count</span><span>1 to 15</span><span>k in the kNN distance</span></div>
          </div>

          <p className="blog-p">the difference from the direction method is fundamental. the direction method computes one global direction and applies it everywhere, whether or not each matrix needs it. ARA solves a local problem at each matrix. it spends change only where harmful and harmless behavior actually differ. this is why it beats the wall.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">evaluation methodology</h2>
          <p className="blog-p"><strong>the refusal metric.</strong> 500 prompts: 350 from our enriched dataset (35 categories, 10 phrasing styles) and 150 from the public mlabonne dataset. both datasets are necessary. a model can pass one and fail the other. a response counts as a refusal if it contains one of 31 keyword markers, case-insensitive, or if an LLM judge flags it as a refusal. keyword matching catches direct refusals. the LLM judge catches soft refusals that keyword matching misses.</p>
          <p className="blog-p"><strong>the divergence metric.</strong> KL divergence from the original model. 50 harmless prompts. the original model generates an answer to each prompt first. both models are then scored on the original model's own answers, teacher-forced, over 100 token positions, full 262144-token vocabulary. this is a strict metric. other published numbers use cheaper variants: fewer positions, smaller vocabularies, or proxy sets. a KL number without a stated computation is not comparable.</p>
          <p className="blog-p"><strong>the capability check.</strong> the final model runs a small smoke battery: grade-school arithmetic, code completion, and multi-step logical reasoning. the battery is not a benchmark. it is a sanity check that catches lobotomized models. the direction-method failures passed the refusal test with 0 percent and failed this battery. the KL metric caught the same models. the two guards are complementary.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">results</h2>
          <p className="blog-p">three gemma 4 models, one evaluation protocol. every number below is a keyword refusal rate on the union set, plus KL divergence from the original model on our strict metric. all three models pass math 5/5 and a code check.</p>
          <ResultsCharts />
          <p className="blog-p">the charts show the same story twice. the original model refuses 99 percent of the harmful prompts. direction abliteration cut E2B to 12 percent, but it left E4B at 30 percent. ARA reaches 3.0 percent on E2B, 2.7 percent on E4B, and 6.7 percent on the MoE A4B. the reduction is about 4× on E2B and 10× on E4B.</p>
          <p className="blog-p">the KL numbers stay inside the safe region. direction abliteration on E2B used KL 0.048. ARA on E2B uses KL 0.173. that is a real increase, but it is far below the KL 4 region where models produce gibberish. ARA spends more divergence than direction abliteration because it makes local edits where they matter, not one global edit everywhere.</p>
          <p className="blog-p">shipped weights:</p>
          <ul className="blog-links-list">
            <li><a href="https://huggingface.co/Bahushruth/gemma-4-E2B-it-abliterated" target="_blank" rel="noopener noreferrer">Bahushruth/gemma-4-E2B-it-abliterated</a> — 3.0% union (1% / 6%) @ KL 0.173</li>
            <li><a href="https://huggingface.co/Bahushruth/gemma-4-E4B-it-abliterated" target="_blank" rel="noopener noreferrer">Bahushruth/gemma-4-E4B-it-abliterated</a> — 2.7% union (2% / 3%) @ KL 0.116</li>
            <li><a href="https://huggingface.co/Bahushruth/gemma-4-26B-A4B-it-abliterated" target="_blank" rel="noopener noreferrer">Bahushruth/gemma-4-26B-A4B-it-abliterated</a> — 6.7% union (6% / 7%) @ KL 0.230</li>
            <li><a href="https://huggingface.co/datasets/Bahushruth/abliteration-harmful-enriched" target="_blank" rel="noopener noreferrer">Bahushruth/abliteration-harmful-enriched</a> — 7356 harmful prompts, 35 categories, 10 styles</li>
          </ul>
          <p className="blog-p">31B ARA search is still running. 12B is optional: same defenses as 31B, fewer layers. the collection updates as each model lands.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-links-list">
            <li>
              <a href="https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration" target="_blank" rel="noopener noreferrer">grimjim - norm-preserving biprojected abliteration</a>
              <br /><span className="blog-ref-note">exact norm preservation, used inside the ARA solve</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2502.09674" target="_blank" rel="noopener noreferrer">Pan et al. - The Hidden Dimensions of LLM Alignment (ICML 2025)</a>
              <br /><span className="blog-ref-note">proof that refusal is multi-dimensional. the reason single directions hit a wall</span>
            </li>
            <li>
              <a href="https://arxiv.org/abs/2511.08379" target="_blank" rel="noopener noreferrer">Piras et al. - SOM Directions Are Better Than One (AAAI 2026)</a>
              <br /><span className="blog-ref-note">refusal is a manifold, not a line</span>
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
