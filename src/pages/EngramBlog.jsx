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
            <h1 className="blog-title">you dont replace hbm with dram. you change what needs hbm.</h1>
            <p className="blog-p">tldr. HBM is expensive bandwidth sitting next to compute. Not expensive RAM. So the answer to an HBM shortage is not DDR5. It is changing which bytes need HBM. Engram turns rebuilt phrase meaning into sparse lookups whose addresses are known early. 100B of table ran from host memory for under 3% throughput loss and quality went up at fixed FLOPs. China has the strongest incentive since HBM is hardest to buy there. But HBM stays. The model just stops pretending all of it belongs in the fast tier.</p>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        <BlogIndex />

        <section className="blog-section">
          <h2 className="blog-section-tag">hbm is not expensive ram</h2>
          <p className="blog-p">HBM is not expensive RAM. <span className="blog-hl">It is expensive bandwidth sitting a few millimeters from the compute.</span> That distinction kills most takes about swapping HBM for DDR5.</p>
          <p className="blog-p">An H200 reads its local HBM at 4.8 TB/s. A top end EPYC socket has 12 channels of DDR5 and tops out around 614 GB/s of socket bandwidth. Then you still have to move whatever the GPU needs across the CPU to GPU link. Those numbers describe different parts of the path. They are not interchangeable.</p>
          <p className="blog-p">A dense transformer touches the same weights every token. Move those weights into host RAM and the memory bus becomes the model. So no. DRAM is not the answer to an HBM shortage.</p>
          <p className="blog-p blog-p--key">The more interesting answer is to change the model until most of its bytes dont need HBM bandwidth in the first place. Engram is the first architecture I have seen make that idea look like a real scaling axis instead of a systems hack. Not because it found cheaper memory. <span className="blog-hl">Because it changed the access pattern.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the shortage is bigger than hbm</h2>
          <p className="blog-p">HBM is DRAM. The same upstream memory industry that makes server DDR feeds HBM too.</p>
          <p className="blog-p">The difference is what each bit costs in factory capacity. <a href="https://investors.micron.com/static-files/530bd7ed-a8c8-4687-af4a-8c129f740e09" target="_blank" rel="noopener">Micron</a> has described roughly a 3 to 1 wafer trade ratio between HBM3E and DDR5 for the same bit count on the same node. The ratio gets worse for newer HBM generations. <a href="https://www.reuters.com/world/asia-pacific/samsung-electronics-says-hbm-account-nearly-30-industry-dram-capacity-next-year-2026-09-29/" target="_blank" rel="noopener">Samsung said in September 2026</a> that HBM already takes roughly 20% of global DRAM wafer capacity and could approach 30% in 2027.</p>
          <p className="blog-p">That is the part people miss when they say just buy more system RAM. AI demand does not only create an HBM shortage. HBM production eats the wafer pool that would have become ordinary DRAM. More accelerator memory can make host memory tighter too.</p>
          <p className="blog-p">So the useful question is not which memory technology wins. It is which bytes deserve the expensive tier.</p>
          <p className="blog-p">Dense weights used on every token need bandwidth. KV state that is hot right now needs low latency. Activations need to stay near compute. A 200 GB table where each token touches a few kilobytes is a completely different object. Treating those 2 workloads as the same memory problem is the mistake.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what engram actually changes</h2>
          <p className="blog-p">A transformer spends part of its early depth rebuilding local patterns it has seen a ridiculous number of times. Names. Common phrases. Repeated syntactic fragments. Places where the token sequence alone already tells you a lot about which representation will be useful.</p>
          <p className="blog-p">Engram turns some of that reconstruction into a lookup. For each position it takes short token n-grams. The research model uses 2-grams and 3-grams. It hashes those token ids into large learned embedding tables and pulls a small number of rows. The current hidden state then gates how much of the retrieved memory enters the model.</p>
          <p className="blog-p">The split is simple. <span className="blog-hl">Token ids decide what gets fetched. The hidden state decides how useful the fetched thing is.</span></p>

          <Fig cap="hashed n-gram lookups get concatenated and gated by the current hidden state. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-arch.jpg" alt="Engram architecture with 2-gram and 3-gram embedding lookups" />
          </Fig>

          <p className="blog-p">That first property is what makes this a hardware story. The addresses are known before the target layer runs. The runtime can start fetching those rows from host memory while earlier GPU layers are still computing.</p>

          <Fig cap="token id lookups can prefetch from the memory hierarchy while lower layers compute. source: Engram paper, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-offload.png" alt="Engram at inference, offloaded to the memory hierarchy" />
          </Fig>

          <p className="blog-p">This is not normal weight offload. Normal dense offload says I need a huge tensor on every forward pass and I hope the link is fast enough. Engram says I own a huge logical parameter space but I will touch a microscopic and predictable fraction of it on this token. That is a much easier problem to hide.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the result that matters</h2>
          <p className="blog-p">The paper has a systems experiment that deserves more attention than most of the benchmark table. They put a 100B parameter Engram table entirely in host memory and ran inference on an H800.</p>
          <p className="blog-p">On the 4B dense backbone throughput went from 9,031.62 tok/s to 8,858.28 tok/s. A 1.9% hit. On the 8B backbone it went from 6,315.52 tok/s to 6,140.02 tok/s. A 2.8% hit.</p>
          <p className="blog-p blog-p--key"><span className="blog-hl">100B parameters outside HBM for less than 3% throughput loss</span> is the interesting number.</p>
          <p className="blog-p">But read the test before turning that into a law. The workload used 512 sequences with lengths sampled between 100 and 1024 tokens. That is a fat throughput workload with enough compute to hide transfers. It does not prove the same result at batch 1. It does not prove good p99 latency. It does not prove that multiple offloaded memory layers survive PCIe contention beside KV offload and everything else a production server does.</p>
          <p className="blog-p">The paper proves the mechanism can work. The serving problem is still open enough to be interesting.</p>
          <p className="blog-p">The quality result matters too. Engram-27B beats the matched MoE-27B while holding total parameter count and FLOPs fixed. MMLU improves by about 3 points. BBH by 5. ARC-Challenge by 3.7. HumanEval by 3. MATH by 2.4.</p>

          <Fig cap="matched budget comparison. same total parameters, same activated parameters, same FLOPs, same token count. source: Conditional Memory via Scalable Lookup, arxiv:2601.07372">
            <PaperFig src="/diagrams/paper/engram-table1.jpg" alt="Benchmark table comparing Dense, MoE, and Engram models" />
          </Fig>

          <p className="blog-p">So this is not just moving existing weights somewhere cheaper. The model gets a different kind of capacity. One correction matters here. Engram does not magically cut FLOPs in the matched experiment. The paper is explicitly iso-FLOPs. <span className="blog-hl">The claim is stronger when stated correctly. You can move some parameter capacity from conditional computation into conditional memory without paying proportional compute for it.</span></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">hbm is still the l1</h2>
          <p className="blog-p">This is where the DRAM replacement framing breaks. HBM does not disappear.</p>
          <p className="blog-p">The active transformer still needs absurd bandwidth. Attention still needs bandwidth. MoE experts need bandwidth when they fire. KV state can still dominate capacity at long context. The accelerator still wants its hot working set close enough that compute does not starve.</p>
          <p className="blog-p">Engram only works off device because its memory has 3 special properties. The access is sparse. The address is predictable early. The payload per token is small enough to hide behind useful compute. Remove any of those and host memory gets ugly fast.</p>

          <Fig cap="the useful abstraction is a hierarchy not a replacement. the architecture has to earn each slower tier. bandwidths are illustrative since GPU HBM, socket DRAM and the CPU to GPU link are different parts of the path.">
            <PaperFig src="/diagrams/engram-hierarchy.svg" alt="Memory hierarchy from HBM to host DRAM to CXL and SSD" />
          </Fig>

          <p className="blog-p blog-p--key">HBM is L1 for the model. Host DRAM is the next tier. CXL memory can become another capacity tier. SSD can hold the very cold tail if the software can predict requests early enough. <span className="blog-hl">The architecture has to earn the right to use the slower tier.</span> That is the inversion.</p>
          <p className="blog-p">Today we usually build the model first and ask the runtime how to fit it into memory later. The better direction is to train model state with a placement target from the beginning.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">china is not advantaged today</h2>
          <p className="blog-p">The China story is real but it needs to be stated carefully. China is not currently winning because it has some magic pool of cheap DRAM. It is getting squeezed harder on HBM.</p>
          <p className="blog-p">The US added specific HBM export controls in December 2024. <a href="https://www.reuters.com/world/asia-pacific/chinas-ai-chipmakers-raise-prices-high-bandwidth-memory-shortage-bites-2026-09-10/" target="_blank" rel="noopener">Reuters reported in September 2026</a> that Chinese AI chip vendors were raising accelerator prices as the HBM shortage hit. Huawei had raised pricing on an upcoming Ascend card by roughly 20% to 50% versus earlier quotes and Cambricon had raised its next generation chip by 20% to 30%. Grey market HBM into China was costing multiples of outside China pricing. That is a disadvantage today.</p>
          <p className="blog-p">The interesting asymmetry is incentive. If HBM is harder for you to buy then an architecture that converts 200 GB of accelerator-resident capacity into a few kilobytes of predictable host traffic per token is worth more to you than to somebody who can just add another HBM-rich GPU.</p>
          <p className="blog-p">China also has a growing domestic conventional DRAM producer in CXMT. <a href="https://www.reuters.com/world/asia-pacific/what-is-cxmt-how-did-it-become-chinas-dram-champion-2026-07-15/" target="_blank" rel="noopener">Reuters put CXMT at 7.7% of global DRAM in 2025</a>. It is still behind the leading vendors in advanced memory. <a href="https://www.reuters.com/world/asia-pacific/chinas-cxmt-makes-breakthrough-advanced-memory-chips-information-reports-2026-08-31/" target="_blank" rel="noopener">A separate Reuters report in August</a> said CXMT had started producing HBM3E only in small quantities with a larger ramp targeted for 2027.</p>
          <p className="blog-p">So the clean version of the thesis is not China has DRAM and the West has HBM. It is this. <span className="blog-hl">China has a stronger reason to make HBM capacity less important before its domestic HBM supply catches up.</span></p>
          <p className="blog-p blog-p--key">And the adoption pattern is hard to ignore. <a href="https://www.deepseek.com/en/news/deepseek-v4-1-flash/" target="_blank" rel="noopener">DeepSeek V4.1 Flash</a> carries about 196B Engram parameters outside its 552B backbone. <a href="https://github.com/meituan-longcat/LongCat-2.0" target="_blank" rel="noopener">Meituan LongCat 2.0</a> ships 135B of n-gram embedding parameters. <a href="https://github.com/QwenLM/Qwen3.8-Flash-Next" target="_blank" rel="noopener">Qwen3.8 Flash Next</a> adds 51B n-gram embedding parameters and explicitly describes host-memory offload with async prefetch. 3 separate Chinese model groups converged on the same broad primitive in months. That does not prove a coordinated strategy. It does tell you the architecture fits the constraint set.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">production is ahead of the paper</h2>
          <p className="blog-p">The original paper asked whether conditional memory works. That question is getting stale. The production models and the serving stacks are moving faster than the research now.</p>
          <p className="blog-p"><a href="https://github.com/vllm-project/vllm/blob/main/docs/features/engram.md" target="_blank" rel="noopener">vLLM has first-class Engram support</a>. For DeepSeek V4.1 it defaults to keeping the giant tables in pinned host memory and prefetching rows on a side CUDA stream. It can share host tables across colocated data-parallel replicas so every replica does not need its own 200 GB copy. That is already past the toy question of can I offload an embedding table.</p>
          <p className="blog-p">The open <a href="https://github.com/sgl-project/sglang/issues/38856" target="_blank" rel="noopener">SGLang work</a> is even more revealing. One current proposal splits sparse row lookup from the much larger projection so only the cheap irregular host fetch runs early. It also proposes a bounded GPU cache for hot Engram rows.</p>
          <p className="blog-p">The performance model in that issue says the thing out loud. <span className="blog-hl">The likely bottleneck is not average bulk bandwidth. It is sparse PCIe transaction latency and TLB behavior.</span> That is where the next layer of systems work starts.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">dont build another engram clone</h2>
          <p className="blog-p">If you want to do something useful do not spend 6 months retrofitting Engram into an old MoE just to prove the paper again. The <a href="https://github.com/deepseek-ai/Engram" target="_blank" rel="noopener">reference implementation</a> exists. Production checkpoints exist. vLLM has support. SGLang has active implementation work.</p>
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
          <p className="blog-p">Once the runtime knows a deadline it can schedule sparse fetches around compute instead of treating every transfer equally. It can prefetch earlier when PCIe is congested. It can drop speculative work when a deadline is impossible. It can choose between a hot HBM copy and host DRAM based on actual slack. This gets especially interesting once Engram fetches share the link with KV movement.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">make the table cacheable on purpose</h2>
          <p className="blog-p">Natural language n-grams are heavy tailed. Some rows will be insanely hot while most of the logical table is cold. So do not treat the table as 200 GB of equally important bytes.</p>
          <p className="blog-p">Measure production row traces. Keep hot rows in HBM. Cluster rows that co-occur into transfer sized pages. Tune page size around real DMA and TLB behavior instead of neural network aesthetics. Promote and demote rows with a policy that understands request mix.</p>
          <p className="blog-p">The paper itself points toward HBM plus DRAM plus NVMe caching. The interesting work is making that hierarchy real under tail-latency constraints.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">batch by memory locality</h2>
          <p className="blog-p">Inference schedulers already batch around token budgets and KV availability. For conditional memory there is another signal available before execution. The memory keys.</p>
          <p className="blog-p">If 20 requests need overlapping Engram rows then serving them near each other may increase GPU-cache hit rate and collapse host reads. You cannot destroy fairness or latency to chase locality. But there is probably a useful scheduling term here. Think cache-aware routing for model parameters rather than only KV prefixes.</p>
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
            <li><a href="https://github.com/vllm-project/vllm/blob/main/docs/features/engram.md" target="_blank" rel="noopener">vLLM Engram documentation</a></li>
            <li><a href="https://github.com/sgl-project/sglang/issues/38856" target="_blank" rel="noopener">SGLang batched async Engram host-row prefetch proposal</a></li>
            <li><a href="https://www.nvidia.com/en-in/data-center/h200/" target="_blank" rel="noopener">NVIDIA H200 specifications</a></li>
            <li><a href="https://www.amd.com/en/products/processors/server/epyc/9005-series/amd-epyc-9965.html" target="_blank" rel="noopener">AMD EPYC 9965 specifications</a></li>
            <li><a href="https://investors.micron.com/static-files/530bd7ed-a8c8-4687-af4a-8c129f740e09" target="_blank" rel="noopener">Micron HBM to DDR5 trade ratio</a></li>
            <li><a href="https://www.reuters.com/world/asia-pacific/samsung-electronics-says-hbm-account-nearly-30-industry-dram-capacity-next-year-2026-09-29/" target="_blank" rel="noopener">Samsung on HBM share of DRAM wafer capacity (Reuters, September 2026)</a></li>
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
