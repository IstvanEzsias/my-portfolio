// ============================================================
// MIR — Daily Rotating Quotes
// Sources: Béla Villás, Neville Goddard, Jesus on forgiveness
// ============================================================

const QUOTES: Array<{ text: string; source: string }> = [
  { text: "Do not let the sun go down on your anger.", source: "Ephesians 4:26" },
  { text: "Do not waste one moment in regret, for to think feelingly of the mistakes of the past is to reinfect yourself.", source: "Neville Goddard" },
  { text: "The only sin is the inability to forgive.", source: "Béla Villás" },
  { text: "Feeling is the secret. The feeling carried into sleep is the seed.", source: "Neville Goddard" },
  { text: "Forgive, and you will be forgiven.", source: "Luke 6:37" },
  { text: "True forgiveness means it never happened. Not 'I've moved on.' It never happened.", source: "Béla Villás" },
  { text: "Assume the feeling of the wish fulfilled and observe the route that your attention follows.", source: "Neville Goddard" },
  { text: "If you forgive those who sin against you, your heavenly Father will forgive you.", source: "Matthew 6:14" },
  { text: "Forgive yourself first. Then the dead. Then the living. The sequence cannot be reversed.", source: "Béla Villás" },
  { text: "Man's chief delusion is his conviction that there are causes other than his own state of consciousness.", source: "Neville Goddard" },
  { text: "How many times shall I forgive? Not seven times, but seventy-seven times.", source: "Matthew 18:22" },
  { text: "Sleep is a door. What you take in as a feeling, you bring out as a condition.", source: "Neville Goddard" },
  { text: "Resentment held inside becomes poison. Slowly.", source: "Béla Villás" },
  { text: "Go to sleep in thanksgiving — present tense, already received.", source: "Neville Goddard" },
  { text: "Blessed are the merciful, for they will be shown mercy.", source: "Matthew 5:7" },
  { text: "The evening review discharges what keeps the tone low.", source: "Béla Villás" },
  { text: "I am is stronger than I will be. Always speak from what is, not what you hope will be.", source: "Neville Goddard" },
  { text: "The heart of the wise is in the house of mourning; but the heart of fools is in the house of mirth.", source: "Ecclesiastes 7:4" },
  { text: "What is resolved inside you stops having power over you outside.", source: "Neville Goddard" },
  { text: "Every unresolved resentment is a weight. The evening is for setting things down.", source: "Béla Villás" },
];

export function getDailyQuote(): { text: string; source: string } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export default QUOTES;
