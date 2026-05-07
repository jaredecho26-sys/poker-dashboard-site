async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// Convert UTC ISO timestamp to local Pacific display strings
function localDateParts(utcIsoString) {
  const date = new Date(utcIsoString);
  const dateParts = date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/');
  const timeString = date.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit'
  });
  return {
    date: `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`,
    time: `${timeString} PT`
  };
}

function localDateString(utcIsoString) {
  return localDateParts(utcIsoString).date;
}

function localDateTimeString(utcIsoString) {
  const parts = localDateParts(utcIsoString);
  return `${parts.date} · ${parts.time}`;
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
      <td><div class="date-main">${localDateString(s.startedAt)}</div><div class="date-sub">Local Pacific time</div></td>
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
  bet:   { cls: 'ab-bet',   icon: '↑', label: 'Bet' },
  raise: { cls: 'ab-raise', icon: '⬆', label: 'Raise' },
  call:  { cls: 'ab-call',  icon: '→', label: 'Call' },
  check: { cls: 'ab-check', icon: '✓', label: 'Check' },
  fold:  { cls: 'ab-fold',  icon: '×', label: 'Fold' },
};

function actionActor(action) {
  const line = action?.line || '';
  if (/^PopeMyCherry\b/.test(line)) return { label: 'You', cls: 'actor-you' };
  const name = line.split(/\s+/)[0];
  return { label: name || 'Villain', cls: 'actor-villain' };
}

function actionDetailText(action) {
  const line = action?.line || '';
  const actor = actionActor(action);
  if (!line) return '';
  return line.replace(new RegExp(`^${actor.label === 'You' ? 'PopeMyCherry' : actor.label}\\b\\s*`), '').trim();
}

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
      const b = ACTION_BADGE[t] || { cls: 'ab-other', icon: '·', label: t || 'Action' };
      const actor = actionActor(a);
      const detail = actionDetailText(a);
      const amt = a.amount > 0 ? `<span class="ab-amt">$${a.amount.toFixed(2)}</span>` : '';
      return `<div class="action-row">
        <span class="action-actor ${actor.cls}">${actor.label}</span>
        <span class="action-badge ${b.cls}">${b.icon} ${b.label}${amt}</span>
        ${detail ? `<span class="action-line">${detail}</span>` : ''}
      </div>`;
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
      <div class="hc-time">${localDateTimeString(h.timestamp)}</div>
    </div>
    <div class="hc-right">
      <div class="hc-net ${netCls}">${fmtCurrency(h.net)}</div>
      <span class="tag ${h.tag}">${tm.icon} ${tm.label}</span>
    </div>
  </div>
  ${boardCards ? `<div class="hc-board"><span class="board-label">Board</span>${boardCards}</div>` : ''}
  <button class="hc-toggle" onclick="toggleHandDetail('${id}')" aria-expanded="false">Show details ▾</button>
  <div class="hc-detail" id="${id}" hidden>
    <div class="hc-detail-note">Action log below is currently your line, explicitly labeled so it's easier to scan.</div>
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
    labels.push(localDateString(s.startedAt));
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
  const [sessions, hands, study, pfrRanges, threeBetRanges, trainerPack] = await Promise.all([
    loadJson('data/sessions.json'),
    loadJson('data/hands.json'),
    loadJson('data/study.json'),
    loadJson('data/pfr-ranges.json'),
    loadJson('data/3bet-ranges.json'),
    loadJson('data/trainer-pack.json')
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

  initQuiz(pfrRanges, threeBetRanges, trainerPack);
})();

// ── STUDY TRAINER QUIZ ───────────────────────────────────────────────

