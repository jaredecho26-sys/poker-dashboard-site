async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function fmtCurrency(n) {
  const abs = Math.abs(n).toFixed(2);
  if (n < 0) return `-$${abs}`;
  if (n > 0) return `+$${abs}`;
  return `$${abs}`;
}

function metric(label, value, sub = '', cls = '') {
  return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value ${cls}">${value}</div><div class="metric-sub">${sub}</div></div>`;
}

function renderMetrics(sessions) {
  const metricsEl = document.getElementById('metrics');
  const totalResult = sessions.reduce((sum, s) => sum + (s.resultSource === 'manual' ? (s.manualResult ?? s.result) : s.result), 0);
  const totalHands = sessions.reduce((sum, s) => sum + s.hands, 0);
  const avgVpip = sessions.length ? sessions.reduce((sum, s) => sum + s.vpipPct, 0) / sessions.length : 0;
  const avgPfr = sessions.length ? sessions.reduce((sum, s) => sum + s.pfrPct, 0) / sessions.length : 0;
  const biggestLoss = Math.min(...sessions.map(s => s.biggestLoss));
  const latest = sessions[sessions.length - 1];
  const latestResult = latest.resultSource === 'manual' ? (latest.manualResult ?? latest.result) : latest.result;

  metricsEl.innerHTML = [
    metric('Total P/L', fmtCurrency(totalResult), `${sessions.length} session${sessions.length === 1 ? '' : 's'}`, totalResult >= 0 ? 'green' : 'red'),
    metric('Hands Logged', totalHands.toLocaleString(), 'across imported sessions'),
    metric('Avg VPIP / PFR', `${avgVpip.toFixed(1)} / ${avgPfr.toFixed(1)}`, 'clean up gap over time'),
    metric('Biggest Loss Hand', fmtCurrency(biggestLoss), 'single-hand downswing', 'red'),
    metric('Latest Session', fmtCurrency(latestResult), latest.sourceFile, latestResult >= 0 ? 'green' : 'red'),
  ].join('');
}

function renderFocus(latest) {
  document.getElementById('results-source').textContent = latest.resultSource === 'manual' ? 'Result source: manual override' : 'Result source: parser';
  document.getElementById('focusPanel').innerHTML = `
    <div class="focus-box">
      <h3>Current Study Focus</h3>
      <p>${latest.studyFocus || 'No study focus set yet.'}</p>
    </div>
    <div class="focus-box">
      <h3>Session Notes</h3>
      <p>${latest.notes || 'No notes added yet.'}</p>
    </div>
    <div class="focus-box">
      <h3>Manual Result Controls</h3>
      <p>${latest.resultSource === 'manual' ? `Buy-ins: $${(latest.buyIns ?? 0).toFixed(2)} · Cash out: $${(latest.cashOut ?? 0).toFixed(2)} · Manual P/L: ${fmtCurrency(latest.manualResult ?? latest.result)}` : 'Using parsed result only.'}</p>
    </div>`;
}

function renderSessions(sessions) {
  const body = document.getElementById('sessionsBody');
  body.innerHTML = sessions.slice().reverse().map(s => {
    const result = s.resultSource === 'manual' ? (s.manualResult ?? s.result) : s.result;
    return `<tr>
      <td>${s.startedAt.slice(0,10)}</td>
      <td>${s.platform}</td>
      <td>${s.hands}</td>
      <td class="${result >= 0 ? 'result-pos' : 'result-neg'}">${fmtCurrency(result)}</td>
      <td>${s.vpipPct}% / ${s.pfrPct}% / ${s.threeBetPct}%</td>
      <td>${s.notes || ''}</td>
    </tr>`;
  }).join('');
}

// ── Card rendering helpers ─────────────────────────────────────────────────
const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_COLORS  = { s: 'cs', h: 'ch', d: 'cd', c: 'cc' };

function cardChip(cardStr) {
  if (!cardStr || cardStr.length < 2) return '';
  const rank = cardStr.slice(0, -1).toUpperCase();
  const suit = cardStr.slice(-1).toLowerCase();
  const sym  = SUIT_SYMBOLS[suit] || suit;
  const cls  = SUIT_COLORS[suit]  || '';
  return `<span class="card-chip ${cls}">${rank}<sup>${sym}</sup></span>`;
}

