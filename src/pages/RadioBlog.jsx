import { useState, useEffect, useRef } from 'react'
import { Highlight } from 'prism-react-renderer'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ============ SHARED COMPONENTS ============

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

function CodeBlock({ file, children, language = 'cpp' }) {
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

// ============ CHART DATA ============

const encOverhead = [
  { name: 'AES-128-CTR\n(HW accel)', time: 12 },
  { name: 'ChaCha20\n(software)', time: 27 },
  { name: 'AES-128-GCM\n(HW accel)', time: 65 },
]

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="blog-chart-tooltip">
      <div style={{ color: '#fff', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value} us</div>
      ))}
    </div>
  )
}

// ============ BLOG ============

export default function RadioBlog() {
  return (
    <main className="main blog-main">

      {/* hero */}
      <div className="blog-hero">
        <Fade>
          <h1 className="blog-title">building a secure radio link on two esp32s</h1>
        </Fade>
      </div>

      <div className="blog-body">

        {/* ====== 01 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the problem</h2>
          <p className="blog-p">most radio links send commands in plaintext. no encryption. someone within range with a $20 SDR can read every packet. they can inject fake commands. they can predict your frequency hopping pattern and follow you across the spectrum.</p>
          <p className="blog-p">i wanted to understand why and what it actually takes to fix it. not by reading about it. by building something. so i grabbed 2 ESP32 NodeMCU boards and started building a radio link from scratch over ESP-NOW. frequency hopping, encryption, key exchange, anti-replay, jam resistance. implement each one, test it, try to break it.</p>
          <p className="blog-p">this post is everything i learned about radio security by tinkering with $8 microcontrollers. all the code is <a href="https://github.com/PotatoSpudowski/esp32-radio-experiments" target="_blank" rel="noopener noreferrer">on github</a>.</p>
        </section>

        {/* ====== 02 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">frequency hopping</h2>
          <p className="blog-p">frequency hopping spread spectrum (FHSS) is the foundation of secure radio links. instead of transmitting on one frequency you jump between many frequencies in a pseudo-random pattern that both TX and RX know. a jammer sitting on one frequency only disrupts a fraction of your packets.</p>
          <p className="blog-p">my testbed uses ESP-NOW across 13 WiFi channels. TX sends 5 packets per channel (100ms dwell at 50Hz) then hops. both sides compute the same PRNG-seeded sequence so they hop in lockstep.</p>

          <Fig cap="FHSS hopping across 13 WiFi channels. TX sends 5 packets per dwell then hops. RX tracks via SYNC packets.">
            <img src="/diagrams/radio-fhss.svg" alt="FHSS channel hopping visualization" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <p className="blog-p">the hard part isnt generating the sequence. its keeping TX and RX synchronized. what happens when the RX misses packets and loses track of which channel the TX is on? TX periodically sends SYNC packets carrying the current hop index and slot phase. RX uses these to recalibrate its timer. if RX loses sync entirely it enters scan mode, dwells on each channel for 50ms until it hears the TX again.</p>
          <p className="blog-p">one thing i learned the hard way: hop on a timer, not on packet count. if you hop after N packets sent and one gets lost the TX and RX disagree on the count and desync. timer-based hopping means both sides hop at the same wall-clock cadence regardless of packet loss. sounds obvious. had to debug a desynced link at 2am to figure it out.</p>

          <CodeBlock file="src/main.cpp: timer-based hop sync on RX">
{`if (rx_sync_received) {
    rx_sync_received = false;
    fhss_idx = rx_pending_hop_idx % FHSS_SEQ_LEN;
    uint32_t remaining_ms = (FHSS_HOP_EVERY_N - rx_pending_slot_phase)
                            * LINK_INTERVAL_MS;
    rx_hop_timer_ms = now + remaining_ms - FHSS_HOP_INTERVAL_MS;
    request_channel_change(fhss_current_channel());
}`}
          </CodeBlock>

          <p className="blog-p">result: 0% loss at 50Hz without hopping. ~20% loss with FHSS enabled, concentrated at hop transitions where the channel switch costs a few ms. acceptable.</p>
        </section>

        {/* ====== 03 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">your PRNG is crackable</h2>
          <p className="blog-p">FHSS gives you jam resistance. it does not give you secrecy. if the hop sequence is predictable an attacker just follows you channel to channel and sees everything.</p>
          <p className="blog-p">most open source radio protocols use xorshift32 for their hop sequence. a simple PRNG with a 32-bit seed. i wrote an attack script to see how fast you can crack it: observe 4 consecutive hops, brute-force all 2^32 seeds, find the match. single CPU core: about 8 minutes. GPU: seconds. your "spread spectrum" is just theater.</p>

          <CodeBlock file="tools/attack_analysis.py: cracking the hop sequence" language="python">
{`def attack_predict_sequence():
    real_seed = 0xDEADBEEF
    real_seq = generate_hop_sequence(real_seed)
    observed = real_seq[:4]  # attacker sees 4 hops

    sample_size = 1_000_000
    start = time.time()
    for seed in range(sample_size):
        candidate = generate_hop_sequence(seed)
        if candidate[:4] == observed:
            print(f"FOUND seed: {seed}")

    seeds_per_sec = sample_size / (time.time() - start)
    total = (2**32) / seeds_per_sec
    print(f"Full search: {total/60:.1f} minutes")
    # ~8 minutes on single core. GPU: seconds.`}
          </CodeBlock>

          <p className="blog-p">the fix is straightforward. replace xorshift32 with AES-128 in ECB counter mode. encrypt sequential counter values with a 128-bit key. predicting the next hop now requires breaking AES-128. same concept, wildly different security.</p>

          <Fig cap="xorshift32 (cracked in 8 minutes) vs AES-CTR CSPRNG (cracked at heat death of the universe).">
            <img src="/diagrams/radio-csprng.svg" alt="PRNG comparison: xorshift32 vs AES-CTR" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock file="src/main.cpp: cryptographic PRNG for hop sequence">
{`// generate one pseudo-random byte from counter
static uint8_t fhss_csprng_byte(uint32_t counter) {
    uint8_t in[16] = {0}, out[16];
    in[0] = (counter >> 24) & 0xFF;
    in[1] = (counter >> 16) & 0xFF;
    in[2] = (counter >> 8) & 0xFF;
    in[3] = counter & 0xFF;
    mbedtls_aes_crypt_ecb(&fhss_aes_ctx,
                           MBEDTLS_AES_ENCRYPT, in, out);
    return out[0];
}`}
          </CodeBlock>
        </section>

        {/* ====== 04 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">encryption is free (and not enough)</h2>
          <p className="blog-p">i tested AES-128-CTR with the ESP32 hardware accelerator and ChaCha20 in pure software. AES: 12 microseconds per packet. ChaCha20: 27 microseconds. both completely negligible versus the 20ms packet interval. less than 0.13% overhead. the performance argument against encrypted radio links has always been bullshit.</p>

          <Fig>
            <div style={{ padding: '22px 14px 6px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={encOverhead} barGap={6} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} unit=" us" />
                  <Tooltip content={<CTooltip />} />
                  <Bar dataKey="time" name="per-packet overhead" fill="#79c0ff" opacity={0.6} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Fig>

          <p className="blog-p">but heres what took me a while to get. encryption alone doesnt cut it. AES-CTR gives you confidentiality (nobody can read your packets) but zero integrity. an attacker who knows the plaintext structure (and control packets are very predictable: fixed field order, known value ranges) can flip bits in the ciphertext and change values without knowing the key. thats called a bit-flipping attack and it works against any stream cipher in CTR mode.</p>
          <p className="blog-p">what you need is authenticated encryption. confidentiality (cant read it), integrity (cant modify it), authenticity (know who sent it). all in one pass. thats AES-GCM.</p>
        </section>

        {/* ====== 05 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">authenticated encryption in practice</h2>
          <p className="blog-p">AES-128-GCM is an AEAD cipher. it takes a key, a nonce, plaintext, and optionally "additional data" that gets authenticated but not encrypted. outputs ciphertext plus a tag that proves nobody tampered with anything.</p>
          <p className="blog-p">my packet has 3 sections. the header (12 bytes) is the AAD. authenticated so nobody can tamper with it but readable in the clear so the radio stack can see FHSS sync info without decrypting. the payload (8 bytes, 4 RC channels) gets encrypted. then an 8-byte GCM tag proves the whole thing is genuine.</p>

          <Fig cap="packet layout. header is readable but tamper-proof. payload is encrypted. tag proves integrity of both.">
            <img src="/diagrams/radio-packet.svg" alt="AEAD packet structure" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock file="src/main.cpp: AEAD encrypt in-place">
{`static bool aead_encrypt_data(data_packet_t *pkt) {
    if (!session_key_active) return false;
    uint8_t nonce[12];
    build_nonce(nonce, session_nonce_base,
                pkt->seq, pkt->hop_idx, 0x00);

    uint8_t *aad = (uint8_t *)pkt;
    size_t aad_len = offsetof(data_packet_t, rc_channels);
    uint8_t *plaintext = (uint8_t *)pkt->rc_channels;
    uint8_t full_tag[16];

    mbedtls_gcm_crypt_and_tag(
        &gcm_session_ctx, MBEDTLS_GCM_ENCRYPT,
        sizeof(pkt->rc_channels), nonce, 12,
        aad, aad_len,
        plaintext, plaintext,  // encrypt in-place
        16, full_tag);

    memcpy(pkt->tag, full_tag, 8); // truncate to 8 bytes
    return true;
}`}
          </CodeBlock>

          <p className="blog-p">the nonce is built from a random session base plus the packet sequence number. never repeats for the same key. thats critical because GCM breaks completely if you reuse a nonce. like, not "slightly weaker." fully broken.</p>
          <p className="blog-p">i truncate the tag to 8 bytes to save space. forgery probability 2^-64 per attempt. at 50 packets/sec an attacker needs ~5.8 billion years to land one. fine.</p>
        </section>

        {/* ====== 06 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">key exchange over lossy radio</h2>
          <p className="blog-p">encryption needs a key. and establishing one over a radio link that drops 10-20% of packets is different from TLS over TCP.</p>
          <p className="blog-p">both sides share a bind phrase. at boot they run PBKDF2-SHA256 with 10,000 iterations to derive a master key. takes ~1.1 seconds on the ESP32. slow enough to make brute-forcing expensive, fast enough for boot.</p>
          <p className="blog-p">TX generates a random session key with the hardware RNG, encrypts it with the master key using GCM, sends it as a KEY_OFFER. RX decrypts, verifies the tag, installs the key, sends back an authenticated KEY_ACK. 3 states: NONE, OFFERED, ACTIVE.</p>

          <Fig cap="key exchange. both sides derive master_key from bind phrase. TX generates session key, encrypts and sends. no data flows until both confirm.">
            <img src="/diagrams/radio-key-exchange.svg" alt="Key exchange handshake" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <p className="blog-p">the critical thing: the link is fail-closed. zero data packets until key exchange completes. if someone jams the key exchange the link stays dead instead of falling back to plaintext. this sounds obvious but its the kind of thing you only think about after you build the wrong version first.</p>
          <p className="blog-p">TX keeps offering at 100ms initially then 1/sec for late joiners. re-keys every 60 seconds. old keys explicitly zeroed.</p>
        </section>

        {/* ====== 07 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">anti-replay</h2>
          <p className="blog-p">this one surprised me. even with authenticated encryption an attacker can capture a valid packet and retransmit it later. the tag still verifies. they could capture any command and replay it whenever they want. crypto checks out but the command is stale. still bad.</p>
          <p className="blog-p">the fix is a sliding window bitmap. 64-bit integer. track the highest accepted seq, check incoming against the bitmap. duplicates rejected. old packets rejected. 20 lines of code.</p>

          <Fig cap="64-slot sliding window. green = accepted, empty = not yet seen, red = too old.">
            <img src="/diagrams/radio-replay.svg" alt="Anti-replay sliding window" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock file="src/main.cpp: anti-replay">
{`static uint32_t replay_window_top = 0;
static uint64_t replay_bitmap = 0;

static bool replay_check_and_accept(uint32_t seq) {
    if (seq == 0) return false;

    if (seq > replay_window_top) {
        uint32_t shift = seq - replay_window_top;
        if (shift >= 64) replay_bitmap = 0;
        else replay_bitmap <<= shift;
        replay_bitmap |= 1ULL;
        replay_window_top = seq;
        return true;
    }

    uint32_t age = replay_window_top - seq;
    if (age >= 64) return false;

    uint64_t mask = 1ULL << age;
    if (replay_bitmap & mask) return false;
    replay_bitmap |= mask;
    return true;
}`}
          </CodeBlock>

          <p className="blog-p">handles out-of-order delivery, rejects duplicates, rejects old packets. resets on re-key. i genuinely dont understand why this isnt standard in every radio protocol. its 20 lines and a uint64.</p>
        </section>

        {/* ====== 08 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">jam resistance</h2>
          <p className="blog-p">FHSS spreads you across channels. jammer on one channel only hits ~8% of packets. but smart jammers sweep multiple channels.</p>
          <p className="blog-p">my approach: track per-channel loss with exponential decay. channels exceeding 60% loss get blacklisted. both sides skip them. TX broadcasts the blacklist to RX every 5 seconds. max 6 blacklisted so at least 7 channels always remain.</p>
          <p className="blog-p">i built a jammer firmware for a 3rd ESP32. when i jam one channel the blacklist kicks in within 5 seconds and the link routes around it. sweep-jam 3 channels and the link degrades but stays alive on the remaining 10. watching it heal around a jammer is genuinely satisfying ngl.</p>
        </section>

        {/* ====== 09 ====== */}
        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">what i learned</h2>
          <p className="blog-p">encryption is free on modern microcontrollers. 12 microseconds for AES, 27 for ChaCha20, versus a 20ms packet interval. there is no performance reason for unencrypted radio links.</p>
          <p className="blog-p">encryption without authentication is almost as bad as no encryption. bit-flipping attacks on CTR mode are trivial if you know the plaintext structure. use AEAD (AES-GCM or ChaCha20-Poly1305). always.</p>
          <p className="blog-p">xorshift32 with a 32-bit seed is not security. its a speed bump. 8 minutes to crack on a laptop. if your FHSS uses a simple PRNG an attacker can predict your entire hop sequence from observing 4 hops.</p>
          <p className="blog-p">fail-open is a design bug. if your system falls back to plaintext when crypto fails an attacker just jams the handshake. fail-closed or nothing.</p>
          <p className="blog-p">anti-replay is 20 lines. no excuse for not having it.</p>
          <p className="blog-p">the gap between "i added encryption" and "this is actually secure" is fucking enormous. key derivation, key exchange, authenticated encryption, replay protection, failure modes. miss any one and the whole thing falls apart. build it, then try to break it. thats where you actually learn.</p>
          <p className="blog-p">all the code: <a href="https://github.com/PotatoSpudowski/esp32-radio-experiments" target="_blank" rel="noopener noreferrer">github.com/PotatoSpudowski/esp32-radio-experiments</a></p>
        </section>

      </div>
    </main>
  )
}