const HAND_VALUE = { A: 14, K: 13, Q: 12, J: 11, T: 10, 9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2 };
const LEVEL_LABELS = { all: 'All Levels', easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MODE_LABELS = {
  pfr: 'PFR Decisions',
  threebet: '3-Bet Decisions',
  blinddefense: 'Blind Defense',
  cbet: 'C-Bet Trainer',
  shovefold: 'Shove / Fold'
};
const MODE_DESCRIPTIONS = {
  pfr: 'Full 6-max raise-first-in drilling across all 169 starting-hand classes.',
  threebet: 'Attack common 3-bet formations with value, bluff, call, fold, and mix recognition.',
  blinddefense: 'Specifically train SB/BB defense decisions where leaks pile up fast.',
  cbet: 'Board-texture drills for practical flop c-bet defaults.',
  shovefold: 'Short-stack tournament-style jam/fold reps to hardwire thresholds.'
};

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

function handMeta(handStr) {
  const pair = handStr.length === 2;
  const suited = handStr.endsWith('s');
  const offsuit = handStr.endsWith('o');
  const r1 = handStr[0];
  const r2 = pair ? handStr[1] : handStr[1];
  const v1 = HAND_VALUE[r1] || 0;
  const v2 = HAND_VALUE[r2] || 0;
  const gap = Math.max(0, Math.abs(v1 - v2) - 1);
  return { pair, suited, offsuit, r1, r2, v1, v2, gap, high: Math.max(v1, v2), low: Math.min(v1, v2) };
}

function handStrengthScore(handStr) {
  const meta = handMeta(handStr);
  if (meta.pair) return 30 + meta.v1;
  let score = meta.v1 + meta.v2;
  if (meta.suited) score += 2.25;
  if (meta.gap === 0) score += 1.2;
  else if (meta.gap === 1) score += 0.5;
  if (meta.r1 === 'A' || meta.r2 === 'A') score += 1.1;
  if ((meta.r1 === 'K' || meta.r2 === 'K') && meta.high >= 12) score += 0.4;
  return score;
}

function classifyPfrDifficulty(hand, action) {
  if (action === 'mix') return 'hard';
  const score = handStrengthScore(hand);
  if (action === 'open') {
    if (score >= 27) return 'easy';
    if (score >= 22) return 'medium';
    return 'hard';
  }
  if (score <= 15.5) return 'easy';
  if (score <= 20.5) return 'medium';
  return 'hard';
}

function classifyAggroDifficulty(hand, action) {
  if (action === 'mix') return 'hard';
  if (action === 'value') return 'easy';
  if (action === 'bluff') return 'hard';
  if (action === 'call') return 'medium';
  const score = handStrengthScore(hand);
  if (score <= 14.5) return 'easy';
  if (score <= 20) return 'medium';
  return 'hard';
}

function boardCardsHtml(cards = []) {
  return `<div class="quiz-board-row"><span class="board-label">Board</span><div class="quiz-board-cards">${cards.map(cardChip).join('')}</div></div>`;
}

function bigCardHtml(handStr) {
  const isPair = handStr.length === 2;
  const isSuited = handStr.endsWith('s');
  const r1 = handStr[0];
  const r2 = handStr[1] || handStr[0];
  const suit1 = isSuited ? 's' : (isPair ? 'h' : 'c');
  const suit2 = isSuited ? 's' : (isPair ? 'd' : 'h');
  const suitLabel = isPair ? ' pair' : (isSuited ? ' suited' : ' offsuit');
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
  { key: 'mix', label: '🎲 Mix', cls: 'qa-mix' },
  { key: 'fold', label: '🏳️ Fold', cls: 'qa-fold' },
];

const AGGRO_ANSWERS = [
  { key: '3bet', label: '🚀 3-Bet', cls: 'qa-open' },
  { key: 'call', label: '📞 Call', cls: 'qa-call' },
  { key: 'mix', label: '🎲 Mix', cls: 'qa-mix' },
  { key: 'fold', label: '🏳️ Fold', cls: 'qa-fold' },
];

const CORRECT_MESSAGES = ['Nice! ✔️', 'Correct! 👏', 'That\'s right! ✅', 'Spot on! 🎯', 'Solid! ✨'];
const WRONG_MESSAGES = ['Not quite ❌', 'Missed this one 👎', 'Close, but no 🤔', 'That leaks money 👀'];

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }
function normalizeAggroAction(action) { return action === 'value' || action === 'bluff' ? '3bet' : action; }

