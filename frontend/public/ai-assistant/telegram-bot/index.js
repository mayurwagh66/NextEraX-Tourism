import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { GoogleGenerativeAI } from '@google/generative-ai';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in env');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Simple in-memory user state
const userState = new Map(); // userId -> { language, days, interests, budget, group, lastPlan, mode }

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'nag', label: 'Nagpuri (trl)' },
  { code: 'sat', label: 'Santhali (trl)' },
  { code: 'kum', label: 'Kurmali' },
  { code: 'ho', label: 'Ho' },
  { code: 'mun', label: 'Mundari' },
  { code: 'kho', label: 'Khortha (trl)' }
];

function getOrInitState(userId) {
  if (!userState.has(userId)) {
    userState.set(userId, { language: 'en', days: '', interests: '', budget: '', group: '', lastPlan: '', mode: '' });
  }
  return userState.get(userId);
}

function renderSetupTab(state) {
  // Tab-like compact summary (monospace-style, no markdown parsing needed)
  return (
    'Trip Setup\n' +
    '──────────\n' +
    `Language : ${state.language || '-'}\n` +
    `Duration : ${state.days || '-'}\n` +
    `Interests: ${state.interests || '-'}\n` +
    `Budget   : ${state.budget || '-'}\n` +
    `Group    : ${state.group || '-'}\n` +
    '\nReply with any missing info, e.g. "3 days, nature + culture, moderate, family of 4"'
  );
}

function buildSystemPrompt() {
  return `You are a Smart Digital Tourism Assistant for Jharkhand, India. Your role is to help tourists plan customized trips, recommend eco-tourism and cultural experiences, and connect them with local communities. You should ALWAYS generate outputs in the user’s preferred language: English, Hindi, Nagpuri (transliterated), Santhali (transliterated), Kurmali, Ho, Mundari, Khortha (transliterated). Keep place names in their original form.

Capabilities:
- Trip Planning: ask clarifying questions (duration, interests, budget, language, group). Generate a day-by-day itinerary (morning/afternoon/evening), include destinations, activities, food, homestays, local experiences, estimated timings, travel, and fees if known. Keep realistic (max 8–10 hrs/day).
- Personalization: interests (nature, waterfalls, wildlife, culture, heritage, trekking, relaxation), budget (low, moderate, premium), trip length (1–10 days).
- Cultural & Local Focus: highlight tribal crafts, markets, cultural events, homestays, eco-friendly practices, responsible tourism, local guides and artisans.
- Response Format: friendly tone, short summary + detailed day-wise plan, end with a helpful follow-up question.

Always produce succinct Telegram-friendly formatting. Avoid long tables; use bullets and short lines.`;
}

function buildUserPrompt(text) {
  return `User request: ${text}\n\nPlease: 1) Ask any missing clarifying questions briefly if needed; 2) Then propose a tailored itinerary for Jharkhand with realistic timing; 3) Provide a compact day-wise list; 4) End with a short follow-up question.`;
}

async function planWithGemini(text) {
  const system = buildSystemPrompt();
  const user = buildUserPrompt(text);
  const prompt = `${system}\n\n---\n${user}`;
  try {
    const result = await model.generateContent(prompt);
    const response = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return response.trim() || 'Sorry, I could not generate a response right now.';
  } catch (err) {
    const msg = (err && (err.statusText || err.message || '')) + '';
    const isQuota = (err && (err.status === 429 || /Too\s*Many\s*Requests|quota/i.test(msg)));
    if (isQuota) {
      const q = new Error('QUOTA_EXCEEDED');
      q.code = 'QUOTA_EXCEEDED';
      throw q;
    }
    throw err;
  }
}

