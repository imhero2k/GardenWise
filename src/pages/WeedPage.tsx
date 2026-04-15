import { type ChangeEventHandler, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { IconBin, IconCamera, IconDroplet, IconPrevent } from '../components/Icons'
import { IconSearch } from '../components/Icons'
import type { PlantEnrichment } from '../lib/plantEnrichment'
import { enrichPlantByScientificName } from '../lib/plantEnrichment'
import type { PredictResponse } from '../lib/predict'
import { predictPlantFromBase64 } from '../lib/predict'
import { fetchTopWeeds, type RegionWeed } from '../lib/weedsApi'
import { useRecommendedPlantEnrichment } from '../hooks/useRecommendedPlantEnrichment'
import { ImageLightbox } from '../components/ImageLightbox'

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error'

type ConfidenceTier = 'high' | 'medium' | 'low'

function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

const CONFIDENCE_TIER = {
  high: {
    label: 'Strong match',
    subtitle: 'Model is highly confident.',
    gradient:
      'linear-gradient(145deg, rgba(46, 125, 50, 0.22) 0%, rgba(129, 199, 132, 0.38) 45%, rgba(200, 230, 201, 0.35) 100%)',
    border: '2px solid rgba(46, 125, 50, 0.5)',
    shadow: '0 8px 28px rgba(46, 125, 50, 0.18)',
    badgeBg: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
    badgeColor: '#fff',
    bar: '#2e7d32',
    accent: '#1b5e20',
  },
  medium: {
    label: 'Moderate confidence',
    subtitle: 'Good hint — confirm with another photo or a field guide.',
    gradient:
      'linear-gradient(145deg, rgba(255, 193, 7, 0.28) 0%, rgba(255, 224, 130, 0.45) 50%, rgba(255, 249, 196, 0.35) 100%)',
    border: '2px solid rgba(245, 124, 0, 0.45)',
    shadow: '0 8px 28px rgba(245, 124, 0, 0.15)',
    badgeBg: 'linear-gradient(135deg, #e65100, #fb8c00)',
    badgeColor: '#fff',
    bar: '#f57c00',
    accent: '#e65100',
  },
  low: {
    label: 'Uncertain',
    subtitle: 'Treat as a suggestion only — verify before acting.',
    gradient:
      'linear-gradient(145deg, rgba(239, 83, 80, 0.2) 0%, rgba(255, 138, 128, 0.32) 55%, rgba(255, 205, 210, 0.28) 100%)',
    border: '2px solid rgba(198, 40, 40, 0.45)',
    shadow: '0 8px 28px rgba(198, 40, 40, 0.14)',
    badgeBg: 'linear-gradient(135deg, #b71c1c, #e53935)',
    badgeColor: '#fff',
    bar: '#c62828',
    accent: '#b71c1c',
  },
} as const

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

function PredictionResultCard({ result }: { result: PredictResponse }) {
  const tier = getConfidenceTier(result.confidence)
  const theme = CONFIDENCE_TIER[tier]
  const pct = Math.round(result.confidence * 10000) / 100
  const barPct = Math.min(100, Math.max(0, result.confidence * 100))

  const [enrichment, setEnrichment] = useState<PlantEnrichment | null>(null)
  const [enrichState, setEnrichState] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    const ac = new AbortController()
    enrichPlantByScientificName(result.label, ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return
        setEnrichment(data)
        setEnrichState('done')
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setEnrichState('error')
      })
    return () => ac.abort()
  }, [result.label])

  return (
    <div
      className="card card-body fade-up"
      style={{
        marginTop: 'var(--space-lg)',
        background: theme.gradient,
        border: theme.border,
        boxShadow: theme.shadow,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h2 style={{ margin: 0, color: theme.accent }}>Likely match</h2>
        <span
          style={{
            display: 'inline-block',
            padding: '0.35rem 0.85rem',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            background: theme.badgeBg,
            color: theme.badgeColor,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          {theme.label}
        </span>
      </div>
      <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)', fontSize: '1.15rem', color: 'var(--color-text)' }}>
        {result.label}
      </p>
      <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
        {theme.subtitle}
      </p>

      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 'var(--space-xs)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Model confidence</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: theme.accent }}>{pct}%</span>
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.65)',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${barPct}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.bar}, ${theme.bar}cc)`,
              transition: 'width 0.45s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: 'var(--space-sm) 0',
        }}
      >
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Class index</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.class_index}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)', color: theme.accent }}>Learn more</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
          Reference photos and text from Wikipedia, GBIF taxonomy, and iNaturalist (public APIs — POC).
        </p>

        {enrichState === 'loading' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>Loading reference info…</p>
        )}

        {enrichState === 'error' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Could not load extra info right now. Try again later.
          </p>
        )}

        {enrichState === 'done' && enrichment && (
          <>
            {enrichment.images.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-md)',
                }}
              >
                {enrichment.images.map((img) => (
                  <figure
                    key={img.url}
                    style={{
                      margin: 0,
                      width: 140,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <figcaption
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--color-text-muted)',
                        padding: '0.25rem 0.35rem',
                        lineHeight: 1.25,
                      }}
                    >
                      {img.source === 'wikipedia' ? 'Wikipedia' : 'iNaturalist'}
                      {img.attribution ? ` · ${img.attribution.slice(0, 80)}${img.attribution.length > 80 ? '…' : ''}` : ''}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {enrichment.wikipedia && (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {enrichment.wikipedia.extract}
                </p>
                <a
                  href={enrichment.wikipedia.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 600, color: theme.accent, fontSize: '0.88rem' }}
                >
                  Read on Wikipedia →
                </a>
              </div>
            )}

            {!enrichment.wikipedia && enrichment.images.length === 0 && (
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
                No Wikipedia summary or community photos found for this exact name. Try verifying the spelling or check GBIF / iNaturalist below.
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
              {enrichment.gbif && (
                <a
                  href={enrichment.gbif.speciesPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                >
                  GBIF: {enrichment.gbif.canonicalName}
                  {enrichment.gbif.rank ? ` (${enrichment.gbif.rank})` : ''}
                </a>
              )}
              {enrichment.inaturalist && (
                <a
                  href={enrichment.inaturalist.taxonPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                >
                  iNaturalist
                  {enrichment.inaturalist.commonName ? `: ${enrichment.inaturalist.commonName}` : ''}
                </a>
              )}
              {enrichment.inaturalist?.wikipediaUrl && (
                <a
                  href={enrichment.inaturalist.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.accent }}
                >
                  iNat Wikipedia link →
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {Array.isArray(result.probabilities) && result.probabilities.length > 0 && (
        <details style={{ marginTop: 'var(--space-md)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            Show model probabilities
          </summary>
          <pre
            style={{
              marginTop: 'var(--space-sm)',
              background: 'rgba(255,255,255,0.5)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {JSON.stringify(result.probabilities.slice(0, 50), null, 2)}
          </pre>
        </details>
      )}

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
        Always confirm ID with your state biosecurity resource. This feature uses an ML model and can be wrong.
      </p>
    </div>
  )
}

function WeedSection({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="weed-page__section card"
      style={{
        scrollMarginTop: 'var(--space-xl)',
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-lg)',
      }}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 style={{ marginTop: eyebrow ? 'var(--space-sm)' : 0, marginBottom: 'var(--space-md)' }}>{title}</h2>
      {children}
    </section>
  )
}

// ── Disposal data types ────────────────────────────────────────────────────
type WeedCategory =
  | 'aquatic' | 'riparian' | 'woody' | 'climbers'
  | 'grasses' | 'broadleaf' | 'underground' | 'succulents'

type DisposalSpecies = {
  emoji: string; name: string; latin: string
  statusTag: 'prohibited' | 'restricted'; statusLabel: string
  ariTag: 'veryhigh' | 'high'; ariLabel: string; impact: string
}
type DisposalEntry = {
  title: string; species: DisposalSpecies[]
  risk: string[]; dos: string[]; donts: string[]
}

const DISPOSAL_DATA: Record<WeedCategory, DisposalEntry> = {
  aquatic: {
    title: 'Aquatic & Wetland Herbaceous — Disposal Guide',
    species: [
      { emoji: '🌿', name: 'Alligator Weed', latin: 'Alternanthera philoxeroides', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Invades both land and water. Stem fragments carried downstream root and form new colonies. Can block entire waterways within one growing season. Do NOT attempt removal — report immediately.' },
      { emoji: '🌱', name: 'Salvinia (Giant Salvinia)', latin: 'Salvinia molesta', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'A single plant can cover an entire dam in one season. Blocks light and depletes oxygen, causing fish kills. Illegal to buy, sell, or move in Victoria.' },
      { emoji: '🦆', name: 'Lagarosiphon', latin: 'Lagarosiphon major', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: '"Chokes" slow-moving water bodies, causing anoxia and fish death. Boat propellers and fishing gear carry stem fragments between water bodies.' },
    ],
    risk: ['Spreads through tiny plant fragments — any broken piece can root and establish downstream', 'Transported rapidly by waterways, floods, contaminated boats, trailers, and fishing gear', 'State Prohibited — do not attempt removal yourself; report to authorities immediately', 'Can cover an entire water body within a single growing season', 'Survives in damp soil for extended periods away from open water'],
    dos: ['Report to the relevant authority immediately (government removes at no cost to landowner)', 'While awaiting professionals: isolate the area with temporary barriers at outflow points', 'Record GPS coordinates, photographs, and estimated coverage area for the report', 'Clean all equipment, waders, boats, and vehicles thoroughly before leaving the site', 'Keep unauthorised people and machinery out of the affected area'],
    donts: ["Don't cut, pull, or disturb the plant — any fragment establishes a new infestation downstream", "Don't move plant material across or between waterways under any circumstances", "Don't dump removed aquatic material near drains, waterways, or moist soil", "Don't compost — aquatic weed fragments remain viable for extended periods", "Don't apply herbicide near water unless using a product with a registered aquatic-use label"],
  },
  riparian: {
    title: 'Riparian Woody Plants — Disposal Guide',
    species: [{ emoji: '🌳', name: 'Willows', latin: 'Salix spp.', statusTag: 'restricted', statusLabel: 'Restricted Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Branches dropped into waterways root downstream, spreading infestation along river corridors. Dense stands alter water flow and destabilise banks when removed without a revegetation plan.' }],
    risk: ['Branches and cuttings in waterways root downstream — infestation spreads along entire river corridors', 'Removing large trees from steep banks without revegetation risks severe bank erosion', 'Regrowth from cut stumps is vigorous unless treated with herbicide within minutes of cutting'],
    dos: ['Treat cut stumps with registered herbicide immediately (within minutes) to prevent resprouting', 'Stage removal by river section — never clear entire banks at once', 'Revegetate cleared banks with local native species to stabilise soil'],
    donts: ["Don't leave cut stumps untreated — willows resprout vigorously", "Don't stack branches near the water's edge — they wash in and re-establish", "Don't apply herbicide in or near water without a registered aquatic-use product and permit"],
  },
  woody: {
    title: 'Terrestrial Woody Shrubs & Trees — Disposal Guide',
    species: [
      { emoji: '🍇', name: 'Blackberry', latin: 'Rubus fruticosus agg.', statusTag: 'restricted', statusLabel: 'Regionally Controlled / Restricted (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Birds and mammals disperse berries widely; canes tip-root wherever they touch the ground. Seed bank persists for years after parent plants are removed.' },
      { emoji: '🌿', name: 'Sweet Pittosporum', latin: 'Pittosporum undulatum', statusTag: 'restricted', statusLabel: 'Environmental Weed (outside its natural range)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Dense canopy and allelopathic leaf litter suppress native understorey regeneration. Expands aggressively via bird-dispersed fruit.' },
    ],
    risk: ['Birds and mammals disperse berries widely, creating new infestations far from the source', 'Blackberry canes tip-root wherever they touch the ground', 'Seed bank persists in soil; seedlings emerge for years after parent plants are removed'],
    dos: ['Cut stumps and immediately treat with registered herbicide (within minutes, before callusing)', 'Target seed-bearing "mother plants" first to cut off the primary dispersal source', 'Bag and dispose of all fruiting material as general waste — not green waste'],
    donts: ["Don't leave seed-bearing canes on bare soil — they will establish", "Don't chip or mulch fruiting material — seeds pass through unharmed", "Don't compost berries or canes — viable seeds survive standard composting"],
  },
  climbers: {
    title: 'Climbers & Creeping Groundcovers — Disposal Guide',
    species: [
      { emoji: '🪴', name: 'English Ivy', latin: 'Hedera helix', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Roots at every stem node; climbs tree trunks and weakens large trees. Bird-dispersed berries and garden dumping create distant infestations.' },
      { emoji: '🌸', name: 'Wandering Trad', latin: 'Tradescantia fluminensis', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Every stem node roots on contact with moist soil. Brush cutters and mowers scatter stem fragments, massively expanding the infestation.' },
    ],
    risk: ['Every stem node roots on contact with moist soil — even tiny discarded fragments establish rapidly', 'Brush cutters and mowers fragment stems and scatter propagules over a far wider area', 'Dense mats completely suppress native seedling regeneration in forest understorey'],
    dos: ['For ivy: cut climbing stems at the base first to halt ongoing tree damage, then clear the ground layer', 'Collect all removed material immediately into sealed bags', 'Treat cut stem bases with herbicide to prevent resprouting'],
    donts: ["Don't use a brush cutter or mower on wandering trad — multiplies propagules", "Don't leave detached stems on moist soil — short segments root within days", "Don't add material to green waste bins or compost — stems regenerate in mulch"],
  },
  grasses: {
    title: 'Grasses & Grass-like — Disposal Guide',
    species: [
      { emoji: '🌾', name: 'Serrated Tussock', latin: 'Nassella trichotoma', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Restricted (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Seeds dormant in soil for up to 15+ years. Wind-dispersed seeds spread along roads, fence lines, and stock routes. Can dominate a paddock within 7 years.' },
      { emoji: '🌿', name: 'Chilean Needle Grass', latin: 'Nassella neesiana', statusTag: 'restricted', statusLabel: 'Restricted Weed — all Victorian catchments', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Produces both normal seeds AND stem-node seeds — suppressing flowering alone does not stop reproduction. Sharp awns injure livestock and wildlife.' },
    ],
    risk: ["Serrated tussock seed viable in soil for 15+ years — a single season's seed set creates a decade-long problem", 'Chilean needle grass produces "stem seeds" at leaf nodes — removing flowers does not prevent seed spread', 'Seeds travel on clothing, animal fur, vehicles, and feed hay'],
    dos: ['Plan work from "clean" areas into infested areas — always clean up before moving to the next site', 'Treat during the optimal control window (before seed set)', 'Set up a wash-down station: clean all clothing, footwear, and machinery before leaving'],
    donts: ["Don't enter infested areas during seed drop — you will carry seed to clean paddocks", "Don't slash or use machinery that disperses seeds without containment during seeding", "For Chilean needle grass: don't rely on cutting alone — stem seeds will still mature and disperse"],
  },
  broadleaf: {
    title: 'Non-woody Broadleaf Herbs — Disposal Guide',
    species: [
      { emoji: '🌼', name: 'Hawkweeds', latin: 'Pilosella spp.', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Release allelopathic chemicals that suppress surrounding plants; form dense mats in alpine zones. Wind-dispersed seeds and creeping stolons. Early detection is critical.' },
      { emoji: '🌡', name: 'Tutsan', latin: 'Hypericum androsaemum', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'high', ariLabel: 'ARI: High', impact: 'Forms dense shade-tolerant thickets in moist forest, suppressing native understorey for years. Berries are toxic to livestock and spread via birds.' },
    ],
    risk: ['Hawkweeds: State Prohibited — allelopathic chemicals suppress all surrounding plants', 'Hawkweed seeds are wind-dispersed; creeping stolons expand patch size rapidly', 'Tutsan berries are toxic to livestock; birds spread seeds widely to new sites'],
    dos: ['Hawkweeds: report to authorities immediately — government removes at no cost to landowner', 'Tutsan: use cut-and-paint (cut stem, immediately apply herbicide to cut surface)', 'Small tutsan seedlings can be hand-pulled including full root on moist soil'],
    donts: ["Don't attempt to remove hawkweeds yourself — incorrect handling risks spreading stolons and seeds", "Don't slash or mow tutsan during fruiting — disperses berries across a wider area", "Don't compost fruiting material — seeds pass through viable"],
  },
  underground: {
    title: 'Underground Storage Perennials — Disposal Guide',
    species: [
      { emoji: '🌸', name: 'Bulbil Watsonia', latin: 'Watsonia meriana var. bulbillifera', statusTag: 'restricted', statusLabel: 'Declared Noxious Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', impact: 'Produces aerial bulbils at leaf axils — mowing or slashing scatters these propagules widely. Corms and bulbils persist in soil for years after top growth is removed.' },
      { emoji: '🌷', name: 'Cape Tulip — One Leaf', latin: 'Moraea flaccida', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Controlled (Vic)', ariTag: 'high', ariLabel: 'ARI: High', impact: 'Dense infestations can exceed 7,000 corms per square metre. Foliage disappears for 5–6 months per year — underground density is easily underestimated.' },
    ],
    risk: ['Dense corms, bulbils, and daughter corms persist in soil for years after above-ground removal', 'Watsonia produces aerial bulbils at leaf axils — mowing scatters thousands of propagules', 'Foliage is absent 5–6 months per year — underground density is consistently underestimated'],
    dos: ['Treat during the active leaf stage (above-ground and visible) for best herbicide uptake', 'Carefully excavate the entire corm cluster; sieve soil to recover small bulbils', 'Bag all underground material immediately — dispose via general waste, not green waste'],
    donts: ["Don't rototill or cultivate — fragments corms and distributes bulbils across the entire area", "Don't mow or slash watsonia during bulbil formation — scatters aerial propagules widely", "Don't compost corms or bulbs — they survive the composting process intact"],
  },
  succulents: {
    title: 'Succulents & Cacti — Disposal Guide',
    species: [{ emoji: '🌵', name: 'Wheel Cactus', latin: 'Opuntia robusta', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Controlled / Restricted (Vic)', ariTag: 'high', ariLabel: 'ARI: High', impact: 'Detached pads root readily on contact with soil. Glochids (barbed micro-spines) penetrate skin and are nearly impossible to remove without medical assistance.' }],
    risk: ['Detached pads root readily on contact with soil within weeks', 'Glochids (fine barbed spines) penetrate skin and are extremely difficult to remove — injury risk is high', 'Brush cutters shred pads into multiple propagules scattered across a wide area'],
    dos: ['Wear heavy puncture-resistant gloves, long sleeves, and eye protection', 'Use tongs or a stick to handle pads and fallen fruit — never touch with bare skin', 'Dispose of all material as general waste in sealed bags — never in green waste'],
    donts: ["Don't leave detached pads on bare soil — they root and form new plants within weeks", "Don't use a brush cutter or slasher — shreds pads into propagules scattered over a wide area", "Don't attempt removal without appropriate PPE — glochid injuries may require medical treatment"],
  },
}

const WEED_TYPES: { type: WeedCategory; icon: string; label: string }[] = [
  { type: 'aquatic',      icon: '💧', label: 'Aquatic & Wetland Herbaceous' },
  { type: 'riparian',    icon: '🌊', label: 'Riparian Woody Plants' },
  { type: 'woody',       icon: '🌳', label: 'Terrestrial Woody Shrubs & Trees' },
  { type: 'climbers',    icon: '🪴', label: 'Climbers & Creeping Groundcovers' },
  { type: 'grasses',     icon: '🌾', label: 'Grasses & Grass-like' },
  { type: 'broadleaf',   icon: '🍃', label: 'Non-woody Broadleaf Herbs' },
  { type: 'underground', icon: '🥕', label: 'Underground Storage Perennials' },
  { type: 'succulents',  icon: '🌵', label: 'Succulents & Cacti' },
]

const PROHIBITED_WEEDS: { name: string; chinese: string; emoji: string; imgUrl: string; desc: string }[] = [
  { name: 'Alligator Weed', chinese: '鳄鱼草', emoji: '🌿', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Alternanthera_philoxeroides_NRCS-1.jpg/330px-Alternanthera_philoxeroides_NRCS-1.jpg', desc: 'Alternanthera philoxeroides. Dense floating mats block waterways and farmland; stem fragments root readily, enabling rapid spread downstream. State Prohibited — do not attempt removal yourself.' },
  { name: 'Salvinia', chinese: '水蕨', emoji: '🌱', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Salvinia_molesta.jpg/330px-Salvinia_molesta.jpg', desc: 'Salvinia molesta. Can double in area every 2–3 days. Dense mats deplete oxygen, cause fish kills, and can cover an entire dam in one season. Illegal to buy, sell, or move in Victoria.' },
  { name: 'Water Hyacinth', chinese: '水葫芦', emoji: '💜', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Eichhornia_crassipes_C.jpg/330px-Eichhornia_crassipes_C.jpg', desc: "Eichhornia crassipes. One of the world's most damaging aquatic weeds. Forms dense floating mats that block light, deplete oxygen, and impede watercraft and irrigation infrastructure." },
  { name: 'Hawkweed', chinese: '鹰草类', emoji: '🌼', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Hieracium_pilosella_plant.jpg/330px-Hieracium_pilosella_plant.jpg', desc: 'Pilosella spp. Releases allelopathic chemicals suppressing surrounding plants. Spreads via wind-dispersed seeds and creeping stolons; threatens alpine and sub-alpine native grasslands.' },
  { name: 'Lagarosiphon', chinese: '水草类', emoji: '🦆', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg/330px-Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg', desc: 'Lagarosiphon major. Dense underwater mats choke slow-moving water bodies, causing anoxia and fish death. Fragments spread via boats, propellers, and fishing gear between water bodies.' },
  { name: 'Knotweed', chinese: '虎杖类', emoji: '🌾', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Reynoutria_japonica_in_Brastad_1.jpg/330px-Reynoutria_japonica_in_Brastad_1.jpg', desc: 'Reynoutria japonica. Extremely aggressive; rhizomes penetrate concrete and building foundations. Near-impossible to eradicate once established. Spreads from fragments as small as 1 cm of root.' },
  { name: 'Mesquite', chinese: '牧豆树', emoji: '🌳', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Prosopis_juliflora%2C_known_as_the_Velvet_Mesquite_%2810078437503%29.jpg/330px-Prosopis_juliflora%2C_known_as_the_Velvet_Mesquite_%2810078437503%29.jpg', desc: 'Prosopis spp. Aggressive woody shrub forming impenetrable thorny thickets. Deep tap roots deplete groundwater; displaces native vegetation across vast arid and semi-arid areas.' },
  { name: 'Mexican Feather Grass', chinese: '墨西哥羽毛草', emoji: '🌾', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Nassella_tenuissima.jpg/330px-Nassella_tenuissima.jpg', desc: 'Nassella tenuissima. Highly ornamental but extremely invasive grass. Wind-dispersed seeds spread kilometres; outcompetes native grassland species and significantly increases fire risk.' },
  { name: 'Parthenium Weed', chinese: '豚草', emoji: '🌼', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Parthenium_hysterophorus_plant_with_flowers.jpg/330px-Parthenium_hysterophorus_plant_with_flowers.jpg', desc: 'Parthenium hysterophorus. Causes severe allergic reactions in humans and livestock. Produces allelopathic chemicals that suppress surrounding vegetation; rapidly colonises disturbed land.' },
  { name: 'Branched Broomrape', chinese: '寄生草', emoji: '🌡', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Orobanche_ramosaTorrevieja.jpg/330px-Orobanche_ramosaTorrevieja.jpg', desc: 'Phelipanche ramosa. A parasitic plant with no chlorophyll; attaches to and destroys roots of crops and native plants. Produces thousands of tiny, long-lived seeds that persist in soil for decades.' },
  { name: 'Horsetails', chinese: '木贼类', emoji: '🌿', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Equisetum_telmateia%2C_Ireland_1_-_Ragnhild_%26_Neil_Crawford.jpg/330px-Equisetum_telmateia%2C_Ireland_1_-_Ragnhild_%26_Neil_Crawford.jpg', desc: 'Equisetum spp. Ancient invasive; rhizomes extend several metres deep, making removal extremely difficult. Establishes readily in wet areas and spreads aggressively along watercourses.' },
  { name: 'Camel Thorn', chinese: '刺槐类', emoji: '🌵', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Camel-thorn-tree-with-sparrow-weaver-nests.jpg/330px-Camel-thorn-tree-with-sparrow-weaver-nests.jpg', desc: 'Vachellia erioloba. Dense thorny thickets reduce pasture productivity and injure livestock. Spreads rapidly via animal-dispersed seed pods; extremely difficult to control once established.' },
  { name: 'Karoo & Giraffe Thorn', chinese: '刺槐类', emoji: '🌳', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Acacia_karroo%2C_habitus%2C_Jimmy_Aves_Park%2C_e.jpg/330px-Acacia_karroo%2C_habitus%2C_Jimmy_Aves_Park%2C_e.jpg', desc: 'Vachellia karroo / V. giraffe. Aggressive thorny acacias forming dense stands that exclude native vegetation and restrict stock movement. Seeds dispersed widely by livestock and wildlife.' },
  { name: 'Poverty Weed', chinese: '贫草', emoji: '🍃', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Iva_axillaris_%284010960273%29_%282%29.jpg/330px-Iva_axillaris_%284010960273%29_%282%29.jpg', desc: 'Iva axillaris. Dense colonies crowd out pasture species and crops. Causes contact dermatitis and allergic reactions; pollen triggers hay fever. Spreads aggressively via rhizomes.' },
  { name: 'Tangled Hypericum', chinese: '缠绕金丝桃', emoji: '🌡', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg/330px-%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg', desc: 'Hypericum androsaemum. Shade-tolerant woody shrub forming impenetrable thickets in moist forest and riparian zones. Berries are toxic to livestock and spread by birds into new sites.' },
]

const GENERAL_RULES = [
  { emoji: '🧩', title: "Don't break into pieces", body: 'Breaking plant material can spread seeds, fragments, and root sections that each have the potential to establish new plants. Keep the weed as intact as possible during removal.' },
  { emoji: '📦', title: 'Contain all plant material', body: 'All removed plant material — roots, stems, leaves, seeds — must be placed in sealed heavy-duty bags immediately after removal. Never leave removed material on the ground.' },
  { emoji: '🧼', title: 'Clean tools & shoes', body: 'Seeds and plant fragments can hitch a ride on boots, gloves, and tools. Clean thoroughly before leaving the site to prevent spreading to new areas.' },
  { emoji: '🌱', title: 'Avoid disturbing soil', body: 'Soil disturbance creates open ground ideal for weed germination. Minimise digging and disturbed areas, and consider covering exposed soil with mulch after removal.' },
  { emoji: '📅', title: 'Check again later', body: 'A single treatment is rarely enough. Return to the site after 4–6 weeks to remove any regrowth from missed roots or newly germinated seeds before they set seed.' },
]

export function WeedPage() {
  const location = useLocation()
  const inputId = useId()
  const [state, setState] = useState<AnalysisState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ bytes: number; base64Chars: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [topWeeds, setTopWeeds] = useState<RegionWeed[]>([])
  const [topWeedsLoading, setTopWeedsLoading] = useState(false)
  const [topWeedsError, setTopWeedsError] = useState<string | null>(null)
  const [topWeedsSearch, setTopWeedsSearch] = useState('')
  const [topWeedsOffset, setTopWeedsOffset] = useState(0)
  const [topWeedsHasMore, setTopWeedsHasMore] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  // Prohibited weeds modal
  const [modalWeed, setModalWeed] = useState<{ name: string; desc: string } | null>(null)
  // General rules accordion
  const [openRules, setOpenRules] = useState<Set<number>>(new Set())
  // Disposal type selector
  const [selectedType, setSelectedType] = useState<WeedCategory | null>(null)
  const disposalContentRef = useRef<HTMLDivElement>(null)

  const topWeedsEnriched = useRecommendedPlantEnrichment(
    topWeeds.map((w) => ({
      id: `top-${w.id}`,
      scientificName: w.scientificName,
      commonName: w.commonName,
      family: null,
      description: null,
      imageUrl: null,
    })),
  )

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const el = document.getElementById(raw)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, location.pathname])

  useEffect(() => {
    queueMicrotask(() => setTopWeedsOffset(0))
  }, [topWeedsSearch])

  useEffect(() => {
    const ac = new AbortController()
    setTopWeedsLoading(true)
    setTopWeedsError(null)
    fetchTopWeeds(ac.signal, { pageSize: 12, offset: topWeedsOffset, q: topWeedsSearch })
      .then((res) => {
        if (ac.signal.aborted) return
        setTopWeeds(res.weeds)
        setTopWeedsHasMore(res.hasMore)
      })
      .catch((e) => {
        if (ac.signal.aborted) return
        setTopWeedsError(e instanceof Error ? e.message : 'Could not load top weeds')
        setTopWeeds([])
        setTopWeedsHasMore(false)
      })
      .finally(() => {
        if (!ac.signal.aborted) setTopWeedsLoading(false)
      })
    return () => ac.abort()
  }, [topWeedsOffset, topWeedsSearch])

  useEffect(() => {
    if (!modalWeed) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalWeed(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modalWeed])

  const toggleRule = (i: number) => {
    setOpenRules((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const handleTypeSelect = (type: WeedCategory) => {
    setSelectedType(type)
    setTimeout(() => disposalContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState('analyzing')
    setError(null)
    setResult(null)
    setImageInfo(null)

    try {
      const dataUrl = await fileToDataUrl(file)
      setPreviewUrl(dataUrl)

      const base64 = dataUrl.startsWith('data:') ? dataUrl.split(',', 2)[1] ?? '' : dataUrl
      const trimmed = base64.replace(/\s+/g, '').trim()
      if (!trimmed) throw new Error('Could not encode image (empty payload)')

      const pad = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0
      const approxBytes = Math.max(0, Math.floor((trimmed.length * 3) / 4) - pad)
      setImageInfo({ bytes: approxBytes, base64Chars: trimmed.length })

      const pred = await predictPlantFromBase64(trimmed, controller.signal)
      setResult(pred)
      setState('done')
    } catch (err) {
      if (controller.signal.aborted) return
      setState('error')
      setError(err instanceof Error ? err.message : 'Prediction failed')
    }
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Weeds</p>
        <h1>Weed help</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Identify risky plants, reduce spread, and dispose of material responsibly.
        </p>
      </header>

      <div className="section-block" style={{ marginBottom: 0 }}>
        <h2 className="sr-only">Quick links</h2>
        <div className="feature-grid">
          <a href="#weed-checker" className="feature-tile">
            <div className="feature-tile__icon">
              <IconCamera />
            </div>
            <div>
              <h3>Weed checker</h3>
              <p>Scan or upload a plant to check invasive risk — same as Plant Safety Check on Home.</p>
            </div>
          </a>
          <a href="#prohibited" className="feature-tile">
            <div className="feature-tile__icon">
              <IconPrevent />
            </div>
            <div>
              <h3>Prohibited weeds</h3>
              <p>State prohibited weeds in Victoria you must not remove — report them immediately.</p>
            </div>
          </a>
          <a href="#rules" className="feature-tile">
            <div className="feature-tile__icon">
              <IconDroplet />
            </div>
            <div>
              <h3>General rules</h3>
              <p>Key rules to follow whenever removing any weed from your garden or land.</p>
            </div>
          </a>
          <a href="#disposal" className="feature-tile">
            <div className="feature-tile__icon">
              <IconBin />
            </div>
            <div>
              <h3>Disposal guide</h3>
              <p>Select your weed type for tailored safe removal and disposal instructions.</p>
            </div>
          </a>
        </div>
      </div>

      <WeedSection id="top-weeds" title="Top weeds (Victoria)">
        <div className="search-field" style={{ marginBottom: 'var(--space-md)' }}>
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconSearch />
          </span>
          <label htmlFor="top-weeds-search" className="sr-only">
            Search top weeds
          </label>
          <input
            id="top-weeds-search"
            type="search"
            placeholder="Search weeds…"
            value={topWeedsSearch}
            onChange={(e) => setTopWeedsSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        {topWeedsError && (
          <div className="card card-body" style={{ borderColor: 'var(--color-danger)' }}>
            <p style={{ margin: 0 }}>{topWeedsError}</p>
          </div>
        )}
        {topWeedsLoading && <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading top weeds…</p>}

        {!topWeedsLoading && !topWeedsError && topWeeds.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No weeds found.</p>
        )}

        {topWeeds.length > 0 && (
          <div className="plant-grid" style={{ marginTop: 'var(--space-md)' }}>
            {topWeeds.map((w) => {
              const extra = topWeedsEnriched[`top-${w.id}`]
              const meta = typeof extra === 'object' && extra ? extra : undefined
              const img = meta?.imageUrl
              const blurb = meta?.description
              return (
                <div key={w.id} className="card card-interactive card-media-top" style={{ textAlign: 'left' }}>
                  <div className="card-media-top__imgwrap">
                    {img ? (
                      <>
                        <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          className="img-expand-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setLightboxSrc(img)
                          }}
                        >
                          Expand
                        </button>
                      </>
                    ) : (
                      <div className="vicflora-card__image-placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="card-body">
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{w.commonName || w.scientificName}</h3>
                    {w.commonName && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                        {w.scientificName}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem 0.6rem',
                        marginTop: '0.55rem',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span>
                        <strong>Risk:</strong> {w.riskRating ?? 'Unknown'}
                      </span>
                      {w.isWons && <span style={{ color: 'var(--color-danger)', fontWeight: 800 }}>WoNS</span>}
                      {w.riskScore != null && <span style={{ color: 'var(--color-text-muted)' }}>score {w.riskScore}</span>}
                    </div>
                    {w.weedStatusVic && (
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {w.weedStatusVic}
                      </p>
                    )}
                    {blurb && (
                      <p
                        style={{
                          margin: '0.6rem 0 0',
                          fontSize: '0.82rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {blurb}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {topWeeds.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={topWeedsOffset <= 0 || topWeedsLoading}
                onClick={() => setTopWeedsOffset((o) => Math.max(0, o - 12))}
              >
                Previous page
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!topWeedsHasMore || topWeedsLoading}
                onClick={() => setTopWeedsOffset((o) => o + 12)}
              >
                Next page
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              Page {Math.floor(topWeedsOffset / 12) + 1}
              {topWeedsSearch.trim() ? ` · filtering “${topWeedsSearch.trim()}”` : ''}
            </p>
          </div>
        )}
      </WeedSection>

      <ImageLightbox src={lightboxSrc} open={Boolean(lightboxSrc)} onClose={() => setLightboxSrc(null)} />

      <WeedSection id="weed-checker" title="Weed checker" eyebrow="Identify">
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)' }}>
          Upload a photo or use your camera — we will identify the plant and return a confidence score.
        </p>

        <label htmlFor={inputId} className="upload-zone" style={{ display: 'block' }}>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFile}
          />
          <IconCamera />
          <p style={{ margin: 'var(--space-sm) 0 0', fontWeight: 600 }}>Tap to upload or scan</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            JPG or PNG — sent to the prediction API
          </p>
        </label>

        {previewUrl && (
          <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Selected image</h3>
            <img
              src={previewUrl}
              alt="Uploaded plant preview"
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
            {imageInfo && (
              <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Payload: ~{Math.round(imageInfo.bytes / 1024)} KB ({imageInfo.base64Chars.toLocaleString()} base64 chars)
              </p>
            )}
          </div>
        )}

        {state === 'analyzing' && (
          <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
            Analysing image…
          </p>
        )}

        {state === 'error' && error && (
          <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Couldn't analyse that image</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        )}

        {state === 'done' && result && <PredictionResultCard key={result.label} result={result} />}
      </WeedSection>

      {/* ── Prohibited weeds ── */}
      <WeedSection id="prohibited" title="State prohibited weeds" eyebrow="Do not remove yourself">
        <div style={{ background: 'rgba(230,81,0,0.07)', border: '1px solid rgba(230,81,0,0.22)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: 2 }}>⚠️</span>
          <div>
            <h3 style={{ color: '#92400e', marginBottom: 'var(--space-xs)', fontSize: '1rem' }}>Can I remove this weed myself?</h3>
            <p style={{ fontSize: '0.88rem', color: '#78350f', margin: 0 }}>
              The following weeds are <strong>State Prohibited Weeds</strong> in Victoria. You must <strong>not</strong> attempt to remove them yourself — report them to the Department of Energy, Environment and Climate Action immediately.
            </p>
            <a href="https://agriculture.vic.gov.au/biosecurity/weeds/stop-the-sale-stop-the-spread/report-a-state-prohibited-weed" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', background: 'var(--color-warning)', color: '#fff', padding: '0.45rem 1rem', borderRadius: 999, fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none' }}>
              Report a State Prohibited Weed →
            </a>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-md)' }}>
          {PROHIBITED_WEEDS.map((w) => (
            <button key={w.name} onClick={() => setModalWeed({ name: w.name, desc: w.desc })}
              style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', cursor: 'pointer', padding: 0, overflow: 'hidden', transition: 'transform var(--transition), box-shadow var(--transition), border-color var(--transition)', textAlign: 'left' }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = 'var(--shadow-hover)'; el.style.borderColor = 'var(--color-accent)' }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = 'var(--color-border)' }}
            >
              <div style={{ position: 'relative', height: 90, overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-bg) 0%, rgba(165,214,167,0.4) 100%)' }}>
                <img src={w.imgUrl} alt={w.name} loading="lazy" referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { const img = e.currentTarget; img.style.display = 'none'; const fb = img.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'flex' }}
                />
                <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{w.emoji}</div>
              </div>
              <div style={{ padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>{w.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{w.chinese}</div>
              </div>
            </button>
          ))}
        </div>
      </WeedSection>

      {/* ── General rules ── */}
      <WeedSection id="rules" title="General rules" eyebrow="Always apply">
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)', fontSize: '0.88rem' }}>
          Follow these rules whenever removing any weed. Tap each rule to expand details.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {GENERAL_RULES.map((rule, i) => {
            const open = openRules.has(i)
            return (
              <div key={i} style={{ border: `1px solid ${open ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'border-color var(--transition)' }}>
                <button onClick={() => toggleRule(i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{rule.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>{rule.title}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)' }}>▼</span>
                </button>
                {open && (
                  <div style={{ padding: 'var(--space-md) var(--space-md) var(--space-md) calc(1.25rem + var(--space-md) + var(--space-md))', fontSize: '0.875rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', lineHeight: 1.7 }}>
                    {rule.body}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </WeedSection>

      {/* ── Disposal guide ── */}
      <WeedSection id="disposal" title="Disposal guide by weed type" eyebrow="Dispose responsibly">
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)', fontSize: '0.88rem' }}>
          Select the category that best matches your weed to see tailored disposal instructions.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-sm)' }}>
          {WEED_TYPES.map(({ type, icon, label }) => {
            const active = selectedType === type
            return (
              <button key={type} onClick={() => handleTypeSelect(type)}
                style={{ border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-sm)', background: active ? 'rgba(46,125,50,0.08)' : 'var(--color-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)', transition: 'all var(--transition)', boxShadow: active ? '0 0 0 3px rgba(46,125,50,0.15)' : 'none', textAlign: 'center' }}
              >
                <span style={{ fontSize: '1.75rem' }}>{icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? 'var(--color-primary-dark)' : 'var(--color-text-muted)', lineHeight: 1.35 }}>{label}</span>
              </button>
            )
          })}
        </div>
        {selectedType && (() => {
          const d = DISPOSAL_DATA[selectedType]
          return (
            <div ref={disposalContentRef} style={{ marginTop: 'var(--space-xl)', scrollMarginTop: 'var(--space-xl)' }}>
              <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-lg)', fontSize: '1.1rem' }}>{d.title}</h3>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 var(--space-sm)' }}>Representative Species</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {d.species.map((s) => (
                  <div key={s.name} className="card card-body">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                      <span style={{ fontSize: '1.65rem', flexShrink: 0, marginTop: 2 }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.3 }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--color-primary)', marginTop: 2 }}>{s.latin}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                      <span className={`badge ${s.statusTag === 'prohibited' ? 'badge-high' : 'badge-medium'}`}>{s.statusLabel}</span>
                      <span className={`badge ${s.ariTag === 'veryhigh' ? 'badge-high' : 'badge-medium'}`}>{s.ariLabel}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-muted)', lineHeight: 1.65, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)' }}>{s.impact}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
                <div style={{ background: 'rgba(230,81,0,0.06)', border: '1px solid rgba(230,81,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>⚡ What makes it risky</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.risk.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-warning)', fontWeight: 700, marginTop: 1 }}>•</span>{item}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>✓ What to do</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.dos.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 1 }}>✓</span>{item}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>✗ What NOT to do</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.donts.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-danger)', fontWeight: 700, marginTop: 1 }}>✗</span>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )
        })()}
      </WeedSection>

      <footer
        style={{
          marginTop: 'var(--space-xl)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Content adapted from{' '}
        <a href="https://weeds.org.au/" target="_blank" rel="noreferrer">Weeds Australia</a>
        {' '}and{' '}
        <a href="https://agriculture.vic.gov.au/biosecurity/weeds" target="_blank" rel="noreferrer">Agriculture Victoria</a>.
      </footer>

      {/* ── Prohibited weed modal ── */}
      {modalWeed && (
        <div role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setModalWeed(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}
        >
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hover)', maxWidth: 520, width: '100%', padding: 'var(--space-xl)', position: 'relative', animation: 'fade-up 0.2s ease forwards' }}>
            <button onClick={() => setModalWeed(null)} aria-label="Close"
              style={{ position: 'absolute', top: 'var(--space-md)', right: 'var(--space-md)', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '0.25rem' }}
            >×</button>
            <span className="badge badge-high" style={{ marginBottom: 'var(--space-sm)' }}>State Prohibited Weed</span>
            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-sm)' }}>{modalWeed.name}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{modalWeed.desc}</p>
          </div>
        </div>
      )}
    </>
  )
}
