import { useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

type Tutorial = {
  id: string
  title: string
  intro: string
  steps: string[]
  tip?: string
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'your-space',
    title: '1. Read your garden',
    intro:
      'Natives do best when you match plants to the sunlight, soil and space you already have — no fancy tests required.',
    steps: [
      'Watch how sun moves across a day: note full sun, part shade or deep shade for each bed or pot cluster.',
      'Dig one spadeful of soil and feel it: grittily sandy, sticky clay or somewhere in between shapes watering and plant choice.',
      'Measure bed or pot sizes and picture mature plant width so things are not crammed in two years’ time.',
      'If you are in a cooler part of Victoria, notice frost-prone corners where tender species might struggle.',
    ],
    tip: 'When in doubt, pick species labelled for your region in PlantMe — they tolerate typical local winters and dry spells better.',
  },
  {
    id: 'plan-small',
    title: '2. Start with one winning patch',
    intro:
      'A single small success beats a whole-yard makeover. Aim for one bed, a nature strip or a group of pots first.',
    steps: [
      'Outline the patch you will actually maintain this season; you can expand once it thrives.',
      'Remove weeds by hand or cut-and-bag seed heads before planting; use the weed checker if you are unsure what something is.',
      'Add a thin layer of compost or broken-down mulch on top rather than deep digging if the ground is rock-hard — many natives prefer lean soil.',
      'Pick three to five plants for your conditions in PlantMe, mixing groundcovers, mid-height shrubs and something with flowers or seed heads for wildlife.',
    ],
  },
  {
    id: 'planting',
    title: '3. Plant and mulch',
    intro:
      'A gentle, wide planting hole and mulch without “volcano” piles around stems sets roots up for Australian summers.',
    steps: [
      'Dig a hole about twice as wide as the nursery pot and the same depth — keep the stem at the same soil line it had in the pot.',
      'Loosen circling roots at the bottom so they point outward instead of continuing in a tight coil.',
      'Backfill with original soil, firm lightly with your hands, then water slowly until the root ball is saturated.',
      'Spread organic mulch in a thin, even layer; keep it a small clear gap away from stems to avoid collar rot.',
    ],
  },
  {
    id: 'watering',
    title: '4. Water smart in the first year',
    intro:
      'Deep, occasional drinks beat daily spritzes. You are teaching roots to chase moisture down while plants establish.',
    steps: [
      'Water deeply and less often so roots grow downward; frequent light watering keeps roots shallow and needy.',
      'Water in the morning when you can so leaves dry off during the day.',
      'Ease off once new growth looks firm and healthy — many established natives in Victoria cope mainly on rainfall.',
      'On brutally hot days in year one, one long soak restores a wilted plant more safely than many short splashes.',
    ],
  },
  {
    id: 'ongoing-care',
    title: '5. Light ongoing care',
    intro:
      'Native gardens reward steady, small habits: mulch, weed patrols and restrained pruning.',
    steps: [
      'Top up mulch once or twice a year so soil stays cool and fewer weed seeds germinate.',
      'Monthly, pull tiny weeds and watch for garden plants trying to seed into bushland — remove them before they spread.',
      'Prune lightly after flowering if a plant looks leggy; avoid heavy “hedge” clipping on most Australian shrubs.',
      'Each season, add a plant or two rather than starting over — small layers of habitat add up for birds and pollinators.',
    ],
  },
]

export function BeginnerGuidesPage() {
  const location = useLocation()

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const el = document.getElementById(raw)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, location.pathname])

  return (
    <>
      <header className="page-header fade-up">
        <p className="eyebrow">Beginner guides</p>
        <h1>Step-by-step: your first native-friendly garden</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, maxWidth: '42rem' }}>
          Short tutorials you can follow in order — from understanding your yard to planting, watering and easy
          upkeep. Pair these steps with{' '}
          <Link to="/plants">PlantMe</Link>, the <Link to="/weed#weed-checker">weed checker</Link>
          {', and '}
          <Link to="/learn#native">native plants 101</Link> when you want more context.
        </p>
      </header>

      {TUTORIALS.map((t) => (
        <section key={t.id} id={t.id} className="card beginner-tutorial" aria-labelledby={`${t.id}-heading`}>
          <h2 id={`${t.id}-heading`}>{t.title}</h2>
          <p className="beginner-tutorial__intro">{t.intro}</p>
          <ol className="beginner-tutorial__steps">
            {t.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {t.tip ? <p className="beginner-tutorial__tip">{t.tip}</p> : null}
        </section>
      ))}

      <section className="learn-cta" style={{ marginTop: 'var(--space-xl)' }}>
        <h2>Ready to pick plants?</h2>
        <p>
          Filter by your area, sun and soil in PlantMe, then visit a local nursery from the map to confirm labels and
          pot sizes before you dig.
        </p>
        <div className="learn-cta__actions">
          <Link to="/plants" className="btn btn-primary">
            Open PlantMe
          </Link>
          <Link to="/map" className="btn btn-secondary">
            Nursery map
          </Link>
        </div>
      </section>
    </>
  )
}
