import { useScrollReveal } from '../hooks/useScrollReveal'

export function AboutPage() {
  const missionReveal = useScrollReveal<HTMLElement>('fade-up')

  return (
    <>
      <header className="page-header fade-up">
        <p className="eyebrow">About RootVio</p>
        <h1>About us</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, maxWidth: '42rem' }}>
          We’re a gardening companion for Victoria—focused on natives, weeds and practical tools you can use today.
        </p>
      </header>

      <section
        className={`home-mission card ${missionReveal.revealClass}`.trim()}
        ref={missionReveal.ref}
        aria-labelledby="about-mission-heading"
      >
        <h2 id="about-mission-heading" className="home-mission__title">
          Our mission
        </h2>
        <div className="home-mission__body">
          <p>
            Victoria’s native plants and animals are under pressure. Habitat loss, climate change and the spread of
            environmental weeds are pushing hundreds of species toward extinction.
          </p>
          <p className="home-mission__emphasis">RootVio believes that gardeners are part of the solution.</p>
          <p>
            Our mission is to educate and empower Victorian home gardeners to increase local biodiversity, reduce the
            spread of environmental weeds, and contribute — one garden at a time — to a healthier natural environment
            for future generations.
          </p>
        </div>
      </section>
    </>
  )
}