function cardsHtml(str) {
  return (str || '').trim().split(/\s+/).filter(Boolean).map(cardChip).join('');
}

const TAG_META = {
  good:   { icon: '✅', label: 'Good play' },
  bad:    { icon: '❌', label: 'Mistake'   },
  cooler: { icon: '🧊', label: 'Cooler'    },
  study:  { icon: '📚', label: 'Study'     },
};

const ACTION_BADGE = {
  bet:   { cls: 'ab-bet',   icon: '↑' },
  raise: { cls: 'ab-raise', icon: '⬆' },
  call:  { cls: 'ab-call',  icon: '→' },
  check: { cls: 'ab-check', icon: '✓' },
  fold:  { cls: 'ab-fold',  icon: '×' },
};

function buildTimeline(actions) {
  if (!actions || !actions.length) return '';
  const streets = {};
  actions.forEach(a => {
    const s = a.street || 'UNKNOWN';
    if (!streets[s]) streets[s] = [];
    streets[s].push(a);
  });
  const streetOrder = ['PREFLOP', 'FLOP', 'TURN', 'RIVER'];
  return streetOrder.filter(s => streets[s]).map(s => {
    const acts = streets[s].map(a => {
      const t = (a.type || '').toLowerCase();
      const b = ACTION_BADGE[t] || { cls: 'ab-other', icon: '·' };
      const amt = a.amount > 0 ? `<span class="ab-amt">$${a.amount.toFixed(0)}</span>` : '';
      return `<span class="action-badge ${b.cls}">${b.icon} ${t}${amt}</span>`;
    }).join('');
    return `<div class="timeline-street"><span class="street-label">${s}</span><div class="street-actions">${acts}</div></div>`;
  }).join('');
}

let _allHands = [];
let _activeHandFilter = 'all';

function renderHandCards(hands, filter) {
  const wrap = document.getElementById('taggedHands');
  const filtered = filter === 'all' ? hands : hands.filter(h => h.tag === filter);
  if (!filtered.length) {
    wrap.innerHTML = `<div class="hand-empty">No ${filter} hands yet.</div>`;
    return;
  }
  wrap.innerHTML = filtered.slice().reverse().map((h, idx) => {
    const tm = TAG_META[h.tag] || { icon: '●', label: h.tag };
    const netCls = h.net >= 0 ? 'net-pos' : 'net-neg';
    const boardCards = (h.board || []).map(cardChip).join('');
    const tlHtml = buildTimeline(h.actions);
    const id = `hand-detail-${h.handId}`;
    return `
<div class="hand-card hand-card--${h.tag}">
  <div class="hc-header">
    <div class="hc-cards">${cardsHtml(h.heroCards)}</div>
    <div class="hc-mid">
      <div class="hc-id">Hand #${h.handId}</div>
      <div class="hc-time">${h.timestamp.slice(0,10)}</div>
    </div>
    <div class="hc-right">
      <div class="hc-net ${netCls}">${fmtCurrency(h.net)}</div>
      <span class="tag ${h.tag}">${tm.icon} ${tm.label}</span>
    </div>
  </div>
  ${boardCards ? `<div class="hc-board"><span class="board-label">Board</span>${boardCards}</div>` : ''}
  <button class="hc-toggle" onclick="toggleHandDetail('${id}')" aria-expanded="false">Show details ▾</button>
  <div class="hc-detail" id="${id}" hidden>
    <div class="hc-timeline">${tlHtml}</div>
    <div class="hc-note">${h.note || ''}</div>
  </div>
</div>`;
  }).join('');
}

function toggleHandDetail(id) {
  const el  = document.getElementById(id);
  const btn = el?.previousElementSibling;
  if (!el) return;
  const isHidden = el.hidden;
  el.hidden = !isHidden;
  if (btn) {
    btn.textContent = isHidden ? 'Hide details ▴' : 'Show details ▾';
    btn.setAttribute('aria-expanded', String(isHidden));
  }
}

