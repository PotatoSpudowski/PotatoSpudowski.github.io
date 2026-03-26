import Timeline from '../components/Timeline'

export default function Home() {
  return (
    <main className="main">
      <section className="hero">
        <img
          src="https://pbs.twimg.com/profile_images/1997230766435274752/LmLhsWSA.jpg"
          alt="Bahushruth CS"
          className="profile-image"
        />
        <div className="hero-text">
          <h1 className="hero-title">Hi, I'm Bahushruth</h1>
          <p className="hero-subtitle">
            started in 10th grade writing VBS scripts to mess with school computers. decided ML was more interesting. made 5 figures freelancing during college. upstream operators needed EOL prediction and hydroflushing cycle optimization pipelines. IBM Research before graduating. founding engineer at a YC startup. MLOps for millions of users at QuillBot. twice at Entrepreneurs First.
          </p>
          <p className="hero-subtitle">
            now CEO and cofounder of Cassian. were automating the nightmare that is commercial lending.
          </p>
          <div className="hero-links">
            <a href="https://github.com/bahushruth" target="_blank" rel="noreferrer" className="hero-social-link">GitHub</a>
            <a href="https://x.com/Bahushruth" target="_blank" rel="noreferrer" className="hero-social-link">X/Twitter</a>
            <a href="https://www.linkedin.com/in/bahushruth/" target="_blank" rel="noreferrer" className="hero-social-link">LinkedIn</a>
          </div>
        </div>
      </section>
      <Timeline />
    </main>
  )
}
