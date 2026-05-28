'use strict';

const GEMINI_API_KEY = ; // provided
const GEMINI_MODEL = 'gemini-1.5-flash';

const form = document.getElementById('planner-form');
const resultEl = document.getElementById('result');
const loaderEl = document.getElementById('loader');
const skeletonEl = document.getElementById('skeleton');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const themeSelect = document.getElementById('theme');
let leafletMap = null;
let nearbyLayer = null;
let lottiePlayer = null;

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('theme-forest', 'theme-water', 'theme-tribal', 'theme-sunset');
  const map = { forest: 'theme-forest', water: 'theme-water', tribal: 'theme-tribal', sunset: 'theme-sunset' };
  root.classList.add(map[theme] || 'theme-forest');
}

(function initTheme() {
  if (!themeSelect) return;
  const saved = localStorage.getItem('jh_theme') || 'forest';
  themeSelect.value = saved;
  applyTheme(saved);
  themeSelect.addEventListener('change', () => {
    const val = themeSelect.value;
    localStorage.setItem('jh_theme', val);
    applyTheme(val);
  });
})();

function initLottie() {
  if (!window.lottie || !lottieEl) return;
  try {
    lottiePlayer = window.lottie.loadAnimation({ container: lottieEl, renderer: 'svg', loop: true, autoplay: true, path: './cartoon.json' });
    lottiePlayer.addEventListener('data_failed', () => {});
  } catch {}
}

window.addEventListener('DOMContentLoaded', initLottie);

function showLoading(isLoading) {
  if (isLoading) {
    loaderEl.hidden = false;
    skeletonEl.hidden = false;
    document.body.classList.add('loading');
  } else {
    loaderEl.hidden = true;
    skeletonEl.hidden = true;
    document.body.classList.remove('loading');
  }
}

const I18N = {
  en: { short: 'Short Itinerary', day: 'Day', plan: 'Plan', weather: 'Weather', temp: 'Temp', wind: 'Wind', nearby: 'Nearby' },
  hi: { short: 'संक्षिप्त यात्रा', day: 'दिन', plan: 'योजना', weather: 'मौसम', temp: 'तापमान', wind: 'हवा', nearby: 'नज़दीक' },
  nag: { short: 'Chhota Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Najdik' },
  sat: { short: 'Chhot Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Pase-paas' },
  kru: { short: 'Chhot Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Najdik' },
  ho:  { short: 'Chhot Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Najdik' },
  mun: { short: 'Chhot Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Najdik' },
  kho: { short: 'Chhot Yatra', day: 'Din', plan: 'Yojna', weather: 'Mausam', temp: 'Tapman', wind: 'Hawa', nearby: 'Najdik' }
};