function renderHands(hands) {
  _allHands = hands;
  // Build filter tabs
  const tabsEl = document.getElementById('handFilterTabs');
  const tagCounts = { all: hands.length };
  hands.forEach(h => { tagCounts[h.tag] = (tagCounts[h.tag] || 0) + 1; });
  const tagOrder = ['all', 'good', 'bad', 'cooler', 'study'];
  tabsEl.innerHTML = tagOrder.filter(t => tagCounts[t]).map(t =>
    `<button class="hf-btn ${t === 'all' ? 'active' : ''}" data-filter="${t}">${
      t === 'all' ? 'All' : (TAG_META[t]?.icon + ' ' + TAG_META[t]?.label || t)
    } <span class="hf-count">${tagCounts[t]}</span></button>`
  ).join('');
  tabsEl.querySelectorAll('.hf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeHandFilter = btn.dataset.filter;
      tabsEl.querySelectorAll('.hf-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderHandCards(_allHands, _activeHandFilter);
    });
  });
  renderHandCards(hands, 'all');
}

function renderPreflopChart(chart) {
  const wrap = document.getElementById('preflopChart');
  wrap.innerHTML = chart.map(spot => `
    <div class="study-card">
      <h3>${spot.spot}</h3>
      <p><strong>Default:</strong> ${spot.default}</p>
      <p><strong>Continue:</strong> ${spot.continueHands}</p>
      <p><strong>3-bet:</strong> ${spot.threeBetHands}</p>
      <p><strong>Fold:</strong> ${spot.foldHands}</p>
    </div>
  `).join('');
}

function renderAvoidList(items) {
  const wrap = document.getElementById('avoidList');
  wrap.innerHTML = items.map(item => `
    <div class="study-card">
      <h3>${item.group}</h3>
      <p><strong>Hands:</strong> ${item.hands}</p>
      <p>${item.why}</p>
    </div>
  `).join('');
}

function renderTopHands(hands) {
  const wrap = document.getElementById('topHands');
  wrap.innerHTML = hands.map((hand, idx) => `
    <div class="top-hand-card">
      <div class="top-hand-header">
        <div>
          <div class="top-hand-rank">#${idx + 1}</div>
          <h3>${hand.title}</h3>
        </div>
        <span class="tag ${hand.tag}">${hand.tag}</span>
      </div>
      <p class="hand-meta">${hand.heroCards} · Hand #${hand.handId}</p>
      <p class="hand-note">${hand.takeaway}</p>
    </div>
  `).join('');
}

function renderChart(sessions) {
  const ctx = document.getElementById('resultsChart');
  const labels = [];
  const points = [];
  let cumulative = 0;
  sessions.forEach(s => {
    const result = s.resultSource === 'manual' ? (s.manualResult ?? s.result) : s.result;
    cumulative += result;
    labels.push(s.startedAt.slice(0,10));
    points.push(cumulative.toFixed(2));
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cumulative P/L',
        data: points,
        borderColor: '#6ea8fe',
        backgroundColor: 'rgba(110,168,254,.15)',
        fill: true,
        tension: 0.25,
        pointRadius: 4,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9cabc9' }, grid: { color: 'rgba(255,255,255,.04)' } },
        y: { ticks: { color: '#9cabc9', callback: v => `$${v}` }, grid: { color: 'rgba(255,255,255,.04)' } }
      }
    }
  });
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const ACTION_WEIGHTS = { open: 1, value: 1, bluff: 1, call: 1, mix: 0.5 };

