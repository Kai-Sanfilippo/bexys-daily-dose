// ---------- daily background palette ----------
// One curated, mature palette per day of week (index = Date#getDay()).

const DAY_PALETTES = [
  { bg1: '#d9b8b0', bg2: '#c2beb5', bg3: '#f1e8e2', blob1: '#b06f61', blob2: '#8a8478', blob3: '#ddc4bb' }, // Sun — rosewood & stone
  { bg1: '#e8c9b0', bg2: '#d8ceb0', bg3: '#f5ece0', blob1: '#cf9873', blob2: '#93a06e', blob3: '#e3c98f' }, // Mon — terracotta & olive
  { bg1: '#e3c6cf', bg2: '#c9d0d8', bg3: '#f2e9e4', blob1: '#c98fa0', blob2: '#7d8fa3', blob3: '#e0c7cf' }, // Tue — dusty rose & slate
  { bg1: '#e6d3a3', bg2: '#b9c7ae', bg3: '#f5eedd', blob1: '#cba24e', blob2: '#5c7a63', blob3: '#e8dcae' }, // Wed — muted gold & forest
  { bg1: '#d8c0d3', bg2: '#c3cdb8', bg3: '#f0e8e6', blob1: '#9c6f92', blob2: '#8fa383', blob3: '#ddc9d8' }, // Thu — plum & sage
  { bg1: '#e0b9a6', bg2: '#aec2b6', bg3: '#f4ebe0', blob1: '#c98868', blob2: '#6f9584', blob3: '#e6cdb8' }, // Fri — clay & eucalyptus
  { bg1: '#e8cf9e', bg2: '#a8c4c1', bg3: '#f6efdd', blob1: '#cc9a4e', blob2: '#4f8a84', blob3: '#ead9ab' }, // Sat — amber & teal
];

function applyDayPalette() {
  const p = DAY_PALETTES[new Date().getDay()];
  const root = document.documentElement.style;
  root.setProperty('--bg1', p.bg1);
  root.setProperty('--bg2', p.bg2);
  root.setProperty('--bg3', p.bg3);
  root.setProperty('--blob1', p.blob1);
  root.setProperty('--blob2', p.blob2);
  root.setProperty('--blob3', p.blob3);
}
applyDayPalette();

const CATEGORIES = {
  health: {
    facts: HEALTH_FACTS,
    questions: HEALTH_QUESTIONS,
    label: "Today's Women's Health Fact",
    archiveTitle: 'Past Health Facts',
    icon: '🌱',
    revealText: "Tap to reveal today's fact",
    emptyText: 'Nothing here yet — check back after your next visit 🌱',
  },
  disney: {
    facts: DISNEY_FACTS,
    questions: DISNEY_QUESTIONS,
    label: "Today's Disney Fact",
    archiveTitle: 'Past Disney Facts',
    icon: '🏰',
    revealText: "Tap to reveal today's Disney magic",
    emptyText: 'Nothing here yet — check back after your next visit 🏰',
  },
};

const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayKey = () => dateKey(new Date());
const revealedKey = (cat) => `revealed-${cat}-${todayKey()}`;

const flipCard = document.getElementById('flipCard');
const flipInner = document.getElementById('flipInner');
const revealBtn = document.getElementById('revealBtn');
const archiveOverlay = document.getElementById('archiveOverlay');

let activeCat = localStorage.getItem('activeTab') || 'health';

// ---------- visited-day tracking (per category) ----------

function getVisited(cat) {
  return JSON.parse(localStorage.getItem(`visited-${cat}`) || '[]');
}
function recordVisit(cat) {
  const arr = getVisited(cat);
  const today = todayKey();
  if (!arr.includes(today)) {
    arr.push(today);
    localStorage.setItem(`visited-${cat}`, JSON.stringify(arr));
  }
}

// ---------- tab rendering ----------

function switchTab(cat) {
  activeCat = cat;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.cat === cat));
  document.body.dataset.theme = cat === 'disney' ? 'disney' : 'health';

  const conf = CATEGORIES[cat];
  document.getElementById('factLabel').textContent = conf.label;
  document.getElementById('revealIcon').textContent = conf.icon;
  document.getElementById('revealText').textContent = conf.revealText;
  document.getElementById('fact').textContent = factForDate(conf.facts, new Date());

  const revealed = !!localStorage.getItem(revealedKey(cat));
  if (revealed) recordVisit(cat);

  flipInner.classList.add('instant');
  flipCard.classList.toggle('flipped', revealed);
  requestAnimationFrame(() => flipInner.classList.remove('instant'));
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.cat === activeCat) return;
    localStorage.setItem('activeTab', btn.dataset.cat);
    switchTab(btn.dataset.cat);
  });
});

