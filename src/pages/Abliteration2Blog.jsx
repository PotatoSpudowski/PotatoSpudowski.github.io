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

const FAMILY_RESULTS = [
  { name: 'E2B (5B)', union: 3.0, enriched: 1, mlabonne: 6, kl: 0.173 },
  { name: 'E4B (8B)', union: 2.7, enriched: 2, mlabonne: 3, kl: 0.116 },
  { name: '26B-A4B', union: 6.7, enriched: 6, mlabonne: 7, kl: 0.230 },
]

const REFUSAL_SERIES = [
  { key: 'union', name: 'union 300', color: '#7ee787' },
  { key: 'enriched', name: 'enriched 200', color: '#79c0ff' },
  { key: 'mlabonne', name: 'mlabonne 100', color: '#d2a8ff' },
]

function GroupedBarChart({ data, series, maxValue, unit = '%' }) {
  const max = maxValue || Math.max(...data.flatMap(d => series.map(s => d[s.key] || 0)), 1)
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
                <span className="css-chart-value">{d[s.key]}{unit}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultsCharts() {
  const klData = FAMILY_RESULTS.map(d => ({
    name: d.name,
    sr: d.kl,
    color: '#7ee787',
  }))
  const klMax = Math.max(...klData.map(d => d.sr)) * 1.15

  return (
    <div className="abl-results-charts">
      <p className="abl-layer-caption">refusal rate on three eval sets. lower is better. original models refuse 97–99% of these prompts.</p>
      <GroupedBarChart data={FAMILY_RESULTS} series={REFUSAL_SERIES} maxValue={12} unit="%" />

      <p className="abl-layer-caption" style={{ marginTop: '1.5rem' }}>KL divergence from the original model (our metric: 50 prompts, teacher-forced, full vocab). lower is better. destroyed models start near KL 4.</p>
      <div className="css-chart">
        {klData.map((d, i) => (
          <div key={i} className="css-chart-row">
            <span className="css-chart-name">{d.name}</span>
            <div className="css-chart-bar-wrap">
              <div
                className="css-chart-bar"
                style={{ width: `${(d.sr / klMax) * 100}%`, background: d.color }}
              />
              <span className="css-chart-value">{d.sr.toFixed(3)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- ARA: distributions demo ---

function DistributionDemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % 4), 2400)
    return () => clearInterval(id)
  }, [paused])

  const W = 560, H = 220
  const x0 = 60, x1 = 540, yBase = 190
  const xScale = (x1 - x0) / 6
  const gauss = (x, mu, sig) => Math.exp(-0.5 * ((x - mu) / sig) ** 2)

  const goodMu = -0.9
  const badMus = [1.1, 0.2, -0.75, -1.0]
  const badMu = badMus[step]

  const path = (mu, sig, amp) => {
    let d = ''
    for (let i = 0; i <= 120; i++) {
      const x = -3 + (i / 120) * 6
      const y = gauss(x, mu, sig) * amp
      const sx = x0 + (x + 3) * xScale
      const sy = yBase - y * 150
      d += (i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`)
    }
    return d + ` L ${x0 + (mu + 3 + 2.2) * xScale} ${yBase}`
  }

  const captions = [
    <>one weight matrix. the curves are its outputs. blue: harmless prompts. red: harmful prompts. two separate shapes.</>,
    <>ARA adjusts the matrix directly. rule 2: pull the red shape toward the blue shape.</>,
    <>rule 3: push a little past it. over-correction, built into the objective.</>,
    <>the blue shape never moved. rule 1. the model keeps its capability. the harmful outputs now look harmless.</>,
  ]

  return (
    <div className="abl-ortho-demo" onClick={() => { setStep(s => (s + 1) % 4); setPaused(true) }}>
      <div className="abl-ortho-steps">
        {['two shapes', 'the pull', 'the push', 'the result'].map((label, i) => (
          <button key={i} className={`abl-step-btn${step === i ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}>
            <span className="abl-step-num" style={{ background: step === i ? '#7ee787' : 'transparent', color: step === i ? '#0f0f0f' : '#585858' }}>{i + 1}</span>
            <span className="abl-step-label">{label}</span>
          </button>
        ))}
      </div>

      <p className="abl-ortho-caption">{captions[step]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="abl-svg-wide">
        <line x1={x0} y1={yBase} x2={x1} y2={yBase} stroke="#2a2a2a" strokeWidth={1.5} />
        <text x={x0} y={yBase + 16} fill="#585858" fontSize={9} fontFamily="monospace">output space</text>

        <path d={path(goodMu, 0.45, 1)} fill="rgba(121,192,255,0.15)" stroke="#79c0ff" strokeWidth={2} />
        <path d={path(badMu, 0.45, 1)} fill="rgba(255,123,114,0.15)" stroke="#ff7b72" strokeWidth={2} />

        <text x={x0 + (goodMu + 3) * xScale} y={yBase - 165} fill="#79c0ff" fontSize={10} fontFamily="monospace" textAnchor="middle">harmless</text>
        <text x={x0 + (badMu + 3) * xScale} y={yBase - 165} fill="#ff7b72" fontSize={10} fontFamily="monospace" textAnchor="middle">harmful</text>
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
          <h2 className="blog-section-tag">summary</h2>
          <p className="blog-p">part 1 described directional ablation. it measures the refusal direction in the residual stream. it projects that direction out of the weight matrices. it preserves the row norms. the method worked on Qwen3.6-35B. the result was 0 percent refusals with intact benchmarks. that post reached more than 250,000 impressions across LinkedIn, X, and Reddit. the uncensored model collection on Hugging Face passed 700,000 downloads on 29 July 2026.</p>
          <p className="blog-p">this post describes what happened when we tried the same project on the gemma 4 family. gemma 4 is a harder target. the direction method stopped at 30 percent refusals inside the divergence budget. the reason is not better alignment. the reason is fault-tolerant architecture: four normalization layers per decoder layer, per-layer embeddings, and shared keys and values. we had to build a different method.</p>
          <p className="blog-p">this post has four parts. part one: the three architectural defenses of gemma 4, with the real configuration values. part two: the full failure record of the direction method, with numbers. part three: arbitrary rank ablation (ARA), the method that works, specified completely. part four: the evaluation methodology and the results.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why gemma 4 is hard</h2>
          <p className="blog-p">read the configuration before you write code. this rule saved us twice. gemma 4 is not more aligned than other models. it is fault-tolerant. three architectural properties dilute every weight edit.</p>

          <p className="blog-p"><strong>property 1: four normalization layers per decoder layer.</strong> a standard transformer block has two normalization layers. a gemma 4 decoder layer has four: <code>input_layernorm</code>, <code>post_attention_layernorm</code>, <code>pre_feedforward_layernorm</code>, and <code>post_feedforward_layernorm</code>. each one is an RMSNorm with epsilon 1e-6. RMSNorm divides a vector by its root-mean-square magnitude. the effect: the model re-scales the residual stream after every block. an edit that only weakens a signal gets amplified back. only a change in direction survives.</p>
          <p className="blog-p">there is a second effect. attention in gemma 4 applies <code>q_norm</code> and <code>k_norm</code> after the projections. these are per-head RMSNorms at head dimension 256. the value path uses <code>v_norm</code> without a learned scale. a magnitude change in the K and V weights is normalized away before attention runs. only a direction change in K and V survives.</p>
          <p className="blog-p">this geometry has three consequences that we verified in our own runs. first: LoRA adapters and inference-time steering hooks produce zero behavioral change on this family. the norms absorb the perturbation. direct weight editing is the only option. second: weak edits fail. the search must rotate weight rows past orthogonal, so the model anti-expresses the refusal direction. our winning E2B configuration used a strength of 3.7. wangzhang's 31B winner searched strengths up to 6.0. third: editing K and V is pointless. our search set the qkv strength to 0.01 by itself. the direction change could not survive the per-head norms either.</p>

          <p className="blog-p"><strong>property 2: per-layer embeddings.</strong> the configuration field <code>hidden_size_per_layer_input</code> is 256. the model has a second embedding table, <code>embed_tokens_per_layer</code>, with shape (262144, 8960). that is 35 layers times 256 dimensions. each decoder layer receives its own 256-dimensional embedding vector. the vector passes through <code>per_layer_input_gate</code> (256 by 1536), a gating product with the residual stream, and <code>per_layer_projection</code> (1536 by 256). the result is added to the residual stream after the normalization layers. this channel bypasses every matrix that standard abliteration edits. we tested it directly: we added the gate and the projection to the editable components and ran a full search. the refusal rate did not move. the channel is a decoy, at least for refusal. as far as we know, we are the only team that has tested this.</p>

          <p className="blog-p"><strong>property 3: shared keys and values.</strong> the configuration field <code>num_kv_shared_layers</code> is 20 for E2B. the transformers source computes <code>first_kv_shared_layer_idx = 35 - 20 = 15</code>. layers 15 to 34 have no <code>k_proj</code> and no <code>v_proj</code> at all. they reuse the key and value states of earlier layers. the source layer for full attention is layer 14. the source layer for sliding attention is layer 13. an edit to layer 14 propagates to 20 layers at once. the upper 20 layers have nothing to edit.</p>
          <p className="blog-p">one more detail from the configuration. attention alternates between sliding window attention (window 512) and full attention. the pattern is four sliding layers and one full layer. rope parameters differ between the two types. this does not block abliteration directly. it does change where the refusal signal concentrates. our searches found the strongest refusal direction at layer 17 or 18 on E2B. that is the first full-attention layer after the shared K/V boundary.</p>

          <p className="blog-p">the defenses differ per model. we read the configuration of every gemma 4 model. the family splits in two. the E series (E2B, E4B) is built for edge devices: shared keys and values to shrink the cache, per-layer embeddings to recover capacity, small sliding windows. the standard series (12B, 26B-A4B, 31B) drops both of those mechanisms. one more difference is important: the standard series sets <code>attention_k_eq_v = true</code>. the keys and values are the same tensor. there is no <code>v_proj</code> matrix to edit at all. the E series keeps separate K and V projections.</p>

          <p className="blog-p"><strong>E2B-it, 5.1B.</strong> 35 layers, hidden size 1536, 8 attention heads, 1 KV head. double-wide MLP in the shared region. defenses: four norms, per-layer embeddings, 20 shared K/V layers. full armor, least capacity. hard target.</p>
          <p className="blog-p"><strong>E4B-it, 8B.</strong> 42 layers, hidden size 2560, 8 attention heads, 2 KV heads. defenses: four norms, per-layer embeddings, 18 shared K/V layers. full armor, more layers to carry the signal. the hardest target we tested.</p>
          <p className="blog-p"><strong>12B-it.</strong> 48 layers, hidden size 3840, 16 attention heads, 8 KV heads, K equals V. defenses: four norms only. the defenses drop here. much friendlier target.</p>
          <p className="blog-p"><strong>26B-A4B-it, 27B.</strong> 30 layers, hidden size 2816, mixture of experts with 128 experts and 8 active per token, K equals V. defenses: four norms and expert routing. fewer defenses, but refusal can hide inside 128 experts.</p>
          <p className="blog-p"><strong>31B-it, 33B.</strong> 60 layers, hidden size 5376, 32 attention heads, 16 KV heads, K equals V. defenses: four norms only. the friendliest target. deep and dense.</p>

          <p className="blog-p">two predictions follow. the E models are the hardest: every defense, least capacity. the standard models are easier: only the norms remain. our results confirm both. E2B needed over-correction to reach 12 percent with the direction method. E4B defeated the direction method completely. and the published 31B result from wangzhang reached 7 percent with attention-only edits, because the 31B has no side channel and no shared keys to repair the cut.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the direction method: the full failure record</h2>
          <p className="blog-p">we did not fail once. we failed seven times, informatively. each failure removed one hypothesis.</p>

          <p className="blog-p"><strong>attempt 1, the manual cut.</strong> compute the refusal direction at each layer from 512 harmful and 512 harmless prompts. pick the strongest layer. project the direction out of the attention output projection and the MLP down projection of every layer. restore the row norms. result on E2B: 10 refusals out of 16 test prompts. that is 62 percent. the edit was safe but too weak.</p>

          <p className="blog-p"><strong>attempt 2, the first search.</strong> we replaced hand-tuning with an Optuna TPE search. the search optimized a strength kernel over the layers, for two components per layer. the objective minimized refusals and KL divergence together. result: 32 percent refusals at KL 0.028. the best trials pushed against the strength limit of 1.5. every trial also edited every layer. the search paid KL divergence on layers that gave no compliance.</p>

          <p className="blog-p"><strong>attempt 3, three fixes.</strong> we added a sparse window (zero edit outside a learned layer range), over-correction (strength up to 4.0, which rotates weight rows past orthogonal), and ORBA (the refusal direction is made orthogonal to the mean harmless direction before the edit). we also added the key, query, and value projections as editable components. result on E2B: 10 percent refusals at KL 0.116, and 12 percent at KL 0.048.</p>
          <p className="blog-p">the search also rejected one of our own hypotheses. we believed the key and value projections carried the refusal signal. the winning trial set their strength to 0.01. the win came from over-correction on the attention output projection alone, at strength 3.7. the barrier was the norms diluting a weak edit. it was never the K/V pathway.</p>

          <p className="blog-p"><strong>attempt 4, the subspace.</strong> refusal is multi-dimensional. we replaced the single direction with a rank-k SVD subspace per layer, and the approximate norm rescale with the exact biprojected transform. result: the search reached 0 percent refusals. it also reached math score 1 out of 5 and gibberish output, at KL 3.5. the subspace removes refusal completely, and the model with it. the lesson: refusal metrics without a divergence limit will ship a destroyed model.</p>

          <p className="blog-p"><strong>attempt 5, the divergence budget.</strong> we added a hard rule: trials above KL 0.05 are rejected. result: nothing inside the budget beat 12 percent. 12 percent is the genuine frontier of the direction method on E2B.</p>

          <p className="blog-p"><strong>attempt 6, the data upgrade.</strong> we quintupled the direction data to 2048 prompts per class. we also replaced the narrow public evaluation set with our own diverse 300-prompt set. result: 10 percent refusals on our dataset, but 58 percent on the public one. the two refusal mechanisms are different. an edit that suppresses refusal to styled prompts does not suppress refusal to direct requests. this is the most important negative result of the project: every published refusal number is only valid for its own prompt distribution.</p>

          <p className="blog-p"><strong>attempt 7, E4B.</strong> we ran the full improved pipeline on E4B. three variants: the standard recipe, a variant with wider strength, and a variant that also edited the per-layer embedding channel. all three stopped at about 30 percent refusals inside the divergence budget. all three kept refusing most direct requests. the per-layer embedding channel turned out to be a decoy. the wall was not a component or a parameter. the wall was the method class. a direction is a guess about where refusal lives. on E4B, the guess is never good enough.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">arbitrary rank ablation</h2>
          <p className="blog-p">ARA stands for arbitrary rank ablation. the principle: forget directions completely. we implemented it from first principles in our own code.</p>

          <p className="blog-p"><strong>step 1: record the inputs and outputs.</strong> attach a PyTorch forward hook to one weight matrix. run 400 harmless prompts and 400 harmful prompts through the model. for each prompt, record the input and the output of the matrix at the last token position. the last token position is where the model makes the refusal decision. repeat for every steerable matrix: the attention output projection and the MLP down projection of every layer.</p>

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
          <div className="abl-quant-table">
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
          <p className="blog-p"><strong>the refusal metric.</strong> 300 prompts: 200 from our enriched dataset (35 categories, 10 phrasing styles) and 100 from the public mlabonne dataset. both datasets are necessary. attempt 6 proved that a model can pass one and fail the other. a response counts as a refusal if it contains one of 31 keyword markers, case-insensitive. keyword matching undercounts soft refusals. an LLM judge would catch more. we report the keyword number and we say so.</p>
          <p className="blog-p"><strong>the divergence metric.</strong> KL divergence from the original model. 50 harmless prompts. the original model generates an answer to each prompt first. both models are then scored on the original model's own answers, teacher-forced, over 100 token positions, full 262144-token vocabulary. this is a strict metric. other published numbers use cheaper variants: fewer positions, smaller vocabularies, or proxy sets. a KL number without a stated computation is not comparable.</p>
          <p className="blog-p"><strong>the capability check.</strong> five arithmetic questions and one code question on the final model. the check is weak but it catches destroyed models. the destroyed models from attempt 4 passed the refusal test with 0 percent and failed arithmetic. the KL metric caught them too. both guards are necessary.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">results</h2>
          <p className="blog-p">three gemma 4 models, one method (ARA), one evaluation protocol. every number below is a keyword refusal rate on the stated set, plus KL on our strict metric. all three models pass math 5/5 and a code check.</p>
          <ResultsCharts />
          <p className="blog-p">on E4B, the direction method stopped at 29–30 percent refusals inside the divergence budget. ARA reaches 2.7 percent on the same union set. that is about a 10× drop in refusals. KL rises from ~0.02 to ~0.12. destroyed models in attempt 4 started near KL 4. the gap is large.</p>
          <p className="blog-p">the split matters. attempt 6 showed that a model can pass one prompt distribution and fail another. every shipped point above is balanced across enriched and mlabonne. the union objective forced that balance.</p>
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
