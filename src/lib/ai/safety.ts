/**
 * Crisis-language detection — runs BEFORE any model call on chat/journal input.
 * Deliberately simple and conservative: pattern match, no AI in the loop.
 */

const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill(ing)?\s+myself|end(ing)?\s+my\s+life|suicid\w*|self[\s-]?harm)\b/i,
  /\b(want|going|plan(ning)?)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b/i,
  /\bhurt(ing)?\s+myself\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on)\b/i,
  /\b(overdose|cutting\s+myself)\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export function crisisResponse(countryCode: string | null): string {
  const inIndia = countryCode === "IN";
  const resources = inIndia
    ? "• AASRA: 9820466726 (24×7)\n• iCall: 9152987821 (Mon–Sat, 10am–8pm)\n• Tele-MANAS: 14416 (24×7, Govt. of India)"
    : "• 988 Suicide & Crisis Lifeline: call or text 988 (US)\n• Samaritans: 116 123 (UK & ROI)\n• Find a helpline worldwide: findahelpline.com";
  return (
    "I'm really glad you told me this, and I want to pause our reading here — " +
    "because what you're carrying deserves real human support, not a card or a chart.\n\n" +
    "Please reach out to someone now:\n" +
    resources +
    "\n\nIf you're in immediate danger, please contact local emergency services. " +
    "I'm here to sit with you, but a trained person can walk beside you in a way I can't. " +
    "You matter beyond anything a sky could say."
  );
}