document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

switchTab(activeCat);

// ---------- streak ----------

function trackStreak() {
  const today = todayKey();
  const last = localStorage.getItem('lastVisit');
  let streak = parseInt(localStorage.getItem('streak') || '0', 10);

  if (last !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = last === dateKey(yesterday) ? streak + 1 : 1;
    localStorage.setItem('lastVisit', today);
    localStorage.setItem('streak', String(streak));
  }

  const maxStreak = Math.max(streak, parseInt(localStorage.getItem('maxStreak') || '0', 10));
  localStorage.setItem('maxStreak', String(maxStreak));

  const el = document.getElementById('streak');
  el.textContent = `🔥 ${streak} day${streak === 1 ? '' : 's'}`;
  el.hidden = false;

  return streak;
}
const streak = trackStreak();

// ---------- garden ----------

function stageEmoji(day) {
  if (day <= 2) return '🌱';
  if (day <= 4) return '🌿';
  if (day <= 6) return '🪴';
  return '🌸';
}

function buildDots(filledCount, full) {
  const wrap = document.createElement('div');
  wrap.className = 'garden-dots';
  for (let i = 1; i <= 7; i++) {
    const span = document.createElement('span');
    const filled = i <= filledCount;
    span.className = `g-dot${filled ? ' filled' : ''}${filled && full ? ' full' : ''}`;
    span.textContent = filled ? stageEmoji(filledCount) : '·';
    wrap.appendChild(span);
  }
  return wrap;
}

function renderGarden() {
  const gardenDay = ((streak - 1) % 7) + 1;
  const newDots = buildDots(gardenDay, gardenDay === 7);
  newDots.id = 'gardenDots';
  document.getElementById('gardenDots').replaceWith(newDots);
  document.getElementById('gardenLabel').textContent = gardenDay === 7
    ? 'Garden in full bloom! 🌸'
    : `Day ${gardenDay} of 7 in bloom`;
}
renderGarden();

// ---------- rewards hub ----------

const rewardsOverlay = document.getElementById('rewardsOverlay');
const rewardsBtn = document.getElementById('rewardsBtn');
const rewardsTitle = document.getElementById('rewardsTitle');
const rewardsBody = document.getElementById('rewardsBody');
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5); // ponytail: naive shuffle, fine for small UI lists

function gamesUnlocked() {
  return parseInt(localStorage.getItem('maxStreak') || '0', 10) >= 7;
}
rewardsBtn.textContent = gamesUnlocked() ? '🎁' : '🔒';

function openRewards(celebrate) {
  rewardsOverlay.hidden = false;
  if (gamesUnlocked()) {
    rewardsTitle.textContent = '🎁 Weekly Rewards';
    renderRewardsMenu(celebrate);
  } else {
    rewardsTitle.textContent = '🔒 Weekly Rewards';
    renderLockedView();
  }
}
rewardsBtn.addEventListener('click', () => openRewards(false));
document.getElementById('closeRewards').addEventListener('click', () => { rewardsOverlay.hidden = true; });
rewardsOverlay.addEventListener('click', (e) => {
  if (e.target === rewardsOverlay) rewardsOverlay.hidden = true;
});

function renderLockedView() {
  const gardenDay = ((streak - 1) % 7) + 1;
  const daysLeft = 7 - gardenDay;
  rewardsBody.innerHTML = '';
  rewardsBody.appendChild(buildDots(gardenDay, false));
  const p = document.createElement('p');
  p.className = 'archive-empty';
  p.textContent = daysLeft <= 0
    ? "You're one reveal away — come back tomorrow! 🌱"
    : `${daysLeft} more day${daysLeft === 1 ? '' : 's'} of facts and your Recap Quiz + Memory Match unlock 🎁`;
  rewardsBody.appendChild(p);
}

function renderRewardsMenu(celebrate) {
  rewardsBody.innerHTML = '';
  if (celebrate) {
    const p = document.createElement('p');
    p.className = 'rewards-celebrate';
    p.textContent = "🎉 A full week of facts! You've unlocked two rewards:";
    rewardsBody.appendChild(p);
  }
  const menu = document.createElement('div');
  menu.className = 'rewards-menu';
  menu.innerHTML = `
    <button class="reward-card" id="openQuiz"><span class="reward-emoji">🧠</span>Recap Quiz</button>
    <button class="reward-card" id="openMatch"><span class="reward-emoji">🎴</span>Memory Match</button>
  `;
  rewardsBody.appendChild(menu);
  document.getElementById('openQuiz').addEventListener('click', startQuiz);
  document.getElementById('openMatch').addEventListener('click', startMatch);
}

