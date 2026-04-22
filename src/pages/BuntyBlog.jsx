import { useRef, useState, useEffect } from 'react'

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

export default function BuntyBlog() {
  return (
    <main className="main blog-main">
      <div className="blog-hero">
        <Fade>
          <h1 className="blog-title">hi bunty. yes life is still unfair.</h1>
        </Fade>
      </div>

      <div className="blog-body">

        <section className="blog-section">
          <p className="blog-p">you wrote this for the nights when you forget who you are. this is one of those nights.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">you already knew this</h2>
          <p className="blog-p">life was always unfair. youve known since 16. nothing this week changed the math. the world didnt get harder. you just ran into another wall that was always going to be there. and for a minute you forgot the walls were the whole fucking point.</p>
          <p className="blog-p">the credential filter was never going to let you through. the network filter was never going to let you through. the pattern-match that rewards people who look like the last winner was never going to let you through. none of that is new. the people who got the easy path didnt work harder. they started closer to the finish line. and they will spend their entire lives telling themselves they earned it because admitting they were handed it would require a kind of honesty most of them dont have.</p>
          <p className="blog-p">thats elitism. thats credentialism. thats the system telling you youre not good enough for things youre already better at than the people saying it.</p>
          <p className="blog-p">heres the part you keep forgetting when youre tired. its not going to get better. its going to get worse.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the exercise</h2>
          <p className="blog-p">third person. pretend youve never met this guy. just read the record.</p>
          <p className="blog-p">building RC planes in 8th grade. arduino and circuits in 9th. radio wave energy harvesting in 10th, Times of India feature. watching karpathys CS231n on a laptop in india at 16, doing the assignments, training models before most of his future "peers" had heard the word backprop. wrote a CNN in PyTorch in 12th grade to detect glaucoma from retinal images. presented it at IISc Open Day as a high schooler who wasnt even enrolled there. made 5 figures USD freelancing on Topcoder during his second year of college. petroleum, insurance, finance clients. EOL prediction and hydroflushing cycle optimization pipelines for oil and gas wells. IBM Research intern before graduating. papers at AAAI workshops, ACM SIGKDD, Complex Networks.</p>
          <p className="blog-p">IBM Call for Code global semifinalist out of 180,000 developers. Microsoft Imagine Cup national finalist. NeurIPS submission on Facebook AIs Hateful Memes challenge. IBM Research again after graduating, multimodal information retrieval, text and images together. shipped an NER MVP at a legal AI startup that helped them land customers and raise pre-seed. first MLOps hire at a company serving millions daily. kept production infra running through every 3am incident for nearly 3 years. twice at Entrepreneurs First. shipped a public project that hit 50,000 views and 400+ upvotes in the first day. already being tested by operators in a live war zone.</p>
          <p className="blog-p">tier-3 college. no tag. no network. no safety net.</p>
          <p className="blog-p">be honest. if that record crossed your desk would you doubt this person for a second?</p>
          <p className="blog-p">you wouldnt. youd be embarrassed to.</p>
          <p className="blog-p">so when someone doubts it. an HR filtering by college name. a VC pattern-matching by tag. a peer doing theatre while youre shipping. understand clearly whats happening. they are either not talented enough to recognize talent or they are actively choosing to ignore it because acknowledging it would break their cookie-cutter worldview where the right schools produce the right people and the rest of us are supposed to stay in our lane.</p>
          <p className="blog-p">thats not your failure. thats their limitation. dont you dare internalize their limitation as your ceiling.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the part that stings</h2>
          <p className="blog-p">youre going to bust your ass and accomplish more than everyone around you and it wont mean a fucking thing. they will still look down on you. youll outship them, outwork them, outthink them and theyll still talk about you like youre the one who got lucky. the more you achieve the more people will look down on you. the more you prove them wrong the more they will hate you for it. they will make it harder, not easier, the further you go.</p>
          <p className="blog-p">you think the credential filter is bad now? wait until youve hit milestones that most credentialed kids cant even spell and they still dismiss it. wait until youve shipped things that actually work in the real world and they still ask where you went to school before they ask what you built. wait until the work speaks for itself and they still cant hear it because hearing it would mean admitting they were wrong about people like you their whole lives. most people would rather keep being wrong than face the arithmetic of their own bias.</p>
          <p className="blog-p">this isnt going to stop. the higher you go the colder the air gets. the better you get the more sophisticated the rejection becomes. at some point it stops being "you dont have the credentials" and becomes "you dont have the polish" or "you dont have the network" or "you dont have the it factor" or whatever new vocabulary they invent to describe the fact that you werent born into their club. there is no altitude at which elitism runs out of excuses. they will always find a new one. thats the job.</p>
          <p className="blog-p">the people around you who fold early. the ones who quit after 1 hard year. the ones who write retrospective posts about how the system is rigged. the ones who retreat to safe jobs and call it wisdom. theyre not wrong that the system is rigged. theyre just wrong about what to do about it. they think the right response is to stop. the actual right response is to keep going because the rigged system punishes stopping more than it punishes trying. the only people who ever break through are the ones who refused to interpret unfairness as a stop signal.</p>
          <p className="blog-p">you know this. youve always known this. dont forget it now just because youre tired.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the voice</h2>
          <p className="blog-p">the voice in your head that says youre not good enough. that voice is not evaluating your track record. its echoing environments you survived. HRs. VCs. peers with tags and no substance. advisors who never built anything. founders doing theatre. none of them were qualified to assess you. they were just loud. and they are still loud in your head sometimes.</p>
          <p className="blog-p">they are wrong. the evidence is on the record. read it again when you doubt yourself. that record didnt happen by accident. it happened because youve been building continuously since middle school and because you refused every exit the system offered you along the way. stay in your tier-3 lane. accept the dead-end job. take the easy money. trim your ambition to match your credentials. you said no every single time. every time you said no you added another brick to the foundation that the voice in your head is trying to convince you isnt there.</p>
          <p className="blog-p">its there. you built it. stand on it.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">nobody is coming</h2>
          <p className="blog-p">nobody is coming to save you. you knew this at 16. you know it now. youll know it at 40. theres no mentor, no investor, no Lois waiting in the next chapter to tell you youre going to be great and then insist on it until you believe her.</p>
          <p className="blog-p">if you want that voice you have to be that voice.</p>
          <p className="blog-p">hold your own bar. call your own bluff when youre pretending you dont want what you actually want. refuse the easy path even when its right there and nobody would blame you for taking it. look yourself in the eye and refuse to let yourself off the hook.</p>
          <p className="blog-p">thats harder than having someone do it for you. its also the only thing that actually works for people like us. the voice you build inside yourself from years of watching yourself clear bars that werent supposed to be clearable. that voice doesnt leave. its built on evidence. the evidence is already there. you just forget sometimes.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">when youre tired</h2>
          <p className="blog-p">you are a gifted kid who beat odds. you will continue to beat odds. not because it gets easier. it doesnt. it gets harder and colder and more isolating and the people around you will keep inventing new reasons to diminish what youre doing. thats the price of the path you chose at 16 when you decided you werent going to accept the ceiling the world wanted to give you.</p>
          <p className="blog-p">you chose this. every bar you cleared you chose to clear. every easy exit you refused you chose to refuse. the suffering isnt something thats happening to you. its the material of the thing youre building. the heart-bigger part. the eye-opening part. the part where you finally stop caring about proving youre the smartest person in the room. all of that comes from exactly this kind of night. the tiredness is the ingredient. dont waste it by giving up.</p>
          <p className="blog-p">heres whats actually happening. the expectations you set for yourself kept going up. every year. every project. every time you cleared a bar you moved it higher. and now youve moved it so high that youre playing in territory where the rules arent fair. where the people around you had head starts you will never have. and yes thats going to feel like shit. its supposed to. thats the price of refusing to stay small. you dont get to set the bar that high and also have it be easy. life doesnt work like that for people like you. its going to be harder than it is for everyone else. its going to be harder than it is for everyone around you. and at some point youre going to look around and realize that everyone has it better than you. and youre going to have to be ok with that.</p>
          <p className="blog-p">the only way to win from here is irrefutable proof. not credentials. not connections. not polish. proof. work so undeniable they cant look away. and the good news, the thing you keep forgetting when youre in the middle of a bad night, is that when you zoom out thats exactly what youve been generating since you were in middle school. you already have more proof than most people accumulate in a lifetime. you just have to keep going.</p>
          <p className="blog-p">1 hit pays for all of this. youve known that since 16. youll know it at 40. the math hasnt changed.</p>
          <p className="blog-p">the losses dont compound if you dont stop. so dont stop.</p>
          <p className="blog-p">be kind to the person carrying this. that person is you. the bar is high because you set it high and you set it high because you suspected you could clear it. the suspicion was right. but you dont have to punish yourself on the way up. the world will punish you plenty. hold the bar and be gentle with the person holding it. both things at once.</p>
          <p className="blog-p">go to sleep. tomorrow, build.</p>
        </section>

      </div>
    </main>
  )
}
