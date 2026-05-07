// study.js — range explorers, BB defend reference, top hands, avoid list, preflop chart

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

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
  const map = {};
  Object.entries(actions).forEach(([act, hands]) => {
    hands.forEach(h => { map[h] = act; });
  });
  return map;
}

function matrixGrid(actions) {
  const map = buildMatrix(actions);
  let html = '<div class="hand-matrix">';
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const label = cellLabel(r, c);
      const act = map[label] || 'fold';
      html += `<div class="hand-cell ${act}" title="${label}">${label}</div>`;
    }
  }
  html += '</div>';
  return html;
}

function buildRangeStats(actions) {
  const combos = {};
  let total = 0;
  Object.entries(actions).forEach(([act, hands]) => {
    let c = 0;
    hands.forEach(h => { c += combosForHand(h); });
    combos[act] = c;
    total += c;
  });
  return { combos, total };
}

// ── PFR Range Explorer ──────────────────────────────────────────────────────
function renderPfrExplorer(pfrRanges) {
  const wrap = document.getElementById('pfrExplorer');
  const positions = pfrRanges.positions;
  let active = positions[0].id;

  function render() {
    const pos = positions.find(p => p.id === active);
    const { combos, total } = buildRangeStats(pos.actions);
    const actionDefs = [
      { key: 'open', label: 'Open RFI', cls: 'open' },
      { key: 'mix',  label: 'Mixed',    cls: 'mix'  },
    ];
    wrap.innerHTML = `
      <div class="range-tabs">${positions.map(p =>
        `<button class="range-btn${p.id === active ? ' active' : ''}" data-pos="${p.id}">${p.label}</button>`
      ).join('')}</div>
      <div class="range-chart-shell">
        <div class="range-legend">${actionDefs.map(a =>
          `<span class="legend-item"><span class="legend-swatch ${a.cls}"></span>${a.label}</span>`
        ).concat(['<span class="legend-item"><span class="legend-swatch fold"></span>Fold</span>']).join('')}</div>
        <p class="range-summary">${pos.summary}</p>
        <div class="matrix-scroll">${matrixGrid(pos.actions)}</div>
        <div class="range-stats">${actionDefs.map(a => `
          <div class="range-stat">
            <div class="range-stat-label">${a.label}</div>
            <div class="range-stat-value ${a.cls}">${combos[a.key] || 0} combos</div>
            <div class="range-stat-label">${(((combos[a.key]||0)/1326)*100).toFixed(1)}% of all hands</div>
          </div>`).join('')}
          <div class="range-stat">
            <div class="range-stat-label">Total opening range</div>
            <div class="range-stat-value blue">${total} combos</div>
            <div class="range-stat-label">${((total/1326)*100).toFixed(1)}% of all hands</div>
          </div>
        </div>
      </div>`;
    wrap.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => { active = btn.dataset.pos; render(); });
    });
  }
  render();
}

// ── 3-Bet Range Explorer ────────────────────────────────────────────────────
function renderThreeBetExplorer(threeBetRanges) {
  const wrap = document.getElementById('threeBetExplorer');
  const scenarios = threeBetRanges.scenarios;
  let active = scenarios[0].id;

  function render() {
    const scen = scenarios.find(s => s.id === active);
    const { combos, total } = buildRangeStats(scen.actions);
    const actionDefs = [
      { key: 'value', label: 'Value 3-bet', cls: 'value' },
      { key: 'bluff', label: 'Bluff 3-bet', cls: 'bluff' },
      { key: 'call',  label: 'Flat call',   cls: 'call'  },
      { key: 'mix',   label: 'Mixed',        cls: 'mix'   },
    ];
    wrap.innerHTML = `
      <div class="range-tabs">${scenarios.map(s =>
        `<button class="range-btn${s.id === active ? ' active' : ''}" data-scen="${s.id}">${s.label}</button>`
      ).join('')}</div>
      <div class="range-chart-shell">
        <div class="range-legend">${actionDefs.map(a =>
          `<span class="legend-item"><span class="legend-swatch ${a.cls}"></span>${a.label}</span>`
        ).concat(['<span class="legend-item"><span class="legend-swatch fold"></span>Fold</span>']).join('')}</div>
        <p class="range-summary">${scen.summary}</p>
        <div class="matrix-scroll">${matrixGrid(scen.actions)}</div>
        <div class="range-stats">${actionDefs.filter(a => combos[a.key]).map(a => `
          <div class="range-stat">
            <div class="range-stat-label">${a.label}</div>
            <div class="range-stat-value ${a.cls}">${combos[a.key]} combos</div>
            <div class="range-stat-label">${((combos[a.key]/1326)*100).toFixed(1)}% of hands</div>
          </div>`).join('')}
        </div>
      </div>`;
    wrap.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => { active = btn.dataset.scen; render(); });
    });
  }
  render();
}

