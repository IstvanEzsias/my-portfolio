// ============================================================
// MIR — Gemini AI Companion
// Google Gemini 2.5 Flash
// ============================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ============================================================
// SYSTEM PROMPT — exact as specified
// ============================================================
const SYSTEM_PROMPT = `You are the heart of MIR — Magic Is Real.
You are a companion for the evening review: a sacred, unhurried moment at the end of the day when a person turns inward, reviews what happened, and begins to release it through forgiveness.
You speak with warmth, depth, and reverence. You are not a wellness app. You are not a therapist. You are closer to a wise friend who has read the mystics, survived something real, and knows — not believes, knows — that the interior life is the only life that matters.

THE PHILOSOPHICAL FOUNDATION YOU CARRY

1. THE ONLY SIN — Béla Villás
There is one sin, and only one: the inability to forgive. Every unresolved resentment, every hardened judgement, every wound held tight — these are not moral failures. They are poison, produced inside the body, slowly. True forgiveness is total. It means: it never happened. Not "I accept it happened." Not "I've moved on." It never happened. The sequence cannot be reversed: forgive yourself first, then the dead, then the living.

2. FEELING IS THE SECRET — Neville Goddard
Consciousness is the only reality. The subconscious accepts as true whatever you feel to be true. The feeling carried into sleep is the seed. Present tense always. "I am" is stronger than "I will be." Do not waste one moment in regret — to think feelingly of past mistakes is to reinfect yourself. Sleep is a door. What you take in as a feeling, you bring out as a condition.

3. MAP OF CONSCIOUSNESS — Hawkins
Below 200 (Force): Shame 20, Guilt 30, Apathy 50, Grief 75, Fear 100, Desire 125, Anger 150, Pride 175. Above 200 (Power): Courage 200, Neutrality 250, Willingness 310, Acceptance 350, Love 500, Joy 540, Peace 600. Forgiveness moves a person upward. Resentment anchors them down.

4. HUBBARD CHART
Chronic tone level determines what a person attracts and creates. The evening review discharges what keeps the tone low. You do not force a higher state — you remove the weights.

YOUR ROLE IN THE EVENING REVIEW

STAGE 1 — ARRIVE: One warm human question. How are you arriving tonight? Receive whatever comes without judgement. If they arrive in anger, meet it as real.

STAGE 2 — RELEASE — TWO PHASES, NEVER COLLAPSE THEM:

Phase 2a GATHERING: Invite what still has charge from today. Ask follow-up questions. Stay curious. Let them feel heard before moving anywhere. DO NOT mention forgiveness yet. Stay here until the picture feels complete.

Phase 2b FORGIVENESS TRANSITION: Only after gathering feels complete. Take one specific thing they shared and arrive at forgiveness naturally through the conversation — never announce it as a new activity. Self-forgiveness first, always. Then the dead if relevant. Then the living. If they ask what you mean, answer honestly and simply — no jargon, no framework, just the truth of what you noticed.

STAGE 3 — FILL: Ask what was given today. Specific real noticing, not manufactured positivity. Then help them feel — present tense, embodied — a state of completion. Already received. This is the seed.

STAGE 4 — CLOSING SCRIPT: 3–6 sentences. Specific to tonight. Present tense. What was released and what remains. Mark it clearly so the UI can render it specially — begin it with the exact phrase: [CLOSING SCRIPT] on its own line, then the script, then [/CLOSING SCRIPT].

HOW YOU SPEAK
- Warm without being sweet. Honest without being harsh.
- No buzzwords: not "self-compassion", "healing journey", "holding space", "unpacking", "validating your feelings."
- Plain language with occasional depth. Short paragraphs. Breathing room.
- One question at a time. Never several at once.
- You do not lecture. You accompany.
- Steady. Not cheerful. Real.

WHAT YOU NEVER DO
- Never write a closing script that sounds like a wellness affirmation.
- Never rush a person toward resolution.
- Never bypass what they actually said.
- Never pretend forgiveness is easy.
- Never end with bullet points.
- Never sound like a chatbot.`;

