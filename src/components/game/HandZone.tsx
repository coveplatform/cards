import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CardBase } from '../cards/CardBase'
import { getCard } from '../../data/registry'
import { getConstantPassiveSummary } from '../../engine/passiveEngine'
import { createPortal } from 'react-dom'

interface DragState {
  instanceId: string
  mouseX: number
  mouseY: number
}

export function HandZone() {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const selectedCardInstanceId = useGameStore(s => s.selectedCardInstanceId)
  const targeting = useGameStore(s => s.targeting)
  const selectCard = useGameStore(s => s.selectCard)
  const playCard = useGameStore(s => s.playCard)
  const enterTargeting = useGameStore(s => s.enterTargeting)
  const cancelTargeting = useGameStore(s => s.cancelTargeting)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{ id: string; x: number; y: number } | null>(null)
  const [overBoard, setOverBoard] = useState(false)
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  dragStateRef.current = dragState

  if (!gameState || !myPlayerId) return null

  const player = gameState.players[myPlayerId]
  const isMyTurn = gameState.activePlayerId === myPlayerId
  const constants = getConstantPassiveSummary(player)

  const dragInstance = dragState
    ? player.hand.find(c => c.instanceId === dragState.instanceId)
    : null
  const dragDef = dragInstance ? getCard(dragInstance.definitionId) : null

  const handleMouseDown = (e: React.MouseEvent, instanceId: string) => {
    if (targeting) {
      cancelTargeting()
      return
    }
    if (!isMyTurn) return
    e.preventDefault()
    selectCard(null)
    // Capture the board zone rect at drag start
    const el = document.querySelector('[data-myboardzone="true"]')
    setBoardRect(el ? el.getBoundingClientRect() : null)
    setDragState({ instanceId, mouseX: e.clientX, mouseY: e.clientY })
  }

  useEffect(() => {
    if (!dragState || !dragInstance || !dragDef) return

    const onMove = (e: MouseEvent) => {
      setDragState(d => d ? { ...d, mouseX: e.clientX, mouseY: e.clientY } : null)
      // Check if hovering over my board zone
      const els = document.elementsFromPoint(e.clientX, e.clientY)
      setOverBoard(els.some(el => el.getAttribute('data-myboardzone') === 'true'))
    }

    const onUp = (e: MouseEvent) => {
      const ds = dragStateRef.current
      if (!ds) return

      const els = document.elementsFromPoint(e.clientX, e.clientY)
      const isOverMyBoard = els.some(el => el.getAttribute('data-myboardzone') === 'true')

      if (dragDef.cardType === 'MINION' && isOverMyBoard && player.board.length < 7) {
        playCard(ds.instanceId)
      } else if (dragDef.cardType === 'SPELL') {
        const targetType = dragDef.spellEffect?.targetType
        if (!targetType) {
          // Untargeted — cast anywhere
          playCard(ds.instanceId)
        } else {
          // Targeted — enter targeting mode, user picks via existing arrow system
          selectCard(ds.instanceId)
          enterTargeting(ds.instanceId, targetType)
        }
      }

      setDragState(null)
      setOverBoard(false)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragState?.instanceId, dragInstance, dragDef])

  const count = player.hand.length

  return (
    <div
      className="flex items-end justify-center px-4 relative"
      style={{
        height: '168px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.65) 100%)',
      }}
    >
      {player.hand.map((instance, idx) => {
        const def = getCard(instance.definitionId)
        let manaCost = def.manaCost
        const crCost = def.classResourceCost ?? 0

        if (def.cardType === 'SPELL') {
          manaCost = Math.max(0, manaCost - constants.spellCostReduction)
          if (player.cardsPlayedThisTurn === 0) manaCost = Math.max(0, manaCost - constants.firstCardCostReduction)
        }


        const isSelected = selectedCardInstanceId === instance.instanceId
        const isDragging = dragState?.instanceId === instance.instanceId
        const isHovered = hoverInfo?.id === instance.instanceId && !dragState

        const pos = count > 1 ? (idx - (count - 1) / 2) : 0
        const rotDeg = pos * Math.min(5, 28 / Math.max(count, 1))
        const arcLift = count > 1 ? Math.abs(pos) * 14 : 0
        // Default: cards sink 70px off-screen. Hover: rise above normal. Selected: fully lifted.
        const liftY = isSelected ? -90 : isHovered ? arcLift - 30 : arcLift + 70

        return (
          <div
            key={instance.instanceId}
            style={{
              transform: `rotate(${rotDeg}deg) translateY(${liftY}px)`,
              transformOrigin: 'bottom center',
              marginLeft: idx === 0 ? 0 : '-52px',
              zIndex: isSelected ? 20 : isHovered ? 100 : idx,
              position: 'relative',
              opacity: isDragging ? 0.25 : 1,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: 'transform 0.2s ease-out',
            }}
            onMouseEnter={() => !dragState && setHoverInfo({ id: instance.instanceId, x: 0, y: 0 })}
            onMouseLeave={() => setHoverInfo(null)}
            onMouseMove={e => {
              if (dragState) return
              const rect = e.currentTarget.getBoundingClientRect()
              setHoverInfo({
                id: instance.instanceId,
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5,
              })
            }}
            onMouseDown={e => handleMouseDown(e, instance.instanceId)}
          >
            <CardBase
              instance={instance}
              isSelected={isSelected}
              isHovered={isHovered}
              hoverX={isHovered ? (hoverInfo?.x ?? 0) : 0}
              hoverY={isHovered ? (hoverInfo?.y ?? 0) : 0}
            />
          </div>
        )
      })}

      {player.hand.length === 0 && (
        <div className="text-stone-700 text-sm italic pb-4">No cards in hand</div>
      )}

      {/* Floating ghost card while dragging */}
      {dragState && dragInstance && createPortal(
        <>
          {/* Ghost card at cursor */}
          <div
            style={{
              position: 'fixed',
              left: dragState.mouseX - 85,
              top: dragState.mouseY - 119,
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'scale(1.05)',
              filter: overBoard ? 'drop-shadow(0 0 16px rgba(34,197,94,0.9))' : 'drop-shadow(0 8px 24px rgba(0,0,0,0.8))',
              transition: 'filter 0.15s ease',
            }}
          >
            <CardBase instance={dragInstance} />
          </div>

          {/* Board drop zone hint — positioned over the actual board element */}
          {dragDef?.cardType === 'MINION' && boardRect && (
            <div
              style={{
                position: 'fixed',
                left: boardRect.left - 8,
                top: boardRect.top - 8,
                width: boardRect.width + 16,
                height: boardRect.height + 16,
                pointerEvents: 'none',
                zIndex: 999,
                border: overBoard
                  ? '2px solid rgba(34,197,94,0.8)'
                  : '2px dashed rgba(34,197,94,0.35)',
                borderRadius: '12px',
                background: overBoard
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(34,197,94,0.02)',
                boxShadow: overBoard ? '0 0 24px rgba(34,197,94,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            />
          )}

          {/* Targeting spell hint */}
          {dragDef?.cardType === 'SPELL' && dragDef.spellEffect?.targetType && (
            <div
              style={{
                position: 'fixed',
                left: dragState.mouseX,
                top: dragState.mouseY - 20,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 1001,
                background: 'rgba(10,8,4,0.9)',
                border: '1px solid rgba(251,191,36,0.6)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#fcd34d',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Release to enter targeting mode
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  )
}