if (streak > 0 && streak % 7 === 0 && localStorage.getItem('celebratedStreak') !== String(streak)) {
  localStorage.setItem('celebratedStreak', String(streak));
  openRewards(true);
}

// ---------- recap quiz ----------

function collectWeekFacts() {
  const pool = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    Object.keys(CATEGORIES).forEach((cat) => {
      if (localStorage.getItem(`revealed-${cat}-${key}`)) {
        pool.push({ cat, fact: factForDate(CATEGORIES[cat].facts, d) });
      }
    });
  }
  return pool;
}

function startQuiz() {
  const weekFacts = collectWeekFacts();
  if (weekFacts.length < 2) {
    rewardsBody.innerHTML = '<p class="archive-empty">Reveal a couple more facts this week, then come back to quiz yourself!</p>';
    return;
  }

  const allFacts = Object.values(CATEGORIES).flatMap((c) => c.facts);
  const weekSet = new Set(weekFacts.map((w) => w.fact));
  const questions = shuffle(weekFacts).slice(0, 5);
  let qIndex = 0;
  let score = 0;

  function renderQuestion() {
    const q = questions[qIndex];
    const decoys = shuffle(allFacts.filter((f) => !weekSet.has(f))).slice(0, 3);
    const options = shuffle([q.fact, ...decoys]);

    rewardsBody.innerHTML = `
      <p class="quiz-progress">Question ${qIndex + 1} of ${questions.length}</p>
      <p class="quiz-prompt">Which fact did you learn this week?</p>
      <div class="quiz-options" id="quizOptions"></div>
    `;
    const optsEl = document.getElementById('quizOptions');
    options.forEach((fact) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = fact;
      btn.addEventListener('click', () => selectAnswer(fact === q.fact, btn, optsEl, q.fact));
      optsEl.appendChild(btn);
    });
  }

  function selectAnswer(isCorrect, btn, optsEl, correctFact) {
    [...optsEl.children].forEach((b) => { b.disabled = true; });
    if (isCorrect) {
      btn.classList.add('correct');
      score++;
    } else {
      btn.classList.add('wrong');
      const correctBtn = [...optsEl.children].find((b) => b.textContent === correctFact);
      if (correctBtn) correctBtn.classList.add('correct');
    }
    setTimeout(() => {
      qIndex++;
      if (qIndex < questions.length) renderQuestion();
      else renderResult();
    }, 900);
  }

  function renderResult() {
    const pct = score / questions.length;
    const msg = pct === 1
      ? 'Perfect recall — future PA right here! 🩺'
      : pct >= 0.6
        ? "Solid! You're paying attention. 👏"
        : 'A few slipped by — good excuse to keep reading! 🌱';
    rewardsBody.innerHTML = `
      <div class="quiz-result">
        <p class="quiz-score">${score} / ${questions.length}</p>
        <p>${msg}</p>
        <button class="chip-btn" id="backToMenu">Back</button>
      </div>
    `;
    document.getElementById('backToMenu').addEventListener('click', () => renderRewardsMenu(false));
  }

  renderQuestion();
}

// ---------- memory match ----------

function startMatch() {
  const glyphs = shuffle(['🌿', '🏰', '🌸', '⭐', '🍃', '👑', '🎆', '🪴']).slice(0, 6);
  const deck = shuffle([...glyphs, ...glyphs]).map((glyph, id) => ({ id, glyph, matched: false }));
  let first = null;
  let moves = 0;
  let lock = false;

  rewardsBody.innerHTML = `
    <p class="match-status" id="matchStatus">Moves: 0</p>
    <div class="match-grid" id="matchGrid"></div>
  `;
  const grid = document.getElementById('matchGrid');
  deck.forEach((card) => {
    const btn = document.createElement('button');
    btn.className = 'match-card';
    btn.textContent = '❔';
    btn.addEventListener('click', () => flip(card, btn));
    grid.appendChild(btn);
  });

  function flip(card, btn) {
    if (lock || card.matched || btn.classList.contains('flipped')) return;
    btn.textContent = card.glyph;
    btn.classList.add('flipped');

    if (!first) { first = { card, btn }; return; }

    moves++;
    document.getElementById('matchStatus').textContent = `Moves: ${moves}`;
    lock = true;
    const second = { card, btn };

    if (first.card.glyph === second.card.glyph) {
      first.card.matched = true;
      second.card.matched = true;
      first.btn.classList.add('matched');
      second.btn.classList.add('matched');
      first = null;
      lock = false;
      if (deck.every((c) => c.matched)) setTimeout(() => renderMatchWin(moves), 400);
    } else {
      setTimeout(() => {
        first.btn.textContent = '❔';
        first.btn.classList.remove('flipped');
        second.btn.textContent = '❔';
        second.btn.classList.remove('flipped');
        first = null;
        lock = false;
      }, 700);
    }
  }
}