function cellLabel(row, col) {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (row < col) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[col]}${RANKS[row]}o`;
}

function combosForHand(hand) {
  if (hand.length === 2) return 6;
  if (hand.endsWith('s')) return 4;
  if (hand.endsWith('o')) return 12;
  return 0;
}

function buildMatrix(actions) {
  const matrix = Array.from({ length: 13 }, () => Array.from({ length: 13 }, () => 'fold'));
  const order = ['call', 'mix', 'bluff', 'value', 'open'];
  for (const category of order) {
    for (const hand of (actions[category] || [])) {
      for (let row = 0; row < 13; row += 1) {
        for (let col = 0; col < 13; col += 1) {
          if (cellLabel(row, col) === hand) {
            matrix[row][col] = category;
          }
        }
      }
    }
  }
  return matrix;
}

function computeStats(actions) {
  const weighted = {};
  const raw = {};
  for (const [category, hands] of Object.entries(actions)) {
    const combos = (hands || []).reduce((sum, hand) => sum + combosForHand(hand), 0);
    raw[category] = combos;
    weighted[category] = combos * (ACTION_WEIGHTS[category] || 1);
  }
  const totalWeighted = Object.values(weighted).reduce((a, b) => a + b, 0);
  const threeBetWeighted = (weighted.value || 0) + (weighted.bluff || 0) + (weighted.mix || 0);
  return {
    openPct: ((weighted.open || 0) / 1326 * 100).toFixed(1),
    mixPct: ((raw.mix || 0) / 1326 * 100).toFixed(1),
    valuePct: ((raw.value || 0) / 1326 * 100).toFixed(1),
    bluffPct: ((raw.bluff || 0) / 1326 * 100).toFixed(1),
    callPct: ((raw.call || 0) / 1326 * 100).toFixed(1),
    totalPct: (totalWeighted / 1326 * 100).toFixed(1),
    threeBetPct: (threeBetWeighted / 1326 * 100).toFixed(1)
  };
}

function rangeCard(label, value, cls = '') {
  return `<div class="range-stat"><div class="range-stat-label">${label}</div><div class="range-stat-value ${cls}">${value}</div></div>`;
}

function renderMatrix(container, matrix) {
  container.innerHTML = `<div class="matrix-scroll"><div class="hand-matrix">${matrix.flatMap((row, rowIndex) => row.map((action, colIndex) => {
    const label = cellLabel(rowIndex, colIndex);
    return `<div class="hand-cell ${action}" title="${label} · ${action}">${label}</div>`;
  })).join('')}</div></div>`;
}

function renderLegend(categories) {
  return `<div class="range-legend">${categories.map(item => `<div class="legend-item"><span class="legend-swatch ${item.className}"></span><span>${item.label}</span></div>`).join('')}</div>`;
}

function setupRangeExplorer(containerId, data, config) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="range-tabs" data-role="tabs"></div>
    <div class="range-meta" data-role="meta"></div>
    ${renderLegend(config.legend)}
    <div class="range-chart-shell" data-role="matrix"></div>
    <div class="range-stats" data-role="stats"></div>
  `;

  const tabsEl = container.querySelector('[data-role="tabs"]');
  const metaEl = container.querySelector('[data-role="meta"]');
  const matrixEl = container.querySelector('[data-role="matrix"]');
  const statsEl = container.querySelector('[data-role="stats"]');

  let activeId = data[0]?.id;

  function renderActive() {
    const item = data.find(entry => entry.id === activeId) || data[0];
    const matrix = buildMatrix(item.actions);
    renderMatrix(matrixEl, matrix);
    const stats = computeStats(item.actions);
    metaEl.innerHTML = `<div class="range-meta-card"><h3>${item.label}</h3><p>${item.summary}</p></div>`;
    statsEl.innerHTML = config.stats(item, stats).map(card => rangeCard(card.label, card.value, card.className)).join('');
    tabsEl.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', btn.dataset.id === activeId));
  }

  tabsEl.innerHTML = data.map((item, index) => `<button class="range-btn ${index === 0 ? 'active' : ''}" data-id="${item.id}">${item.label}</button>`).join('');
  tabsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeId = btn.dataset.id;
      renderActive();
    });
  });

  renderActive();
}

