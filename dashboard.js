// dashboard.js — session metrics, chart, sessions table, tagged hands

function metric(label, value, sub = '', cls = '') {
  return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value ${cls}">${value}</div><div class="metric-sub">${sub}</div></div>`;
}

function renderMetrics(sessions) {
  const metricsEl = document.getElementById('metrics');
  const totalResult = sessions.reduce((sum, s) => sum + (s.resultSource === 'manual' ? (s.manualResult ?? s.result) : s.result), 0);
  const totalHands = sessions.reduce((sum, s) => sum + s.hands, 0);
  const avgVpip = sessions.length ? sessions.reduce((sum, s) => sum + s.vpipPct, 0) / sessions.length : 0;
  const avgPfr  = sessions.length ? sessions.reduce((sum, s) => sum + s.pfrPct,  0) / sessions.length : 0;
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

let _allHands = [];
let _activeHandFilter = 'all';

function renderHandCards(hands, filter) {
  const wrap = document.getElementById('taggedHands');
  const filtered = filter === 'all' ? hands : hands.filter(h => h.tag === filter);
  if (!filtered.length) {
    wrap.innerHTML = `<div class="hand-empty">No ${filter} hands yet.</div>`;
    return;
  }
  wrap.innerHTML = filtered.slice().reverse().map(h => {
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
    <div class="hc-detail-note">Action log below is your line, explicitly labeled so it's easier to scan.</div>
    <div class="hc-timeline">${tlHtml}</div>
    <div class="hc-note">${h.note || ''}</div>
  </div>
</div>`;
  }).join('');
}

function renderHands(hands) {
  _allHands = hands;
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

function renderChart(sessions) {
  const ctx = document.getElementById('resultsChart');
  const labels = [], points = [];
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

async function initDashboard() {
  injectNav();
  const [sessions, hands] = await Promise.all([
    loadJson('data/sessions.json'),
    loadJson('data/hands.json'),
  ]);
  renderMetrics(sessions);
  renderFocus(sessions[sessions.length - 1]);
  renderSessions(sessions);
  renderHands(hands);
  renderChart(sessions);
}

initDashboard();
