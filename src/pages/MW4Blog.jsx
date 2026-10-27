import { Fade, CodeBlock, Fig } from '../components/BlogPrimitives'

export default function MW4Blog() {
  return (
    <main className="main blog-main">
      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <h1 className="blog-title">patching COD MW4 to run on linux</h1>
            <img src="/mw4-linux-meme.png" alt="Gru's plan: install MW4 on Linux, use Proton and Wine, discover it still will not launch, then patch the binary yourself." className="blog-hero-img mw4-hero-img" />
            <p className="blog-p blog-p--key">tldr. I built <a href="https://github.com/PotatoSpudowski/mw4-linux">mw4-linux</a> to patch a supported Windows campaign build and launch it through Proton. <span className="blog-hl">I tested it in campaign gameplay on Bazzite.</span> Here is why it needs a patch, what changes and how to try it.</p>
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
          <h2 className="blog-section-tag">the missing piece was a windows dependency</h2>
          <p className="blog-p">A Windows executable contains instructions my Intel CPU already understands. But those instructions call into an operating system. Creating a thread, opening a file and allocating memory all need an implementation behind the call. Wine provides many of those implementations on Linux. Proton packages Wine with extra compatibility tools for games.</p>
          <p className="blog-p">A driver is a harder boundary. It expects Windows kernel interfaces, which a Linux kernel does not provide. Selecting a newer Proton version does not automatically make that driver work. And an offline campaign can still contain startup code that expects a driver device to exist.</p>
          <p className="blog-p">In this build, we could identify the exact request: <code>\??\Randgrid</code>. We could also identify the instructions and startup flags changed by the working repair. That gave us a specific target. We needed to change what this campaign asks for during startup, while leaving Wine to handle the rest.</p>
          <p className="blog-p">I used a coding agent over SSH to inspect the launcher, compare the binaries and turn the repair into source code. The useful part of that workflow was the feedback loop: make a small change, capture the runtime events and check the actual game window. A process existing in the task list was not enough.</p>
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
          <h2 className="blog-section-tag">why a pause and two breakpoints are enough</h2>
          <p className="blog-p">The pause solves a timing problem. Our helper is a separate Linux process. By the time it finds the game, the game has already started loading. Replacing one call in the DLL with a jump back to itself gives the helper time to attach before that path continues.</p>
          <p className="blog-p">While the game is stopped, the helper checks the original bytes at every patch location. Some edits change a conditional jump into an unconditional jump. Another makes a function return 1 immediately. These changes alter decisions made during startup. We have the exact byte changes, but not the original source names for every function.</p>
          <p className="blog-p">Two repairs need the live process state, so the helper places software breakpoints at two known locations inside the game. A breakpoint temporarily replaces an instruction byte with <code>INT3</code>. When the CPU reaches it, Linux stops that thread and gives our helper a chance to inspect its registers and memory.</p>
          <p className="blog-p">The first breakpoint is just before the device-open call. The helper follows the pointer to the device name, checks that it is exactly Randgrid and checks the buffer has enough room. It then writes the shorter NUL name and updates the arguments for <code>NtCreateFile</code>, the Windows function that opens the object.</p>
          <p className="blog-p">The second breakpoint handles a later startup checkpoint. It verifies the code edits, changes a CPU condition flag and sets two status bytes in the game. After both repairs have happened, the helper restores the breakpoint instructions and detaches. It does not need to stay attached throughout gameplay.</p>
          <p className="blog-p blog-p--key">The patch changes a small, known startup path. <span className="blog-hl">It does not translate the whole game or implement the missing driver.</span> That is why the exact build matters, and why this result does not imply multiplayer support.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">proton still needs the right environment</h2>
          <p className="blog-p">The startup repair is only one part of the launch. Our tested setup uses UMU to run GE-Proton11-9 outside Steam. A dedicated Wine prefix holds the Windows-side registry, files and settings. The portable setup also has its own HOME directory for Linux-side runtime data.</p>
          <p className="blog-p">That separation helps keep the test away from other games. It also explains why pointing a new Steam shortcut at the EXE can fail: the shortcut may use a different prefix, different graphics libraries and no startup helper.</p>
          <p className="blog-p">For graphics, the launcher selects two verified DLLs: <code>d3d12.dll</code> and <code>d3d12core.dll</code>. They provide the VKD3D implementation that turns Direct3D 12 calls into Vulkan. The DLL override tells Wine to try these files first.</p>
          <Fig cap="The launcher's graphics setting. n,b means native first, then builtin fallback.">
            <CodeBlock language="bash">{`WINEDLLOVERRIDES='d3d12,d3d12core=n,b'`}</CodeBlock>
          </Fig>
          <p className="blog-p">Those files differ from the copies bundled with the GE release we compared. We know they belong to the working setup; we have not yet proved that their exact build is required. The alpha therefore checks their hashes rather than quietly substituting another renderer. Reproducing them from source, or verifying an upstream replacement, is still on the list.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">what worked</h2>
          <p className="blog-p">I tested our patcher on a separate copy of the game, with the original helper removed. Both repairs fired, the patcher detached and the campaign menu rendered. I have since tested it in campaign gameplay too. Restoring the files also worked. Nine regression tests and a small live tracing test passed.</p>
          <p className="blog-p">The separate copy matters. On Btrfs, a reflink copy can share unchanged data with the original while keeping later writes separate. In that copy, I reversed the known DLL preparation bytes and removed the graphics overrides. Our installer then had to put the required changes back. The existing prefix and caches stayed in place, so this tested the patcher rather than a completely fresh installation.</p>
          <p className="blog-p">The small tests cover failures that are easy to miss in a successful game launch: a different executable, the wrong device name, a buffer that is too short, a damaged backup or a file changed by another tool. The live tracing fixture also checks that we can stop a process, handle a real breakpoint and detach without leaving it broken.</p>
          <Fig cap="Campaign menu reached by our patcher on the isolated Bazzite test copy.">
            <img src="/mw4-linux-menu.png" alt="MW4 campaign menu with Resume selected after the source patcher completed startup." style={{ display: 'block', width: '100%', height: 'auto' }} loading="lazy" />
          </Fig>
          <p className="blog-p">This is an alpha for one offline campaign build. The test reused a working Wine prefix and graphics libraries. A fresh setup, full campaign completion, broader controller support and macOS still need testing. The patch does not enable multiplayer or support an untouched retail installation.</p>
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
