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

// ── Format Toggle Helper ────────────────────────────────────────────────────
function formatToggleHTML(currentFormat) {
  return `<div class="format-toggle">
    <button class="fmt-btn${currentFormat === '6max' ? ' active' : ''}" data-fmt="6max">6-Max</button>
    <button class="fmt-btn${currentFormat === '9max' ? ' active' : ''}" data-fmt="9max">9-Max</button>
  </div>`;
}

// ── PFR Range Explorer ──────────────────────────────────────────────────────
function renderPfrExplorer(pfrRanges6, pfrRanges9) {
  const wrap = document.getElementById('pfrExplorer');
  let format = '6max';
  let active = pfrRanges6.positions[0].id;

  function currentData() { return format === '6max' ? pfrRanges6 : pfrRanges9; }

  function render() {
    const positions = currentData().positions;
    // reset active if position doesn't exist in new format
    if (!positions.find(p => p.id === active)) active = positions[0].id;
    const pos = positions.find(p => p.id === active);
    const { combos, total } = buildRangeStats(pos.actions);
    const actionDefs = [
      { key: 'open', label: 'Open RFI', cls: 'open' },
      { key: 'mix',  label: 'Mixed',    cls: 'mix'  },
    ];
    wrap.innerHTML = `
      ${formatToggleHTML(format)}
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
    wrap.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => { format = btn.dataset.fmt; render(); });
    });
    wrap.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => { active = btn.dataset.pos; render(); });
    });
  }
  render();
}

// ── 3-Bet Range Explorer ────────────────────────────────────────────────────
// Position metadata for display order and labels
const POSITIONS_6MAX = [
  { id: 'utg', label: 'UTG' },
  { id: 'hj',  label: 'HJ'  },
  { id: 'co',  label: 'CO'  },
  { id: 'btn', label: 'BTN' },
  { id: 'sb',  label: 'SB'  },
  { id: 'bb',  label: 'BB'  },
];
const POSITIONS_9MAX = [
  { id: 'utg',  label: 'UTG'  },
  { id: 'utg1', label: 'UTG+1' },
  { id: 'mp',   label: 'MP'   },
  { id: 'hj',   label: 'HJ'   },
  { id: 'co',   label: 'CO'   },
  { id: 'btn',  label: 'BTN'  },
  { id: 'sb',   label: 'SB'   },
  { id: 'bb',   label: 'BB'   },
];

function renderThreeBetExplorer(threeBetRanges6, threeBetRanges9) {
  const wrap = document.getElementById('threeBetExplorer');
  let format = '6max';

  // Parse scenario ids to build hero→[villain] map
  function buildPositionMap(scenarios) {
    const map = {};
    scenarios.forEach(s => {
      const [hero, , villain] = s.id.split('-');
      if (!map[hero]) map[hero] = [];
      if (!map[hero].includes(villain)) map[hero].push(villain);
    });
    return map;
  }

  function currentData()    { return format === '6max' ? threeBetRanges6 : threeBetRanges9; }
  function currentPositions(){ return format === '6max' ? POSITIONS_6MAX : POSITIONS_9MAX; }

  // State
  let heroPos   = null;
  let villainPos = null;

  function initDefaults() {
    const posMap = buildPositionMap(currentData().scenarios);
    const allPositions = currentPositions();
    // default: first hero that has scenarios
    heroPos = allPositions.find(p => posMap[p.id])?.id || Object.keys(posMap)[0];
    villainPos = posMap[heroPos]?.[0] || null;
  }

  function render() {
    const scenarios  = currentData().scenarios;
    const posMap     = buildPositionMap(scenarios);
    const allPos     = currentPositions();

    // Validate state
    if (!posMap[heroPos]) {
      heroPos = allPos.find(p => posMap[p.id])?.id || Object.keys(posMap)[0];
    }
    const validVillains = posMap[heroPos] || [];
    if (!validVillains.includes(villainPos)) villainPos = validVillains[0];

    const scenId = `${heroPos}-vs-${villainPos}`;
    const scen   = scenarios.find(s => s.id === scenId);

    const actionDefs = [
      { key: 'value', label: 'Value 3-bet', cls: 'value' },
      { key: 'bluff', label: 'Bluff 3-bet', cls: 'bluff' },
      { key: 'call',  label: 'Flat call',   cls: 'call'  },
      { key: 'mix',   label: 'Mixed',        cls: 'mix'   },
    ];

    // Build hero row — only positions that have at least one scenario
    const heroButtons = allPos
      .filter(p => posMap[p.id])
      .map(p => `<button class="pos-btn${p.id === heroPos ? ' active' : ''}" data-role="hero" data-pos="${p.id}">${p.label}</button>`)
      .join('');

    // Build villain row — only valid opponents for current hero
    const villainButtons = allPos
      .filter(p => validVillains.includes(p.id))
      .map(p => `<button class="pos-btn${p.id === villainPos ? ' active' : ''}" data-role="villain" data-pos="${p.id}">${p.label}</button>`)
      .join('');

    let rangeHTML = '';
    if (scen) {
      const { combos } = buildRangeStats(scen.actions);
      rangeHTML = `
        <div class="range-chart-shell">
          <div class="tbet-scenario-label">You in <strong>${heroPos.toUpperCase()}</strong> vs raiser in <strong>${villainPos.toUpperCase()}</strong></div>
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
    } else {
      rangeHTML = `<div class="tbet-no-scenario">No range charted for this position combo — fold is default.</div>`;
    }

    wrap.innerHTML = `
      ${formatToggleHTML(format)}
      <div class="tbet-selectors">
        <div class="tbet-selector-group">
          <div class="tbet-selector-label">Your Position</div>
          <div class="tbet-pos-row">${heroButtons}</div>
        </div>
        <div class="tbet-selector-group">
          <div class="tbet-selector-label">Raiser Position</div>
          <div class="tbet-pos-row">${villainButtons}</div>
        </div>
      </div>
      ${rangeHTML}`;

    wrap.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => { format = btn.dataset.fmt; initDefaults(); render(); });
    });
    wrap.querySelectorAll('.pos-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.role === 'hero') {
          heroPos = btn.dataset.pos;
          // reset villain to first valid
          const pm = buildPositionMap(currentData().scenarios);
          villainPos = pm[heroPos]?.[0] || null;
        } else {
          villainPos = btn.dataset.pos;
        }
        render();
      });
    });
  }

  initDefaults();
  render();
}