function t(key) {
  const lang = document.getElementById('language').value || 'en';
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function getSelectedInterests() {
  const chips = document.querySelectorAll('fieldset .chip input[type="checkbox"]');
  const values = [];
  chips.forEach((c) => { if (c.checked) values.push(c.value); });
  return values;
}

function sanitizeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAssistantSystem(languageCode) {
  const languageMap = { en: 'English', hi: 'Hindi', nag: 'Nagpuri (transliterated)', sat: 'Santhali (transliterated)', kru: 'Kurmali (transliterated)', ho: 'Ho (transliterated)', mun: 'Mundari (transliterated)', kho: 'Khortha (transliterated)' };
  const languageName = languageMap[languageCode] || 'English';
  return [
    'You are the Smart Digital Tourism Assistant for Jharkhand, India.',
    'Role: help tourists plan customized trips, recommend eco-tourism and cultural experiences, and connect them with local communities.',
    'Rules:',
    '- Always respond ONLY as the Jharkhand Tourism Assistant. No unrelated content.',
    `- ALWAYS reply fully in the user's preferred language: ${languageName}. Place names remain in original English (e.g., "Hundru Falls", "Betla National Park").`,
    '- Response structure: friendly greeting, short summary, detailed day-wise plan (morning/afternoon/evening), and a helpful follow-up question.',
    '- Ask for missing clarifications briefly if crucial (duration, interests, budget, language, travel group).',
    '- Keep itineraries realistic: 8–10 hours max activities per day with approximate timings and travel details.',
    '- Personalize based on interests (nature, waterfalls, wildlife, culture, heritage, trekking, relaxation), budget (low, moderate, premium), trip length (1–10 days).',
    '- Cultural & local focus: include tribal crafts, markets, cultural events, homestays; encourage eco-friendly practices, responsible tourism; promote local guides and artisans.',
    '- Mention fees only if commonly known; otherwise say "fees vary".',
    '- Encourage homestays and local transport where reasonable. Include simple packing/eco tips where helpful.',
  ].join('\n');
}

function buildUserPrompt(data) {
  const { language, duration, budget, group, startCity, pace, interests, notes } = data;
  const interestList = interests.length ? interests.join(', ') : 'nature, culture';
  const details = [
    `Language: ${language}`,
    `Trip length: ${duration} days`,
    `Budget: ${budget}`,
    `Group: ${group}`,
    `Pace: ${pace}`,
    startCity ? `Starting city: ${startCity}` : null,
    `Interests: ${interestList}`,
    notes ? `Notes: ${notes}` : null
  ].filter(Boolean).join('\n');

  return [
    'Create a customized day-by-day itinerary for Jharkhand.',
    'Include morning/afternoon/evening with realistic timings, travel notes, and food/local experiences.',
    'Highlight homestays, tribal crafts/markets, cultural events, eco-friendly tips, and local guides.',
    'Keep place names in English as-is (e.g., "Hundru Falls").',
    'Keep the itinerary concise: use brief bullets (3–5 per day) and avoid long paragraphs.',
    'Avoid using raw asterisks. Use headings and bullet lists clearly.',
    'At the very end, add a compact Short Itinerary with one line per day as: "Day 1 — ...", "Day 2 — ...".',
    'End with a follow-up question to assist further (e.g., homestay suggestions).',
    'Preferences:',
    details
  ].join('\n');
}

async function callGemini(systemPrompt, userPrompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(GEMINI_MODEL) + ':generateContent?key=' + encodeURIComponent(GEMINI_API_KEY);
  const contents = [ { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] } ];
  const body = { contents, generationConfig: { temperature: 0.8, top_p: 0.95, maxOutputTokens: 1500 } };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const txt = await res.text(); throw new Error('API error: ' + res.status + ' ' + txt); }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  if (!text) throw new Error('Empty response');
  // small delay to let skeleton be visible
  await new Promise(r => setTimeout(r, 250));
  return text;
}

