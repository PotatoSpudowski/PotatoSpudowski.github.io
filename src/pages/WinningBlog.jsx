import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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

export default function WinningBlog() {
  return (
    <main className="main blog-main">
      <Link to="/articles" className="back-link">&larr; Back to articles</Link>

      <div className="blog-hero">
        <Fade>
          <h1 className="blog-title">how i keep winning</h1>
        </Fade>
      </div>

      <div className="blog-body">

        <section className="blog-section">
          <p className="blog-p">the same people keep winning. not the smartest. not the hardest workers. not the ones with the best degree or the most followers. the same ones. over and over. once you pay attention you see why.</p>
          <p className="blog-p">its not a secret. its a system. most people dont have one because they spent years optimizing for a game that doesnt exist outside school.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">see early move messy</h2>
          <p className="blog-p">intelligence is pattern recognition. you watch what keeps working. what content gets traction. which people keep getting opportunities. which methods keep producing results. thats signal not luck.</p>
          <p className="blog-p">most people see the pattern and dont move. they wait to feel ready. they wait for someone to confirm the window is real. by the time they move its crowded and the edge is gone.</p>
          <p className="blog-p">see early. act messy. act now. you wont have all the information. the early position is the advantage. the mess is the price of getting there first. <strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>people who wait for certainty are just watching other people win.</strong></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">position beats effort</h2>
          <p className="blog-p">effort doesnt scale. position does. school teaches you effort matters. show up. work hard. get marks. but marks dont compound. position does.</p>
          <p className="blog-p">2 people study the same thing. 1 reads and repeats. the other figures out how questions are asked and where marks actually come from. same hours. different results. one played the game correctly.</p>
          <p className="blog-p">2 people build products. 1 ships and hopes. the other studies what people click on and what makes them come back. same output. different outcomes. you steer the game into terrain where your strengths matter and theirs dont.</p>
          <p className="blog-p">most people play to get better at the game. <strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>winners play to make the game easy.</strong></p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">speed</h2>
          <p className="blog-p">1 person is still thinking. the other has data. thats it.</p>
          <p className="blog-p">weeks pass. 1 has ideas. the other has experiments. months pass. 1 is still planning. the other has momentum you cant buy. the slow person isnt dumb. theyre just running a different strategy and calling it being careful.</p>
          <p className="blog-p"><strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>you dont get clarity before you move. you get clarity by moving.</strong> readiness comes from reps. reps require moving. you cant think your way into the reps.</p>
          <p className="blog-p">speed compounds. every attempt is data. every data point sharpens your eye. every sharpened pattern makes the next move faster. slow people think fast people are reckless. theyre not. theyre just further in a loop the slow person hasnt started.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the credential people</h2>
          <p className="blog-p">this part will piss some people off. good.</p>
          <p className="blog-p">theres a type of person who uses credentials as a substitute for thinking. they cite papers to avoid having a position. they name drop institutions to signal authority they never earned through actual work. they talk about rigor and methodology to make you feel like you cant have an opinion unless you went where they went.</p>
          <p className="blog-p">ive watched these people for years. they are almost never building things that matter. theyre good at sounding credible in rooms where nobody checks receipts. they win at status games and hiring panels and advisory boards. <strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>but perception isnt product. perception isnt revenue. perception doesnt ship.</strong></p>
          <p className="blog-p">the tell is always the same. ask them what they built. ask what shipped. ask for a result that exists in the world. watch how fast the conversation moves to context and nuance and why comparing outcomes is unfair. thats not honesty. thats a dodge. someone with real results just points at the thing.</p>
          <p className="blog-p">credentials were supposed to be a proxy for capability because you couldnt always evaluate capability directly. that made sense 30 years ago. now the tools are free. the information is free. anyone with a laptop can build and ship and prove competence. credentials are now how gatekeepers protect their position from people who didnt use the gate.</p>
          <p className="blog-p">the bar for showing proof of competence is very low. if someone doesnt have anything to show for they are most likely incompetent irrespective of their pedigree and credentials.</p>
          <p className="blog-p">when someone pulls credentials on you. stop. what did they build. <strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>if the record is thin and the framing is thick youre talking to someone who got good at sounding right instead of being right.</strong> those are different things.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">the valley</h2>
          <p className="blog-p">theres a phase in every real attempt where nothing works. youre still failing. still unsure. still not getting results. this is where most people stop.</p>
          <p className="blog-p">they stop because stopping feels rational. the data says its not working. but almost every pattern worth finding looks like noise before it breaks through. if you stop in the valley you never see the pattern. you go find another valley and stop there too. never compounding.</p>
          <p className="blog-p">staying in isnt blind hope. its knowing that clarity comes after enough reps and you havent hit enough reps yet. most people quit before the threshold and then decide the pattern doesnt exist. it existed. they just left before they could see it.</p>
          <p className="blog-p"><strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>bad signal in the middle is normal. its the price of the reps. pay it.</strong></p>
          <p className="blog-p">only a fucking idiot thinks every step needs to be perfect and show a clear path into nirvana. most people that think this way have a very linear career progression and are terrible founders because they cant handle the uncertainty that comes with learning they are wrong in order to course correct and be right.</p>
        </section>

        <section className="blog-section">
          <h2 className="blog-section-tag">specific knowledge</h2>
          <p className="blog-p">after enough reps at speed something forms. you start seeing things faster. your instincts stop being guesses. you build knowledge nobody else has because nobody else took your exact path.</p>
          <p className="blog-p">anyone can copy a strategy. nobody can copy the combination of your reps, your failures, your early moves in your specific market at the specific time you were there. that compounds into a perspective nobody else has.</p>
          <p className="blog-p">this is why copying winners doesnt work. youre implementing their conclusions without their path. you can borrow the what. you cant borrow the why. without the why youre always a version behind.</p>
        </section>

        <section className="blog-section blog-section--last">
          <h2 className="blog-section-tag">it compounds</h2>
          <p className="blog-p">pattern recognition shows you the opening. moving early puts you ahead. position gives you the angle. speed compounds attempts. staying in gives you enough reps. specific knowledge makes it yours. then it feeds itself.</p>
          <p className="blog-p">early position gives early data. early data sharpens patterns. sharper patterns mean earlier moves. faster moves mean more attempts. more attempts mean more knowledge. the loop tightens. each cycle youre harder to catch.</p>
          <p className="blog-p">the credential people are not in this loop. theyre in a different game. that game rewards them in specific places. job applications. grant panels. social capital in academic circles. thats real. but it doesnt compound.</p>
          <p className="blog-p"><strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>credentials dont compound. status doesnt compound.</strong> the person who ran more experiments last year runs better ones this year. the person who shipped more last year ships faster this year. thats the loop you want.</p>
          <p className="blog-p">its not about being smarter. its about running a system that makes you faster over time. most people dont have a system. theyre reacting. reaction loses to anticipation at scale.</p>
          <p className="blog-p">the same people keep winning because theyre in a compounding loop everyone else hasnt started. <strong style={{textDecoration: 'underline', textUnderlineOffset: '4px'}}>the gap grows in both directions.</strong></p>
        </section>

      </div>
    </main>
  )
}
