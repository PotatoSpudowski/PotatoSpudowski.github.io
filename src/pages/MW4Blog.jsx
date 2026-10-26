import { useState } from 'react'
import { Fade, CodeBlock, Fig } from '../components/BlogPrimitives'

const layers = [
  { name: 'the environment', component: 'UMU + GE-Proton11-9 + steamrt4', detail: 'Chooses the Wine prefix and runtime. Our launcher also sets a private HOME, so an existing runtime elsewhere on the machine does not necessarily satisfy this launch.', evidence: 'Observed: runtime archive hash and mtree validation passed, then UMU launched GE-Proton11-9.' },
  { name: 'the renderer', component: 'D3D12 → VKD3D-Proton → Vulkan', detail: 'The game calls Direct3D 12. VKD3D-Proton implements that interface over Vulkan. This package selects its own D3D12 DLLs instead of relying only on the ones shipped with GE.', evidence: 'Observed: override DLL hashes differ from the GE reference. The log reports VKD3D-Proton 3.1.0.' },
  { name: 'the startup repair', component: 'Rex execution gate + ptrace helper', detail: 'The prepared DLL waits at an execution gate. The helper applies build-specific changes, intercepts the Randgrid device request and releases the gate.', evidence: 'Tested: both game call-site repairs fired and the source helper detached before the campaign menu rendered.' },
  { name: 'the screen', component: 'game window → Gamescope → Steam', detail: 'Steam launches the working wrapper as a non-Steam entry. The wrapper selects the runtime and manages the startup helper while Gamescope handles the console display session.', evidence: 'New source helper: rendered campaign menu verified. Previous package: gameplay and cutscenes observed. Full campaign stability remains untested.' },
]

function CompatibilityLayers() {
  const [active, setActive] = useState(0)
  const layer = layers[active]
  return (
    <div className="mw4-layers">
      <div className="mw4-layer-buttons" role="group" aria-label="Explore the compatibility layers">
        {layers.map((item, i) => <button key={item.name} type="button" aria-pressed={active === i} onClick={() => setActive(i)}>{item.name}</button>)}
      </div>
      <div className="mw4-layer-detail" aria-live="polite">
        <h3>{layer.component}</h3>
        <p>{layer.detail}</p>
        <p className="mw4-layer-evidence">{layer.evidence}</p>
      </div>
    </div>
  )
}

