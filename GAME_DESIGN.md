# Realm's Edge — Game Design Document
*Working Title | Web-based prototype → Unity*

---

## Overview

Realm's Edge is a 1v1 and 2v2 digital card game set in a classic high fantasy world rooted in the aesthetics and lore of early Warcraft — grimdark, archetypal, and world-worn. No sci-fi, no meta-humor. Each class feels like a distinct fantasy archetype with its own playstyle, resource system, and spell identity.

---

## Setting & Tone

Classic high fantasy. Humans, Orcs, Undead, Elves, Dwarves. The world has the weight of old wars and ancient magic. Visually chunky and painterly — think WoW circa 2004, not modern polished fantasy. Flavor text on cards references history, war, religion, and dark humor. No pop culture references.

---

## Game Modes

### 1v1 — Standard
Two players. Each controls their own hero, deck, and resources. Standard competitive mode.

### 2v2 — Allied
Four players split into two teams. Teammates share a single unified board but maintain completely separate hands, decks, mana pools, and class resources. Each player faces one designated opponent but spells and minions can target anywhere on the board. Cross-class synergy cards exist that interact with your partner's class resource or board state. Communication happens through an in-game ping and emote system.

---

## Classes & Hero Identity

Each class has a unique hero with a unique secondary resource and a class-specific spell pool. Six launch classes:

| Class | Fantasy Archetype | Secondary Resource |
|---|---|---|
| **Paladin** | Holy warrior, control/sustain | Holy Power |
| **Warlock** | Demon pact, burn/sacrifice | Soul Shards |
| **Shaman** | Spirit caller, midrange/chain | Elemental Fury |
| **Necromancer** | Death lord, graveyard engine | Corpse Dust |
| **Ranger** | Bow master, tempo/combo | Focus |
| **Runesmith** | Dwarf artificer, artifacts/board | Heat |

---

## Resource Systems

### Primary Resource — Mana
All classes share a base mana pool. Starts at 1 crystal on turn 1, gains 1 per turn, caps at 10. All cards have a mana cost. This is the universal pacing system.

### Secondary Resource — Class Resource
Each class has a unique secondary resource generated and spent through gameplay. Powerful class spells and hero abilities require both mana AND class resource to play. This gates the most impactful class cards behind earned gameplay moments rather than just curve progression.

**Holy Power (Paladin)**
Stacks 0–5, displayed as glowing orbs. Gained when a friendly minion survives combat or when you heal any target. Spent on divine executes, empowered attacks, and massive heal bursts. Rewards patient, defensive play — build righteousness then punish.

**Soul Shards (Warlock)**
Stacks 0–3. Gained whenever ANY minion dies on either side of the board. Spent on powerful demons, forbidden spells, and dark pact variants. Rewards flooding the board and engineering deaths — yours and theirs.

**Elemental Fury (Shaman)**
Stacks 0–4. Gained by playing Elemental or Totem tagged cards. Spent to empower chain spells — Chain Lightning hits one additional target per Fury spent, Bloodlust scales with Fury stacks. Rewards within-turn sequencing and building elemental chains.

**Corpse Dust (Necromancer)**
Stacks 0–10, higher cap and lower individual value. Gained whenever any minion dies on either side. Spent on graveyard resurrection, plague spells, and powering bone constructs. Passively accumulates — a late game monster that grows stronger the longer the game goes.

**Focus (Ranger)**
Stacks 0–3, resets at the start of each turn. Gains 1 at turn start plus 1 for each spell played this turn. Spent on multi-target shots and a scaling Aimed Shot that grows proportional to Focus spent. Rewards spell-first sequencing — cast first, spend Focus, fire the finisher.

**Heat (Runesmith)**
Stacks 0–5. Gained whenever you play a non-spell card. Spent on forging artifact weapons, overclocking constructs with stat boosts, and a forge explosion AoE. Rewards consistent minion deployment and snowballing through gear.

---

## Card Types

### Spells — Class Identity
Spells are the primary expression of class fantasy. Approximately 90% of spells are class-locked. Spells are how you deal damage, control the board, generate resources, and execute your win condition. Your class's spells define how you play — two players with the same neutral minions but different classes play completely different games.

Some spells have **Combo text** — bonus effects that trigger if a specific condition was met earlier in the turn. This rewards correct sequencing and knowledge of your class rotation without making the mechanic keyword-dependent.

Example Warlock spells:

| Spell | Cost | Effect |
|---|---|---|
| Corruption | 1 mana | Curse a minion — it dies at end of their next turn |
| Drain Soul | 2 mana + 1 Shard | Destroy a damaged minion, heal for its attack value |
| Rain of Fire | 3 mana | Deal 1 damage to ALL minions |
| Soulfire | 1 mana + 1 Shard | Deal 4 damage. Discard a random card |
| Dark Pact | 0 mana | Sacrifice a friendly demon, restore 8 health |
| Summon Infernal | 6 mana + 3 Shards | Summon a 6/6 demon. Deal 3 damage to your hero |

### Minions — Neutral Build Nodes
Approximately 80% of minions are neutral — available to any class. Minions are not the source of class identity. Instead they are **build-defining passive nodes** that shape how your hero plays at a fundamental level.

Each minion has a passive ability that modifies your gameplan in a broad way — not augmenting specific spells but changing core stats and behaviors. Think Path of Exile passive nodes, not Hearthstone tribal synergies. The same minion played in a Paladin deck versus a Warlock deck creates a completely different outcome because the underlying hero is different.

