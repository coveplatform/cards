// Card art using Unsplash keyword search — consistent per card, fantasy themed.
// Format: https://picsum.photos/seed/{seed}/w/h (fallback) or themed via loremflickr
// Using loremflickr.com which supports keyword queries and is free with no API key.

function artUrl(keywords: string): string {
  // loremflickr returns a consistent image per keyword combo + lock=seed
  const encoded = encodeURIComponent(keywords)
  return `https://loremflickr.com/320/240/${encoded}?lock=${keywords.length * 31 + keywords.charCodeAt(0)}`
}

export const CARD_ART: Record<string, string> = {
  // Warlock spells
  corruption:        artUrl('dark,magic,corruption'),
  soulfire:          artUrl('fire,demon,soul'),
  eye_of_kilrogg:    artUrl('eye,magic,dark'),
  dark_pact:         artUrl('ritual,dark,pact'),
  blood_pact:        artUrl('blood,magic,scroll'),
  drain_soul:        artUrl('soul,spirit,drain'),
  demonic_ritual:    artUrl('demon,ritual,summoning'),
  shadow_bolt:       artUrl('shadow,lightning,dark'),
  rain_of_fire:      artUrl('fire,rain,destruction'),
  soul_rend:         artUrl('soul,tear,dark'),
  hellfire:          artUrl('hell,fire,inferno'),
  chaos_bolt:        artUrl('chaos,magic,explosion'),
  // Warlock minions
  imp_familiar:      artUrl('imp,demon,small'),
  voidwalker:        artUrl('void,demon,dark'),
  void_stalker:      artUrl('void,shadow,creature'),
  soul_harvester:    artUrl('reaper,soul,dark'),
  felguard:          artUrl('demon,warrior,guard'),
  shadow_weaver:     artUrl('shadow,magic,weaver'),
  soul_merchant:     artUrl('merchant,dark,soul'),
  blood_imp:         artUrl('imp,blood,demon'),
  doom_herald:       artUrl('doom,herald,dark'),
  void_seer:         artUrl('seer,void,magic'),
  rift_caller:       artUrl('rift,portal,dark'),
  pit_lord:          artUrl('demon,lord,pit'),
  ritual_overseer:   artUrl('ritual,dark,overseer'),
  abyssal_tyrant:    artUrl('abyss,tyrant,demon'),
  dark_channeler:    artUrl('dark,channeler,magic'),
  void_lord:         artUrl('void,lord,demon'),
  dread_infernal:    artUrl('infernal,dread,demon'),
  soulchain_keeper:  artUrl('chain,soul,keeper'),
  // Paladin spells
  blessing_of_might: artUrl('blessing,light,holy'),
  holy_light:        artUrl('holy,light,radiant'),
  divine_purpose:    artUrl('divine,purpose,light'),
  righteous_smite:   artUrl('righteous,smite,holy'),
  shield_of_the_templar: artUrl('shield,templar,holy'),
  glory_smash:       artUrl('glory,paladin,smash'),
  hammer_of_justice: artUrl('hammer,justice,holy'),
  consecration:      artUrl('consecration,holy,ground'),
  holy_judgment:     artUrl('judgment,holy,divine'),
  divine_storm:      artUrl('divine,storm,holy'),
  libram_of_justice: artUrl('libram,book,holy'),
  lay_on_hands:      artUrl('healing,hands,holy'),
  // Paladin minions
  silver_hand_recruit:    artUrl('paladin,recruit,knight'),
  templar_initiate:       artUrl('templar,initiate,holy'),
  divine_shield_bearer:   artUrl('shield,bearer,paladin'),
  squire_of_light:        artUrl('squire,light,knight'),
  battle_priest:          artUrl('priest,battle,holy'),
  zealous_defender:       artUrl('zealot,defender,paladin'),
  light_herald:           artUrl('herald,light,angel'),
  hand_of_protection:     artUrl('protection,hand,holy'),
  crusading_captain:      artUrl('crusader,captain,knight'),
  lightforged_crusader:   artUrl('crusader,light,forged'),
  valiant_knight:         artUrl('knight,valiant,armor'),
  paladin_champion:       artUrl('paladin,champion,holy'),
  lightsworn_zealot:      artUrl('zealot,lightsworn,paladin'),
  purity_guardian:        artUrl('purity,guardian,holy'),
  high_inquisitor:        artUrl('inquisitor,high,holy'),
  sacred_sunwalker:       artUrl('sacred,sun,walker'),
  avenger_of_light:       artUrl('avenger,light,angel'),
  divine_colossus:        artUrl('colossus,divine,giant'),
  // Tokens
  skeleton_token:    artUrl('skeleton,undead,bone'),
  imp_token:         artUrl('imp,small,demon'),
  // Neutral
  grimtooth_imp:     artUrl('imp,grim,demon'),
  soul_warden:       artUrl('warden,soul,guard'),
  arcane_vessel:     artUrl('arcane,vessel,magic'),
  warborn_grunt:     artUrl('warrior,grunt,war'),
  ironhide_veteran:  artUrl('veteran,iron,warrior'),
  bonecaller:        artUrl('bone,caller,necromancer'),
  stoneskin_guardian: artUrl('stone,guardian,golem'),
  bloodpact_shaman:  artUrl('shaman,blood,pact'),
  void_herald:       artUrl('void,herald,dark'),
  banner_bearer:     artUrl('banner,bearer,warrior'),
}

export function getArt(id: string): string {
  return CARD_ART[id] ?? `https://loremflickr.com/320/240/fantasy,magic?lock=${id.length}`
}
