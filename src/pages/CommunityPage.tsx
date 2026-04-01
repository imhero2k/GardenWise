import { useState } from 'react'
import { communityPosts } from '../data/community'
import { IconComment, IconHeart, IconShare } from '../components/Icons'

export function CommunityPage() {
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Together</p>
        <h1>Community gallery</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Gardens from eco-conscious growers across Australia.
        </p>
      </header>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <button type="button" className="btn btn-primary">
          Post your garden
        </button>
      </div>

      <div className="community-grid">
        {communityPosts.map((post, i) => (
          <article key={post.id} className="community-card card-interactive fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <img src={post.image} alt="" loading="lazy" />
            <div className="community-card__bar">
              <div>
                {post.author} · {post.location}
              </div>
              <div className="community-actions">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  aria-pressed={liked[post.id]}
                  aria-label="Like"
                >
                  <IconHeart filled={liked[post.id]} />
                  {post.likes + (liked[post.id] ? 1 : 0)}
                </button>
                <button type="button" aria-label="Comment">
                  <IconComment />
                  {post.comments}
                </button>
                <button type="button" aria-label="Share">
                  <IconShare />
                  Share
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