Passive categories:

- **Offense** — increases damage output, attack values, or aggressive pressure
- **Defense / Sustain** — increases health thresholds, reduces incoming damage, regenerates health
- **Economy** — increases mana efficiency, draw rate, or resource generation speed
- **Tempo** — reduces costs, grants extra actions, rewards chaining plays
- **Class Resource** — modifies how class resources are generated or spent

Example neutral minions:

| Minion | Stats | Cost | Passive |
|---|---|---|---|
| Ironhide Veteran | 4/5 | 5 | Your hero takes 1 less damage from spells |
| Grimtooth Imp | 2/1 | 1 | Deal 1 damage to the enemy hero whenever you play a card |
| Soul Warden | 1/4 | 2 | Gain 1 class resource at the start of your turn |
| Bonecaller | 3/3 | 4 | Whenever you spend class resources, summon a 1/1 Skeleton |
| Warborn Grunt | 3/2 | 3 | Your minions deal +1 damage when they attack |
| Arcane Vessel | 2/3 | 3 | Your first card each turn costs 1 less mana |

The remaining ~20% of minions are class-specific — iconic, memorable, and deeply tied to class fantasy. These are rarer and represent the signature creatures of each class (demons for Warlock, undead for Necromancer, totems for Shaman, etc.).

### Weapons
Approximately 50% neutral, 50% class-specific. Heroes can equip a weapon giving them a persistent attack value and durability. Weapons are consumed on use. Class weapons often interact with class resources.

### Relics *(planned post-prototype)*
Persistent enchantments that sit in a dedicated Relic zone. Activate effects each turn or in response to conditions. Neither minion nor spell — a third persistent card type.

---

## Spec Building — How Your Build Evolves

Your build is not predetermined. It emerges through gameplay from two sources:

### Pre-Game Draft — Starting Nodes
Before the match begins, each player selects **2 passive nodes** from a randomised set of 5 options. These minion passives are active from turn 1, giving each player immediate build identity without requiring them to draw specific cards. This is your character's starting spec — a skeleton that gameplay will flesh out.

### Soul Binding — Building Through Play
When one of your minions dies in combat, you are presented with a choice: let it go, or **Bind its Soul** by spending 1 class resource. A bound minion's passive becomes a permanent part of your hero for the rest of the match — even if its card is gone.

This makes death meaningful. You want your minions to fight, trade, and fall — because each death is an opportunity to deepen your spec. Early game your passive build is sparse. Late game you are a layered, passive-rich engine built from the fallen. Losing a minion is no longer purely a loss — it is a potential investment.

Opponents can prevent Soul Binding by using spells that banish or transform minions rather than simply destroying them — a counterplay layer built naturally into the spell design space.

---

## Combat System

### Core Loop
Minions attack **minions only** — they can never directly target the enemy hero. Only **spells and hero abilities** deal face damage. This ensures that class spell identity remains the primary win condition while minions serve a distinct tactical role.

### How Damage Reaches the Hero — Overpenetration
When a spell targets the enemy hero, it must first pass through their board. Minions act as a living shield. A 5 damage spell aimed at a hero with a 3 health minion in play kills that minion and deals the remaining 2 damage to the hero. Clearing the board is not just a tempo play — it is the prerequisite to dealing face damage. A full board is a fully defended hero.

This creates the central strategic tension of the game:
1. You clear their board to open their face
2. They rebuild their board to close it
3. You decide whether to keep clearing or press damage
4. They decide whether to rebuild defensively or push their own damage

### Ward Keyword
Certain minions carry the **Ward** keyword. Ward minions intercept all spells targeting your hero regardless of board position — the spell redirects to the Ward minion first. A Ward minion must be destroyed before any spell can reach your hero's health directly. Ward minions still die to normal minion combat as usual.

Ward is a specific keyword on select minions, not a universal mechanic — it is a design space for dedicated defensive cards that create a stronger protection guarantee than standard overpenetration.

### Turn Structure
1. Draw a card
2. Gain a mana crystal (max 10)
3. Gain class resource passively if applicable
4. Play cards in any order — spells, minions, weapons
5. Attack with any minions (each can attack once per turn)
6. End turn

---

## Deckbuilding

Players build a deck of 30 cards. Constraints:
- 1 hero class selected at deck creation
- Any neutral card can be included
- Only your class's specific cards can be included
- Maximum 2 copies of any non-legendary card
- Maximum 1 copy of any legendary card

Deckbuilding is primarily about selecting which neutral minion passives complement your class's spell win condition and playstyle. You are not filling a curve — you are assembling a build. Which passive nodes do you want available to Soul Bind? Which starting draft nodes synergise with your spell rotation? These are the meaningful decisions.

---

## Win Condition

Reduce the enemy hero's health to 0. Heroes start at 30 health. In 2v2, each hero has their own health pool — both enemy heroes must be eliminated to win the match.

---

---

## 20-Second Pitch

Realm's Edge is a class-based fantasy card game where your class's spells are your identity and minions are passive build nodes that permanently shape your hero as they die in battle. You're not filling a hand of creatures to attack with — you're assembling a spec, like a Path of Exile passive tree, while using your class spells to burn through the enemy's defences. It plays fast, every class feels completely different, and no two games with the same class play out the same way.