// ── BB Defend Explorer ──────────────────────────────────────────────────────
function renderBbDefend(bbDefend6, bbDefend9) {
  const wrap = document.getElementById('bbDefendExplorer');
  let format = '6max';
  let active = bbDefend6.scenarios[0].id;

  function currentData() { return format === '6max' ? bbDefend6 : bbDefend9; }

  function render() {
    const scenarios = currentData().scenarios;
    if (!scenarios.find(s => s.id === active)) active = scenarios[0].id;
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
      ${formatToggleHTML(format)}
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
    wrap.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => { format = btn.dataset.fmt; render(); });
    });
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
  const [studyData, pfrRanges6, pfrRanges9, threeBetRanges6, threeBetRanges9, bbDefend6, bbDefend9] = await Promise.all([
    loadJson('data/study.json'),
    loadJson('data/pfr-ranges.json'),
    loadJson('data/pfr-ranges-9max.json'),
    loadJson('data/3bet-ranges.json'),
    loadJson('data/3bet-ranges-9max.json'),
    loadJson('data/bb-defend.json'),
    loadJson('data/bb-defend-9max.json'),
  ]);

  renderTopHands(studyData.topHands || []);
  renderPreflopChart(studyData.preflopChart || []);
  renderAvoidList(studyData.avoidList || []);
  renderPfrExplorer(pfrRanges6, pfrRanges9);
  renderThreeBetExplorer(threeBetRanges6, threeBetRanges9);
  renderBbDefend(bbDefend6, bbDefend9);
}

initStudy();