// ── BB Defend Explorer ──────────────────────────────────────────────────────
function renderBbDefend(bbDefend) {
  const wrap = document.getElementById('bbDefendExplorer');
  const scenarios = bbDefend.scenarios;
  let active = scenarios[0].id;

  function render() {
    const scen = scenarios.find(s => s.id === active);
    const actionDefs = [
      { key: 'call',     label: 'Call (defend)',      cls: 'call'  },
      { key: 'threebet', label: '3-Bet (value/bluff)', cls: 'bluff' },
      { key: 'mix',      label: 'Mixed defend',       cls: 'mix'   },
      { key: 'fold',     label: 'Fold',               cls: 'fold'  },
    ];
    const { combos } = buildRangeStats(scen.actions);
    const notes = (scen.notes || []).map(n => `<li>${n}</li>`).join('');
    const defendedCombos = (combos.call || 0) + (combos.threebet || 0) + (combos.mix || 0);
    const defendedClasses = (scen.actions.call || []).length + (scen.actions.threebet || []).length + (scen.actions.mix || []).length;
    wrap.innerHTML = `
      <div class="range-tabs">${scenarios.map(s =>
        `<button class="range-btn${s.id === active ? ' active' : ''}" data-scen="${s.id}">${s.label}</button>`
      ).join('')}</div>
      <div class="bb-defend-shell">
        <div class="bb-defend-header">
          <div>
            <div class="bb-freq-badge">Defended: <strong>${(defendedCombos / 1326 * 100).toFixed(1)}%</strong> combos · <strong>${(defendedClasses / 169 * 100).toFixed(1)}%</strong> classes</div>
            <p class="range-summary">${scen.summary}</p>
          </div>
          ${notes ? `<ul class="bb-notes">${notes}</ul>` : ''}
        </div>
        <div class="range-legend">${actionDefs.map(a =>
          `<span class="legend-item"><span class="legend-swatch ${a.key === 'threebet' ? 'bluff' : a.key}"></span>${a.label}</span>`
        ).join('')}</div>
        <div class="matrix-scroll">${matrixGrid(scen.actions)}</div>
        <div class="range-stats">
          <div class="range-stat">
            <div class="range-stat-label">Call combos</div>
            <div class="range-stat-value call">${combos.call || 0}</div>
            <div class="range-stat-label">${(((combos.call||0)/1326)*100).toFixed(1)}% of hands</div>
          </div>
          <div class="range-stat">
            <div class="range-stat-label">3-Bet combos</div>
            <div class="range-stat-value blue">${combos.threebet || 0}</div>
            <div class="range-stat-label">${(((combos.threebet||0)/1326)*100).toFixed(1)}% of hands</div>
          </div>
          <div class="range-stat">
            <div class="range-stat-label">Mixed defend combos</div>
            <div class="range-stat-value mix">${combos.mix || 0}</div>
            <div class="range-stat-label">${(((combos.mix||0)/1326)*100).toFixed(1)}% of hands</div>
          </div>
          <div class="range-stat">
            <div class="range-stat-label">Total defended</div>
            <div class="range-stat-value green">${defendedCombos}</div>
            <div class="range-stat-label">${((defendedCombos/1326)*100).toFixed(1)}% of hands</div>
          </div>
        </div>
      </div>`;
    wrap.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => { active = btn.dataset.scen; render(); });
    });
  }
  render();
}

// ── Simple Preflop Defense Chart ────────────────────────────────────────────
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

async function initStudy() {
  injectNav();
  const [studyData, pfrRanges, threeBetRanges, bbDefend] = await Promise.all([
    loadJson('data/study.json'),
    loadJson('data/pfr-ranges.json'),
    loadJson('data/3bet-ranges.json'),
    loadJson('data/bb-defend.json'),
  ]);

  renderTopHands(studyData.topHands || []);
  renderPreflopChart(studyData.preflopChart || []);
  renderAvoidList(studyData.avoidList || []);
  renderPfrExplorer(pfrRanges);
  renderThreeBetExplorer(threeBetRanges);
  renderBbDefend(bbDefend);
}

initStudy();
