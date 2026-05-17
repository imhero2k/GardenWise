import { useScrollReveal } from '../hooks/useScrollReveal'

export function AboutPage() {
  const { elementRef: missionSectionRef, revealClass: missionRevealClass } =
    useScrollReveal<HTMLElement>('fade-up')

  return (
    <>
      <section className="about-band about-band--hero" aria-label="About RootVio">
        <div className="about-band__inner">
          <header className="about-hero fade-up">
            <div className="about-hero__main">
              <p className="eyebrow">About</p>
              <h1 className="about-hero__title">RootVio</h1>
              <p className="about-hero__mission">
                Grow smart. Garden responsibly — with practical tools for Victorian gardeners to support native
                biodiversity and reduce environmental weeds.
              </p>
            </div>
          </header>
        </div>
      </section>

      <section
        className={`about-band about-band--mission ${missionRevealClass}`.trim()}
        ref={missionSectionRef}
        aria-labelledby="about-mission-heading"
      >
        <div className="about-band__inner">
          <div className="home-mission about-mission">
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
                Our mission is to educate and empower Victorian home gardeners to increase local biodiversity, reduce
                the spread of environmental weeds, and contribute — one garden at a time — to a healthier natural
                environment for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-band about-band--benefits" aria-labelledby="about-benefits-heading">
        <div className="about-band__inner">
          <div className="about-benefits section-block">
            <h2 id="about-benefits-heading" className="about-values__title">
              Why use RootVio?
            </h2>
            <div className="about-values__grid" role="list" aria-label="RootVio benefits">
              <div className="about-value" role="listitem">
                <p className="about-value__title">Local plant suggestions</p>
                <p className="about-value__body">
                  Find native plants that fit your area, sun and soil, so your garden supports local biodiversity.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Reduce environmental weeds</p>
                <p className="about-value__body">
                  Quickly check if a garden plant is risky, and learn safer alternatives for Victorian conditions.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Simple, step-by-step basics</p>
                <p className="about-value__body">
                  Short guides help you establish plants, mulch well, and water smarter—without guesswork.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Find nurseries nearby</p>
                <p className="about-value__body">
                  Use the map to locate native nurseries and public gardens so you can confirm labels and get local
                  advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="about-band about-band--sources"
        aria-labelledby="about-sources-heading"
      >
        <div className="about-band__inner">
          <div className="about-sources section-block">
            <h2 id="about-sources-heading" className="about-values__title">
              Data sources
            </h2>
            <p className="about-sources__lede">
              RootVio combines several open Victorian datasets so recommendations stay
              grounded in real ecological evidence.
            </p>
            <ol className="about-sources__list">
              <li className="about-source">
                <p className="about-source__title">Bioregions and EVC benchmarks</p>
                <p className="about-source__body">
                  We use Victoria’s 28 bioregions and their Ecological Vegetation Classes
                  (EVCs) to match plant choices to local conditions, with a curated short
                  list of garden-friendly EVCs: <em>EVC 3 Damp Sands Woodland</em>,
                  <em> EVC 48 Heathy Woodland</em>, <em>EVC 55 Plains Grassy Woodland</em>,
                  <em> EVC 61 Box Ironbark Forest</em>,
                  <em> EVC 132 Plains Grassland</em>, and{' '}
                  <em>EVC 175 Grassy Woodland</em>.
                </p>
                <a
                  className="about-source__link"
                  href="https://www.environment.vic.gov.au/biodiversity/bioregions-and-evc-benchmarks"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  DEECA – Bioregions and EVC benchmarks →
                </a>
              </li>

              <li className="about-source">
                <p className="about-source__title">
                  Victorian Bioregions map (1:100,000)
                </p>
                <p className="about-source__body">
                  The bioregion boundaries on the location picker come from the 2004
                  state-wide GIS layer (version 3.0), which lets RootVio resolve any
                  Victorian coordinate to its bioregion.
                </p>
                <a
                  className="about-source__link"
                  href="https://datashare.maps.vic.gov.au/search?md=3508ad58-e66b-50e4-9717-0338845ded77"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  DataVic – Victorian Bioregions 1:100,000 →
                </a>
              </li>

              <li className="about-source">
                <p className="about-source__title">AusTraits plant trait database</p>
                <p className="about-source__body">
                  Plant traits — growth form, mature size, flowering season, dispersal —
                  power our planner and recommendations. We use the latest AusTraits release
                  from Zenodo.
                </p>
                <a
                  className="about-source__link"
                  href="https://zenodo.org/records/15718081"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  AusTraits release on Zenodo →
                </a>
                <p className="about-source__cite">
                  Cite:{' '}
                  <a
                    href="https://zenodo.org/records/5112001"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Falster, D. <em>et al.</em> (2021){' '}
                    <em>AusTraits: a curated plant trait database for the Australian flora</em>.
                    Zenodo.
                  </a>
                </p>
              </li>

              <li className="about-source">
                <p className="about-source__title">
                  Advisory list of environmental weeds in Victoria
                </p>
                <p className="about-source__body">
                  The plant identifier flags species using the 2022 advisory list of
                  environmental weeds, so gardeners can avoid plants known to spread into
                  Victorian bushland.
                </p>
                <a
                  className="about-source__link"
                  href="https://www.environment.vic.gov.au/__data/assets/excel_doc/0027/563607/Advisory-list-of-environmental-weeds-in-Victoria_2022.xlsx"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  DEECA – Advisory list 2022 (XLSX) →
                </a>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="about-band about-band--values" aria-labelledby="about-values-heading">
        <div className="about-band__inner">
          <div className="about-values section-block">
            <h2 id="about-values-heading" className="about-values__title">
              Our values
            </h2>
            <div className="about-values__grid" role="list">
              <div className="about-value" role="listitem">
                <p className="about-value__title">Support biodiversity</p>
                <p className="about-value__body">
                  Native plants help provide food and shelter for birds, bees, butterflies, and other wildlife.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Keep gardening practical</p>
                <p className="about-value__body">
                  We share realistic, easy-to-follow advice for gardeners of all experience levels.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Promote sustainability</p>
                <p className="about-value__body">
                  Water-wise, climate-resilient gardens are better for both people and the environment.
                </p>
              </div>
              <div className="about-value" role="listitem">
                <p className="about-value__title">Celebrate Australian plants</p>
                <p className="about-value__body">
                  Our native flora is uniquely beautiful, diverse, and perfectly adapted to this continent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
