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
            I build things, mostly with AI. Currently working on Cassian where
            we're trying to make commercial lending less painful. Before this
            I've been at a bunch of places, done a bunch of stuff. Scroll down
            if you want the full story.
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
