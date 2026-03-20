import { useState } from 'react'
import type { PlayerId } from '../../types'
import { useGameStore } from '../../store/gameStore'
import { BoardMinion } from '../cards/BoardMinion'

interface Props {
  playerId: PlayerId
  isOpponent?: boolean
}

interface AttackAnim {
  instanceId: string
  dx: number
  dy: number
}

export function BoardZone({ playerId, isOpponent }: Props) {
  const gameState = useGameStore(s => s.gameState)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const selectedAttackerInstanceId = useGameStore(s => s.selectedAttackerInstanceId)
  const targeting = useGameStore(s => s.targeting)
  const selectAttacker = useGameStore(s => s.selectAttacker)
  const attackMinion = useGameStore(s => s.attackMinion)
  const playCardWithTarget = useGameStore(s => s.playCardWithTarget)

  const [attackAnim, setAttackAnim] = useState<AttackAnim | null>(null)

  if (!gameState || !myPlayerId) return null

  const player = gameState.players[playerId]
  const isMyTurn = gameState.activePlayerId === myPlayerId
  const hasAttackerSelected = !!selectedAttackerInstanceId
  const isInTargetingMode = !!targeting

  const handleAttackWithAnim = (attackerId: string, defenderId: string) => {
    const attackerEl = document.querySelector(`[data-instanceid="${attackerId}"]`)
    const defenderEl = document.querySelector(`[data-instanceid="${defenderId}"]`)

    if (attackerEl && defenderEl) {
      const ar = attackerEl.getBoundingClientRect()
      const dr = defenderEl.getBoundingClientRect()
      const dx = (dr.left + dr.width / 2) - (ar.left + ar.width / 2)
      const dy = (dr.top + dr.height / 2) - (ar.top + ar.height / 2)

      setAttackAnim({ instanceId: attackerId, dx: dx * 0.75, dy: dy * 0.75 })

      setTimeout(() => {
        setAttackAnim(null)
        attackMinion(attackerId, defenderId)
      }, 280)
    } else {
      attackMinion(attackerId, defenderId)
    }
  }

  return (
    <div
      className="flex items-center justify-center gap-3 min-h-32 px-6 py-3"
      {...(!isOpponent ? { 'data-myboardzone': 'true' } : {})}
    >
      {player.board.length === 0 ? (
        <div className="text-stone-800 text-xs italic">
          {isOpponent ? 'Opponent board' : 'Your board — drag a minion here'}
        </div>
      ) : (
        player.board.map(minion => {
          let isValidTargetEnemy = false
          let isValidTargetFriendly = false
          let onClick: (() => void) | undefined
          const anim = attackAnim?.instanceId === minion.instanceId ? attackAnim : null

          if (isOpponent) {
            if (hasAttackerSelected) {
              const wardMinions = player.board.filter(m => m.isWard)
              isValidTargetEnemy = !wardMinions.length || minion.isWard
              if (isValidTargetEnemy) {
                onClick = () => handleAttackWithAnim(selectedAttackerInstanceId!, minion.instanceId)
              }
            }
            if (isInTargetingMode) {
              if (targeting!.targetType === 'ENEMY_MINION') {
                isValidTargetEnemy = true
                onClick = () => playCardWithTarget(minion.instanceId)
              } else if (targeting!.targetType === 'DAMAGED_ENEMY_MINION' && minion.currentHealth < minion.maxHealth) {
                isValidTargetEnemy = true
                onClick = () => playCardWithTarget(minion.instanceId)
              }
            }
          } else {
            const canAttack = isMyTurn && !minion.hasAttackedThisTurn && !minion.isSummonSick
            const isAttacker = selectedAttackerInstanceId === minion.instanceId

            if (isInTargetingMode && targeting!.targetType === 'FRIENDLY_MINION') {
              isValidTargetFriendly = true
              onClick = () => playCardWithTarget(minion.instanceId)
            } else if (canAttack || isAttacker) {
              onClick = () => selectAttacker(isAttacker ? null : minion.instanceId)
            }

            return (
              <BoardMinion
                key={minion.instanceId}
                instance={minion}
                isAttacker={isAttacker}
                isValidTargetFriendly={isValidTargetFriendly}
                canAttack={canAttack && !isInTargetingMode}
                animOffset={anim ? { dx: anim.dx, dy: anim.dy } : null}
                onClick={onClick}
              />
            )
          }

          return (
            <BoardMinion
              key={minion.instanceId}
              instance={minion}
              isValidTargetEnemy={isValidTargetEnemy}
              isValidTargetFriendly={isValidTargetFriendly}
              animOffset={anim ? { dx: anim.dx, dy: anim.dy } : null}
              onClick={onClick}
            />
          )
        })
      )}
    </div>
  )
}