function renderMatchWin(moves) {
  rewardsBody.innerHTML = `
    <div class="quiz-result">
      <p class="quiz-score">🎉 ${moves} moves</p>
      <p>You matched them all!</p>
      <button class="chip-btn" id="backToMenu">Back</button>
    </div>
  `;
  document.getElementById('backToMenu').addEventListener('click', () => renderRewardsMenu(false));
}

// ---------- flip reveal ----------

revealBtn.addEventListener('click', () => {
  localStorage.setItem(revealedKey(activeCat), '1');
  recordVisit(activeCat);
  flipCard.classList.add('flipped');
  burstConfetti();
});

// ---------- confetti ----------

function burstConfetti() {
  const layer = document.getElementById('confettiLayer');
  const bits = activeCat === 'disney'
    ? ['🏰', '✨', '⭐', '👑', '🎆']
    : ['🌿', '🌱', '✨', '💚', '🍃'];
  for (let i = 0; i < 22; i++) {
    const span = document.createElement('span');
    span.className = 'confetti-bit';
    span.textContent = bits[Math.floor(Math.random() * bits.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 160;
    span.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    span.style.setProperty('--dy', `${Math.sin(angle) * dist - 60}px`);
    span.style.setProperty('--rot', `${(Math.random() - 0.5) * 360}deg`);
    span.style.animationDelay = `${Math.random() * 0.15}s`;
    layer.appendChild(span);
    setTimeout(() => span.remove(), 1400);
  }
}

// ---------- copy / share ----------

document.getElementById('shareBtn').addEventListener('click', async (e) => {
  const fact = document.getElementById('fact').textContent;
  try {
    await navigator.clipboard.writeText(`${fact} — Bexy's Daily Dose`);
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch { /* clipboard unavailable, ignore */ }
});

// ---------- daily guess (everyday mini-game) ----------

document.getElementById('guessBtn').addEventListener('click', () => {
  rewardsOverlay.hidden = false;
  rewardsTitle.textContent = '🎯 Daily Guess';
  renderDailyGuess();
});

function guessKey() {
  return `guessed-${activeCat}-${todayKey()}`;
}

function renderDailyGuess() {
  const conf = CATEGORIES[activeCat];
  const today = factForDate(conf.questions, new Date());
  const played = JSON.parse(localStorage.getItem(guessKey()) || 'null');

  // reuse the same decoy answer shown the first time, so reopening today
  // shows the exact same two options rather than a freshly randomized pair.
  const decoyAnswer = played ? played.decoyAnswer : shuffle(conf.questions.filter((x) => x.a !== today.a))[0].a;
  const options = played ? played.options : shuffle([today.a, decoyAnswer]);

  rewardsBody.innerHTML = `
    <p class="quiz-prompt">${today.q}</p>
    <div class="quiz-options" id="guessOptions"></div>
    ${played ? `<p class="archive-empty">${played.pickedCorrect ? 'You got today\'s guess right! 🎯' : 'Not quite — the real answer is highlighted above.'}</p>` : ''}
  `;
  const optsEl = document.getElementById('guessOptions');
  options.forEach((answer) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = answer;

    if (played) {
      btn.disabled = true;
      if (answer === today.a) btn.classList.add('correct');
      else if (answer === played.picked) btn.classList.add('wrong');
    } else {
      btn.addEventListener('click', () => {
        [...optsEl.children].forEach((b) => { b.disabled = true; });
        const isCorrect = answer === today.a;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          const correctBtn = [...optsEl.children].find((b) => b.textContent === today.a);
          if (correctBtn) correctBtn.classList.add('correct');
        }
        localStorage.setItem(guessKey(), JSON.stringify({ options, decoyAnswer, picked: answer, pickedCorrect: isCorrect }));
        renderDailyGuess();
      });
    }
    optsEl.appendChild(btn);
  });
}

// ---------- look back archive ----------

document.getElementById('archiveBtn').addEventListener('click', () => {
  const conf = CATEGORIES[activeCat];
  document.getElementById('archiveTitle').textContent = conf.archiveTitle;

  const list = document.getElementById('archiveList');
  list.innerHTML = '';

  const visited = getVisited(activeCat)
    .filter((d) => d !== todayKey())
    .sort((a, b) => b.localeCompare(a));

  if (visited.length === 0) {
    const p = document.createElement('p');
    p.className = 'archive-empty';
    p.textContent = conf.emptyText;
    list.appendChild(p);
  } else {
    visited.forEach((dateStr) => {
      const d = new Date(`${dateStr}T00:00:00`);
      const details = document.createElement('details');
      details.className = 'a-item';

      const summary = document.createElement('summary');
      summary.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const factP = document.createElement('p');
      factP.className = 'a-fact';
      factP.textContent = factForDate(conf.facts, d);

      details.append(summary, factP);
      list.appendChild(details);
    });
  }

  archiveOverlay.hidden = false;
});
document.getElementById('closeArchive').addEventListener('click', () => { archiveOverlay.hidden = true; });
archiveOverlay.addEventListener('click', (e) => {
  if (e.target === archiveOverlay) archiveOverlay.hidden = true;
});

// ---------- countdown to next fact ----------

function updateCountdown() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const ms = midnight - now;
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  document.getElementById('countdown').textContent = `🌿 next fact in ${h}:${m}:${s}`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ---------- ask about the facts ----------

const ALL_FACTS = [
  ...HEALTH_FACTS.map((fact) => ({ cat: 'health', fact })),
  ...DISNEY_FACTS.map((fact) => ({ cat: 'disney', fact })),
];

const ASK_STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'that', 'this', 'with', 'have', 'has', 'had',
  'not', 'but', 'you', 'your', 'what', 'whats', 'why', 'how', 'when', 'who', 'whos', 'does',
  'did', 'can', 'could', 'would', 'should', 'about', 'from', 'into', 'than', 'then', 'them',
  'they', 'their', 'its', 'tell', 'me', 'please', 'any', 'all', 'today', 'tomorrow', 'yesterday',
]);

