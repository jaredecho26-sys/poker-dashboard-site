// dashboard.js — session metrics, chart, sessions table, tagged hands

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
      <td><div class="date-main">${localDateString(s.startedAt)}</div><div class="date-sub">Local Pacific time</div></td>
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

// ===== ADVANCED STATS =====

function statCell(val, opps, fmt = v => v) {
  const low = opps !== undefined && opps < 10;
  const cls = low ? 'muted' : '';
  return `<span class="${cls}">${fmt(val)}${low ? ' *' : ''}</span>`;
}

function statBox(label, value, sub = '', cls = '') {
  return `<div class="stat-box"><div class="stat-box-label">${label}</div><div class="stat-box-value ${cls}">${value}</div>${sub ? `<div class="stat-box-sub">${sub}</div>` : ''}</div>`;
}

function pct(num, den) {
  return den > 0 ? (num / den * 100).toFixed(1) + '%' : '—';
}

function renderAdvancedStats(sessions, allHands) {
  document.getElementById('statsHandCount').textContent = `${allHands.length} hands`;

  // aggregate across all sessions
  const agg = {
    hands: allHands.length,
    vpip: 0, pfr: 0, threeBet: 0, sawFlop: 0,
    showdowns: 0, showdownWon: 0,
    cbetOpp: 0, cbet: 0,
    foldToCbetOpp: 0, foldToCbet: 0,
    foldTo3betOpp: 0, foldTo3bet: 0,
    stealOpp: 0, stealAttempt: 0,
    bbDefendOpp: 0, bbDefend: 0,
    heroBets: 0, heroRaises: 0, heroCalls: 0,
    net: 0,
  };
  // position aggregates
  const posAgg = {}; // position -> {hands, net, vpip, pfr}

  for (const h of allHands) {
    if (h.vpip)         agg.vpip++;
    if (h.pfr)          agg.pfr++;
    if (h.threeBet)     agg.threeBet++;
    if (h.sawFlop)      agg.sawFlop++;
    if (h.showdown)     agg.showdowns++;
    if (h.showdownWon)  agg.showdownWon++;
    if (h.cbetOpp)      agg.cbetOpp++;
    if (h.cbet)         agg.cbet++;
    if (h.foldToCbetOpp) agg.foldToCbetOpp++;
    if (h.foldToCbet)   agg.foldToCbet++;
    if (h.foldTo3betOpp) agg.foldTo3betOpp++;
    if (h.foldTo3bet)   agg.foldTo3bet++;
    if (h.stealOpp)     agg.stealOpp++;
    if (h.stealAttempt) agg.stealAttempt++;
    if (h.bbDefendOpp)  agg.bbDefendOpp++;
    if (h.bbDefend)     agg.bbDefend++;
    agg.heroBets   += h.heroBets   || 0;
    agg.heroRaises += h.heroRaises || 0;
    agg.heroCalls  += h.heroCalls  || 0;
    agg.net        += h.net || 0;

    const pos = h.position || 'UNK';
    if (!posAgg[pos]) posAgg[pos] = { hands: 0, net: 0, vpip: 0, pfr: 0 };
    posAgg[pos].hands++;
    posAgg[pos].net += h.net || 0;
    if (h.vpip) posAgg[pos].vpip++;
    if (h.pfr)  posAgg[pos].pfr++;
  }

  const n = agg.hands;
  const totalBB = sessions.reduce((s, sess) => s + sess.hands * (sess.dominantBB || 2), 0);
  const bb100 = totalBB > 0 ? ((agg.net / totalBB) * 100).toFixed(1) : '—';

  // --- Core Metrics tab ---
  const coreGrid = document.getElementById('statsCoreGrid');
  coreGrid.innerHTML = [
    statBox('VPIP', pct(agg.vpip, n), `${agg.vpip} / ${n} hands`, ''),
    statBox('PFR', pct(agg.pfr, n), `${agg.pfr} / ${n} hands`, ''),
    statBox('3-Bet', pct(agg.threeBet, n), `${agg.threeBet} / ${n} hands`, ''),
    statBox('Fold to 3-Bet', pct(agg.foldTo3bet, agg.foldTo3betOpp), `${agg.foldTo3betOpp} opps`, agg.foldTo3betOpp < 10 ? 'muted' : ''),
    statBox('C-Bet', pct(agg.cbet, agg.cbetOpp), `${agg.cbetOpp} opps`, agg.cbetOpp < 10 ? 'muted' : ''),
    statBox('Fold to C-Bet', pct(agg.foldToCbet, agg.foldToCbetOpp), `${agg.foldToCbetOpp} opps`, agg.foldToCbetOpp < 10 ? 'muted' : ''),
    statBox('Steal', pct(agg.stealAttempt, agg.stealOpp), `${agg.stealOpp} opps`, agg.stealOpp < 10 ? 'muted' : ''),
    statBox('BB Defend', pct(agg.bbDefend, agg.bbDefendOpp), `${agg.bbDefendOpp} opps`, agg.bbDefendOpp < 10 ? 'muted' : ''),
    statBox('Saw Flop', pct(agg.sawFlop, n), `${agg.sawFlop} / ${n}`, ''),
    statBox('Showdown', `${agg.showdowns}`, `${pct(agg.showdownWon, agg.showdowns)} won`, ''),
    statBox('BB/100', bb100, 'all sessions', parseFloat(bb100) >= 0 ? 'green' : 'red'),
  ].join('');

  // --- Aggression tab ---
  const aggrFactor = agg.heroCalls > 0 ? ((agg.heroBets + agg.heroRaises) / agg.heroCalls).toFixed(2) : (agg.heroBets + agg.heroRaises > 0 ? '∞' : '0');
  const aggrGrid = document.getElementById('statsAggrGrid');
  aggrGrid.innerHTML = [
    statBox('Aggression Factor', aggrFactor, '(bets+raises)/calls', ''),
    statBox('Total Bets', agg.heroBets, 'non-raise bets', ''),
    statBox('Total Raises', agg.heroRaises, 'all streets', ''),
    statBox('Total Calls', agg.heroCalls, 'all streets', ''),
    statBox('Bet/Call Ratio', agg.heroCalls > 0 ? (agg.heroBets / agg.heroCalls).toFixed(2) : '—', 'bets per call', ''),
    statBox('3-Bet Opp Rate', pct(agg.foldTo3betOpp, agg.pfr), `${agg.foldTo3betOpp} faced / ${agg.pfr} PFR`, ''),
    statBox('Win @ SD', pct(agg.showdownWon, agg.showdowns), `${agg.showdownWon}/${agg.showdowns}`, agg.showdowns < 20 ? 'muted' : ''),
    statBox('WTSD%', pct(agg.showdowns, agg.sawFlop), 'showdown when saw flop', ''),
  ].join('');

  // --- Position tab ---
  const posOrder = ['BTN', 'CO', 'HJ', 'UTG', 'SB', 'BB', 'UNK'];
  const posBody = document.getElementById('positionBody');
  posBody.innerHTML = posOrder.filter(p => posAgg[p]).map(p => {
    const d = posAgg[p];
    // estimate BB/100 per position (approximate: use session dominant BB=2)
    const posBB100 = d.hands > 0 ? ((d.net / (d.hands * 2)) * 100).toFixed(1) : '—';
    const cls = d.net >= 0 ? 'result-pos' : 'result-neg';
    return `<tr>
      <td><strong>${p}</strong></td>
      <td>${d.hands}</td>
      <td class="${cls}">${fmtCurrency(d.net)}</td>
      <td class="${cls}">${posBB100}</td>
      <td>${pct(d.vpip, d.hands)}</td>
      <td>${pct(d.pfr, d.hands)}</td>
    </tr>`;
  }).join('');

  // --- Session Breakdown tab ---
  const sessBody = document.getElementById('sessionStatsBody');
  sessBody.innerHTML = sessions.slice().reverse().map(s => {
    const low = (opps) => opps < 10 ? 'class="muted"' : '';
    const bb100cls = s.bb100 >= 0 ? 'result-pos' : 'result-neg';
    return `<tr>
      <td>${localDateString(s.startedAt)}<br><span class="muted" style="font-size:0.75em">${s.sourceFile}</span></td>
      <td>${s.hands}</td>
      <td class="${bb100cls}">${s.bb100}</td>
      <td>${s.vpipPct}/${s.pfrPct}/${s.threeBetPct}</td>
      <td ${low(s.cbetOpps)}>${s.cbetPct}% <span class="muted">(${s.cbetOpps})</span></td>
      <td ${low(s.foldTo3betOpps)}>${s.foldTo3betPct}% <span class="muted">(${s.foldTo3betOpps})</span></td>
      <td ${low(s.stealOpps)}>${s.stealPct}% <span class="muted">(${s.stealOpps})</span></td>
      <td ${low(s.bbDefendOpps)}>${s.bbDefendPct}% <span class="muted">(${s.bbDefendOpps})</span></td>
      <td ${low(s.showdowns)}>${s.showdownWonPct}% <span class="muted">(${s.showdowns})</span></td>
    </tr>`;
  }).join('');

  // tab switching
  document.getElementById('statsTabs').querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.stats-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById('stats-' + btn.dataset.tab).classList.remove('hidden');
    });
  });
}

async function initDashboard() {
  injectNav();
  const [sessions, hands, allHands] = await Promise.all([
    loadJson('data/sessions.json'),
    loadJson('data/hands.json'),
    loadJson('data/all_hands.json'),
  ]);
  renderMetrics(sessions);
  renderFocus(sessions[sessions.length - 1]);
  renderSessions(sessions);
  renderHands(hands);
  renderChart(sessions);
  renderAdvancedStats(sessions, allHands);
}

initDashboard();
