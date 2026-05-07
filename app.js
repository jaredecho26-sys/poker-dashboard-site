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

function renderHands(hands) {
  const wrap = document.getElementById('taggedHands');
  wrap.innerHTML = hands.slice().reverse().map(h => `
    <div class="hand-item">
      <div class="hand-top">
        <div>
          <strong>${h.heroCards || 'Unknown'} · Hand #${h.handId}</strong>
          <div class="hand-meta">${h.timestamp.replace('T',' ').replace('Z',' UTC')} · ${fmtCurrency(h.net)}</div>
        </div>
        <span class="tag ${h.tag}">${h.tag}</span>
      </div>
      <div class="hand-meta">Board: ${(h.board || []).join(' ') || 'n/a'}</div>
      <p class="hand-note">${h.note}</p>
    </div>
  `).join('');
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
})();
