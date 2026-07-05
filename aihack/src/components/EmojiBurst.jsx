// 추천 결과가 나타나는 순간 중심에서 이모지가 사방으로 터져 나오는 연출.
const EMOJI_POOL = ['🩵', '🩷', '💛', '❤️', '👑', '👩‍🎓', '🏫', '😍', '🎈', '✨', '🎉', '🎀']
const PARTICLE_COUNT = 20

function pickRandomEmojis() {
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5)
  const count = 4 + Math.round(Math.random()) // 4~5개
  return shuffled.slice(0, count)
}

function buildParticles() {
  const emojis = pickRandomEmojis()
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 90 + Math.random() * 170
    const tx = Math.cos(angle) * distance
    const ty = Math.sin(angle) * distance
    const rotate = (Math.random() - 0.5) * 260
    const size = 22 + Math.random() * 16
    const delay = Math.random() * 140
    return { id: i, emoji: emojis[i % emojis.length], tx, ty, rotate, size, delay }
  })
}

export default function EmojiBurst() {
  const particles = buildParticles()

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-0 w-0 overflow-visible" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-0 top-0 animate-emoji-burst select-none"
          style={{
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}ms`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rotate}deg`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