function askKeywords(text) {
  return text.toLowerCase().replace(/'s\b/g, '').replace(/'/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !ASK_STOPWORDS.has(w));
}

function answerQuestion(question) {
  const qWords = askKeywords(question);
  if (qWords.length === 0) return 'Try asking with a few more words, like "why does..." or "what is...".';

  let best = null;
  let bestScore = 0;
  ALL_FACTS.forEach(({ fact }) => {
    const factWords = new Set(askKeywords(fact));
    const score = qWords.filter((w) => factWords.has(w)).length;
    if (score > bestScore) { bestScore = score; best = fact; }
  });

  // require at least 2 shared keywords once the question has more than one, so a single
  // coincidental overlap (e.g. "tomorrow") doesn't surface an unrelated fact.
  const minScore = qWords.length === 1 ? 1 : 2;
  if (!best || bestScore < minScore) return "I don't have a fact covering that yet — good one to look up or ask a real PA about! 🌿";
  return best;
}

const askOverlay = document.getElementById('askOverlay');
const askMessages = document.getElementById('askMessages');
const askInput = document.getElementById('askInput');

function addAskMessage(role, text) {
  const div = document.createElement('div');
  div.className = `ask-msg ${role}`;
  div.textContent = text;
  askMessages.appendChild(div);
  askMessages.scrollTop = askMessages.scrollHeight;
}

document.getElementById('askBtn').addEventListener('click', () => {
  askOverlay.hidden = false;
  if (!askMessages.children.length) {
    addAskMessage('bot', "Hi! Ask me anything about the facts on this site 🌿🏰 (I search what's already here — I'm not a full AI, so keep it to topics covered in Health or Disney facts.)");
  }
  askInput.focus();
});
document.getElementById('closeAsk').addEventListener('click', () => { askOverlay.hidden = true; });
askOverlay.addEventListener('click', (e) => {
  if (e.target === askOverlay) askOverlay.hidden = true;
});

document.getElementById('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = askInput.value.trim();
  if (!q) return;
  addAskMessage('user', q);
  askInput.value = '';
  setTimeout(() => addAskMessage('bot', answerQuestion(q)), 300);
});
