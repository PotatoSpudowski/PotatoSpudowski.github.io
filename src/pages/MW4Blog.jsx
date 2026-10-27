import { Fade, CodeBlock, Fig } from '../components/BlogPrimitives'

export default function MW4Blog() {
  return (
    <main className="main blog-main">
      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <h1 className="blog-title">patching COD MW4 to run on linux</h1>
            <p className="blog-p blog-p--key">I built <a href="https://github.com/PotatoSpudowski/mw4-linux">mw4-linux</a> to patch a supported Windows campaign build and launch it through Proton. <span className="blog-hl">The patch reached the campaign menu on Bazzite.</span> Here is why it needs a patch, what changes and how to try it.</p>
            <img src="/mw4-linux-meme.png" alt="Gru's plan: install MW4 on Linux, use Proton and Wine, discover it still will not launch, then patch the binary yourself." className="blog-hero-img mw4-hero-img" />
          </div>
        </Fade>
      </div>

      <div className="blog-body">
        <section className="blog-section">
          <h2 className="blog-section-tag">i wanted a console, not another waiting list</h2>
          <p className="blog-p">I wanted my PC to feel like a console. Turn it on, pick up a controller, choose a game and play. So I installed <a href="https://bazzite.gg/">Bazzite</a>, a Fedora-based gaming OS with a SteamOS-style experience, on my RX 7900 XTX and i5-12400F machine. More on that setup in another blog.</p>
          <p className="blog-p">I really wanted to play MW4 this week. But the Windows-only campaign would not launch on my new Linux setup. I already wait for PS5 games to come to Windows. I did not want to wait again for Windows games to become playable on Linux. I wanted to find what was blocking this one and fix it.</p>
          <p className="blog-p">Proton got us most of the way. My CPU can execute the Windows machine code, but the game also needs Windows services and graphics APIs. Proton includes Wine to handle Windows APIs. VKD3D translates Direct3D 12 graphics calls into Vulkan.</p>
          <p className="blog-p">This campaign build still tried to open a Windows driver device called Randgrid. That startup path did not work in our Linux setup. The patch changes the device request and the checks around it so the campaign can continue.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what the patch does</h2>
          <Fig cap="The patch handles startup. Proton runs the game after it detaches.">
            <ol className="mw4-flow">
              <li><strong>Pause startup</strong><span>Wait for the patcher.</span></li>
              <li><strong>Apply the fix</strong><span>Repair the request and checks.</span></li>
              <li><strong>Continue</strong><span>Detach and let Proton run.</span></li>
            </ol>
          </Fig>
          <p className="blog-p">First, the installer changes five bytes in <code>rex_sp.dll</code> to create a small loop. The game waits there while the patcher attaches. Without this pause, startup could pass the code we need to change.</p>
          <p className="blog-p">Next, the patcher uses Linux <code>ptrace</code>—the interface debuggers use—to inspect and edit the running process. It makes ten checked edits to the game code. At the device-open call, it changes the exact Randgrid request to NUL, the Windows null device. At a second checkpoint, it adjusts the startup flags.</p>
          <p className="blog-p">Opening NUL does not recreate the driver. The surrounding code edits make that changed startup path usable. Once both repairs have run, the patcher removes its breakpoints and detaches.</p>
          <p className="blog-p">The offsets are specific to one build. That is why the tool checks file hashes before writing anything. A game update can put different code at the same address.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what worked</h2>
          <p className="blog-p">I tested our patcher on a separate copy of the game, with the original helper removed. Both repairs fired, the patcher detached and the campaign menu rendered. Restoring the files also worked. Nine regression tests and a small live tracing test passed.</p>
          <Fig cap="Campaign menu reached by our patcher on the isolated Bazzite test copy.">
            <img src="/mw4-linux-menu.png" alt="MW4 campaign menu with Resume selected after the source patcher completed startup." style={{ display: 'block', width: '100%', height: 'auto' }} loading="lazy" />
          </Fig>
          <p className="blog-p">This is an alpha for one offline campaign build. The test reused a working Wine prefix and graphics libraries. A fresh setup, full campaign, controller support and macOS still need testing. The patch does not enable multiplayer or support an untouched retail installation.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">try it</h2>
          <p className="blog-p">Start with a copy of your game and Wine prefix. The <a href="https://fitgirl-repacks.site/call-of-duty-modern-warfare-4/">Windows campaign download page</a> is here; use the tool's build check to confirm your installed files match. You also need Python 3.10+, UMU, GE-Proton11-9 and the graphics DLLs listed in the <a href="https://github.com/PotatoSpudowski/mw4-linux">README</a>. The patcher does not download those dependencies.</p>
          <Fig cap="Check the build, then install the patch. Replace the example paths with yours.">
            <CodeBlock language="bash">{`git clone https://github.com/PotatoSpudowski/mw4-linux.git
cd mw4-linux
python3 mw4.py doctor --game /path/to/game
python3 mw4.py install --game /path/to/game \\
  --graphics /path/to/verified-vkd3d-dlls`}</CodeBlock>
          </Fig>
          <p className="blog-p">Use the <a href="https://github.com/PotatoSpudowski/mw4-linux#launch">launch command in the README</a> to select your Proton installation and prefix. Launch through the patcher every time: the prepared DLL waits for it. For Steam, add that full command through a shell wrapper.</p>
          <p className="blog-p">To undo the file changes, close the game and run <code>python3 mw4.py restore --game /path/to/game</code>. The tool keeps backups and refuses to overwrite files changed since installation.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">code and details</h2>
          <p className="blog-p">The repair builds on community codpatch work, implemented here in Python. The repo keeps the <a href="https://github.com/PotatoSpudowski/mw4-linux/blob/main/research/mechanism.md">exact offsets and mechanism</a>, <a href="https://github.com/PotatoSpudowski/mw4-linux/blob/main/research/validation.md">test results</a> and <a href="https://github.com/PotatoSpudowski/mw4-linux">source</a>. Next is testing a fresh prefix and making the graphics dependencies easier to reproduce.</p>
        </section>
      </div>
    </main>
  )
}
