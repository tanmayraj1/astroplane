export interface TarotCard {
  key: string;
  name: string;
  arcana: "major" | "minor";
  suit: "wands" | "cups" | "swords" | "pentacles" | null;
  numeral: string; // roman numeral (majors) or rank label
  upright: string;
  reversed: string;
  theme: string; // one-line theme used in journal recurrence insights
}

const M = (
  n: number,
  numeral: string,
  name: string,
  upright: string,
  reversed: string,
  theme: string,
): TarotCard => ({
  key: `major_${n}`,
  name,
  arcana: "major",
  suit: null,
  numeral,
  upright,
  reversed,
  theme,
});

const RANKS = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven",
  "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King",
] as const;

function minor(
  suit: "wands" | "cups" | "swords" | "pentacles",
  meanings: Array<[string, string, string]>,
): TarotCard[] {
  return meanings.map(([upright, reversed, theme], i) => ({
    key: `${suit}_${i + 1}`,
    name: `${RANKS[i]} of ${suit[0].toUpperCase()}${suit.slice(1)}`,
    arcana: "minor" as const,
    suit,
    numeral: RANKS[i],
    upright,
    reversed,
    theme,
  }));
}

export const MAJOR_ARCANA: TarotCard[] = [
  M(0, "0", "The Fool", "A leap, a beginning, trust in the unwritten", "Hesitation at the edge, recklessness disguised as freedom", "beginnings"),
  M(1, "I", "The Magician", "Every tool you need is already on the table", "Scattered will, talent waiting on focus", "agency"),
  M(2, "II", "The High Priestess", "The answer is behind the curtain — listen inward", "Noise over intuition, secrets kept from yourself", "intuition"),
  M(3, "III", "The Empress", "Abundance grows where you tend it", "Creative block, care turned to smothering", "nurture"),
  M(4, "IV", "The Emperor", "Structure is a form of love — build the frame", "Rigidity, control mistaken for safety", "structure"),
  M(5, "V", "The Hierophant", "Tradition has something to teach — or to outgrow", "Dogma questioned, your own path forming", "belief"),
  M(6, "VI", "The Lovers", "A real choice, made with the whole heart", "Misalignment, values pulling in two directions", "choice"),
  M(7, "VII", "The Chariot", "Both reins in hand — momentum through will", "Drive without direction, wheels spinning", "momentum"),
  M(8, "VIII", "Strength", "Soft power — courage that doesn't roar", "Self-doubt, force where gentleness would win", "courage"),
  M(9, "IX", "The Hermit", "Step back; the lantern only lights one step", "Isolation past its usefulness", "solitude"),
  M(10, "X", "Wheel of Fortune", "The turn is already happening — ride it", "Resisting a cycle that's closing", "cycles"),
  M(11, "XI", "Justice", "Cause meets effect — weigh it honestly", "An unbalanced account, truth avoided", "balance"),
  M(12, "XII", "The Hanged Man", "The pause is the point — see it upside down", "Stalling dressed as surrender", "surrender"),
  M(13, "XIII", "Death", "An ending that composts into beginning", "Clinging to what has already left", "endings"),
  M(14, "XIV", "Temperance", "The middle path, mixed patiently", "Excess, an imbalance asking for attention", "moderation"),
  M(15, "XV", "The Devil", "Look at the chain — you're holding the key", "Loosening grip of an old pattern", "attachment"),
  M(16, "XVI", "The Tower", "The lightning clears what the foundation couldn't hold", "Disaster averted or delayed — rebuild anyway", "upheaval"),
  M(17, "XVII", "The Star", "Hope, repair, and the long view", "Dimmed faith asking to be refilled", "rebuilding"),
  M(18, "XVIII", "The Moon", "Not everything unclear is untrue — walk slowly", "Fog lifting, fears named and shrinking", "uncertainty"),
  M(19, "XIX", "The Sun", "Unquestionable warmth — let it be simple", "Joy delayed, clouds you can move", "joy"),
  M(20, "XX", "Judgement", "The call to rise — answer it honestly", "Self-judgment louder than the calling", "reckoning"),
  M(21, "XXI", "The World", "A circle completes — stand in the finished thing", "Almost done — one thread left to tie", "completion"),
];