export default function MW4Blog() {
  return (
    <main className="main blog-main">
      <div className="blog-hero blog-hero-split">
        <Fade>
          <div className="blog-hero-layout">
            <img src="/mw4-linux-menu.png" alt="Campaign menu reached by our source helper on the isolated Bazzite test copy" className="blog-hero-img mw4-hero-img" />
            <h1 className="blog-title">getting COD MW4 to run on linux</h1>
            <p className="blog-p">I wanted to install SteamOS on my PC and turn it into a Steam Machine. Boot into Steam, pick a game with a controller, play. I ended up using Bazzite on an RX 7900 XTX and an i5-12400F. More on that setup in another blog. This one is about getting the Call of Duty: Modern Warfare 4 campaign running, and the startup compatibility work that made it possible.</p>
          </div>
        </Fade>
      </div>

      <div className="blog-body">
        <section className="blog-section">
          <h2 className="blog-section-tag">what actually made it work</h2>
          <p className="blog-p">The Windows-oriented installation passed file verification but failed to start through the configurations we tried. The working Linux package changed the launch environment and the program itself. Understanding that second part requires looking below Proton, at the instructions executed during startup.</p>
          <p className="blog-p">The working setup uses GE-Proton11-9 through UMU, explicit D3D12 libraries and a Linux helper called <code>codpatch</code>. The helper changes the startup path. It prepares a DLL to wait for attachment, patches selected instructions in the loaded process and intercepts a request for the Randgrid device. That request is redirected to the Windows null device.</p>
          <p className="blog-p blog-p--key">The fix changes what the game requires during startup. <span className="blog-hl">It redirects the driver-device request and changes build-specific checks instead of making the Windows driver work natively on Linux.</span> Wine and VKD3D supply the execution and rendering environment around that modified path.</p>
          <p className="blog-p">I wanted a repair I could read, test and publish. Using a coding agent over SSH, I decoded the community helpers patch table, traced its call sites and implemented the Linux startup helper in Python. The <a href="https://github.com/PotatoSpudowski/mw4-linux">source repository</a> includes build detection, preparation, a runtime tracer, rollback and tests. Our helper reached the campaign menu with the reference helper removed from the test tree. Credit for the original repair belongs to its community authors; our contribution is the source implementation and the reproducible account below.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the cpu already speaks the language</h2>
          <p className="blog-p">A Windows executable is not just a bag of CPU instructions. It expects an operating system around it. Something has to load its DLLs, create its threads, implement its synchronization calls and answer its requests for files and memory. The CPU being able to execute an instruction doesnt mean the environment that instruction expects exists.</p>
          <p className="blog-p">My Intel CPU can execute the games x86-64 code directly. The missing piece is the Windows contract. Wine implements Windows interfaces on another operating system. Proton bundles Wine with additional compatibility components. For this games Direct3D 12 renderer, VKD3D-Proton translates the graphics work into Vulkan.</p>
          <p className="blog-p">There are already 2 different problems here. Making a Windows process behave correctly and making its graphics calls work. Then this package adds a third path: a helper that repairs startup behavior in the game process. Finally the rendered window has to appear through Gamescope and Steam.</p>
          <Fig cap="4 parts of our launch environment. Select a layer to see its job and what we actually observed. The startup helper is a separate path, not another graphics translation stage.">
            <CompatibilityLayers />
          </Fig>
          <p className="blog-p">The distinction matters because a graphics translation layer cannot supply a missing driver-device protocol. Changing renderer versions and repairing startup dependencies act on different parts of the program.</p>
          <p className="blog-p">Windows kernel drivers are another boundary entirely. Implementing Windows APIs in user space does not make an arbitrary Windows anti-cheat driver load into the Linux kernel. Getting this modified campaign to start doesnt establish multiplayer compatibility.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">read the launcher before changing the runtime</h2>
          <p className="blog-p">The most useful source file in the package was a shell script called <code>start</code>. It told us what the package actually expected. A specific Proton directory. A dedicated Wine prefix. UMU as the launcher. A game-specific <code>HOME</code>.</p>
          <p className="blog-p">That last one matters. A Wine prefix holds Windows-side state such as the registry and the emulated drive. Redirecting HOME also changes where Linux-side tooling looks for user caches and runtime data. Having already installed a runtime somewhere else on Bazzite did not mean this isolated environment could see it.</p>
          <p className="blog-p">The first launch log looked alarming if you stopped reading early. It reported a validation failure, then downloaded and verified the runtime it needed.</p>
          <Fig cap="game/state/runs/<run>/umu.log · excerpts from runtime setup">
            <CodeBlock language="text">{`CRITICAL: steamrt4 validation failed
INFO: Setting up Unified Launcher for Windows Games on Linux...
INFO: SteamLinuxRuntime_4.tar.xz: SHA256 is OK
INFO: steamrt4_platform_4.0.20261021.265997: mtree is OK
INFO: Running 'GE-Proton11-9-x86_64' using runtime 'steamrt4'`}</CodeBlock>
          </Fig>
          <p className="blog-p">The failure was followed by recovery. Killing the process because the log said CRITICAL would have interrupted the setup that was fixing it.</p>
          <p className="blog-p"><a href="https://github.com/Open-Wine-Components/umu-launcher">UMU</a> runs Proton with the Steam Linux Runtime outside the usual Steam launch path. That let us start the game over SSH in a controlled environment. The working run used UMU 1.4.4 and GE-Proton11-9. The isolation made the setup more predictable, but it also meant extra runtime provisioning and caches. It was not a security sandbox.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">same proton. different renderer.</h2>
          <p className="blog-p">The launcher also verifies 2 graphics libraries and places them beside the game executable. <code>d3d12.dll</code> and <code>d3d12core.dll</code>. Then it changes Wines DLL selection order.</p>
          <Fig cap="start · DLL selection used by the supplied launcher">
            <CodeBlock language="bash">{`WINEDLLOVERRIDES='d3d12,d3d12core=n,b'`}</CodeBlock>
          </Fig>
          <p className="blog-p">The <code>n</code> selects the native Windows DLL path first. The <code>b</code> allows the builtin fallback. Native here describes how Wine loads the DLL. It does not mean the library contains Microsofts implementation or that the game has become a native Linux application. A compatibility library can occupy that slot.</p>
          <p className="blog-p blog-p--key">2 people can select GE-Proton11-9 and still run <span className="blog-hl">different graphics implementations</span>. “Which Proton version?” is a useful question. “Which DLL actually loaded?” is the next one.</p>
          <p className="blog-p">We compared files against an official GE-Proton11-9 archive. The packaged 64-bit <code>ntdll.dll</code> matched the reference byte for byte. The game-specific D3D12 overrides did not match GEs bundled VKD3D-Proton libraries. That moves the investigation away from “the whole Proton build is custom” and toward the components the launcher deliberately replaces.</p>
          <p className="blog-p">The runtime reported VKD3D-Proton 3.1.0 with build <code>0bb64c56c8f0dcc+</code>. The corresponding upstream commit updates the DXIL-to-SPIR-V submodule. We dont have a reproducible source comparison for these particular DLLs. Different bytes could mean a different revision, compiler, configuration or patch. The evidence establishes a different renderer build. It doesnt establish a secret MW4-specific graphics fix.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">preparing the dll creates an attachment window</h2>
          <p className="blog-p">The launcher does not use the original Windows batch file to start a driver service. It explicitly refuses to continue if a Randgrid process is running. It launches <code>sp26-cod.exe</code> directly through UMU, waits for <code>rex_sp.dll</code> to appear in the process mappings, then attaches the Linux helper.</p>
          <p className="blog-p">That creates a timing problem. The game is already executing before the external helper attaches. How do you prevent it from passing the point that needs repair?</p>
          <p className="blog-p">The preparation patch supplies an answer. At file offset <code>0x43db</code> in the recognized Rex DLL, a 5-byte call is replaced with a short jump to itself and 3 no-ops. I read the installed file and confirmed those replacement bytes. Its PE section table maps that file offset to relative virtual address <code>0x4fdb</code>. The runtime patch table targets that same location and replaces the loop with no-ops.</p>
          <Fig cap="codpatch decoded records and installed rex_sp.dll · file offset and RVA refer to the same code location in this build">
            <CodeBlock language="text">{`On disk, file offset 0x43db:
  call instruction → jump to self + padding

After loading, module RVA 0x4fdb:
  jump to self → no-ops

Result: startup can wait at the prepared point
        until the runtime helper releases it.`}</CodeBlock>
          </Fig>
          <p className="blog-p">This is an execution gate. The external helper gets a window in which to inspect and modify the loaded program before allowing that path to proceed. It also explains why launching the prepared executable without its wrapper can be a bad test: you can leave it waiting at a gate that nobody opens. A spinning thread could consume CPU without advancing startup. That is a consequence of these instructions, not a diagnosis of every black screen we encountered.</p>
          <p className="blog-p">The launcher preserves an original DLL when it performs preparation itself. Our installed copy was already prepared and had no corresponding backup in the launchers state directory. The bytes in the file establish its current state more directly than the absence of a log message.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">intercepting the driver-device request</h2>
          <p className="blog-p">The helper is a stripped, statically linked Linux ELF executable. Its patch data is stored separately from the visible diagnostic strings. I reconstructed the decoder from the disassembly and decoded that data in Python, without executing the helper or changing the game. The result has a <code>CPW1</code> header and 32 typed records. Those records name the game executable, Rex, <code>ntdll.dll</code> and the exported function <code>NtCreateFile</code>.</p>
          <p className="blog-p"><code>NtCreateFile</code> is lower-level than its name suggests. On Windows, opening an object can mean obtaining a handle to a device, not just a normal disk file. The decoded records contain an exact source device name and a replacement name.</p>
          <Fig cap="codpatch embedded data · decoded UTF-16 names used by the interception handler">
            <CodeBlock language="text">{String.raw`call-site RVA:  0x0b58c7c6 in the game image
resolved callee: ntdll.dll!NtCreateFile
matched name:   \??\Randgrid
replacement:    \??\NUL`}</CodeBlock>
          </Fig>
          <p className="blog-p">The breakpoint sits inside the games caller, not on NtCreateFile. Its handler depends on this callers stack frame. RBP + 0x3e0 contains OBJECT_ATTRIBUTES; the ObjectName member at offset 16 points to a UNICODE_STRING. The helper checks its length, buffer capacity and exact UTF-16 contents before rewriting the name. RCX receives the handle-output slot, RDX the access mask, R8 the OBJECT_ATTRIBUTES address and R9 the I/O status slot. RAX receives the resolved NtCreateFile address. These are concrete Windows x64 call arguments, not a generic redirection of every file open.</p>
          <p className="blog-p blog-p--key">That is a concrete dependency substitution. <span className="blog-hl">The process asks to open Randgrid; the compatibility helper changes the request to NUL.</span> Opening NUL does not implement Randgrids driver protocol. The surrounding startup checks must also be accounted for.</p>
          <p className="blog-p">This is why the launchers refusal to coexist with Randgrid matters. The working path is deliberately arranged around the process-level repair. It is not the Windows service launcher with a different graphics setting.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">changing the checks around that request</h2>
          <p className="blog-p">The decoded table contains 10 records targeting the game image, alongside the Rex preparation and release records. Several have recognizable instruction-level effects. A conditional jump becomes an unconditional jump. Another conditional jump is removed. One function entry becomes <code>mov eax, 1; ret</code>. Another change replaces a zeroing instruction with one that places 1 in the low byte of the register.</p>
          <p className="blog-p">These edits change decisions and return values. The function returning 1 no longer executes its original body on that entry path. The removed branch no longer diverts control to its previous target. Together with the device-name interception, these are substantive changes to the startup contract, not performance tweaks.</p>
          <p className="blog-p">The decoded records do not include source-level function names for those game offsets. Calling every one an “anti-cheat check” would overstate what we recovered. What we can establish is that the setup redirects the Randgrid open and alters surrounding build-specific control flow. Mapping every changed branch to its full game-level purpose would require further analysis of those functions.</p>
          <p className="blog-p">The patch records pair expected bytes with replacements. The launcher also accepts only recognized Rex states and pins the supplied graphics DLL hashes. These checks matter because a relative address belongs to a particular binary layout. A game update can move a function or change what its return value means. A working patch for one build is not a portable recipe for another.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">why the linux helper stays alive</h2>
          <p className="blog-p">The helper does not simply copy files and exit. Its runtime code uses Linux <code>ptrace</code> to control the games threads. The disassembly identifies the x86-64 ptrace syscall, register reads and writes, continuation and single-step requests. Its trap setup saves an original instruction byte and writes <code>0xcc</code>, the x86 INT3 breakpoint instruction.</p>
          <p className="blog-p">When execution reaches a breakpoint, the traced thread stops and the helper can inspect its state. The event loop handles the stop, restores the original byte, adjusts registers or memory as needed and resumes the thread. The code also has a single-step and re-arm path, plus handling for newly cloned threads. This is how an external Linux process can intervene at selected points inside a Windows process running through Wine.</p>
          <Fig cap="codpatch · reconstructed runtime structure from static disassembly, not executable patch code">
            <CodeBlock language="text">{`locate loaded modules and the target export
validate expected instruction bytes
apply the configured runtime changes
install software breakpoints
resume traced threads

on a breakpoint stop:
  read registers and relevant process memory
  perform the matched repair
  restore / single-step / re-arm as required
  resume execution`}</CodeBlock>
          </Fig>
          <p className="blog-p">That mechanism explains the launchers ptrace-policy check, its wait for the Rex module mapping and its management of a separate helper PID. It also explains why copying the game directory into a fresh Proton shortcut is insufficient. The wrapper is part of execution. Skipping it skips both the selected environment and the runtime intervention.</p>
          <p className="blog-p">The source implementation records each repair separately. Our isolated test observed both handlers and a successful detach, then captured the rendered campaign menu. The second breakpoint, game RVA 0x0b5a7163, verifies the patched instructions, clears the zero flag and writes two build-specific startup flags. Once both repairs complete, the helper removes its breakpoints and detaches the threads. The game continues without the tracer attached.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">where the graphics libraries fit</h2>
          <p className="blog-p">The startup helper removes or changes specific requirements on the way into the campaign. The graphics translator still has to implement the rendering workload once execution reaches it. This is why the device repair and D3D12 overrides can coexist without being the same fix.</p>
          <p className="blog-p">The override libraries are part of our verified working configuration. Their bytes differ from the GE reference. We have not isolated whether the exact override builds are necessary by replacing them while keeping the startup repairs fixed. That is a bounded question we can test. It does not undermine the directly recovered device redirection, execution gate or branch patches.</p>
          <p className="blog-p">The resulting launch path is now specific: select the isolated runtime, load the chosen D3D12 implementation, start the prepared executable, attach the helper, apply the recognized repairs and release the startup gate. Steam launches that wrapper. It does not replace it.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">turning the mechanism into a tool</h2>
          <p className="blog-p">The first alpha is <a href="https://github.com/PotatoSpudowski/mw4-linux">mw4-linux</a>. It uses Python standard-library bindings to Linux ptrace. Full executable and Rex hashes pin the patch to a known layout. Installation backs up affected files and records their before/after hashes; restore refuses to overwrite files modified afterward.</p>
          <p className="blog-p">I tested it on a Btrfs reflink copy of the working offline campaign package. In that copy, I reversed the known Rex preparation bytes, removed the graphics overrides and moved codpatch out of the tree. Our installer then prepared the files and our tracer launched them. The prefix, caches and saves came from the working setup. This isolates the helper replacement; it is not a clean retail or fresh-prefix test.</p>
          <Fig cap="Source helper run · both repairs observed, followed by detach">
            <CodeBlock language="json">{`{"event":"ready","patches":10,"threads":1}
{"event":"device_redirected","source":"Randgrid","target":"NUL"}
{"event":"startup_checkpoint_repaired"}
{"event":"detached","result":"both startup repairs observed"}`}</CodeBlock>
          </Fig>
          <p className="blog-p">Nine regression tests cover argument layout, exact-name matching, buffer capacity, input rejection and rollback protection. A Linux fixture tests a real breakpoint, instruction-pointer repair and clean detach against our own child process. The first game test failed because the device breakpoint targeted the export instead of its caller. Correcting that mistake produced the two repair events and the menu. Implementing the mechanism exposed an error that static inspection had missed.</p>
          <p className="blog-p blog-p--key"><span className="blog-hl">The alpha supports one fingerprinted offline campaign build.</span> It does not convert an arbitrary retail installation, ship game files or implement multiplayer compatibility. The verified graphics DLLs and a working UMU/Proton environment are external prerequisites. The repository records their exact fingerprints.</p>
          <p className="blog-p">For the supported installation, make separate game and prefix copies, close MW4 and point the tool at the directory containing sp26. Doctor reads files only. Install checks all inputs before modifying the copy.</p>
          <Fig cap="Quick start · substitute your own absolute paths and existing launch argument">
            <CodeBlock language="bash">{`git clone https://github.com/PotatoSpudowski/mw4-linux.git
cd mw4-linux
python3 mw4.py doctor --game /path/to/test-game
python3 mw4.py install --game /path/to/test-game \\
  --graphics /path/to/verified-vkd3d-dlls
python3 mw4.py launch --game /path/to/test-game \\
  --umu /path/to/umu-run --proton /path/to/GE-Proton11-9 \\
  --prefix /path/to/dedicated-test-prefix \\
  --game-argument 'ARGUMENT_FROM_YOUR_EXISTING_LAUNCHER'`}</CodeBlock>
          </Fig>
          <p className="blog-p">Portable installations may also need --home to select their existing UMU runtime location. After closing the game, <code>python3 mw4.py restore --game /path/to/test-game</code> restores its pre-install files. Steam must launch the complete Linux wrapper, not the prepared EXE: the gate needs the helper on every run.</p>
          <p className="blog-p">The replacement has reached the menu. Repeated launches, its controller path and full campaign testing remain work. The previous package rendered gameplay and cutscenes, but that does not certify replacement code. Next are repeated startup tests, a fresh prefix and an experiment replacing the pinned graphics DLLs with a reproducible upstream build while keeping the startup repair fixed.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">could the same approach work on mac</h2>
          <p className="blog-p">There is a separate <a href="https://github.com/mac-fixer/cod-mw4-fix">macOS startup kit</a> with source. It takes a different route. Its provider supplies selected missing interfaces inside Wines <code>winedevice.exe</code> driver host, with guards for specific host, driver and stub layouts. That is a user-space compatibility implementation, not loading a Windows driver into the macOS kernel.</p>
          <p className="blog-p">The provider includes process and processor compatibility work. Its Code Integrity validation function still returns <code>STATUS_NOT_IMPLEMENTED</code>, so even its name should not be read as a complete Windows integrity implementation. The authors report controlled startup tests requiring the provider, Rex repair, dispatcher repair and clock repair on their tested build. Those are their findings, not experiments repeated on my Mac.</p>
          <p className="blog-p">The Linux path we inspected redirects the device request and modifies the running process. The Mac project supplies part of the driver-host environment as well as binary repairs. A shared installer could manage build detection, backups and rollback, but these mechanisms need separate implementations and tests. Sharing a Wine foundation does not make a Linux ptrace helper portable to macOS.</p>
          <p className="blog-p">For my Steam Machine, the practical result is a campaign running through a repaired startup path and a selected graphics stack. The technically interesting result is narrower and more useful: we can now point to the execution gate, the device request and the control-flow edits that distinguish this launch from simply running the EXE under Proton.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">references</h2>
          <ul className="blog-refs">
            <li><a href="https://github.com/PotatoSpudowski/mw4-linux">Source implementation, installation guide and validation record</a></li>
            <li><a href="/research/mw4-findings.txt">Local binary findings — inspected helper hash, decoded records and disassembly locations</a></li>
            <li><a href="/research/mw4-decode.py">Read-only Python decoder for the inspected helper build</a></li>
            <li><a href="https://github.com/torvalds/linux/blob/master/arch/x86/include/uapi/asm/ptrace-abi.h">Linux x86 ptrace ABI — register operation definitions</a></li>
            <li><a href="https://github.com/mac-fixer/cod-mw4-fix/blob/d9a1a63feacdb765524db1f5ce1f76de03a406ba/MW4-Startup-Kit/source/provider/README.md">Mac startup provider — scope and implementation limits</a></li>
            <li><a href="https://github.com/Open-Wine-Components/umu-launcher">UMU launcher — Proton and Steam Linux Runtime outside Steam</a></li>
            <li><a href="https://github.com/HansKristian-Work/vkd3d-proton">VKD3D-Proton — Direct3D 12 over Vulkan</a></li>
            <li><a href="https://github.com/HansKristian-Work/vkd3d-proton/commit/0bb64c56c8f0dcc">VKD3D-Proton commit reported by our runtime</a></li>
            <li><a href="https://github.com/mac-fixer/cod-mw4-fix/blob/main/MW4-Startup-Kit/VERIFICATION.md">macOS startup kit — author-reported verification, not tested here</a></li>
          </ul>
        </section>
      </div>
    </main>
  )
}
