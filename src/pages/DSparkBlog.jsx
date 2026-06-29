import { useState, useEffect } from 'react'
import { Fade, CodeBlock, Fig, PaperFig } from '../components/BlogPrimitives'

function VerificationCycle() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const totalSteps = 5

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setStep(s => (s + 1) % totalSteps), 2500)
    return () => clearInterval(id)
  }, [paused])

  const descriptions = [
    'drafter generates 4 tokens in one shot',
    'target model runs one forward pass on all 4 positions',
    'compare distributions at each position. pos 1, 2, 3 match.',
    'pos 4: draft says "quick" (0.6) but target says "fast" (0.7). rejected.',
    'accept positions 1-3. resample pos 4 from target. done in 1 cycle.',
  ]

  const tokens = [
    { word: 'the', draftP: 0.82, targetP: 0.85 },
    { word: 'model', draftP: 0.71, targetP: 0.68 },
    { word: 'is', draftP: 0.90, targetP: 0.88 },
    { word: 'quick', draftP: 0.60, targetP: 0.22 },
  ]

  const getTokenState = (i) => {
    if (step === 0) return 'drafting'
    if (step === 1) return 'verifying'
    if (step === 2) return i <= 2 ? 'checking' : 'pending'
    if (step === 3) return i <= 2 ? 'accepted' : 'rejected'
    if (step === 4) return i <= 2 ? 'accepted' : 'resampled'
    return 'pending'
  }

  return (
    <div className="spec-viz" onClick={() => { setStep(s => (s + 1) % totalSteps); setPaused(true) }}>
      <div className="spec-viz-steps">
        {Array.from({ length: totalSteps }, (_, i) => (
          <button
            key={i}
            className={`spec-viz-step${step === i ? ' spec-viz-step--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setStep(i); setPaused(true) }}
          >
            {i + 1}
          </button>
        ))}
        {paused && <button className="spec-viz-play" onClick={(e) => { e.stopPropagation(); setPaused(false) }}>▶</button>}
      </div>

      <p className="spec-viz-desc">{descriptions[step]}</p>

      <div className="spec-viz-content">
        <div className="spec-viz-pipeline">
          <div className="spec-viz-stage">
            <div className="spec-viz-stage-label">draft model</div>
            <div className={`spec-viz-block spec-viz-block--draft${step >= 1 ? ' spec-viz-block--dim' : ''}`}>
              {tokens.map((t, i) => (
                <div key={i} className="spec-viz-tok-col">
                  <span className="spec-viz-tok-word">{t.word}</span>
                  <span className="spec-viz-tok-p">p={t.draftP}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="spec-viz-arrow">{step >= 1 ? '→' : '·'}</div>

          <div className="spec-viz-stage">
            <div className="spec-viz-stage-label">target model (1 pass)</div>
            <div className={`spec-viz-block spec-viz-block--target${step < 1 ? ' spec-viz-block--dim' : ''}`}>
              {tokens.map((t, i) => (
                <div key={i} className="spec-viz-tok-col">
                  <span className="spec-viz-tok-word">{step >= 4 && i === 3 ? 'fast' : t.word}</span>
                  <span className="spec-viz-tok-p">p={step >= 4 && i === 3 ? '0.70' : t.targetP}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="spec-viz-results">
          {tokens.map((t, i) => {
            const state = getTokenState(i)
            return (
              <div key={i} className={`spec-viz-result spec-viz-result--${state}`}>
                <span className="spec-viz-result-pos">pos {i + 1}</span>
                <span className="spec-viz-result-word">{state === 'resampled' ? 'fast' : t.word}</span>
                <span className="spec-viz-result-status">
                  {state === 'drafting' && '···'}
                  {state === 'verifying' && '?'}
                  {state === 'checking' && '✓'}
                  {state === 'pending' && '···'}
                  {state === 'accepted' && '✓'}
                  {state === 'rejected' && '✗'}
                  {state === 'resampled' && '↺'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SuffixDecayDemo() {
  const [mode, setMode] = useState('parallel')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setMode(m => m === 'parallel' ? 'markov' : 'parallel'), 4000)
    return () => clearInterval(id)
  }, [paused])

  const positions = [
    {
      context: '"there is no"',
      parallel: { top: ['way', 'doubt', 'one'], probs: [0.35, 0.25, 0.20], sampled: 'way' },
      withPrev: { top: ['way', 'doubt', 'one'], probs: [0.35, 0.25, 0.20], sampled: 'way' },
    },
    {
      context: 'pos 1 picked "way"',
      parallel: { top: ['to', 'of', 'back'], probs: [0.30, 0.28, 0.22], sampled: 'of' },
      withPrev: { top: ['to', 'around', 'back'], probs: [0.72, 0.12, 0.08], sampled: 'to' },
    },
    {
      context: 'pos 2 picked "to" or "of"',
      parallel: { top: ['know', 'tell', 'say'], probs: [0.28, 0.24, 0.22], sampled: 'tell' },
      withPrev: { top: ['know', 'tell', 'get'], probs: [0.65, 0.18, 0.09], sampled: 'know' },
    },
  ]

  const isParallel = mode === 'parallel'

  return (
    <div className="decay-viz">
      <div className="decay-viz-tabs">
        <button className={`decay-viz-tab${isParallel ? ' decay-viz-tab--active' : ''}`} onClick={() => { setMode('parallel'); setPaused(true) }}>
          parallel (DFlash)
        </button>
        <button className={`decay-viz-tab${!isParallel ? ' decay-viz-tab--active' : ''}`} onClick={() => { setMode('markov'); setPaused(true) }}>
          + markov head (DSpark)
        </button>
      </div>

      <div className="decay-viz-positions">
        {positions.map((pos, i) => {
          const data = isParallel ? pos.parallel : pos.withPrev
          const maxP = Math.max(...data.probs)
          return (
            <div key={i} className="decay-viz-pos">
              <div className="decay-viz-pos-header">
                <span className="decay-viz-pos-num">position {i + 1}</span>
                <span className="decay-viz-pos-ctx">{isParallel ? `sees: "${positions[0].context}"` : pos.context}</span>
              </div>
              <div className="decay-viz-dist">
                {data.top.map((word, j) => (
                  <div key={j} className="decay-viz-bar-row">
                    <span className="decay-viz-bar-word">{word}</span>
                    <div className="decay-viz-bar-track">
                      <div
                        className={`decay-viz-bar-fill${word === data.sampled ? ' decay-viz-bar-fill--sampled' : ''}`}
                        style={{ width: `${(data.probs[j] / maxP) * 100}%` }}
                      />
                    </div>
                    <span className="decay-viz-bar-p">{data.probs[j].toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="decay-viz-pos-sampled">
                sampled: <span className={`decay-viz-sampled-word${isParallel && i > 0 ? ' decay-viz-sampled-word--bad' : ''}`}>"{data.sampled}"</span>
                {isParallel && i > 0 && <span className="decay-viz-pos-warn">target wanted "{positions[i].withPrev.sampled}"</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="decay-viz-summary">
        {isParallel
          ? <span className="decay-viz-summary-bad">every position sees only the prompt. no inter-token dependency. "way of tell" instead of "way to know"</span>
          : <span className="decay-viz-summary-good">markov head biases each position toward tokens that follow what was actually sampled before it</span>
        }
      </div>
    </div>
  )
}

function ThroughputViz() {
  const [verifyDepth, setVerifyDepth] = useState(3)

  const data = [
    { depth: 1, userSpeed: 40, throughput: 200, label: 'MTP-1 baseline' },
    { depth: 2, userSpeed: 62, throughput: 195, label: '' },
    { depth: 3, userSpeed: 78, throughput: 182, label: 'DSpark sweet spot' },
    { depth: 4, userSpeed: 85, throughput: 155, label: '' },
    { depth: 5, userSpeed: 88, throughput: 120, label: 'MTP-5 (rolled back)' },
  ]

  const selected = data[verifyDepth - 1]
  const maxSpeed = 100
  const maxThroughput = 220

  return (
    <div className="tp-viz">
      <div className="tp-viz-slider">
        <span className="tp-viz-slider-label">verification depth:</span>
        <input
          type="range"
          min={1}
          max={5}
          value={verifyDepth}
          onChange={e => setVerifyDepth(Number(e.target.value))}
          className="tp-viz-range"
        />
        <span className="tp-viz-slider-val">{verifyDepth} tokens</span>
      </div>

      <div className="tp-viz-meters">
        <div className="tp-viz-meter">
          <div className="tp-viz-meter-label">per-user speed (tok/s)</div>
          <div className="tp-viz-meter-track">
            <div className="tp-viz-meter-fill tp-viz-meter-fill--speed" style={{ width: `${(selected.userSpeed / maxSpeed) * 100}%` }} />
          </div>
          <div className="tp-viz-meter-val">{selected.userSpeed}</div>
        </div>
        <div className="tp-viz-meter">
          <div className="tp-viz-meter-label">system throughput (req/s)</div>
          <div className="tp-viz-meter-track">
            <div className={`tp-viz-meter-fill tp-viz-meter-fill--tp${selected.throughput < 160 ? ' tp-viz-meter-fill--danger' : ''}`} style={{ width: `${(selected.throughput / maxThroughput) * 100}%` }} />
          </div>
          <div className="tp-viz-meter-val">{selected.throughput}</div>
        </div>
      </div>

      {selected.label && <div className="tp-viz-note">{selected.label}</div>}

      <div className="tp-viz-insight">
        {verifyDepth <= 2 && 'safe for throughput but leaving speed on the table'}
        {verifyDepth === 3 && 'DSpark picks this depth dynamically based on actual GPU load'}
        {verifyDepth >= 4 && 'faster per user but throughput is collapsing. other users suffer.'}
      </div>
    </div>
  )
}

export default function DSparkBlog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/dspark-hero.png" alt="" className="blog-hero-img" />
            <h1 className="blog-title">speculative decoding that actually survives production traffic</h1>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <section className="blog-section">
          <h2 className="blog-section-tag">why LLMs are slow</h2>
          <p className="blog-p">LLMs generate one token at a time. each token requires a full forward pass through the model. 200 tokens means 200 serial passes. the GPU loads billions of parameters from memory, does a multiply, produces one word, then does the whole thing again.</p>
          <p className="blog-p">the bottleneck is not compute. its memory bandwidth. the GPU spends most of its time moving weights from HBM into the compute units. the actual math finishes fast but then you wait for the next batch of weights to arrive. this is what "memory-bound" means. your expensive H100 is sitting there bored waiting for bytes.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">prefill vs decode</h2>
          <p className="blog-p">LLM inference has 2 completely different phases and they look nothing alike.</p>
          <p className="blog-p">prefill takes your input prompt and processes all of it in one shot. every token in parallel. big fat matrix multiplies. the GPU is compute-bound here. arithmetic intensity is high. this is the happy path where your hardware does real work.</p>
          <p className="blog-p">decode generates the response. one token per step. loads the full model weights each time for one output token. memory-bound. arithmetic intensity is garbage. the GPU is a delivery truck that carries one package per trip.</p>
          <p className="blog-p">these 2 phases want completely different things. prefill wants raw FLOPS. decode wants memory bandwidth. when you run both on the same GPU they interfere. a big prefill request spikes latency for everyone who is mid-decode.</p>
          <p className="blog-p">disaggregated serving (Splitwise, DistServe, Mooncake) solves this by putting prefill and decode on separate GPU pools. prefill nodes crunch prompts then ship the KV cache over the network to decode nodes. no interference. but it adds complexity and a network hop every time.</p>
          <p className="blog-p">DeepSeek runs DSpark on unified nodes instead. the scheduler handles compute interference directly by throttling how much work each request does when the GPU is saturated. simpler to deploy.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">speculative decoding</h2>
          <p className="blog-p">the core idea is simple. run a small cheap model (the "drafter") that guesses several tokens ahead. then run the big model once on that entire guess. the big model can verify all positions in parallel because attention is causal. position 3s output only depends on positions 1 and 2, same as if youd generated sequentially.</p>
          <p className="blog-p">each cycle looks like this: drafter produces tokens 1 through K. target model runs one forward pass on all K tokens simultaneously. for each position, compare the drafters distribution to the targets. if they match, accept. the moment one gets rejected, throw away everything after it and resample from the target at that position.</p>
          <p className="blog-p">the output is mathematically identical to running the target model alone. the draft cant change the answer. it can only make it faster. provably lossless. same distribution of outputs.</p>
          <p className="blog-p">notice that verification is basically a mini-prefill. youre processing K tokens in parallel through the target. thats compute-bound, not memory-bound. so speculative decoding converts your memory-bound decode problem into something closer to a compute-bound prefill problem. the GPU actually gets to do real math.</p>

          <VerificationCycle />
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why it doesnt ship</h2>
          <p className="blog-p">speculative decoding works great on a single request. the problem shows up at scale.</p>
          <p className="blog-p">you have hundreds of concurrent users. every extra token you verify grows the effective batch size for that step. verify 5 tokens per request across 200 requests and suddenly your GPU is trying to process 1000 positions in one pass. that steals capacity from other users. per-user speed goes up but total system throughput tanks.</p>
          <p className="blog-p">MTP-1 (predict 1 extra token) ships everywhere because its cheap enough to never hurt aggregate throughput. MTP-3 and MTP-5 cant. DeepSeek tried both. they rolled them back because under high concurrency the extra verification killed total throughput even though individual users were faster.</p>
          <p className="blog-p">this is the fundamental tension. verifying more tokens makes each user faster. verifying more tokens makes the system slower for everyone else. every serving system before DSpark picked a static number and hoped for the best.</p>

          <ThroughputViz />
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why existing drafters suck</h2>
          <p className="blog-p">even if you could verify cheaply, the drafters themselves have issues.</p>
          <p className="blog-p">autoregressive drafters (Eagle3) generate one draft token at a time. each token sees the previous one so the output stays coherent. but drafting time grows linearly with block size. you end up with tiny models and short blocks.</p>
          <p className="blog-p">parallel drafters (DFlash) generate the whole block in one pass. fast. but every position is predicted independently. when context allows "of course" or "no problem", it happily writes "of problem" because position 2 cant see what position 1 picked. acceptance rate collapses at later positions. this is called suffix decay.</p>

          <Fig cap="acceptance rate by position. DFlash (blue) decays fast. Eagle3 (orange) holds but starts lower. DSpark (green) gets both: high start AND stable tail. source: Cheng et al. 2026">
            <PaperFig src="/diagrams/paper/dspark-fig2-acceptance.png" alt="Position-wise conditional acceptance rate comparison" />
          </Fig>

          <SuffixDecayDemo />
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the fix: semi-autoregressive</h2>
          <p className="blog-p">DSpark asks: what if you keep the parallel backbone for speed but add the tiniest possible sequential dependency to fix coherence?</p>
          <p className="blog-p">thats the architecture. a deep parallel block drafts all tokens in one pass. then a tiny Markov head runs sequentially and nudges each position based on what the previous position actually sampled. one lookup, one matrix multiply per position. adds about 1% latency to drafting.</p>

          <Fig cap="DSpark architecture. the parallel block drafts all positions at once. the sequential Markov head corrects each position based on what the previous position sampled. the confidence head scores each token. the scheduler decides how many to actually verify. source: Cheng et al. 2026">
            <PaperFig src="/diagrams/paper/dspark-fig1-arch.png" alt="DSpark architecture and decoding cycle" />
          </Fig>

          <p className="blog-p">the Markov head is a low-rank transition matrix. given the token sampled at position k-1, it produces a logit bias for position k:</p>
          <CodeBlock language="python">
{`# the entire sequential stage
# W1: [vocab_size x 256]  (embedding lookup)
# W2: [256 x vocab_size]  (logit projection)

bias = W1[prev_token] @ W2   # shape: [vocab_size]
logits[k] = parallel_logits[k] + bias`}
          </CodeBlock>
          <p className="blog-p">thats it. once position 1 samples "of", the Markov head boosts "course" and kills "problem" at position 2. local correction, still a plain softmax, still losslessly verifiable.</p>
          <p className="blog-p">a 2-layer DSpark beats a 5-layer DFlash on acceptance rate. the Markov head costs almost nothing and fixes the suffix decay problem completely.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the confidence head</h2>
          <p className="blog-p">generating a long draft is cheap. but blindly verifying all of it under load is what killed MTP-3 and MTP-5. you need to know which tokens are worth verifying.</p>
          <p className="blog-p">DSpark trains a confidence head to predict each tokens acceptance probability. its a linear projection on the backbone hidden state plus the Markov embedding:</p>
          <CodeBlock language="python">
{`confidence[k] = sigmoid(w @ [hidden[k]; markov_embed[prev_token]])

# supervised with actual acceptance rate:
# label = 1 - 0.5 * total_variation(draft_dist, target_dist)`}
          </CodeBlock>
          <p className="blog-p">prefix survival probability is the product: P(first j tokens all accepted) = c1 x c2 x ... x cj. this factorization is what makes the scheduler fast.</p>
          <p className="blog-p">raw confidence scores are overconfident. DSpark calibrates them with Sequential Temperature Scaling. a learned temperature per position that minimizes calibration error of the cumulative product. ECE drops from 5-8% to about 1%.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the scheduler</h2>
          <p className="blog-p">this is the part that actually solves the production problem.</p>
          <p className="blog-p">you have R concurrent requests in a batch. each has calibrated confidence scores for their draft tokens. how many tokens do you verify per request?</p>
          <p className="blog-p">DSpark profiles the GPU once at startup to get a steps-per-second curve for each batch size. at runtime: sort all candidate tokens across all requests by survival probability. greedily admit tokens starting from the most confident. stop the moment admitting one more token would reduce total throughput.</p>
          <p className="blog-p">when the GPU is idle, verify deep. every token gets checked because the compute is free. when the GPU is slammed, verify shallow. only check the most confident prefix. never drop below what MTP-1 would give you.</p>
          <p className="blog-p">the early stopping guarantee is critical. the scheduler makes its admission decision before looking at whether tokens were actually accepted. no information from future positions leaks into the decision. thats what keeps it mathematically lossless.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">production numbers</h2>
          <p className="blog-p">DSpark replaced MTP-1 inside DeepSeek-V4s serving system. real traffic, real SLAs.</p>

          <Fig cap="throughput vs per-user speed on live traffic. green = DSpark, blue = MTP-1 baseline. DSpark shifts the Pareto frontier outward. source: Cheng et al. 2026">
            <PaperFig src="/diagrams/paper/dspark-fig7-throughput.png" alt="Throughput vs TPS comparison on DeepSeek-V4" />
          </Fig>

          <p className="blog-p">at matched throughput: 60-85% faster per user on V4-Flash. 57-78% on V4-Pro. at strict SLAs (120 tok/s/user for Flash, 50 for Pro) where MTP-1 falls over, DSpark still works.</p>

          <Fig cap="load-adaptive behavior. throughput stays high as concurrency grows. scheduler automatically shrinks verification budget under load. source: Cheng et al. 2026">
            <PaperFig src="/diagrams/paper/dspark-fig8-load.png" alt="Load-adaptive throughput and verification budgets" />
          </Fig>

          <p className="blog-p">MTP-3 and MTP-5 couldnt replace MTP-1 because blindly verifying 3-5 tokens degraded aggregate throughput under high concurrency. DSpark verifies deep when idle, shallow when slammed. thats why it ships.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the training</h2>
          <p className="blog-p">3 loss terms:</p>
          <CodeBlock language="python">
{`L = 0.1 * cross_entropy + 0.9 * total_variation + 1.0 * confidence

# cross_entropy: predict the right token
# total_variation: match the target models distribution
#   (directly maximizes acceptance rate)
# confidence: train the confidence head to predict survival

# position weights decay exponentially:
# w_k = exp(-(k-1) / block_size)
# getting position 1 right matters most`}
          </CodeBlock>
          <p className="blog-p">TV loss dominates at 0.9 weight. total variation distance between draft and target is a direct proxy for acceptance rate. minimizing it literally maximizes the probability each token survives verification.</p>
          <p className="blog-p">target model is frozen. you only train the backbone, Markov head, and confidence head. communication between workers is O(d) hidden states not O(V) logits. matters when vocab is 100k+.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">bottom line</h2>
          <p className="blog-p">speculative decoding always worked in isolation. it didnt work in production because verifying extra tokens under high concurrency costs more than it saves. DSpark is the first system that adapts. verify deep when idle, shallow when slammed, never below the MTP-1 baseline.</p>
          <p className="blog-p">2 ideas make it work. a Markov head that costs 1% latency and fixes suffix incoherence so you have good tokens worth verifying. a hardware-aware scheduler that decides how many to verify per request while staying mathematically lossless.</p>
          <p className="blog-p">checkpoints for V4-Flash and V4-Pro are open source. training framework (DeepSpec) ships under MIT.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-refs">
            <li><a href="https://github.com/deepseek-ai/DeepSpec/blob/main/DSpark_paper.pdf" target="_blank" rel="noopener">Cheng et al. "DSpark: Confidence-Scheduled Speculative Decoding for Lossless LLM Acceleration" (2026)</a></li>
            <li><a href="https://arxiv.org/abs/2211.17192" target="_blank" rel="noopener">Leviathan et al. "Fast Inference from Transformers via Speculative Decoding" (2022)</a></li>
            <li><a href="https://arxiv.org/abs/2401.15077" target="_blank" rel="noopener">Li et al. "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty" (2024)</a></li>
            <li><a href="https://arxiv.org/abs/2401.09670" target="_blank" rel="noopener">Zhong et al. "DistServe: Disaggregating Prefill and Decoding for Goodput-optimized Large Language Model Serving" (2024)</a></li>
            <li><a href="https://arxiv.org/abs/2311.18677" target="_blank" rel="noopener">Patel et al. "Splitwise: Efficient Generative LLM Inference Using Phase Splitting" (2023)</a></li>
          </ul>
        </section>

      </div>
    </main>
  )
}