(async function init() {
  const [sessions, hands, study, pfrRanges, threeBetRanges] = await Promise.all([
    loadJson('data/sessions.json'),
    loadJson('data/hands.json'),
    loadJson('data/study.json'),
    loadJson('data/pfr-ranges.json'),
    loadJson('data/3bet-ranges.json')
  ]);

  renderMetrics(sessions);
  renderFocus(sessions[sessions.length - 1]);
  renderSessions(sessions);
  renderHands(hands);
  renderPreflopChart(study.preflopChart || []);
  renderAvoidList(study.avoidList || []);
  renderTopHands(study.topHands || []);
  renderChart(sessions);

  setupRangeExplorer('pfrExplorer', pfrRanges.positions, {
    legend: [
      { className: 'open', label: 'Open' },
      { className: 'mix', label: 'Mix / Fringe' },
      { className: 'fold', label: 'Fold' }
    ],
    stats: (_item, stats) => [
      { label: 'Open %', value: `${stats.openPct}%`, className: 'open' },
      { label: 'Mixed %', value: `${stats.mixPct}%`, className: 'mix' },
      { label: 'Weighted Total', value: `${stats.totalPct}%` }
    ]
  });

  setupRangeExplorer('threeBetExplorer', threeBetRanges.scenarios, {
    legend: [
      { className: 'value', label: '3-bet value' },
      { className: 'bluff', label: '3-bet bluff' },
      { className: 'call', label: 'Call' },
      { className: 'mix', label: 'Mix' },
      { className: 'fold', label: 'Fold' }
    ],
    stats: (_item, stats) => [
      { label: '3-bet value', value: `${stats.valuePct}%`, className: 'value' },
      { label: '3-bet bluff', value: `${stats.bluffPct}%`, className: 'bluff' },
      { label: 'Call', value: `${stats.callPct}%`, className: 'call' },
      { label: '3-bet total', value: `${stats.threeBetPct}%` }
    ]
  });

  initQuiz(pfrRanges, threeBetRanges);
})();

// ── PREFLOP TRAINER QUIZ ───────────────────────────────────────────────

function generateAllHands() {
  const hands = [];
  for (let i = 0; i < 13; i++) {
    hands.push(RANKS[i] + RANKS[i]);
    for (let j = i + 1; j < 13; j++) {
      hands.push(RANKS[i] + RANKS[j] + 's');
      hands.push(RANKS[i] + RANKS[j] + 'o');
    }
  }
  return hands;
}

function buildPfrLookup(pfrRanges) {
  // Map: positionId -> hand -> 'open'|'mix'|'fold'
  const lookup = {};
  pfrRanges.positions.forEach(pos => {
    const map = {};
    generateAllHands().forEach(h => { map[h] = 'fold'; });
    (pos.actions.open || []).forEach(h => { map[h] = 'open'; });
    (pos.actions.mix  || []).forEach(h => { map[h] = 'mix';  });
    lookup[pos.id] = { label: pos.label, summary: pos.summary, map };
  });
  return lookup;
}

function build3betLookup(threeBetRanges) {
  // Map: scenarioId -> hand -> 'value'|'bluff'|'call'|'mix'|'fold'
  const lookup = {};
  threeBetRanges.scenarios.forEach(sc => {
    const map = {};
    // start all folds
    generateAllHands().forEach(h => { map[h] = 'fold'; });
    (sc.actions.value || []).forEach(h => { map[h] = 'value'; });
    (sc.actions.bluff || []).forEach(h => { map[h] = 'bluff'; });
    (sc.actions.call  || []).forEach(h => { map[h] = 'call';  });
    (sc.actions.mix   || []).forEach(h => { map[h] = 'mix';   });
    lookup[sc.id] = { label: sc.label, summary: sc.summary, map };
  });
  return lookup;
}