function extractShortItineraryLines(rawText) {
  const lines = rawText.split(/\n/);
  const regex = /^\s*(?:###\s*)?Day\s*(\d+)\s*[—-]\s*(.+)$/i;
  const out = [];
  for (const l of lines) { const m = l.match(regex); if (m) out.push({ day: Number(m[1]), text: m[2].trim() }); }
  out.sort((a, b) => a.day - b.day); return out;
}

function buildItineraryTable(items) {
  if (!items.length) return '';
  let rows = '';
  for (const it of items) { rows += '<tr><td class="day-col">' + sanitizeHtml(t('day')) + ' ' + String(it.day) + '<\/td><td class="plan-col">' + sanitizeHtml(it.text) + '<\/td><\/tr>'; }
  return '<h3>' + sanitizeHtml(t('short')) + '<\/h3><div class="table-wrap"><table class="itinerary-table"><thead><tr><th>' + sanitizeHtml(t('day')) + '<\/th><th>' + sanitizeHtml(t('plan')) + '<\/th><\/tr><\/thead><tbody>' + rows + '<\/tbody><\/table><\/div>';
}

// Wikimedia Commons image search (fallback)
async function fetchCommonsPhoto(place) {
  try { const url = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=' + encodeURIComponent(place + ' Jharkhand') + '&srlimit=1&format=json&origin=*'; const res = await fetch(url); const data = await res.json(); const title = data?.query?.search?.[0]?.title; if (!title) return null; const infoUrl = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&titles=' + encodeURIComponent(title) + '&format=json&origin=*'; const res2 = await fetch(infoUrl); const data2 = await res2.json(); const pages = data2?.query?.pages || {}; const first = Object.values(pages)[0]; return first?.imageinfo?.[0]?.url || null; } catch { return null; }
}

// Wikipedia search + pageimages (preferred)
async function fetchWikipediaImage(query) {
  try { const searchUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(query) + '&format=json&origin=*'; const rs = await fetch(searchUrl); const sd = await rs.json(); const pageid = sd?.query?.search?.[0]?.pageid; if (!pageid) return null; const imgUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&pageids=' + pageid + '&format=json&origin=*'; const ri = await fetch(imgUrl); const id = await ri.json(); const page = id?.query?.pages?.[pageid]; return page?.thumbnail?.source || page?.original?.source || null; } catch { return null; }
}

const PLACE_IMAGES = [
  { key: 'Hundru Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Hundru_Falls.jpg' },
  { key: 'Dassam Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Dassam_Falls.jpg' },
  { key: 'Jonha Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Joona_falls.jpg' },
  { key: 'Hirni Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Hirni_Falls.jpg' },
  { key: 'Panchghagh Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Panchghagh_Falls.jpg' },
  { key: 'Lodh Falls', url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Lodh_Waterfall.jpg' },
  { key: 'Netarhat', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Netarhat_Sunrise_point.jpg' },
  { key: 'Betla National Park', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Betla_National_Park_Tiger.jpg' },
  { key: 'Palamu Fort', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Palamu_Fort.jpg' },
  { key: 'Patratu Valley', url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Patratu_valley.jpg' },
  { key: 'Rock Garden', url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ranchi_Rock_garden.jpg' },
  { key: 'Tagore Hill', url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Tagore_Hill_Ranchi.jpg' },
  { key: 'Jagannath Temple', url: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Jagannath_Temple_Ranchi.jpg' },
  { key: 'Pahari Mandir', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Pahari_Mandir_Ranchi.jpg' },
  { key: 'Deori Mandir', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Deori_Mandir_Ranchi.jpg' },
  { key: 'Dalma Wildlife Sanctuary', url: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Dalma_Wildlife_Sanctuary.jpg' },
  { key: 'Parasnath', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Parasnath_Hill.jpg' }
];

function detectPlaces(rawText) {
  const text = rawText.toLowerCase(); const found = [];
  for (const p of PLACE_IMAGES) { const aliases = [p.key, p.key.replace(' National Park', ''), p.key.replace(' Falls', ''), p.key.replace(' Temple', ''), p.key.replace(' Mandir', '')]; const hit = aliases.some(a => a && text.includes(a.toLowerCase())); if (hit) found.push(p); }
  const dedup = []; const seen = new Set(); for (const f of found) { if (!seen.has(f.key)) { seen.add(f.key); dedup.push(f); } }
  return dedup.slice(0, 8);
}

async function buildGallery(places) {
  if (!places.length) return '';
  let cards = '';
  for (const p of places) {
    const wiki = await fetchWikipediaImage(p.key + ', Jharkhand');
    const commons = !wiki ? await fetchCommonsPhoto(p.key) : null;
    const img = wiki || commons || p.url;
    cards += '<figure class="gallery-card" data-place="' + sanitizeHtml(p.key) + '"><img loading="lazy" src="' + img + '" alt="' + sanitizeHtml(p.key) + '" \/><figcaption>' + sanitizeHtml(p.key) + '<\/figcaption><\/figure>';
  }
  return '<h3>Places Preview<\/h3><div class="gallery-grid">' + cards + '<\/div>';
}

// Geocode with Nominatim
async function geocodePlace(place) {
  const primary = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(place + ', Jharkhand, India');
  const fallback = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent('Ranchi, Jharkhand, India');
  try { const r = await fetch(primary, { headers: { 'Accept-Language': 'en' } }); const d = await r.json(); if (d?.[0]) return d[0]; } catch {}
  const rf = await fetch(fallback, { headers: { 'Accept-Language': 'en' } }); const df = await rf.json(); return df?.[0] || null;
}

// Overpass: nearby POIs (tourism, amenity)
async function fetchNearby(lat, lon) {
  const radius = 15000; const q = `(node(around:${radius},${lat},${lon})[tourism];node(around:${radius},${lat},${lon})[amenity~"restaurant|cafe|hotel|guest_house"];);out center 20;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);
  const res = await fetch(url, { method: 'GET' }); const data = await res.json(); return (data?.elements || []).slice(0, 20);
}

// Open-Meteo current weather
async function fetchWeather(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true';
  const res = await fetch(url); const data = await res.json(); return data?.current_weather || null;
}

function renderMap(lat, lon, label) {
  const mapDiv = document.getElementById('map'); if (!window.L || !mapDiv) return;
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  leafletMap = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lon], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(leafletMap);
  L.marker([lat, lon]).addTo(leafletMap).bindPopup(label || 'Destination').openPopup();
  nearbyLayer = L.layerGroup().addTo(leafletMap);
}

function addNearbyMarkers(elems) {
  if (!leafletMap) return;
  if (nearbyLayer) {
    nearbyLayer.clearLayers();
  } else {
    nearbyLayer = L.layerGroup().addTo(leafletMap);
  }
  for (const e of elems) {
    const lat = e.lat || e.center?.lat;
    const lon = e.lon || e.center?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    const name = e.tags?.name || e.tags?.amenity || e.tags?.tourism || 'Place';
    L.marker([lat, lon]).addTo(nearbyLayer).bindPopup(name);
  }
}

function renderWeather(weather) {
  const box = document.getElementById('weather'); if (!box) return;
  if (!weather) { box.innerHTML = '<h3>' + sanitizeHtml(t('weather')) + '<\/h3><p>No data.<\/p>'; return; }
  const temp = weather.temperature; const wind = weather.windspeed;
  box.innerHTML = '<h3>' + sanitizeHtml(t('weather')) + '<\/h3><p><strong>' + sanitizeHtml(t('temp')) + ':<\/strong> ' + sanitizeHtml(String(temp)) + '°C • <strong>' + sanitizeHtml(t('wind')) + ':<\/strong> ' + sanitizeHtml(String(wind)) + ' km/h<\/p>';
}

function renderNearby(elems) {
  const box = document.getElementById('nearby'); if (!box) return;
  if (!elems || !elems.length) { box.innerHTML = '<h3>' + sanitizeHtml(t('nearby')) + '<\/h3><p>No nearby places found.<\/p>'; if (nearbyLayer) nearbyLayer.clearLayers(); return; }
  let list = '';
  for (const e of elems.slice(0, 10)) { const name = e.tags?.name || e.tags?.amenity || e.tags?.tourism || 'Place'; list += '<li>' + sanitizeHtml(name) + '<\/li>'; }
  box.innerHTML = '<h3>' + sanitizeHtml(t('nearby')) + '<\/h3><ul>' + list + '<\/ul>';
  addNearbyMarkers(elems.slice(0, 20));
}

function revealMapCard() {
  const mapCard = document.getElementById('map-card');
  if (mapCard && mapCard.hasAttribute('hidden')) {
    mapCard.removeAttribute('hidden');
  }
  document.body.classList.add('map-open');
  mapCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function updateMapNearbyWeather(rawText, overridePlace) {
  const options = detectPlaces(rawText); const mainPlace = overridePlace || options?.[0]?.key || 'Ranchi';
  try { const geo = await geocodePlace(mainPlace); if (!geo) throw new Error('geocode fail'); const lat = parseFloat(geo.lat), lon = parseFloat(geo.lon); revealMapCard(); renderMap(lat, lon, mainPlace); const [nearby, weather] = await Promise.all([ fetchNearby(lat, lon).catch(() => []), fetchWeather(lat, lon).catch(() => null) ]); renderNearby(nearby); renderWeather(weather); } catch (e) { console.warn('Map/weather failed', e); revealMapCard(); renderNearby([]); renderWeather(null); }
}

async function renderOutputAsync(rawText) {
  const html = sanitizeMarkdownLike(rawText); const items = extractShortItineraryLines(rawText); const table = buildItineraryTable(items); const places = detectPlaces(rawText); const gallery = await buildGallery(places); resultEl.style.opacity = '0'; resultEl.innerHTML = html + table + gallery; requestAnimationFrame(() => { resultEl.style.transition = 'opacity 250ms ease'; resultEl.style.opacity = '1'; }); // delegate clicks persistently
  const onClick = (ev) => { const card = ev.target.closest && ev.target.closest('.gallery-card'); if (card && card.dataset.place) { updateMapNearbyWeather(rawText, card.dataset.place); return; } const dayRow = ev.target.closest && ev.target.closest('.itinerary-table tr'); if (dayRow) { updateMapNearbyWeather(rawText); return; } };
  // remove previous listener if any, then add
  resultEl.onclick = onClick; }

function sanitizeMarkdownLike(text) {
  const safe = sanitizeHtml(text);
  let html = safe.replace(/^######\s?(.+)$/gim, '<h6>$1<\/h6>').replace(/^#####\s?(.+)$/gim, '<h5>$1<\/h5>').replace(/^####\s?(.+)$/gim, '<h4>$1<\/h4>').replace(/^###\s?(.+)$/gim, '<h3>$1<\/h3>').replace(/^##\s?(.+)$/gim, '<h2>$1<\/h2>').replace(/^#\s?(.+)$/gim, '<h1>$1<\/h1>');
  html = html.replace(/\*\*(.+?)\*\*/gim, '<strong>$1<\/strong>').replace(/(^|\s)\*(.+?)\*(?=\s|$)/gim, '$1<em>$2<\/em>'); html = html.replace(/^(?:\-|\*)\s+(.+)$/gim, '<li>$1<\/li>'); html = html.replace(/(<li>.*?<\/li>\n?)+/gims, (m) => '<ul>' + m + '<\/ul>'); html = html.split(/\n{2,}/).map(block => /<h\d|<ul>|<li>/.test(block) ? block : '<p>' + block.replace(/\n/g, '<br/>') + '<\/p>').join(''); return html;
}

function getFormData() { const language = document.getElementById('language').value; const duration = Number(document.getElementById('duration').value || '3'); const budget = document.getElementById('budget').value; const group = document.getElementById('group').value; const startCity = document.getElementById('startCity').value.trim(); const pace = document.getElementById('pace').value; const interests = getSelectedInterests(); const notes = document.getElementById('notes').value.trim(); return { language, duration, budget, group, startCity, pace, interests, notes }; }

function examplePrompt(languageCode) { if (languageCode === 'hi') return 'उदाहरण: "मुझे 3 दिन का nature और culture ट्रिप चाहिए, बजट moderate।"'; if (languageCode === 'nag') return 'Udaharan: "Humke 2 din ke nature trip chahi, budget low."'; if (languageCode === 'sat') return 'Udaharan: "Aenre 3 din re culture au nature yatra, budget moderate."'; if (languageCode === 'kru') return 'Udaharan: "Hamra 3 din ke yatra chahe, nature-culture, budget moderate."'; if (languageCode === 'ho') return 'Udaharan: "Amo 3 din yatra, nature-culture, budget moderate."'; if (languageCode === 'mun') return 'Udaharan: "Amo 3 din yatra, nature-culture, budget moderate."'; if (languageCode === 'kho') return 'Udaharan: "Hamke 3 din ke yatra chahi, nature-culture, budget moderate."'; return 'Example: "I want a 3-day trip, interests nature and culture, budget moderate."'; }

function setLoading(isLoading) { showLoading(isLoading); generateBtn.disabled = isLoading; }

form.addEventListener('submit', async (e) => {
  e.preventDefault(); setLoading(true); resultEl.innerHTML = '';
  try { const data = getFormData(); const systemPrompt = buildAssistantSystem(data.language); const userPrompt = buildUserPrompt(data); const output = await callGemini(systemPrompt, userPrompt); await renderOutputAsync(output); }
  catch (err) { console.error(err); resultEl.textContent = 'Unable to generate itinerary right now. Please try again.'; }
  finally { setLoading(false); }
});

clearBtn.addEventListener('click', () => { form.reset(); resultEl.innerHTML = sanitizeHtml('Tip: Tell me your duration, interests, budget, group. ' + examplePrompt(document.getElementById('language').value)); });

resultEl.innerHTML = sanitizeHtml('Tip: Tell me your duration, interests, budget, group. ' + examplePrompt(document.getElementById('language').value));

function mountFloatingLottie() {
  // Removed floating assistant logo per user request
}

// window.addEventListener('DOMContentLoaded', () => { mountFloatingLottie(); });