function buildPfrLookup(pfrRanges) {
  const lookup = {};
  pfrRanges.positions.forEach(pos => {
    const map = {};
    generateAllHands().forEach(h => { map[h] = 'fold'; });
    (pos.actions.open || []).forEach(h => { map[h] = 'open'; });
    (pos.actions.mix || []).forEach(h => { map[h] = 'mix'; });
    lookup[pos.id] = { label: pos.label, summary: pos.summary, map };
  });
  return lookup;
}

function build3betLookup(threeBetRanges) {
  const lookup = {};
  threeBetRanges.scenarios.forEach(sc => {
    const map = {};
    generateAllHands().forEach(h => { map[h] = 'fold'; });
    (sc.actions.value || []).forEach(h => { map[h] = 'value'; });
    (sc.actions.bluff || []).forEach(h => { map[h] = 'bluff'; });
    (sc.actions.call || []).forEach(h => { map[h] = 'call'; });
    (sc.actions.mix || []).forEach(h => { map[h] = 'mix'; });
    lookup[sc.id] = { label: sc.label, summary: sc.summary, map };
  });
  return lookup;
}

function buildRangeQuestionPools(pfrRanges, threeBetRanges) {
  const allHands = generateAllHands();
  const pfrLookup = buildPfrLookup(pfrRanges);
  const threeBetLookup = build3betLookup(threeBetRanges);
  const pfr = [];
  const threebet = [];
  const blinddefense = [];

  pfrRanges.positions.forEach(pos => {
    allHands.forEach(hand => {
      const action = pfrLookup[pos.id].map[hand] || 'fold';
      const difficulty = classifyPfrDifficulty(hand, action);
      const explainMap = {
        open: 'Open / raise first-in. This hand clears the threshold from this position.',
        mix: 'Mixed frequency spot. This one sits right near the edge of your range.',
        fold: 'Fold. This hand under-realizes or gets dominated too often from this seat.'
      };
      pfr.push({
        mode: 'pfr',
        difficulty,
        contextLabel: pos.label,
        contextSummary: pos.summary,
        hand,
        answers: PFR_ANSWERS,
        correctKey: action,
        explanation: explainMap[action],
        prompt: `What do you do from ${pos.label}?`,
      });
    });
  });

  threeBetRanges.scenarios.forEach(sc => {
    const isBlind = /^sb-|^bb-/.test(sc.id);
    allHands.forEach(hand => {
      const rawAction = threeBetLookup[sc.id].map[hand] || 'fold';
      const difficulty = classifyAggroDifficulty(hand, rawAction);
      const correctKey = normalizeAggroAction(rawAction);
      const explainMap = {
        value: '3-bet for value. You want action from worse and this hand stands the heat.',
        bluff: '3-bet bluff. Good blocker / playability candidate for pressure.',
        call: 'Flat call. Strong enough to continue, not mandatory to 3-bet.',
        mix: 'Mixed frequency spot. This one genuinely lives near the boundary.',
        fold: 'Fold. Too dominated or too weak to continue profitably here.'
      };
      const item = {
        mode: isBlind ? 'blinddefense' : 'threebet',
        difficulty,
        contextLabel: sc.label,
        contextSummary: sc.summary,
        hand,
        answers: AGGRO_ANSWERS,
        correctKey,
        explanation: explainMap[rawAction],
        prompt: isBlind ? `Defending from the blinds in ${sc.label} — what's your move?` : `Facing an open in ${sc.label} — what's your move?`,
      };
      threebet.push({ ...item, mode: 'threebet' });
      if (isBlind) blinddefense.push({ ...item, mode: 'blinddefense' });
    });
  });

  return { pfr, threebet, blinddefense };
}