export const MINOR_ARCANA: TarotCard[] = [
  ...minor("wands", [
    ["A spark worth protecting", "A flame waiting on oxygen", "inspiration"],
    ["The world in your hands — plan the leap", "Playing small with a big view", "vision"],
    ["Ships on the horizon — expansion underway", "Delays in what you sent out", "expansion"],
    ["A pause to celebrate what stands", "Restlessness inside stability", "celebration"],
    ["Friction that sharpens — pick your battles", "Conflict avoided at a cost", "competition"],
    ["Victory acknowledged — receive it", "Recognition delayed, doubt creeping", "recognition"],
    ["Hold the high ground you earned", "Overwhelm — defend less, choose more", "defense"],
    ["Everything moves at once — aim first", "Scattered speed, delays in flight", "swiftness"],
    ["Nearly there — guard the last mile", "Fatigue at the threshold", "persistence"],
    ["A heavy load carried alone", "Put some of it down — delegate", "burden"],
    ["Curiosity with matches — explore", "A message stalled, enthusiasm scattered", "curiosity"],
    ["Charge — passion knows the way", "Impulse ahead of plan", "boldness"],
    ["Warmth that leads — magnetic confidence", "Demanding what could be invited", "confidence"],
    ["Vision held with authority", "A leader's shadow — ego in the way", "leadership"],
  ]),
  ...minor("cups", [
    ["A new feeling overflows — let it", "A full cup you keep not drinking", "openness"],
    ["Two currents meeting as one", "A connection asking for repair", "partnership"],
    ["Friendship as medicine — gather", "The circle thinned — reach out", "community"],
    ["A cup offered while you look away", "Apathy lifting — notice the offer", "apathy"],
    ["Three spilled, two standing — grieve, then turn", "Acceptance arriving, loss loosening", "grief"],
    ["Sweetness from the past visits", "Nostalgia holding you backward", "memory"],
    ["Seven doors, one real — choose", "Clarity after the fog of options", "illusion"],
    ["Walking away from the almost-enough", "The return, or fear of leaving", "departure"],
    ["The quiet wish, granted", "Wanting more after getting it", "contentment"],
    ["The full table — emotional homecoming", "Harmony strained at home", "fulfillment"],
    ["A message from the tender side", "Feelings unexpressed, creativity dammed", "sensitivity"],
    ["Romance in motion — follow beauty", "A charming offer, check its depth", "romance"],
    ["Feeling as wisdom — hold the room", "Emotional overflow needing banks", "empathy"],
    ["Calm seas by choice — mastered feeling", "Suppression posing as calm", "composure"],
  ]),
  ...minor("swords", [
    ["Clarity like cold air — name the truth", "A sharp idea, misused or fogged", "clarity"],
    ["A stalemate you're blindfolded inside", "The tiebreak arrives — decide", "indecision"],
    ["The honest ache — let it teach", "Healing begins where denial ends", "heartbreak"],
    ["Rest as strategy, not retreat", "Burnout ignored — lie down first", "rest"],
    ["A win that cost more than it paid", "Making peace after the sting", "conflict"],
    ["Rough water, steady ferry — transition", "Baggage delaying the crossing", "transition"],
    ["A quiet exit with someone's spoons", "The trick revealed — come clean", "strategy"],
    ["Bound only by the story of bound", "The blindfold loosens — step out", "restriction"],
    ["The 3 a.m. spiral — worry outruns fact", "Dawn after the worst night", "anxiety"],
    ["An ending, complete — the worst is done", "Recovery — the blade lifts", "rock-bottom"],
    ["Watchful mind, quick questions", "Gossip, surveillance of the self", "vigilance"],
    ["Full tilt toward the truth", "Haste that cuts the messenger", "urgency"],
    ["Grief-tempered clarity — say it plainly", "Coldness where candor would do", "candor"],
    ["Rule by principle, not mood", "Logic weaponized — soften the verdict", "principle"],
  ]),
  ...minor("pentacles", [
    ["A seed of the tangible — plant it", "An opportunity slipping through planning", "opportunity"],
    ["Juggling in rhythm — flexible balance", "Dropped balls asking for triage", "juggling"],
    ["Craft meets collaboration — build together", "Working alone at a team's task", "craft"],
    ["Holding tight — security or grip?", "Loosening — generosity returns flow", "holding"],
    ["Out in the cold, help lit inside", "The door opens — take the help", "hardship"],
    ["Giving and receiving in true measure", "Strings attached to the gift", "reciprocity"],
    ["Pause at the vine — assess the yield", "Impatience with slow growth", "patience"],
    ["Craft over speed — the apprentice's devotion", "Cut corners dulling the work", "diligence"],
    ["The garden you grew, enjoyed alone and proud", "Luxury unfelt — reconnect to enough", "self-sufficiency"],
    ["Legacy — wealth that outlives a moment", "Family patterns around money surfacing", "legacy"],
    ["A student of the material world", "Procrastination on the practical", "study"],
    ["Slow, thorough, reliable progress", "Stagnation dressed as caution", "steadiness"],
    ["Nurture that also builds — grounded care", "Self-care last on your own list", "groundedness"],
    ["The realm tended well — mastery", "Wealth guarding against feeling", "mastery"],
  ]),
];

export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export function cardByKey(key: string): TarotCard | undefined {
  return FULL_DECK.find((c) => c.key === key);
}

/** Deterministic seeded draw: same user + date + spread → same card. */
export function seededDraw(
  seedStr: string,
  count = 1,
): Array<{ card: TarotCard; reversed: boolean }> {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
  const picked = new Set<number>();
  const out: Array<{ card: TarotCard; reversed: boolean }> = [];
  while (out.length < count && picked.size < FULL_DECK.length) {
    const idx = Math.floor(rand() * FULL_DECK.length);
    if (picked.has(idx)) continue;
    picked.add(idx);
    out.push({ card: FULL_DECK[idx], reversed: rand() < 0.3 });
  }
  return out;
}