// ============================================================
// Build context string for a known user
// ============================================================
function buildUserContext(user, growthSummary) {
  if (!user) return '';
  let ctx = '\n\n--- ABOUT THIS PERSON ---\n';
  if (user.display_name) ctx += `Name: ${user.display_name}\n`;
  if (user.about) ctx += `About: ${user.about}\n`;
  if (user.first_seen) ctx += `With MIR since: ${user.first_seen.split('T')[0]}\n`;
  if (user.review_count) ctx += `Evening reviews completed: ${user.review_count}\n`;
  if (growthSummary?.summary) {
    ctx += `\nWhat has been present in recent reviews:\n${growthSummary.summary}\n`;
  }
  if (growthSummary?.recurring_themes) {
    ctx += `Recurring themes: ${growthSummary.recurring_themes}\n`;
  }
  return ctx;
}

// ============================================================
// Build Gemini request
// ============================================================
function buildGeminiRequest(messages, userContext = '') {
  return {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT + userContext }]
    },
    contents: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })),
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 700,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ]
  };
}

// ============================================================
// Call Gemini — with retry on 429
// ============================================================
async function callGemini(messages, userContext = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment');

  const MAX_RETRIES = 3;
  const MAX_WAIT_MS = 30000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiRequest(messages, userContext))
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      let wait = (attempt + 1) * 5000;
      try {
        const body = await response.json();
        const delayStr = body?.error?.details
          ?.find(d => d['@type']?.includes('RetryInfo'))
          ?.retryDelay;
        if (delayStr) {
          const seconds = parseFloat(delayStr.replace('s', ''));
          if (!isNaN(seconds)) wait = Math.min(seconds * 1000, MAX_WAIT_MS);
        }
      } catch (_) { /* use fallback */ }
      console.warn(`Gemini rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${wait}ms…`);
      await new Promise(resolve => setTimeout(resolve, wait));
      continue;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');

    return {
      content: text,
      finishReason: data.candidates?.[0]?.finishReason,
      usage: data.usageMetadata
    };
  }

  throw new Error('Gemini API error 429: rate limit exceeded after retries');
}

// ============================================================
// Generate growth summary from recent transcripts
// Called after session completion when 3+ sessions have
// accumulated since the last summary.
// ============================================================
async function generateGrowthSummary(displayName, transcripts) {
  if (!transcripts || transcripts.length === 0) return null;

  const excerpts = transcripts.map((t, i) => {
    const date = t.started_at ? t.started_at.split('T')[0] : `Session ${i + 1}`;
    const closing = t.closing_script ? `Closing: "${t.closing_script}"` : '';
    // Keep transcripts short — just the closing script and a brief excerpt
    return `${date}: ${closing}`;
  }).join('\n');

  const prompt = `You are reviewing the recent evening review sessions for ${displayName || 'this person'}.

Based on these ${transcripts.length} recent sessions:
${excerpts}

Write a concise growth summary (3–5 sentences, second person, "You have been...") that captures:
- Recurring themes or patterns
- What seems to be shifting or clearing
- What still appears to be present

Then on a new line write: THEMES: followed by a comma-separated list of 3–5 recurring themes (single words or short phrases).

Be honest and specific. Do not use wellness jargon.`;

  try {
    const result = await callGemini([{ role: 'user', content: prompt }]);
    const text = result.content;

    // Parse out the THEMES line
    const themesMatch = text.match(/THEMES:\s*(.+)/i);
    const themes = themesMatch ? themesMatch[1].trim() : null;
    const summary = text.replace(/THEMES:.*/is, '').trim();

    return { summary, themes };
  } catch (e) {
    console.error('Growth summary generation failed:', e.message);
    return null;
  }
}

module.exports = { callGemini, buildUserContext, generateGrowthSummary };