function buildStructuredPools(trainerPack) {
  const cbet = (trainerPack.cbet || []).map(item => ({
    ...item,
    mode: 'cbet',
    answers: item.options || [],
    correctKey: item.correct,
  }));
  const shovefold = (trainerPack.shoveFold || []).map(item => ({
    ...item,
    mode: 'shovefold',
    answers: item.options || [],
    correctKey: item.correct,
  }));
  return { cbet, shovefold };
}

function filterPoolByLevel(pool, level) {
  if (level === 'all') return pool;
  return pool.filter(item => item.difficulty === level);
}

function sampleQuestion(pool) {
  if (!pool.length) return null;
  const weighted = pool.map(item => {
    let weight = 1;
    if (item.difficulty === 'hard') weight = 1.45;
    else if (item.difficulty === 'medium') weight = 1.15;
    if (item.correctKey === 'mix') weight += 0.2;
    return weight;
  });
  const total = weighted.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weighted[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function metaCard(label, value, sub = '') {
  return `<div class="quiz-meta-card"><div class="quiz-meta-label">${label}</div><div class="quiz-meta-value">${value}</div>${sub ? `<div class="quiz-meta-sub">${sub}</div>` : ''}</div>`;
}

function scoreHtml(state, activePool, trainerMeta) {
  const acc = state.total ? Math.round(state.score / state.total * 100) : 0;
  const handClassText = trainerMeta?.handClasses ? `${trainerMeta.handClasses}` : '—';
  const comboText = trainerMeta?.totalCombos ? `${trainerMeta.totalCombos}` : '—';
  return `<div class="quiz-scorebar">
      <div class="quiz-score-item">✅ <span>${state.score}/${state.total}</span></div>
      <div class="quiz-score-item">🎯 <span>${acc}%</span></div>
      <div class="quiz-score-item">🔥 <span>${state.streak} streak</span></div>
      <div class="quiz-score-item">⭐ <span>Best ${state.bestStreak}</span></div>
    </div>
    <div class="quiz-meta-grid">
      ${metaCard('Mode', MODE_LABELS[state.mode], MODE_DESCRIPTIONS[state.mode])}
      ${metaCard('Level', LEVEL_LABELS[state.level], `${activePool.length.toLocaleString()} spots in this pool`) }
      ${metaCard('Hand Classes', handClassText, 'Strategically distinct starting hands')}
      ${metaCard('Raw Combos', comboText, 'All two-card combinations')}
    </div>`;
}

function renderAnswerButtons(answers) {
  return answers.map(a => `<button class="quiz-ans ${a.cls || 'qa-call'}" data-key="${a.key}">${a.label}</button>`).join('');
}

function renderRangePrompt(question) {
  return `
    <div class="quiz-prompt">
      <div class="quiz-context-badge">📍 ${question.contextLabel}</div>
      <div class="quiz-context-sub">${question.contextSummary}</div>
      ${bigCardHtml(question.hand)}
      <div class="quiz-question">${question.prompt}</div>
    </div>`;
}

function renderCbetPrompt(question) {
  return `
    <div class="quiz-prompt">
      <div class="quiz-stack-badges">
        <span class="quiz-stack-badge">🧠 ${question.line}</span>
        <span class="quiz-stack-badge">🪙 ${question.potType}</span>
        <span class="quiz-stack-badge">${question.difficulty.toUpperCase()}</span>
      </div>
      ${boardCardsHtml(question.board)}
      <div class="quiz-question">${question.prompt}</div>
      <div class="quiz-context-sub">Think in terms of practical default sizing, not solver cosplay.</div>
    </div>`;
}

function renderShovePrompt(question) {
  return `
    <div class="quiz-prompt">
      <div class="quiz-stack-badges">
        <span class="quiz-stack-badge">📍 ${question.position}</span>
        <span class="quiz-stack-badge">📏 ${question.stackBb}bb</span>
        <span class="quiz-stack-badge">🔄 ${question.action}</span>
      </div>
      ${bigCardHtml(question.heroHand)}
      <div class="quiz-question">${question.prompt}</div>
      <div class="quiz-context-sub">Short-stack reps. This is where certainty matters.</div>
    </div>`;
}

function buildQuestionHtml(state, activePool, trainerMeta) {
  const q = state.currentQuestion;
  const promptHtml = q.mode === 'cbet' ? renderCbetPrompt(q)
    : q.mode === 'shovefold' ? renderShovePrompt(q)
    : renderRangePrompt(q);
  return `
    ${scoreHtml(state, activePool, trainerMeta)}
    ${promptHtml}
    <div class="quiz-answers" id="quizAnswers">${renderAnswerButtons(q.answers)}</div>
    <div class="quiz-feedback" id="quizFeedback" hidden></div>
    <button class="quiz-next" id="quizNext" hidden>Next Spot →</button>
  `;
}

function initQuiz(pfrRanges, threeBetRanges, trainerPack) {
  const rangePools = buildRangeQuestionPools(pfrRanges, threeBetRanges);
  const structuredPools = buildStructuredPools(trainerPack);
  const pools = {
    pfr: rangePools.pfr,
    threebet: rangePools.threebet,
    blinddefense: rangePools.blinddefense,
    cbet: structuredPools.cbet,
    shovefold: structuredPools.shovefold,
  };

  const state = {
    mode: 'pfr',
    level: 'all',
    score: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    currentQuestion: null,
  };

  const quizBody = document.getElementById('quizBody');

  function activePool() {
    return filterPoolByLevel(pools[state.mode] || [], state.level);
  }

  function nextQuestion() {
    state.answered = false;
    const pool = activePool();
    state.currentQuestion = sampleQuestion(pool);
    if (!state.currentQuestion) {
      quizBody.innerHTML = `<div class="quiz-empty">No questions in this level yet.</div>`;
      return;
    }
    quizBody.innerHTML = buildQuestionHtml(state, pool, trainerPack.meta || {});
    attachAnswerHandlers(pool);
  }

  function revealAnswer(selectedBtn, correctKey, explanation) {
    const answersEl = document.getElementById('quizAnswers');
    const fbEl = document.getElementById('quizFeedback');
    const nextEl = document.getElementById('quizNext');
    answersEl.querySelectorAll('.quiz-ans').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.key === correctKey) btn.classList.add('qa-correct-reveal');
      if (btn === selectedBtn && btn.dataset.key !== correctKey) btn.classList.add('qa-wrong-reveal');
    });

    const correct = selectedBtn.dataset.key === correctKey;
    if (correct) {
      state.score += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      fbEl.innerHTML = `<span class="fb-correct">${randOf(CORRECT_MESSAGES)} ${explanation}</span>`;
    } else {
      state.streak = 0;
      fbEl.innerHTML = `<span class="fb-wrong">${randOf(WRONG_MESSAGES)} ${explanation}</span>`;
    }
    fbEl.hidden = false;
    nextEl.hidden = false;
    nextEl.addEventListener('click', nextQuestion, { once: true });
  }

  function attachAnswerHandlers(pool) {
    const q = state.currentQuestion;
    document.querySelectorAll('.quiz-ans').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.answered) return;
        state.answered = true;
        state.total += 1;
        revealAnswer(btn, q.correctKey, q.explanation);
        const scorebarEl = quizBody.querySelector('.quiz-scorebar');
        const metaEl = quizBody.querySelector('.quiz-meta-grid');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = scoreHtml(state, pool, trainerPack.meta || {});
        scorebarEl.replaceWith(wrapper.firstElementChild);
        metaEl.replaceWith(wrapper.lastElementChild);
      });
    });
  }

  document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      state.answered = false;
      document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      nextQuestion();
    });
  });

  document.querySelectorAll('.quiz-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.level = btn.dataset.level;
      state.answered = false;
      document.querySelectorAll('.quiz-level-btn').forEach(b => b.classList.toggle('active', b === btn));
      nextQuestion();
    });
  });

  nextQuestion();
}