function pickWeightedHand(handMap) {
  // Weight interesting hands more, pure folds less
  const all = generateAllHands();
  const weights = all.map(h => {
    const a = handMap[h];
    if (a === 'fold') return 0.15;
    if (a === 'mix')  return 2.5;
    return 1.0;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < all.length; i++) {
    r -= weights[i];
    if (r <= 0) return all[i];
  }
  return all[all.length - 1];
}

function bigCardHtml(handStr) {
  // handStr like "AKs", "TT", "87o"
  const isPair   = handStr.length === 2;
  const isSuited = handStr.endsWith('s');
  const isOffsuit = handStr.endsWith('o');
  const r1 = handStr[0];
  const r2 = handStr.length >= 2 ? (isPair ? handStr[1] : handStr[1]) : handStr[0];
  const suit1 = isSuited ? 's' : (isPair ? 'h' : 'c');
  const suit2 = isSuited ? 's' : (isPair ? 'd' : 'h');
  const card1 = `${r1}${suit1}`;
  const card2 = `${r2}${suit2}`;
  const suitLabel = isPair ? '' : (isSuited ? ' suited' : ' offsuit');
  return `<div class="quiz-cards">
    <div class="quiz-card ${SUIT_COLORS[suit1]}">
      <div class="qc-rank">${r1}</div>
      <div class="qc-suit">${SUIT_SYMBOLS[suit1]}</div>
    </div>
    <div class="quiz-card ${SUIT_COLORS[suit2]}">
      <div class="qc-rank">${r2}</div>
      <div class="qc-suit">${SUIT_SYMBOLS[suit2]}</div>
    </div>
    <div class="quiz-hand-label">${handStr}${suitLabel}</div>
  </div>`;
}

const PFR_ANSWERS = [
  { key: 'open', label: '🚀 Open', cls: 'qa-open' },
  { key: 'mix',  label: '🎲 Mixed', cls: 'qa-mix' },
  { key: 'fold', label: '🏳️ Fold', cls: 'qa-fold' },
];

const THREEBET_ANSWERS = [
  { key: '3bet', label: '🚀 3-Bet', cls: 'qa-open', matches: ['value', 'bluff'] },
  { key: 'call', label: '📞 Call', cls: 'qa-call', matches: ['call'] },
  { key: 'fold', label: '🏳️ Fold', cls: 'qa-fold', matches: ['fold'] },
];

const CORRECT_MESSAGES = ['Nice! ✔️', 'Correct! 👏', 'That\'s right! ✅', 'Spot on! 🎯', 'Solid! ✨'];
const WRONG_MESSAGES   = ['Not quite ❌', 'Missed this one 👎', 'Not quite... 🤔', 'Think tighter 👀'];

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function initQuiz(pfrRanges, threeBetRanges) {
  const pfrLookup    = buildPfrLookup(pfrRanges);
  const threeBetLookup = build3betLookup(threeBetRanges);
  const pfrPositions   = Object.keys(pfrLookup);
  const tbScenarios    = Object.keys(threeBetLookup);

  const state = {
    mode: 'pfr',
    score: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    currentHand: null,
    currentContext: null,
    correctAction: null,
  };

  const quizBody = document.getElementById('quizBody');

  // Mode tabs
  document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      state.answered = false;
      document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      nextQuestion();
    });
  });

  function nextQuestion() {
    state.answered = false;
    if (state.mode === 'pfr') {
      const posId  = randOf(pfrPositions);
      const posData = pfrLookup[posId];
      state.currentContext  = { id: posId, ...posData };
      state.currentHand     = pickWeightedHand(posData.map);
      state.correctAction   = posData.map[state.currentHand] || 'fold';
      renderPfrQuestion();
    } else {
      const scId   = randOf(tbScenarios);
      const scData = threeBetLookup[scId];
      state.currentContext  = { id: scId, ...scData };
      state.currentHand     = pickWeightedHand(scData.map);
      state.correctAction   = scData.map[state.currentHand] || 'fold';
      render3betQuestion();
    }
  }

  function scoreHtml() {
    const acc = state.total ? Math.round(state.score / state.total * 100) : 0;
    return `<div class="quiz-scorebar">
      <div class="quiz-score-item">✅ <span>${state.score}/${state.total}</span></div>
      <div class="quiz-score-item">🎯 <span>${acc}%</span></div>
      <div class="quiz-score-item">🔥 <span>${state.streak} streak</span></div>
      <div class="quiz-score-item">⭐ <span>Best ${state.bestStreak}</span></div>
    </div>`;
  }

  function renderPfrQuestion() {
    const ctx   = state.currentContext;
    quizBody.innerHTML = `
      ${scoreHtml()}
      <div class="quiz-prompt">
        <div class="quiz-context-badge">📍 ${ctx.label}</div>
        <div class="quiz-context-sub">${ctx.summary}</div>
        ${bigCardHtml(state.currentHand)}
        <div class="quiz-question">What do you do from <strong>${ctx.label}</strong>?</div>
      </div>
      <div class="quiz-answers" id="quizAnswers">
        ${PFR_ANSWERS.map(a =>
          `<button class="quiz-ans ${a.cls}" data-key="${a.key}">${a.label}</button>`
        ).join('')}
      </div>
      <div class="quiz-feedback" id="quizFeedback" hidden></div>
      <button class="quiz-next" id="quizNext" hidden>Next Hand →</button>
    `;
    attachAnswerHandlers(PFR_ANSWERS, ans => ans.key === state.correctAction);
  }

  function render3betQuestion() {
    const ctx   = state.currentContext;
    quizBody.innerHTML = `
      ${scoreHtml()}
      <div class="quiz-prompt">
        <div class="quiz-context-badge">🔄 ${ctx.label}</div>
        <div class="quiz-context-sub">${ctx.summary}</div>
        ${bigCardHtml(state.currentHand)}
        <div class="quiz-question">Facing an open in <strong>${ctx.label}</strong> — what\'s your move?</div>
      </div>
      <div class="quiz-answers" id="quizAnswers">
        ${THREEBET_ANSWERS.map(a =>
          `<button class="quiz-ans ${a.cls}" data-key="${a.key}">${a.label}</button>`
        ).join('')}
      </div>
      <div class="quiz-feedback" id="quizFeedback" hidden></div>
      <button class="quiz-next" id="quizNext" hidden>Next Hand →</button>
    `;
    const isMix = state.correctAction === 'mix';
    attachAnswerHandlers(THREEBET_ANSWERS, ans => {
      if (isMix) return false; // any answer gets partial
      return ans.matches && ans.matches.includes(state.correctAction);
    }, isMix);
  }

  function attachAnswerHandlers(answers, isCorrectFn, isMix = false) {
    const fbEl   = document.getElementById('quizFeedback');
    const nextEl = document.getElementById('quizNext');
    document.getElementById('quizAnswers').querySelectorAll('.quiz-ans').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.answered) return;
        state.answered = true;
        state.total++;
        const key = btn.dataset.key;
        const ans = answers.find(a => a.key === key);
        const correct = !isMix && isCorrectFn(ans);

        if (correct) {
          state.score++;
          state.streak++;
          state.bestStreak = Math.max(state.bestStreak, state.streak);
        } else {
          state.streak = 0;
        }

        // Highlight buttons
        document.getElementById('quizAnswers').querySelectorAll('.quiz-ans').forEach(b => {
          const bAns = answers.find(a => a.key === b.dataset.key);
          if (!isMix && isCorrectFn(bAns)) b.classList.add('qa-correct-reveal');
          if (b === btn && !correct && !isMix) b.classList.add('qa-wrong-reveal');
        });

        // Feedback
        const correctLabel = answers.find(a => !isMix && isCorrectFn(a))?.label || '';
        let explain = '';
        if (state.mode === 'pfr') {
          const actionLabels = { open: 'Open / raise first-in', mix: 'Mixed — sometimes open, sometimes fold', fold: 'Fold — too thin from this position' };
          explain = actionLabels[state.correctAction] || state.correctAction;
        } else {
          const tbLabels = { value: '3-bet for value', bluff: '3-bet as a bluff', call: 'Flat / call', fold: 'Fold', mix: 'Mixed — use a solver and cry' };
          explain = tbLabels[state.correctAction] || state.correctAction;
        }

        if (isMix) {
          fbEl.innerHTML = `<span class="fb-mixed">🎲 Mixed spot — ${explain}. Any answer is defensible here.</span>`;
        } else if (correct) {
          fbEl.innerHTML = `<span class="fb-correct">${randOf(CORRECT_MESSAGES)} <em>${state.currentHand}</em> = ${explain}</span>`;
        } else {
          fbEl.innerHTML = `<span class="fb-wrong">${randOf(WRONG_MESSAGES)}. <em>${state.currentHand}</em> = ${explain}</span>`;
        }
        fbEl.hidden = false;
        nextEl.hidden = false;

        // Update scorebar inline
        const scorebarEl = quizBody.querySelector('.quiz-scorebar');
        if (scorebarEl) {
          const tmp = document.createElement('div');
          tmp.innerHTML = scoreHtml();
          scorebarEl.replaceWith(tmp.firstElementChild);
        }
      });
    });

    nextEl?.addEventListener('click', nextQuestion);
  }

  nextQuestion();
}
