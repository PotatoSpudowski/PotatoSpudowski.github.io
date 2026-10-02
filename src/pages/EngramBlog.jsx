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
            <h1 className="blog-title">the west is scaling hbm. china may scale around it.</h1>
            <p className="blog-p">tldr. HBM is the fast memory glued next to a GPU and it is priced like bandwidth not like RAM. You cannot just move a model into DDR5. But you can change the model so most of its bytes stop needing HBM. Engram does that. It stores the meaning of repeated token sequences in big lookup tables that live in host DRAM and it fetches a few rows per token instead of recomputing that meaning. 100B of table ran outside HBM for under 3% throughput loss and at matched budgets the benchmarks went up. The same fabs make both kinds of memory so there is no clean winner. But China gets squeezed hardest on HBM and 3 chinese labs already ship this. The real shift is a model that owns 200 GB of memory without needing 200 GB of HBM. HBM stays. What changes is what has to sit in it.</p>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <BlogIndex />

        <section className="blog-section">
          <h2 className="blog-section-tag">hbm is not expensive ram</h2>
          <p className="blog-p">HBM is not expensive RAM. <span className="blog-hl">It is expensive bandwidth sitting a few millimeters from the compute.</span> That distinction kills most takes about swapping HBM for DDR5.</p>
          <p className="blog-p">An H200 reads its local HBM at 4.8 TB/s. A top end EPYC CPU socket with 12 channels of DDR5 tops out around 614 GB/s of socket bandwidth. And then whatever the GPU needs still has to cross the CPU to GPU link. These numbers describe different parts of the path. They are not interchangeable.</p>
          <p className="blog-p">A dense transformer touches the same weights on every single token. Move those weights into host RAM and the memory bus becomes the model. So no. DRAM is not the answer to an HBM shortage.</p>
          <p className="blog-p blog-p--key">The better answer is to change the model until most of its bytes dont need HBM bandwidth in the first place. Engram is the first architecture I have seen make that idea look like a real scaling axis instead of a systems hack. Not because it found cheaper memory. <span className="blog-hl">Because it changed the access pattern.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the tax on every forward pass</h2>
          <p className="blog-p">Start with what a model actually does with your input. The text gets split into tokens. Then the lower layers spend compute working out what sequences of those tokens mean together.</p>
          <p className="blog-p">Take 3 tokens. "Alexander" "the" "great". Each one has its own meaning. Together they point at one very specific thing. The model pays FLOPs to rebuild that combined meaning every time those tokens show up next to each other.</p>
          <p className="blog-p">This is not a one time cost. Prefill pays it for every prompt. Decode pays it again for every generated token. The model has seen "of course" and "United States" and "New York" billions of times in training and still reconstructs what they mean from scratch on every pass.</p>
          <p className="blog-p">That is the tax. Lower layers manufacture meaning that is effectively constant. Meaning that could have been memorized.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what engram actually is</h2>
          <p className="blog-p">Engram turns some of that reconstruction into a lookup. It stores the meaning of short token sequences in large learned embedding tables and pulls the right row instead of recomputing the meaning.</p>
          <p className="blog-p">Here is the mechanism from <a href="https://arxiv.org/abs/2601.07372" target="_blank" rel="noopener">the paper that introduced it</a>. For each token position the model takes short n-grams of nearby tokens. The research model uses 2-grams and 3-grams. That means every pair and every triple of neighboring tokens. It hashes those token ids into big tables and reads a few rows back. Hashing means different sequences can land on the same slot so the model uses multiple heads with different hashes to cover for it.</p>
          <p className="blog-p">The retrieved rows are concatenated and projected into keys and values. The current hidden state then gates how much of that retrieved memory enters the model.</p>
          <p className="blog-p">The split is simple. <span className="blog-hl">Token ids decide what gets fetched. The hidden state decides how useful the fetched thing is.</span></p>

          <Fig cap="hashed n-gram lookups get concatenated and gated by the current hidden state. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-arch.jpg" alt="Engram architecture with 2-gram and 3-gram embedding lookups" />
          </Fig>

          <p className="blog-p">These rows are not text snippets from a database. They are trained with the model like any other embedding. The point is to move repeated pattern work out of the expensive compute path and into learned memory.</p>
          <p className="blog-p">One more term matters before the numbers later make sense. A mixture of experts model keeps many expert sub networks but fires only a few of them per token. Total parameters count everything in the warehouse. Activated parameters count what one token actually uses. The paper holds activated parameters fixed at 3.8B and total at 26.7B and then moves part of the sparse budget from experts into lookup tables. That is what makes the comparison fair.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why this is a hardware story</h2>
          <p className="blog-p">That first property is what turns this into a hardware story. The addresses come from token ids. They are known before the target layer even runs. The runtime can start fetching rows from host memory while earlier GPU layers are still computing.</p>
          <p className="blog-p">This is not normal weight offload. Normal offload needs a huge tensor on every forward pass and hopes the link is fast enough. Engram owns a huge logical parameter space but touches a tiny and predictable fraction of it per token. A few kilobytes out of 200 GB. That is a much easier problem to hide behind useful compute.</p>

          <Fig cap="token id lookups can prefetch from the memory hierarchy while lower layers compute. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-offload.png" alt="Engram at inference, offloaded to the memory hierarchy" />
          </Fig>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the number that matters</h2>
          <p className="blog-p">The paper has a systems experiment that deserves way more attention than the usual benchmark table. They put a 100B parameter Engram table entirely in host memory and ran inference on an H800. That is a China market GPU with less memory bandwidth than the H100.</p>
          <p className="blog-p">On the 4B dense backbone throughput went from 9,031.62 tok/s to 8,858.28 tok/s. A 1.9% hit. On the 8B backbone it went from 6,315.52 tok/s to 6,140.02 tok/s. A 2.8% hit.</p>
          <p className="blog-p blog-p--key"><span className="blog-hl">100B parameters outside HBM for less than 3% throughput loss</span> is the interesting number.</p>
          <p className="blog-p">But read the test before making it a law. The workload ran 512 sequences with lengths between 100 and 1024 tokens. That is a fat throughput load with enough compute to hide transfers. It does not prove the same result at batch 1. It does not prove good p99 latency. It does not prove that multiple offloaded memory layers survive PCIe contention next to KV offload and everything else a production server does.</p>
          <p className="blog-p">The paper proves the mechanism works. The serving problem is still open enough to be interesting.</p>
          <p className="blog-p">The quality numbers matter too. The paper runs a matched budget comparison. Same total parameters. Same activated parameters. Same FLOPs. Same training tokens. Engram-27B beats the plain MoE-27B baseline. MMLU goes up by about 3 points. BBH by 5. ARC-Challenge by 3.7. HumanEval by 3. MATH by 2.4.</p>

          <Fig cap="matched budget comparison. same total parameters, same activated parameters, same FLOPs, same token count. source: Conditional Memory via Scalable Lookup, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-table1.jpg" alt="Benchmark table comparing Dense, MoE, and Engram models" />
          </Fig>

          <p className="blog-p">So this is not just parking existing weights somewhere cheaper. The model gets a different kind of capacity. One correction matters here. Engram does not magically cut FLOPs in this experiment. It is iso-FLOPs on purpose. <span className="blog-hl">The claim is stronger stated correctly. You can move capacity from conditional computation into conditional memory without paying proportional compute for it.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why you cant put everything in a table</h2>
          <p className="blog-p">If lookup beats recompute why not turn the whole model into one giant table. Because feed-forward layers do more than remember. They do concept math.</p>
          <p className="blog-p"><a href="https://arxiv.org/abs/2203.14680" target="_blank" rel="noopener">Geva et al.</a> showed that feed-forward updates can be read as pushing the hidden state toward concepts in vocabulary space. Give the model "few ___ coffee" and the layer pushes toward breakfast and pancake. That is transforming meaning for the current context. Not recalling a fixed meaning.</p>

          <Fig cap="feed-forward updates promote concepts that change the next token prediction. this is reasoning not lookup. source: Geva et al. 2022, arxiv:2203.14680">
            <PaperFig src="/diagrams/paper/engram-ffn.png" alt="FFN promoting concepts in vocabulary space" />
          </Fig>

          <p className="blog-p">A table can tell you what a phrase means. It cannot work out what comes next given the last 40 tokens of context. So there is a floor on how much of the model can become memory.</p>
          <p className="blog-p">The paper puts the sweet spot near 20 to 25% of the sparse parameter budget. Push past that and you delete too many experts to feed the table. One caution. The bigger table run in the paper does not sweep ahead on every benchmark and the authors flag under-training as the likely reason. The loss gap was still widening at the end of training.</p>

          <Fig cap="the authors flag under-training as the likely reason the bigger table does not dominate yet. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-quote.png" alt="Paper quote on Engram-40B under-training" />
          </Fig>

          <p className="blog-p">Treat 20 to 25% as a starting point for a sweep. Not a law of nature. And watch the denominator. That range is a share of the sparse budget. DeepSeek V4.1 Flash puts 196B of Engram parameters outside its 552B backbone which is 26% of the total. Different measure.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">how the shipping model scaled it</h2>
          <p className="blog-p">DeepSeek V4.1 Flash is the proof this leaves the lab. It carries about 552B backbone parameters plus 196B of Engram memory. The tables are not just bigger. They are shaped differently.</p>

          <Fig cap="DeepSeek V4.1 Flash grows n-gram orders, table rows and embedding width relative to the research model. source: DeepSeek-V4.1-Flash tech report">
            <PaperFig src="/diagrams/paper/engram-dims.png" alt="Engram dimension comparison between Engram-27B and V4.1-Flash" />
          </Fig>

          <p className="blog-p">Rows per head table grow from about 2.26M to about 16M. Embedding width grows from 80 to 256. The model adds 4-grams on top of 2-grams and 3-grams. That is how you scale this. More orders. More rows. Wider vectors. Not just more layers.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">hbm is still the l1</h2>
          <p className="blog-p">This is where the DRAM replacement framing breaks. HBM does not disappear. The active transformer still needs absurd bandwidth. Attention still needs bandwidth. MoE experts need bandwidth when they fire. KV state can still dominate capacity at long context. The accelerator still wants its hot working set close enough that compute does not starve.</p>
          <p className="blog-p">Engram only works off device because its memory has 3 special properties. The access is sparse. The address is predictable early. The payload per token is small enough to hide behind useful compute. Remove any one of those and host memory gets ugly fast.</p>

          <Fig cap="the useful abstraction is a hierarchy not a replacement. the architecture has to earn each slower tier. bandwidths are illustrative since GPU HBM, socket DRAM and the CPU to GPU link are different parts of the path.">
            <PaperFig src="/diagrams/engram-hierarchy.svg" alt="Memory hierarchy from HBM to host DRAM to CXL and SSD" />
          </Fig>

          <p className="blog-p blog-p--key">HBM is the L1 for the model. The fastest tier in the hierarchy. Host DRAM is the next tier. CXL memory can become another capacity tier. SSD can hold the very cold tail if the software can predict requests early enough. <span className="blog-hl">The architecture has to earn the right to use the slower tier.</span> That is the inversion.</p>
          <p className="blog-p">Today we usually build the model first and ask the runtime how to fit it into memory later. The better direction is to train model state with a placement target from the beginning.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the shortage is bigger than hbm</h2>
          <p className="blog-p">Here is the market backdrop that makes all this urgent. HBM is DRAM. The same upstream memory industry that makes server DDR feeds HBM too.</p>
          <p className="blog-p">The difference is what each bit costs in factory capacity. <a href="https://investors.micron.com/static-files/530bd7ed-a8c8-4687-af4a-8c129f740e09" target="_blank" rel="noopener">Micron</a> has described roughly a 3 to 1 wafer trade ratio between HBM3E and DDR5 for the same bit count on the same node. The ratio gets worse for newer HBM generations. <a href="https://www.reuters.com/world/asia-pacific/samsung-electronics-says-hbm-account-nearly-30-industry-dram-capacity-next-year-2026-09-29/" target="_blank" rel="noopener">Samsung said in September 2026</a> that HBM already takes roughly 20% of global DRAM wafer capacity and could approach 30% in 2027.</p>

          <Fig cap="HBM3E and server DDR5 prices per gigabit. the premium is real but it is shrinking as server DDR5 rises. published in 2025 so later points are forecasts. source: TrendForce roadshow via SemiconSam">
            <PaperFig src="/diagrams/paper/hbm-dram-price.jpg" alt="HBM3E and server DDR5 price per gigabit" />
          </Fig>

          <p className="blog-p">So AI demand does not only create an HBM shortage. HBM production eats the wafer pool that would have become ordinary DRAM. More accelerator memory can make host memory tighter too. When people say just buy more system RAM they miss this.</p>
          <p className="blog-p">And the cheap tier is repricing right now. <a href="https://counterpointresearch.com/en/insights/Memory-Prices-Surge-Up-to-90-From-Q4-2025" target="_blank" rel="noopener">Counterpoint reported in February 2026</a> that a 64GB server memory stick went from a $450 contract price in Q4 2025 to above $900 in Q1 2026. TrendForce expects supply to stay tight through 2027 with meaningful new fab output not arriving until 2028.</p>

          <Fig cap="PC and server memory prices from Q2 2025 to Q2 2026 including server DDR5. 2026 points are estimates. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/ddr5-prices.jpg" alt="PC and server memory price trends" />
          </Fig>

          <p className="blog-p">Engram moves demand into the cheap tier at exactly the moment the cheap tier stops being cheap. That does not kill the idea. It does mean the memory bill is a real line item and not free capacity lying around.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the same fabs sell both sides</h2>
          <p className="blog-p">The 3 big HBM suppliers also sell host DRAM. <a href="https://counterpointresearch.com/en/insights/global-dram-and-hbm-market-share" target="_blank" rel="noopener">Counterpoint</a> puts Q2 2026 HBM revenue share at roughly 50% for SK hynix, 33% for Samsung and 18% for Micron. Those are revenue shares. Not shares of bits or wafers.</p>

          <Fig cap="HBM revenue share through Q2 2026. rounded vendor shares differ from bit shipment shares. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/hbm-vendor-share.jpg" alt="HBM revenue share by vendor" />
          </Fig>

          <p className="blog-p">Here is the part that makes the vendor story non obvious. <a href="https://www.trendforce.com/presscenter/news/20260602-13074.html" target="_blank" rel="noopener">TrendForce</a> also said DDR5 server memory revenue per wafer overtook HBM in Q1 2026. Producers follow yield and margin. If inference workloads want more host DRAM the suppliers chase that with the same fabs.</p>
          <p className="blog-p">So there is no mechanical winner and loser here. Less HBM capacity needed per served model does not mean less total HBM demand in a growing industry. It means the mix shifts. Buy complete servers from multiple suppliers and measure bytes moved per token.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">china is squeezed and that is why this matters</h2>
          <p className="blog-p">The China story is real but it needs stating carefully. China is not winning because it has some magic pool of cheap DRAM. It is getting squeezed harder on HBM.</p>
          <p className="blog-p">The US added specific HBM export controls in December 2024. <a href="https://www.reuters.com/world/asia-pacific/chinas-ai-chipmakers-raise-prices-high-bandwidth-memory-shortage-bites-2026-09-10/" target="_blank" rel="noopener">Reuters reported in September 2026</a> that Chinese AI chip vendors were raising accelerator prices as the shortage bit. Huawei had raised pricing on an upcoming Ascend card by roughly 20% to 50% versus earlier quotes. Cambricon had raised its next chip by 20% to 30%. Grey market HBM into China was costing multiples of outside China pricing. That is a disadvantage today.</p>
          <p className="blog-p">The interesting asymmetry is incentive. If HBM is harder for you to buy then an architecture that converts 200 GB of accelerator resident capacity into a few kilobytes of predictable host traffic per token is worth more to you than to somebody who can just add another HBM rich GPU.</p>
          <p className="blog-p">China also has a growing domestic DRAM producer in CXMT. <a href="https://www.reuters.com/world/asia-pacific/what-is-cxmt-how-did-it-become-chinas-dram-champion-2026-07-15/" target="_blank" rel="noopener">Reuters put CXMT at 7.7% of global DRAM in 2025</a>. It is still behind the leading vendors in advanced memory. <a href="https://www.reuters.com/world/asia-pacific/chinas-cxmt-makes-breakthrough-advanced-memory-chips-information-reports-2026-08-31/" target="_blank" rel="noopener">A separate report in August</a> said CXMT had started producing HBM3E only in small quantities with a bigger ramp targeted for 2027.</p>

          <Fig cap="global DRAM bit shipment shares with CXMT growing from 8% in 2025 to a forecast 11% in 2028. source: Counterpoint Research">
            <PaperFig src="/diagrams/paper/dram-vendor-share.jpg" alt="Global DRAM bit shipment shares including CXMT" />
          </Fig>

          <p className="blog-p">So the clean thesis is not China has DRAM and the West has HBM. It is this. <span className="blog-hl">China has a stronger reason to make HBM capacity less important before its domestic HBM supply catches up.</span></p>
          <p className="blog-p blog-p--key">And the adoption pattern is hard to ignore. <a href="https://www.deepseek.com/en/news/deepseek-v4-1-flash/" target="_blank" rel="noopener">DeepSeek V4.1 Flash</a> carries about 196B Engram parameters outside its 552B backbone. <a href="https://github.com/meituan-longcat/LongCat-2.0" target="_blank" rel="noopener">Meituan LongCat 2.0</a> ships 135B of n-gram embedding parameters. <a href="https://github.com/QwenLM/Qwen3.8-Flash-Next" target="_blank" rel="noopener">Qwen3.8 Flash Next</a> adds 51B of n-gram memory and explicitly describes host-memory offload with async prefetch. 3 separate chinese model groups converged on the same broad primitive in months. That does not prove a coordinated strategy. It does tell you the architecture fits the constraint set.</p>

          <Fig cap="Qwen places an n-gram embedding layer at the input of its hybrid block. same primitive as Engram with different plumbing. source: Qwen">
            <PaperFig src="/diagrams/paper/engram-qwen.jpg" alt="Qwen architecture with N-gram Embedding Layer" />
          </Fig>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the money number and what it actually says</h2>
          <p className="blog-p">This is where the finance crowd got interested. The number everyone quotes is 50% higher revenue per gigawatt from <a href="https://inferencex.semianalysis.com/blog/engrams-embedding-entendre-codesign" target="_blank" rel="noopener">SemiAnalysis</a>. Read the fine print before putting it in a model.</p>

          <Fig cap="SemiAnalysis serving economics per gigawatt for DeepSeek V4.1 Flash. the revenue per GW headline needs its assumptions read before it gets quoted. source: SemiAnalysis InferenceX">
            <PaperFig src="/diagrams/paper/engram-semianalysis.jpg" alt="SemiAnalysis revenue and profit estimates per gigawatt" />
          </Fig>

          <p className="blog-p blog-p--key">What is public is up to 50% better offload performance on named NVIDIA systems plus one concrete systems result. <span className="blog-hl">The exact 50% revenue per GW figure does not appear in the public report.</span> Performance and revenue are different metrics.</p>
          <p className="blog-p">The concrete result is still good. DRAM offload let a B300 setup move from tensor parallelism across 4 GPUs to 2 and improved the measured serving curve by up to 1.6x. Removing a capacity constraint can also remove communication and a whole pair of GPUs per replica. That is a stronger mechanism than DRAM is cheaper.</p>
          <p className="blog-p">Anyone modeling a business on the headline number needs the chart. The GPU count. The SLO. The software revision. And what the power denominator actually counts. An idle larger batch earns nothing.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">production is ahead of the paper</h2>
          <p className="blog-p">The research asked whether conditional memory works. That question is getting stale. The production models and serving stacks are moving faster now.</p>
          <p className="blog-p"><a href="https://github.com/vllm-project/vllm/blob/main/docs/features/engram.md" target="_blank" rel="noopener">vLLM has first-class Engram support</a>. For DeepSeek V4.1 it keeps the giant tables in pinned host memory and prefetches rows on a side CUDA stream. It can share host tables across colocated replicas so every replica does not need its own 200 GB copy. That is already past the toy question of can I offload an embedding table.</p>
          <p className="blog-p">The open <a href="https://github.com/sgl-project/sglang/issues/38856" target="_blank" rel="noopener">SGLang work</a> is even more revealing. One proposal splits the sparse row lookup from the much larger projection so only the cheap irregular host fetch runs early. It also proposes a bounded GPU cache for hot rows.</p>
          <p className="blog-p">The performance model in that issue says the thing out loud. <span className="blog-hl">The likely bottleneck is not average bulk bandwidth. It is sparse PCIe transaction latency and TLB behavior.</span> That is where the next layer of systems work starts.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">dont build another engram clone</h2>
          <p className="blog-p">If you want to do something useful do not spend 6 months retrofitting Engram into an old MoE just to prove the paper again. The <a href="https://github.com/deepseek-ai/Engram" target="_blank" rel="noopener">reference implementation</a> exists. Production checkpoints exist. vLLM has support. SGLang has active work.</p>
          <p className="blog-p">The higher value problem is building the memory system around this new class of parameters. Here is where I would aim.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">a memory roofline for model state</h2>
          <p className="blog-p">We have roofline models for compute and bandwidth. Build one for placement.</p>
          <p className="blog-p">For every tensor or memory primitive measure active bytes per token. Reuse distance. Address predictability. Read versus write ratio. Access entropy. Earliest time the address becomes known. Deadline before the value is consumed. Then say what belongs in HBM. What can live in host DRAM. What can survive CXL. What can fall all the way to SSD.</p>
          <p className="blog-p">The output should not be another profiler screenshot. It should be a placement plan with a predicted stall cost. That becomes useful far beyond Engram.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">deadline driven prefetch</h2>
          <p className="blog-p">Most offload systems think in terms of move this tensor to the GPU. The better abstraction is this row must arrive before layer 14 begins.</p>
          <p className="blog-p">Once the runtime knows a deadline it can schedule sparse fetches around compute instead of treating every transfer equally. Prefetch earlier when PCIe is congested. Drop speculative work when a deadline is impossible. Choose between a hot HBM copy and host DRAM based on actual slack. This gets especially interesting once Engram fetches share the link with KV movement.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">make the table cacheable on purpose</h2>
          <p className="blog-p">Natural language n-grams are heavy tailed. Some rows will be insanely hot while most of the logical table stays cold. So do not treat the table as 200 GB of equally important bytes.</p>
          <p className="blog-p">Measure production row traces. Keep hot rows in HBM. Cluster rows that co-occur into transfer sized pages. Tune page size around real DMA and TLB behavior instead of neural network aesthetics. Promote and demote rows with a policy that understands request mix.</p>
          <p className="blog-p">The paper itself points toward HBM plus DRAM plus NVMe caching. The interesting work is making that hierarchy real under tail-latency constraints.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">batch by memory locality</h2>
          <p className="blog-p">Inference schedulers already batch around token budgets and KV availability. For conditional memory there is another signal available before execution. The memory keys.</p>
          <p className="blog-p">If 20 requests need overlapping Engram rows then serving them near each other may increase cache hit rate and collapse host reads. You cannot destroy fairness or latency to chase locality. But there is probably a useful scheduling term here. Think cache-aware routing for model parameters rather than only KV prefixes.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">train for cheap memory behavior</h2>
          <p className="blog-p">This is the one I think has the most unexplored upside. Engram uses deterministic hashes so serving knows addresses early. Future conditional memory does not have to stop there.</p>
          <p className="blog-p">Make memory cost part of training. Penalize architectures whose retrieval addresses have high entropy too late in the network. Reward locality. Reward repeated page access. Reward memory queries that can be predicted 5 layers before use. Jointly optimize quality and HBM bytes per token instead of training for loss and asking infrastructure to clean up later.</p>
          <p className="blog-p">MoE learned to care about expert balance because systems constraints matter. Conditional memory should learn to care about placement for the same reason.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">build the benchmark everyone will fake</h2>
          <p className="blog-p">The 512-sequence H800 result is useful but nowhere near enough. Run batch 1 through saturation. Split prefill from decode. Test 4K 32K and 128K contexts. Report TTFT. p50 and p99 inter-token latency. Host bytes per token. PCIe transactions. TLB misses if the platform exposes them. GPU stall time at each memory layer. NUMA placement. Hot-row cache hit rate. Power per token.</p>
          <p className="blog-p">Then turn on KV offload at the same time. A system that looks brilliant with an empty PCIe link may fall apart once the rest of the serving stack uses the same road. That benchmark is probably more useful to the field than another architecture paper with 12 downstream scores.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the next scaling law is hot bytes</h2>
          <p className="blog-p">The first era of LLM scaling was parameters. Then active parameters. Then FLOPs and tokens.</p>
          <p className="blog-p blog-p--key">The next systems number I want to see on every model card is <span className="blog-hl">HBM bytes touched per generated token</span>. Not total checkpoint size. Not theoretical parameter count. How much state actually has to be hot for the next token to arrive on time.</p>
          <p className="blog-p">Engram matters because it makes those numbers diverge. A model can own a 200 GB learned memory without demanding 200 GB of HBM residency. Once that becomes normal the obvious next questions follow. Can factual and local-pattern memory become 10x larger without touching accelerator cost. Can the runtime keep the top 1% of rows in HBM and make the other 99% effectively invisible behind compute. Can training produce retrieval patterns shaped around real hardware pages and links. Can a cluster expose a huge shared read-mostly memory pool so 8 replicas stop carrying 8 copies of the same table.</p>
          <p className="blog-p">Those are architecture and systems questions at the same time. That is why I would not describe Engram as DRAM replacing HBM. <span className="blog-hl">HBM stays the fast tier. Probably for a long time.</span> The opportunity is to stop pretending the whole model belongs there.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-refs">
            <li><a href="https://arxiv.org/abs/2601.07372" target="_blank" rel="noopener">DeepSeek et al. "Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models"</a></li>
            <li><a href="https://github.com/deepseek-ai/Engram" target="_blank" rel="noopener">DeepSeek Engram reference implementation</a></li>
            <li><a href="https://www.deepseek.com/en/news/deepseek-v4-1-flash/" target="_blank" rel="noopener">DeepSeek V4.1 Flash announcement</a></li>
            <li><a href="https://github.com/QwenLM/Qwen3.8-Flash-Next" target="_blank" rel="noopener">Qwen3.8 Flash Next</a></li>
            <li><a href="https://arxiv.org/abs/2608.30320" target="_blank" rel="noopener">Qwen3.8 architecture report</a></li>
            <li><a href="https://github.com/meituan-longcat/LongCat-2.0" target="_blank" rel="noopener">Meituan LongCat 2.0</a></li>
            <li><a href="https://arxiv.org/abs/2203.14680" target="_blank" rel="noopener">Geva et al. "Transformer Feed-Forward Layers Build Predictions by Promoting Concepts in the Vocabulary Space"</a></li>
            <li><a href="https://github.com/vllm-project/vllm/blob/main/docs/features/engram.md" target="_blank" rel="noopener">vLLM Engram documentation</a></li>
            <li><a href="https://github.com/sgl-project/sglang/issues/38856" target="_blank" rel="noopener">SGLang batched async Engram host-row prefetch proposal</a></li>
            <li><a href="https://inferencex.semianalysis.com/blog/engrams-embedding-entendre-codesign" target="_blank" rel="noopener">SemiAnalysis "Engram's Embedding Entendre CoDesign"</a></li>
            <li><a href="https://www.nvidia.com/en-in/data-center/h200/" target="_blank" rel="noopener">NVIDIA H200 specifications</a></li>
            <li><a href="https://www.amd.com/en/products/processors/server/epyc/9005-series/amd-epyc-9965.html" target="_blank" rel="noopener">AMD EPYC 9965 specifications</a></li>
            <li><a href="https://investors.micron.com/static-files/530bd7ed-a8c8-4687-af4a-8c129f740e09" target="_blank" rel="noopener">Micron HBM to DDR5 wafer trade ratio</a></li>
            <li><a href="https://www.reuters.com/world/asia-pacific/samsung-electronics-says-hbm-account-nearly-30-industry-dram-capacity-next-year-2026-09-29/" target="_blank" rel="noopener">Samsung on HBM share of DRAM wafer capacity (Reuters, September 2026)</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/Memory-Prices-Surge-Up-to-90-From-Q4-2025" target="_blank" rel="noopener">Counterpoint "Memory Prices Surge Up to 90% From Q4 2025"</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/global-dram-and-hbm-market-share" target="_blank" rel="noopener">Counterpoint global DRAM and HBM market share tracker</a></li>
            <li><a href="https://counterpointresearch.com/en/insights/cxmt-stock-market-big-three-memory-club" target="_blank" rel="noopener">Counterpoint CXMT and the big three memory club</a></li>
            <li><a href="https://www.trendforce.com/presscenter/news/20260602-13074.html" target="_blank" rel="noopener">TrendForce DRAM wafer allocation and RDIMM revenue per wafer (June 2026)</a></li>
            <li><a href="https://www.trendforce.com/presscenter/news/20251029-12758.html" target="_blank" rel="noopener">TrendForce HBM and server DDR5 price outlook (October 2025)</a></li>
            <li><a href="https://www.reuters.com/world/asia-pacific/chinas-ai-chipmakers-raise-prices-high-bandwidth-memory-shortage-bites-2026-09-10/" target="_blank" rel="noopener">China HBM shortage and accelerator pricing (Reuters, September 2026)</a></li>
            <li><a href="https://www.reuters.com/world/asia-pacific/what-is-cxmt-how-did-it-become-chinas-dram-champion-2026-07-15/" target="_blank" rel="noopener">CXMT DRAM position (Reuters, July 2026)</a></li>
            <li><a href="https://www.reuters.com/world/asia-pacific/chinas-cxmt-makes-breakthrough-advanced-memory-chips-information-reports-2026-08-31/" target="_blank" rel="noopener">CXMT small-volume HBM3E report (Reuters, August 2026)</a></li>
            <li><a href="https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military" target="_blank" rel="noopener">US BIS December 2024 HBM controls</a></li>
            <li><a href="https://arxiv.org/abs/2607.07388" target="_blank" rel="noopener">TF-Engram</a></li>
          </ul>
        </section>

      </div>
    </main>
  )
}
