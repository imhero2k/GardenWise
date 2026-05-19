import { Link } from 'react-router-dom'

type BeginnerTierCrossLinkProps = {
  title: string
  description: string
  to: string
  linkLabel: string
}

export function BeginnerTierCrossLink({ title, description, to, linkLabel }: BeginnerTierCrossLinkProps) {
  return (
    <section className="card beginner-tutorial" aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`}>{title}</h2>
      <p className="beginner-tutorial__intro">{description}</p>
      <p style={{ margin: 0 }}>
        <Link to={to} className="home-impact__more-link">
          {linkLabel}
        </Link>
      </p>
    </section>
  )
}
