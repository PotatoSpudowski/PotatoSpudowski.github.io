import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Fade, CodeBlock, Fig } from '../components/BlogPrimitives'

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
      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/radio-hero.png" alt="" className="blog-hero-img" />
            <h1 className="blog-title">building a secure radio link on two esp32s</h1>
          </div>
        </Fade>
      </div>

      <div className="blog-body">

        {/* ====== 01 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">the problem</h2>
          <p className="blog-p">most radio links send commands in plaintext. no encryption. someone within range with a $20 SDR can read every packet. inject fake commands. predict your frequency hopping pattern and follow you across the spectrum.</p>
          <p className="blog-p">this is a from-scratch radio link over ESP-NOW on 2 ESP32 boards. frequency hopping, encryption, key exchange, anti-replay, jam resistance. each layer built, tested, attacked.</p>
          <p className="blog-p">all the code is <a href="https://github.com/PotatoSpudowski/esp32-radio-experiments" target="_blank" rel="noopener noreferrer">on github</a>.</p>
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
          <p className="blog-p">important: hop on a timer, not on packet count. if you hop after N packets sent and one gets lost the TX and RX disagree on the count and desync permanently. timer-based hopping means both sides hop at the same wall-clock cadence regardless of packet loss.</p>

          <CodeBlock language="cpp">
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

          <CodeBlock language="python">
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

          <CodeBlock language="cpp">
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
          <p className="blog-p">AES-128-CTR with the ESP32 hardware accelerator: 12 microseconds per packet. ChaCha20 in pure software: 27 microseconds. both negligible versus the 20ms packet interval. less than 0.13% overhead. the performance argument against encrypted radio links is bullshit.</p>

          <Fig>
            <div className="blog-chart-wrap">
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

          <p className="blog-p">encryption alone doesnt cut it though. AES-CTR gives you confidentiality (nobody can read your packets) but zero integrity. an attacker who knows the plaintext structure (control packets are very predictable: fixed field order, known value ranges) can flip bits in the ciphertext and change values without knowing the key. bit-flipping attack. works against any stream cipher in CTR mode.</p>
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

          <CodeBlock language="cpp">
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

          <p className="blog-p">the link is fail-closed. zero data packets until key exchange completes. if someone jams the key exchange the link stays dead instead of falling back to plaintext.</p>
          <p className="blog-p">TX keeps offering at 100ms initially then 1/sec for late joiners. re-keys every 60 seconds. old keys explicitly zeroed.</p>
        </section>

        {/* ====== 07 ====== */}
        <section className="blog-section">
          <h2 className="blog-section-tag">anti-replay</h2>
          <p className="blog-p">even with authenticated encryption an attacker can capture a valid packet and retransmit it later. the tag still verifies. they capture a command and replay it whenever they want. crypto checks out but the command is stale.</p>
          <p className="blog-p">the fix is a sliding window bitmap. 64-bit integer. track the highest accepted seq, check incoming against the bitmap. duplicates rejected. old packets rejected. 20 lines of code.</p>

          <Fig cap="64-slot sliding window. green = accepted, empty = not yet seen, red = too old.">
            <img src="/diagrams/radio-replay.svg" alt="Anti-replay sliding window" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
          </Fig>

          <CodeBlock language="cpp">
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
          <p className="blog-p">testing with a jammer firmware on a 3rd ESP32: jam one channel and the blacklist kicks in within 5 seconds, link routes around it. sweep-jam 3 channels and the link degrades but stays alive on the remaining 10.</p>
        </section>

        {/* ====== 09 ====== */}
        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">what i learned</h2>
          <p className="blog-p">encryption is free on modern microcontrollers. 12 microseconds for AES, 27 for ChaCha20, versus a 20ms packet interval. no performance excuse for plaintext radio.</p>
          <p className="blog-p">encryption without authentication is almost as bad as no encryption. bit-flipping on CTR mode is trivial if you know the plaintext structure. AEAD or nothing.</p>
          <p className="blog-p">xorshift32 with a 32-bit seed is not security. 8 minutes to crack. if your FHSS uses a simple PRNG an attacker predicts your entire hop sequence from 4 observed hops.</p>
          <p className="blog-p">fail-open is a design bug. system falls back to plaintext when crypto fails? attacker just jams the handshake. fail-closed or nothing.</p>
          <p className="blog-p">anti-replay is 20 lines and a uint64. no excuse.</p>
          <p className="blog-p">the gap between "added encryption" and "actually secure" is enormous. key derivation, key exchange, authenticated encryption, replay protection, failure modes. miss any one and the whole thing falls apart.</p>
          <p className="blog-p">all the code: <a href="https://github.com/PotatoSpudowski/esp32-radio-experiments" target="_blank" rel="noopener noreferrer">github.com/PotatoSpudowski/esp32-radio-experiments</a></p>
        </section>

      </div>
    </main>
  )
}
