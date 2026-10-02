import { useState, useEffect } from 'react'
import { Fade, Fig, PaperFig } from '../components/BlogPrimitives'

function BlogIndex() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const sections = document.querySelectorAll('.blog-body > .blog-section')
    const built = []
    sections.forEach((sec) => {
      const h = sec.querySelector('.blog-section-tag')
      if (!h) return
      const label = h.textContent.trim()
      const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      sec.id = id
      built.push({ id, label })
    })
    setItems(built)
  }, [])

  if (!items.length) return null

  return (
    <section className="blog-section">
      <h2 className="blog-section-tag">index</h2>
      <ul className="blog-refs">
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`}>{String(i + 1).padStart(2, '0')} {it.label}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function EngramBlog() {
  return (
    <main className="main blog-main">

      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/engram-hero.png" alt="" className="blog-hero-img" />
            <h1 className="blog-title">engram is chinas way to win ai without hbm</h1>
            <p className="blog-p">tldr. Engram stores what token sequences mean in lookup tables instead of recomputing that meaning every forward pass. Same parameters and FLOPs and the benchmarks go up. The tables live in DRAM instead of HBM which cuts the expensive kind of memory and adds prefetchable bandwidth. That trade is why DeepSeek LongCat and Qwen already ship it and why it fits China perfectly. HBM is gated there. DRAM is not. The open questions are how big the table gets and what goes in it next.</p>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <BlogIndex />

        <section className="blog-section">
          <h2 className="blog-section-tag">the tax you pay every forward pass</h2>
          <p className="blog-p">A model shouldnt have to work out who Alexander the Great is every time those tokens show up. But part of what lower transformer layers do is rebuild useful meanings from familiar token sequences. You keep paying compute for patterns the model has seen before.</p>
          <p className="blog-p">Engram asks a simple question. What if some of that work became a lookup?</p>
          <p className="blog-p">Store learned vectors for token sequences in embedding tables. Fetch the right vectors when those sequences appear. Let the rest of the model spend its compute on what the current context actually needs.</p>
          <p className="blog-p">The interesting part isnt just cheaper recall. <span className="blog-hl">In the controlled experiment Engram gets better benchmark scores at the same total parameter count and compute budget.</span> Then the second order effect matters more than the first. Those tables can live in DRAM instead of HBM. That changes which memory is scarce which suppliers benefit and which labs are comfortable.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how a phrase becomes a lookup</h2>
          <p className="blog-p">A normal token embedding gives you a starting vector for each token. Engram adds embeddings for short sequences of tokens. Alexander and the and great each have their own uses but the sequence points to something much more specific.</p>
          <p className="blog-p">In the <a href="https://arxiv.org/pdf/2601.07372" target="_blank" rel="noopener">research model</a> Engram takes 2-gram and 3-gram token windows. It hashes their token ids into embedding tables and reads the vectors at those addresses. Multiple heads give each sequence multiple hashed lookups.</p>
          <p className="blog-p">A hash table isnt a perfect dictionary of phrases. Different sequences can land at the same address. Multiple lookups let the model build a useful representation without needing a unique stored entry for every possible sequence.</p>
          <p className="blog-p">The retrieved vectors are concatenated. That means joining them into a larger vector which the module can project into keys and values. The current hidden state supplies the context used to decide how much of that memory belongs here.</p>
          <p className="blog-p">A scaled dot product measures the match between that state and the retrieved key. The resulting gate controls how much of the memory value enters the hidden state. <span className="blog-hl">So the token ids decide what gets fetched while the context helps decide what gets used.</span></p>

          <Fig cap="hashed n-gram lookups are concatenated and gated using the current hidden state. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-arch.jpg" alt="Engram architecture with 2-gram and 3-gram embedding lookups" />
          </Fig>

          <p className="blog-p">These are learned embeddings trained with the model. They arent text snippets pulled from a search index or a separate database of facts. Engram moves some repeated pattern work out of the expensive compute path and into learned memory.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why this is a hardware story</h2>
          <p className="blog-p">This is the part that matters beyond model architecture. Engram lookup addresses depend on token ids alone. They dont depend on waiting for a later hidden state to choose an expert or find a memory entry. That makes the reads predictable early.</p>
          <p className="blog-p">While lower layers compute the system can prefetch the vectors needed by an Engram layer above them. The tables can sit in DRAM and send over the required rows in time for use. You dont need the whole table resident in HBM.</p>

          <Fig cap="token-id lookup addresses allow memory prefetch while lower layers compute. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-offload.png" alt="Engram at inference, offloaded to the memory hierarchy" />
          </Fig>

          <p className="blog-p">That matters because the cheap tier really is cheaper per bit. But the ratio is a moving number and the comparison has 3 different versions. Price per bit. Silicon per bit. Usable server capacity cost. <a href="https://investors.micron.com/static-files/088991c5-a249-4f66-a0a6-258d9b66f3f9" target="_blank" rel="noopener">Micron</a> described roughly a 3:1 silicon trade ratio between HBM and DDR5 in its fiscal Q1 2026 material. <a href="https://www.trendforce.com/presscenter/news/20251029-12758.html" target="_blank" rel="noopener">TrendForce</a> put the HBM3e price premium above 4x DDR5 in Q2 2025 and expected that gap to shrink as server DDR5 rose. <span className="blog-hl">Anyone still quoting a fixed 3x price ratio is quoting a snapshot that is already stale.</span></p>
          <p className="blog-p">A lab with scarce HBM and plenty of DRAM gets the best version of this trade. The slower tier becomes useful model capacity as long as bandwidth and prefetch timing keep up. Thats not a model trick. Thats a change in what hardware you need to buy.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">does it actually get smarter</h2>
          <p className="blog-p">The quality result is what makes the hardware trade worth taking seriously. The clean comparison is MoE-27B against Engram-27B. Both have 26.7B total parameters with 3.8B activated parameters and 262B training tokens. The paper holds storage and FLOPs constant.</p>
          <p className="blog-p">Engram-27B cuts the expert count from 72 to 55. It spends the freed parameter budget on 5.7B of Engram tables and keeps a 21B backbone. Same budget. Different allocation.</p>
          <p className="blog-p">MMLU goes from <span className="blog-hl">57.4 to 60.4</span>. MMLU-Redux moves from 60.6 to 64.0 and MMLU-Pro from 28.3 to 30.1. CMMLU rises from 57.9 to 61.9 while C-Eval goes from 58.0 to 62.7.</p>
          <p className="blog-p">The gains dont stop at knowledge tests. BBH goes from 50.9 to 55.9 and ARC-Challenge from 70.1 to 73.8. HumanEval moves from 37.8 to 40.8 while GSM8K goes from 58.4 to 60.6 and MATH from 28.3 to 30.7.</p>
          <p className="blog-p">Pile loss also drops from 1.960 to 1.950. That makes the result harder to dismiss as a trick that helps a single benchmark. Recall support appears to help the rest of the network do its job too.</p>

          <Fig cap="benchmark comparison at 262B training tokens and 3.8B activated parameters. source: Conditional Memory via Scalable Lookup, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-table1.jpg" alt="Benchmark table comparing Dense, MoE, and Engram models" />
          </Fig>

          <p className="blog-p blog-p--key">Same storage. Same FLOPs. Same training tokens. Better scores. <span className="blog-hl">The win came from where the parameters live not from adding more of them.</span> Not a promise that every architecture gets the same lift.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">ffns still have to think</h2>
          <p className="blog-p">The controlled allocation experiments put the sweet spot around <span className="blog-hl">20-25% of the inactive or sparse parameter budget</span>. Past that point you give up too many MoE experts to make room for memory. Better recall stops paying for the compute you removed.</p>
          <p className="blog-p">FFN layers do more than remember phrases. They also do concept math. They take the current state and push it toward concepts that help predict what comes next.</p>
          <p className="blog-p"><a href="https://arxiv.org/pdf/2203.14680" target="_blank" rel="noopener">Geva et al.</a> show this through updates that can be read in vocabulary space. A context like few ___ coffee can promote breakfast and pancake. That is a context-dependent change in the prediction rather than just recognition of a familiar phrase.</p>

          <Fig cap="FFN updates promote concepts that affect the next token prediction. source: Geva et al. 2022, arxiv:2203.14680">
            <PaperFig src="/diagrams/paper/engram-ffn.png" alt="FFN promoting concepts in vocabulary space" />
          </Fig>

          <p className="blog-p">You need both jobs. Engram helps supply learned patterns and the FFN helps transform what those patterns mean in the current context. Replacing all FFN capacity with lookup tables throws away part of the machine that uses the memory.</p>
          <p className="blog-p">There is also a limit to how much useful repeated structure a given corpus can feed into the tables. But table rows arent a count of concepts. Hash collisions and multiple heads make that a much messier mapping.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the ceiling so far</h2>
          <p className="blog-p">Engram-40B tests a different question. It grows Engram memory from 5.7B to 18.5B while keeping activated parameters at 3.8B and training tokens at 262B. This adds total storage so it isnt the same fixed-parameter bargain as Engram-27B.</p>
          <p className="blog-p">The extra memory barely moves some scores. MMLU goes from 60.4 to 60.6 and Engram-40B doesnt beat Engram-27B on every task. Just making the table bigger isnt enough.</p>
          <p className="blog-p">The paper points to under-training as a likely reason. The loss gap is still widening at the end of training which suggests the added memory hasnt finished paying off. That is evidence against treating the weak gain as proof that memory is saturated.</p>

          <Fig cap="the paper identifies under-training as a likely reason for uneven gains from Engram-40B. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-quote.png" alt="Paper quote on Engram-40B under-training" />
          </Fig>

          <p className="blog-p">Keep those findings separate. Taking too much capacity away from experts hurts at a fixed budget. Adding memory without enough training can also disappoint.</p>
          <p className="blog-p">The 20-25% range is a starting point for a sweep rather than a law of nature. A larger training budget may move the best allocation. It wont make the need for concept math disappear. And watch the denominator. <span className="blog-hl">That range is a share of the inactive parameter budget which is not the same measure as a share of total parameters.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">this already ships</h2>
          <p className="blog-p"><a href="https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf" target="_blank" rel="noopener">DeepSeek-V4.1-Flash</a> uses 552B backbone parameters plus 196B Engram parameters for 748B total. Engram takes 26.2% of that total compared with 21.3% in Engram-27B. Both sit near the upper edge of the rough allocation range though total-parameter share and sparse-budget share arent identical measures.</p>

          <Fig cap="Engram accounts for 21.3% of total parameters in Engram-27B and 26.2% in DeepSeek-V4.1-Flash. source: DeepSeek-V4.1-Flash tech report">
            <PaperFig src="/diagrams/paper/engram-params.jpg" alt="Backbone and Engram parameter comparison" />
          </Fig>

          <p className="blog-p">The shape of the memory changes too. Both use 2 Engram layers and 8 heads per n-gram order. V4.1-Flash adds 4-grams to the 2-gram and 3-gram setup which takes the logical table count from 32 to 48.</p>
          <p className="blog-p">Rows per head table grow from about 2.26M to about 16M. Embedding dimensions grow from 80 to 256. So scaling means longer sequences and more room per table and wider stored vectors rather than just adding more Engram layers.</p>

          <Fig cap="DeepSeek-V4.1-Flash expands n-gram orders and table rows and embedding dimensions. source: DeepSeek-V4.1-Flash tech report">
            <PaperFig src="/diagrams/paper/engram-dims.png" alt="Engram dimension comparison between Engram-27B and V4.1-Flash" />
          </Fig>

          <p className="blog-p">Meituan LongCat has adopted the approach too. Qwen calls its version an N-gram Embedding Layer in Qwen-3.8-Flash Next. This is already shipping rather than waiting for someone to turn a paper into a model.</p>

          <Fig cap="Qwen places an N-gram Embedding Layer at layer 2. source: Qwen">
            <PaperFig src="/diagrams/paper/engram-qwen.jpg" alt="Qwen architecture with N-gram Embedding Layer" />
          </Fig>

          <p className="blog-p blog-p--key">One warning before anyone copies this from a checkpoint. <span className="blog-hl">You cannot swap experts for a trained table in an existing model with a serving flag.</span> The tables are trained with the model. A retrofit means continued pretraining surgery and that is a different experiment from the matched-budget result in the paper.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the cheap tier got expensive</h2>
          <p className="blog-p">The memory trade needs a date on it. This is the picture checked in September 2026. HBM is itself DRAM so the useful split is stacked HBM beside the accelerator versus DDR5 in host memory.</p>

          <Fig cap="HBM3e and server DDR5 prices per gigabit with a shrinking forecast premium. published in 2025 so the 2026 points are forecasts. source: TrendForce roadshow via SemiconSam">
            <PaperFig src="/diagrams/paper/hbm-dram-price.jpg" alt="HBM3e and server DDR5 price per gigabit" />
          </Fig>

          <p className="blog-p">The cheap tier was already repricing hard by early 2026. <a href="https://counterpointresearch.com/en/insights/Memory-Prices-Surge-Up-to-90-From-Q4-2025" target="_blank" rel="noopener">Counterpoint</a> reported in February that a 64GB server RDIMM went from a $450 contract price in Q4 2025 to above $900 in Q1 2026. The 2026 points in that chart are estimates. This is not a pure DDR5 spot index.</p>

          <Fig cap="PC and server memory price trends from Q2 2025 to Q2 2026 including server DDR5. 2026 values marked as estimates. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/ddr5-prices.jpg" alt="PC and server memory price trends" />
          </Fig>

          <p className="blog-p">The tightness extends beyond a bad quarter. TrendForce said in July that DRAM supply would stay tight in 2027 and meaningful new fab output was not expected until 2028. Counterpoint says suppliers are already selling 2027 and 2028 capacity. <span className="blog-hl">Engram moves demand into the cheap tier at exactly the moment the cheap tier stops being cheap.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the same fabs sell both sides</h2>
          <p className="blog-p">The 3 big HBM suppliers also sell host DRAM. <a href="https://counterpointresearch.com/en/insights/global-dram-and-hbm-market-share" target="_blank" rel="noopener">Counterpoint</a> puts Q2 2026 HBM revenue share at roughly 50% for SK hynix, 33% for Samsung and 18% for Micron. Those are revenue shares. Not shares of bits or wafers.</p>

          <Fig cap="HBM revenue share through Q2 2026. rounded vendor shares differ from bit shipment shares. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/hbm-vendor-share.jpg" alt="HBM revenue share by vendor" />
          </Fig>

          <p className="blog-p">HBM consumes more wafer area for the same bit output. Micron described a 3:1 trade ratio with DDR5 and that burden grows in later HBM generations. TrendForce estimated HBM would take 18% of the top 3 suppliers combined DRAM wafer input at the end of 2025, 22% in 2026 and 30% in 2027.</p>
          <p className="blog-p">Here is the part that makes the vendor story non obvious. <a href="https://www.trendforce.com/presscenter/news/20260602-13074.html" target="_blank" rel="noopener">TrendForce</a> also said DDR5 64GB RDIMM revenue per wafer overtook HBM in Q1 2026. Producers follow yield and margin. If inference workloads want more host DRAM the suppliers can chase that with the same fabs. <span className="blog-hl">This does not mechanically create 1 winner and 1 loser.</span></p>
          <p className="blog-p">SK hynix has the largest HBM franchise exposed to a lower HBM capacity requirement per served model. It can still sell host DRAM and more served tokens can keep HBM bandwidth demand high. Samsung has a broad DRAM business that can catch host-memory demand while it ramps HBM4. Micron faces the same mix trade. Buy complete servers from multiple suppliers and measure bytes moved per token. More DIMMs only help if the CPU channels and GPU links can feed them.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">china is the reason this matters now</h2>
          <p className="blog-p">Engram is useful everywhere but it is strategically interesting in 1 place first. Chinese labs are HBM constrained and DRAM heavy. A technique that converts HBM pressure into DRAM pressure fits the position they are already in.</p>
          <p className="blog-p">CXMT is the extra supplier worth watching. <a href="https://counterpointresearch.com/en/insights/cxmt-stock-market-big-three-memory-club" target="_blank" rel="noopener">Counterpoint</a> shows its global DRAM bit shipment share at 8% in 2025 and forecasts 11% in 2028. Its 2026 coverage describes a move toward DDR5 and LPDDR5 including PC and server parts reaching global OEMs. Those shares cover DRAM bits. Not HBM revenue.</p>

          <Fig cap="global DRAM bit shipment shares with CXMT at 8% in 2025 and a forecast 11% in 2028. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/dram-vendor-share.jpg" alt="Global DRAM bit shipment shares including CXMT" />
          </Fig>

          <p className="blog-p">That makes host-memory placement useful for Chinese labs even before domestic HBM catches up. More local DDR5 supply expands the pool of memory that can hold learned tables. It does not guarantee server qualification or sustained bandwidth. Those are procurement and validation jobs.</p>
          <p className="blog-p">The policy split matters as much as the supply picture. The December 2024 <a href="https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military" target="_blank" rel="noopener">BIS package</a> added specific HBM export controls alongside controls on chipmaking equipment. DDR5 is not automatically subject to the same HBM classification but advanced DRAM production and individual transactions can face other restrictions. <span className="blog-hl">Engram changes what the system needs to buy. It doesnt change which trade rules apply.</span></p>
          <p className="blog-p">This is why DeepSeek LongCat and Qwen shipping the same idea is a signal and not a coincidence. Each is solving the same constraint. The open ecosystem gets the technique because those labs have every reason to publish the path.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">hbm4, hbf and other bets</h2>
          <p className="blog-p">HBM4 is the next fast-memory rung but hybrid bonding is a packaging choice with its own schedule. Samsung showed hybrid copper bonding for taller future stacks at GTC 2026. SK hynix still used Advanced MR-MUF in its June 2026 HBM4E samples. Dont assume every HBM4 stack is hybrid bonded.</p>
          <p className="blog-p">High Bandwidth Flash is a different branch. Sandisk and SK hynix began joint HBF standardization in February 2026 and announced initial specifications in August. It puts NAND capacity behind a high-bandwidth interface for inference-oriented systems. A specification is not a shipping Engram service.</p>
          <p className="blog-p">Read-mostly Engram tables look like a plausible HBF target. Mutable KV state is a harder fit because write traffic latency and endurance matter. Even for tables small random row fetches need a benchmark rather than a headline bandwidth number. Treat HBF as a research path while DDR5 is an offload path you can test now.</p>
          <p className="blog-p">Then there is processing in memory. Samsung has shown HBM-PIM test hardware and newer 3D-memory concepts. Real hardware with vendor prototypes. It could compose with Engram through near-memory gather or reduction but a sparse lookup is not the same workload as a dense matrix kernel. Do not make a software roadmap depend on this hardware arriving.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">about that 50% number</h2>
          <p className="blog-p">The useful <a href="https://inferencex.semianalysis.com/blog/engrams-embedding-entendre-codesign" target="_blank" rel="noopener">SemiAnalysis result</a> is concrete. Its public September 2026 Engram report says DRAM offload let a B300 setup move from tensor parallelism across 4 GPUs to 2 and improved the measured serving curve by up to 1.6x. Removing a capacity constraint can also remove communication and an entire pair of GPUs per replica. Thats a stronger mechanism than just saying DRAM costs less.</p>

          <Fig cap="SemiAnalysis serving economics for DeepSeek-V4.1-Flash per gigawatt. the revenue per GW headline needs its assumptions read before it gets quoted. source: SemiAnalysis InferenceX">
            <PaperFig src="/diagrams/paper/engram-semianalysis.jpg" alt="SemiAnalysis revenue and profit estimates per gigawatt" />
          </Fig>

          <p className="blog-p blog-p--key">The headline everyone is quoting is 50% higher revenue per GW. <span className="blog-hl">That exact figure did not appear in the public report.</span> What is public is up to 50% better offload performance on named NVIDIA systems and performance and revenue per GW are different metrics. Before anyone models a business on that number they need the chart the GPU count the SLO the software revision the price assumptions and what the power denominator actually counts.</p>
          <p className="blog-p">The mechanism is still easy to see. More room for KV cache can support more serving work. Less repeated compute can reduce cost per token. At a fixed power budget those changes can improve how much paid output a datacenter produces. But an idle larger batch earns nothing. Extra host RAM and transfer work belong in the power bill too.</p>
          <p className="blog-p">There is also a useful failed path in the same work. An unoptimized SSD offload path lost to DRAM on both serving cost and interactivity. Warm file cache did not remove the CPU coordination and row-transfer work. Cheap storage only helps if it changes useful throughput or the server bill.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">product keys vs engram</h2>
          <p className="blog-p"><a href="https://arxiv.org/abs/1907.05242" target="_blank" rel="noopener">Product-key memory</a> turns a hidden-state query into a sparse lookup over a large learned key-value bank. It splits keys into 2 smaller sets combines candidate scores and retrieves a small set of values. The 2019 paper used it as a replacement for selected FFN layers and released code. This is a trainable retrieval module. Not a text database.</p>

          <Fig cap="product-key retrieval combines 2 subkey searches and retrieves a weighted set of values. source: product-key memory diagram reproduced by Graphcore">
            <PaperFig src="/diagrams/paper/memory-layers-arch.jpg" alt="Product-key memory architecture" />
          </Fig>

          <p className="blog-p">Meta pushed this line further in <a href="https://arxiv.org/abs/2412.09764" target="_blank" rel="noopener">Memory Layers at Scale</a>. The work studied up to 128B memory parameters and training runs up to 1T tokens with a public implementation built on Meta Lingua. Its Memory+ block adds projection and gating around sparse retrieval. The maturity is a research paper plus open training code. Not a verified claim that every Meta production model uses it.</p>
          <p className="blog-p blog-p--key">The Engram comparison is about when the address becomes known. Product-key retrieval waits for the learned hidden-state query. Engram can hash token ids before the target layer runs. <span className="blog-hl">Both learn stored vectors but only the latter gets that deterministic early fetch path.</span> Combining them is plausible but they compete for parameter budget and memory traffic so test the combination instead of adding their separate gains.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">kv reuse is the other dram story</h2>
          <p className="blog-p">Engram stores trained parameters shared across requests. A KV cache stores activations tied to a model and the context already processed. Reusing a matching prefix can skip prefill for that prefix without adding a new memory layer or training a new checkpoint. That makes KV reuse the first baseline for a serving team facing repeated system prompts and documents.</p>
          <p className="blog-p"><a href="https://docs.lmcache.ai/" target="_blank" rel="noopener">LMCache</a> is open-source serving software that stores and reuses KV state across GPU memory host RAM and disk or remote backends. It integrates with vLLM and SGLang. vLLM also has a native offloading connector that extends prefix caching into larger tiers. These can compose with an Engram model but both features draw on the same host-memory and transfer budget.</p>
          <p className="blog-p"><a href="https://arxiv.org/abs/2407.00079" target="_blank" rel="noopener">Mooncake</a> separates prefill and decode around a distributed KV store using CPU memory and SSD resources. The paper describes a deployed serving system and the project is open source. SGLang HiCache adds a hierarchy above its GPU radix cache and can use Mooncake as a distributed storage tier. This can compose with Engram without changing what either kind of memory stores.</p>

          <Fig cap="Mooncake prefix blocks are stored and moved between prefill and decode instances. source: Mooncake paper, arxiv:2407.00079">
            <PaperFig src="/diagrams/paper/kv-offload-arch.jpg" alt="Mooncake prefix KV transfer architecture" />
          </Fig>

          <p className="blog-p">NIXL is the transport layer in this story. It provides transfer primitives across memory and storage backends and LMCache exposes a NIXL backend. Open-source infrastructure. Not a new memory model. It composes with Engram only through an implemented transfer path.</p>
          <p className="blog-p">Cache-aware routing sends a request toward a worker with reusable state while accounting for queue time. Mooncake includes cache-aware scheduling. It composes with Engram because request placement and trained table lookup solve different problems. A hot-cache worker can still be the wrong choice when its queue costs more than recomputing the prefix elsewhere.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">or just shrink the cache</h2>
          <p className="blog-p"><a href="https://arxiv.org/abs/2312.00752" target="_blank" rel="noopener">Mamba</a> uses an input-dependent recurrent state instead of keeping a full attention KV history. <a href="https://arxiv.org/abs/2412.06464" target="_blank" rel="noopener">Gated DeltaNet</a> updates a recurrent matrix state through a gated delta rule. Both have papers and open implementations and they target sequence-state cost rather than learned n-gram storage.</p>
          <p className="blog-p">Qwen3-Next makes the hybrid idea practical with an open checkpoint that mixes Gated DeltaNet and gated attention. The recurrent layers reduce the growing KV burden while attention layers retain direct context access. That can compose with learned lookup but the savings interact. <span className="blog-hl">A smaller KV cache may reduce the value of freeing HBM for more KV.</span> Measure the combined system at the same context length and concurrency.</p>
          <p className="blog-p"><a href="https://arxiv.org/abs/2203.08913" target="_blank" rel="noopener">Memorizing Transformers</a> retrieve old hidden-state keys and values using approximate nearest-neighbor search. Research architecture with code aimed at recalling information beyond the local context. It can sit beside Engram in principle but its query-dependent search has a different latency path and its stored states go stale as the model changes.</p>
          <p className="blog-p"><a href="https://arxiv.org/abs/2407.04620" target="_blank" rel="noopener">TTT</a> makes the recurrent state a small model whose weights update through self-supervised learning at test time. <a href="https://arxiv.org/abs/2501.00663" target="_blank" rel="noopener">Titans</a> learns a neural memory that updates from the incoming sequence. Research directions rather than drop-in serving cache options. They could compose with Engram as dynamic session memory beside static learned pattern memory but session isolation update cost and joint training become part of the design.</p>
          <p className="blog-p">The order of attack follows the workload. Repeated prefixes favor KV reuse first. A fresh pretraining run can test Engram against learned memory layers. Long-context state pressure justifies a hybrid-attention baseline. Save adaptive test-time memory for a task that actually needs it.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how to actually test this</h2>
          <p className="blog-p">If you want to try this yourself here is the protocol. Use the inactive parameter budget as the denominator. Define the memory fraction as Engram parameters divided by total parameters minus activated parameters using the same accounting rules in every run. The Engram paper excludes vocabulary embeddings and the LM head from its total-parameter definition. Its 20-25% optimum uses that sparse-budget framing.</p>
          <p className="blog-p">Here is a proposed sweep and not a result from the paper. Allocate 0%, 10%, 20%, 25%, 35% and 50% of the sparse budget to tables. Hold total parameters activated compute tokenizer data order training tokens optimizer and context schedule fixed as closely as the architecture allows. Publish exact counts and measured FLOPs because projections gates and convolutions still do work.</p>
          <p className="blog-p">Start with a small fresh-pretraining model and run at least 3 seeds for the baseline and finalists. Keep validation loss curves and held-out reasoning code factual recall and long-context scores. Use the same task versions prompts decode settings and confidence intervals across runs. Decide the quality non-inferiority margin before looking at the result.</p>
          <p className="blog-p">Split evaluation by n-gram frequency rare names language code identifiers and held-out domains. Add paraphrases changed whitespace and case-sensitive examples to expose tokenization effects. Check training-set overlap and measure table occupancy access skew and hash collisions. A gain driven only by frequent surface forms needs a different roadmap than a gain that survives new domains.</p>
          <p className="blog-p">Separate an allocation sweep from a capacity sweep. For the latter freeze the backbone design and grow only table rows then give the large tables enough training to inspect the loss trend. Record GPU-hours peak training memory optimizer-state bytes and distributed lookup traffic. Equal nominal FLOPs does not mean equal training cost.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">bandwidth is the real budget</h2>
          <p className="blog-p">Benchmark the same trained model with tables in HBM and pinned host DRAM before changing GPU count. Use cold and warm runs realistic prompt and output lengths and both prefill-heavy and decode-heavy traffic. Report time to first token p50 and p99 inter-token latency SLO-compliant tokens per second and joules per token. Repeat across concurrency until the serving curve bends.</p>
          <p className="blog-p">Account for HBM by category. Backbone weights resident table rows KV cache runtime workspace and graph buffers. Convert freed bytes into measured KV blocks or extra sessions at a fixed context length. For standard full-attention GQA raw KV bytes per token are 2 times layer count times KV heads times head dimension times element bytes before sharding and allocator overhead. MLA and recurrent hybrids need their actual state layout instead of that formula.</p>
          <p className="blog-p">For a proposed layout lookup payload per token is Engram layers times n-gram orders times heads per order times row width times bytes per element. Add scale metadata index traffic alignment cache misses and any replicated reads. Multiply by all processed token positions per second including prefill to get a first bandwidth estimate. Then measure the actual bytes on each link.</p>
          <p className="blog-p">As an illustrative calculation 2 layers 2 orders 8 heads width 80 and 2 bytes per element give <span className="blog-hl">5120 bytes per token</span> before overhead. At 100000 processed tokens per second that is 0.512 GB/s of raw row payload across the model. Thats arithmetic for that proposed layout. Not a measurement of V4.1. Small random reads and synchronization can hurt despite a low average byte rate.</p>
          <p className="blog-p">Measure DRAM reads PCIe or coherent-link traffic NUMA placement row-cache hit rate and GPU wait time at each Engram layer. The useful latency test is whether gather and transfer finish inside the compute window before the layer needs its rows. Earlier placement may help quality while leaving less time to hide the read. Sweep layer placement alongside prefetch depth.</p>
          <p className="blog-p">Now turn KV offload on too. Budget table fetches KV loads and stores and other host traffic against sustained measured bandwidth with room for bursts. Cold prompts and cache eviction can expose contention that warm averages hide. <span className="blog-hl">Reject a setup that improves mean throughput while missing the latency target under that shared load.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the break-even math</h2>
          <p className="blog-p">Let G be GPUs per replica and p the all-in rental price per GPU-hour. Let h be the extra hourly host-memory storage and network charge not already in p. Let R be aggregate output tokens per second that pass the latency target at the chosen request mix. Then cost per 1M output tokens is 1000000 times G times p plus h divided by 3600 times R. Input processing still consumes those GPU-hours so keep the prompt mix fixed and report input throughput too.</p>
          <p className="blog-p">Take a made-up example to show the break-even math. At 4 GPUs $3 per GPU-hour no extra host charge and 1000 compliant output tokens per second the cost is about $3.33 per 1M output tokens. If DRAM offload adds $1 per replica-hour <span className="blog-hl">throughput must exceed 1083.3 tokens per second to beat that cost</span>. These are explicit scenario inputs and not cloud quotes or measured Engram performance.</p>
          <p className="blog-p">If the offloaded setup reaches 1300 compliant tokens per second the same scenario costs about $2.78 per 1M output tokens. If throughput stays at 1000 it costs about $3.61 and loses. For owned hardware replace rental spend with amortized server cost power cooling and operations. Add the one-off training and porting cost divided by expected lifetime served tokens.</p>
          <p className="blog-p blog-p--key">The bigger win may be a smaller replica. Retest tensor parallelism and GPU count after moving the table then compare under the same quality and latency limits. Buy more DRAM only when it raises useful throughput reduces replicas or avoids buying GPUs for capacity. <span className="blog-hl">Free bytes alone are not a business case.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">dont spend 6 months reproducing this</h2>
          <p className="blog-p">The obvious project is grabbing an older MoE like DeepSeek-V2-Lite or Qwen3-30B-A3B-Base and retrofitting tables into it. Skip that. It is a replication exercise and it is already stale. <span className="blog-hl">DeepSeek LongCat and Qwen ship trained Engram tables in production models today.</span> By the time a reproduction finishes every frontier checkpoint will have this baked in and you will have proven what 3 labs already shipped.</p>
          <p className="blog-p">Copy the mechanism not the experiment. The <a href="https://github.com/deepseek-ai/Engram" target="_blank" rel="noopener">official Engram repository</a> shows how the lookup and the training work. The <a href="https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf" target="_blank" rel="noopener">V4.1-Flash report</a> shows how a shipping model scaled it. Read both. Then aim at what is still open.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what is still open</h2>
          <p className="blog-p">The ceiling question is the biggest one. The paper puts the sweet spot at 20-25% of the sparse budget but that number comes from runs where the bigger tables were undertrained. Nobody has published a well trained allocation sweep at 50% or above. <span className="blog-hl">If the ceiling moves with training tokens the whole sizing conversation changes.</span> And the 40B loss curve still widening at the end of training is a hint that it might.</p>
          <p className="blog-p">The second question is whether concept math can become a lookup. FFNs earn their parameters by transforming meaning not by recalling it. Anyone who finds a retrievable form of that transform breaks the ceiling open. Product-key memory is the closest attempt and it still waits on a hidden state query for its address. A version with Engrams deterministic early fetch path is unsolved and worth real effort.</p>
          <p className="blog-p">Composition work is wide open. Engram plus KV reuse plus hybrid attention all touch the same memory budget and the same host bandwidth. The savings interact in both directions. Small KV caches reduce the value of freeing HBM. Table fetches fight KV transfers for the same links. Nobody has published clean numbers for the combined system at fixed context length and concurrency.</p>
          <p className="blog-p">Then the smaller sharp questions. Hash collisions and table occupancy on real corpora instead of toy vocabularies. Whether 5-gram and 6-gram orders keep paying after V4.1-Flash stopped at 4. Tokenizer effects on code identifiers and rare names. Read-mostly tables on HBF with measured latency instead of headline bandwidth. Each is a clean contained result.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how to start on those</h2>
          <p className="blog-p">Pick 1 question and stay narrow. The allocation ceiling is the most tractable. Take the sweep protocol from earlier in this post and push it past 50% and keep training until the loss curves flatten. That single experiment is publishable and every lab sizing a table wants the answer.</p>
          <p className="blog-p">If you are a systems person instead measure what shipping tables actually do. Row access skew. Occupancy. Collision rates. Prefetch hit rates under real traffic. The bandwidth section earlier is the measurement plan. Release the traces and everyone downstream benefits.</p>
          <p className="blog-p">If you are an architecture person attack the concept math problem. Start from product keys and ask what breaks when the address must exist before the hidden state does. Hard question. Real constraint. Open solution.</p>
          <p className="blog-p">Whatever you pick publish the recipe and the traces. The field just moved from "does lookup work" to "how big should the table get and what goes in it next". Both answers need more than 1 lab.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">bottom line</h2>
          <p className="blog-p">Engram is not a model trick. It is a memory allocation move. Parameters that used to burn HBM become a lookup table that lives in DRAM and gets prefetched while lower layers compute.</p>
          <p className="blog-p blog-p--key">That one move cuts HBM demand cuts FLOPs per token and raised scores at a fixed budget. <span className="blog-hl">And it lands hardest where HBM is scarce and DRAM is not.</span></p>
          <p className="blog-p">That is the chinese position in 2026. Domestic DRAM is ramping while HBM access stays gated so the table-growing direction runs with the supply instead of against it. This is why the technique shows up first in DeepSeek LongCat and Qwen and not as a curiosity.</p>
          <p className="blog-p">Western labs get the same economics more slowly. DRAM is cheaper per bit everywhere and every inference fleet pays the memory bill. The open question is no longer whether lookup tables work. It is how big the table gets which memory tier holds it and who is left buying the expensive bits.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-refs">
            <li><a href="https://arxiv.org/pdf/2601.07372" target="_blank" rel="noopener">"Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models"</a></li>
            <li><a href="https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf" target="_blank" rel="noopener">DeepSeek-V4.1-Flash tech report</a></li>
            <li><a href="https://arxiv.org/pdf/2203.14680" target="_blank" rel="noopener">Geva et al. "Transformer Feed-Forward Layers Build Predictions by Promoting Concepts in the Vocabulary Space" (2022)</a></li>
            <li><a href="https://inferencex.semianalysis.com/blog/engrams-embedding-entendre-codesign" target="_blank" rel="noopener">SemiAnalysis "Engram's Embedding Entendre CoDesign" (2026)</a></li>
            <li><a href="https://www.trendforce.com/presscenter/news/20251029-12758.html" target="_blank" rel="noopener">TrendForce HBM and server DDR5 price outlook (October 2025)</a></li>
            <li><a href="https://www.trendforce.com/presscenter/news/20260602-13074.html" target="_blank" rel="noopener">TrendForce DRAM wafer allocation and RDIMM revenue per wafer (June 2026)</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/Memory-Prices-Surge-Up-to-90-From-Q4-2025" target="_blank" rel="noopener">Counterpoint "Memory Prices Surge Up to 90% From Q4 2025"</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/global-dram-and-hbm-market-share" target="_blank" rel="noopener">Counterpoint global DRAM and HBM market share tracker</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/cxmt-stock-market-big-three-memory-club" target="_blank" rel="noopener">Counterpoint CXMT and the big three memory club</a></li>
            <li><a href="https://investors.micron.com/static-files/088991c5-a249-4f66-a0a6-258d9b66f3f9" target="_blank" rel="noopener">Micron fiscal Q1 2026 earnings material (HBM to DDR5 silicon trade ratio)</a></li>
            <li><a href="https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military" target="_blank" rel="noopener">BIS December 2024 export control package (HBM)</a></li>
            <li><a href="https://arxiv.org/abs/1907.05242" target="_blank" rel="noopener">Lample et al. "Large Memory Layers with Product Keys" (2019)</a></li>
            <li><a href="https://arxiv.org/abs/2412.09764" target="_blank" rel="noopener">Meta "Scaling Language Models with Memory Layers" (2024)</a></li>
            <li><a href="https://arxiv.org/abs/2407.00079" target="_blank" rel="noopener">Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving</a></li>
            <li><a href="https://arxiv.org/abs/2203.08913" target="_blank" rel="noopener">Memorizing Transformers (2022)</a></li>
            <li><a href="https://arxiv.org/abs/2407.04620" target="_blank" rel="noopener">Learning to (Learn at Test Time) (TTT)</a></li>
            <li><a href="https://arxiv.org/abs/2501.00663" target="_blank" rel="noopener">Titans: Learning to Memorize at Test Time</a></li>
            <li><a href="https://arxiv.org/abs/2312.00752" target="_blank" rel="noopener">Mamba: Linear-Time Sequence Modeling with Selective State Spaces</a></li>
            <li><a href="https://arxiv.org/abs/2412.06464" target="_blank" rel="noopener">Gated Delta Networks</a></li>
            <li><a href="https://github.com/deepseek-ai/Engram" target="_blank" rel="noopener">Engram reference implementation</a></li>
          </ul>
        </section>

      </div>
    </main>
  )
}