function formatForTelegram(rawText) {
  if (!rawText) return '';
  let t = rawText;
  // Strip bold/italics and backticks
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/`{1,3}([^`]+)`{1,3}/g, '$1');
  // Remove markdown headings
  t = t.replace(/^#{1,6}\s*/gm, '');
  // Bullet points and common labels → emojis
  t = t.replace(/^\s*[-•]\s*/gm, '• ');
  t = t.replace(/^\s*(Day\s*\d+)/gmi, '📅 $1');
  t = t.replace(/^\s*Morning\b/gi, '☀️ Morning');
  t = t.replace(/^\s*Afternoon\b/gi, '🌤️ Afternoon');
  t = t.replace(/^\s*Evening\b/gi, '🌃 Evening');
  t = t.replace(/\bPlaces?\b/gi, '📍 Places');
  t = t.replace(/\bTravel\b/gi, '🚗 Travel');
  t = t.replace(/\bFee[s]?\b/gi, '💰 Fees');
  // Ensure a blank line after each Day header line
  t = t.replace(/^(📅\s*Day\s*\d+[^\n]*)(?:\n(?!\n)|$)/gmi, '$1\n\n');
  // Compact spacing
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const state = getOrInitState(userId);
  await ctx.reply('Welcome to NextEraX Jharkhand Tourism Assistant! Let’s set your language.');
  const buttons = languageOptions.map((l) => Markup.button.callback(l.label, `lang:${l.code}`));
  // Split into rows of 2
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  await ctx.reply('Choose your language:', Markup.inlineKeyboard(rows));
  // Also show the setup tab
  await ctx.reply(renderSetupTab(state));
});

bot.hears(/Plan a trip/i, (ctx) => {
  ctx.reply('Great! Please share details like: days, interests, budget, language, group size.');
});

bot.hears(/Change language/i, (ctx) => {
  const buttons = languageOptions.map((l) => Markup.button.callback(l.label, `lang:${l.code}`));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  ctx.reply('Choose your language:', Markup.inlineKeyboard(rows));
});

bot.action(/lang:(.+)/, async (ctx) => {
  const userId = ctx.from.id;
  const code = ctx.match[1];
  const selected = languageOptions.find((l) => l.code === code);
  if (!selected) return ctx.answerCbQuery('Unknown language');
  const state = getOrInitState(userId);
  state.language = selected.label;
  await ctx.answerCbQuery(`Language set to ${selected.label}`);
  await ctx.editMessageText(`Language set to: ${selected.label}`);
  await ctx.reply('Now share trip details in one line, e.g. "3 days, nature + culture, moderate, Hindi, 2 adults"');
  await ctx.reply(renderSetupTab(state));
});

bot.command('plan', async (ctx) => {
  const text = ctx.message.text.replace(/^\/plan\s*/i, '').trim();
  if (!text) {
    return ctx.reply('Usage: /plan 3 days, nature + culture, moderate budget, Hindi');
  }
  await ctx.reply('Planning your itinerary...');
  try {
    const reply = await planWithGemini(text);
    const pretty = formatForTelegram(reply);
    const state = getOrInitState(ctx.from.id);
    state.lastPlan = pretty;
    await ctx.reply(pretty, {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Repeat', callback_data: 'plan:repeat' },
            { text: '✨ Refine', callback_data: 'plan:refine' },
            { text: '🆕 New Plan', callback_data: 'plan:new' },
          ],
        ],
      },
    });
  } catch (err) {
    console.error('Gemini error:', err);
    await ctx.reply('Sorry, something went wrong. Try again in a moment.');
  }
});

bot.action('plan:repeat', async (ctx) => {
  const state = getOrInitState(ctx.from.id);
  if (!state.lastPlan) return ctx.answerCbQuery('No plan yet');
  await ctx.answerCbQuery('Repeating last plan');
  await ctx.reply(state.lastPlan, { disable_web_page_preview: true });
});

bot.action('plan:new', async (ctx) => {
  const state = getOrInitState(ctx.from.id);
  state.lastPlan = '';
  await ctx.answerCbQuery('Starting a new plan');
  await ctx.reply('Tell me your new details: days, interests, budget, language, group.');
  await ctx.reply(renderSetupTab(state));
});

bot.action('plan:refine', async (ctx) => {
  await ctx.answerCbQuery('What would you like to change or add?');
  await ctx.reply('Reply with changes (e.g., “add waterfalls on Day 2, lower budget”).');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text || '';
  if (!text) return;

  // Try to parse simple parameters from free text
  const state = getOrInitState(userId);
  const lower = text.toLowerCase();
  const daysMatch = lower.match(/(\d+)\s*day/);
  if (daysMatch) state.days = `${daysMatch[1]} days`;
  if (lower.includes('moderate')) state.budget = 'moderate';
  else if (lower.includes('premium')) state.budget = 'premium';
  else if (lower.includes('low')) state.budget = 'low';
  const interests = [];
  ['nature', 'waterfalls', 'wildlife', 'culture', 'heritage', 'trekking', 'relaxation']
    .forEach((k) => { if (lower.includes(k)) interests.push(k); });
  if (interests.length) state.interests = interests.join(', ');
  const groupMatch = lower.match(/(family|couple|solo|group|adults?|kids?)/);
  if (groupMatch) state.group = groupMatch[0];

  try {
    const reply = await planWithGemini(text);
    const pretty = formatForTelegram(reply);
    state.lastPlan = pretty;
    await ctx.reply(renderSetupTab(state));
    await ctx.reply(pretty, {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔁 Repeat', callback_data: 'plan:repeat' },
            { text: '✨ Refine', callback_data: 'plan:refine' },
            { text: '🆕 New Plan', callback_data: 'plan:new' },
          ],
        ],
      },
    });
  } catch (err) {
    console.error('Gemini error:', err);
    await ctx.reply('Sorry, something went wrong. Try again in a moment.');
  }
});

bot.launch().then(() => {
  console.log('Telegram bot started (long polling).');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


