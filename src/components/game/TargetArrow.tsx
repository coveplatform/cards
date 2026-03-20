import { useEffect, useState } from 'react'

interface Props {
  sourceInstanceId: string
  mousePos: { x: number; y: number }
  isHostile: boolean
}

export function TargetArrow({ sourceInstanceId, mousePos, isHostile }: Props) {
  const [sourceCenter, setSourceCenter] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = document.querySelector(`[data-instanceid="${sourceInstanceId}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSourceCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }, [sourceInstanceId])

  if (!sourceCenter) return null

  const sx = sourceCenter.x
  const sy = sourceCenter.y
  const ex = mousePos.x
  const ey = mousePos.y

  const dx = ex - sx
  const dy = ey - sy
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Quadratic bezier control point: midpoint lifted upward
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2 - dist * 0.25

  const color = isHostile ? '#ef4444' : '#22c55e'
  const glowColor = isHostile ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)'
  const markerId = isHostile ? 'arrowhead-hostile' : 'arrowhead-friendly'

  const pathD = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>

      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={glowColor}
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: `blur(6px)` }}
      />

      {/* Main arrow line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  )
}
