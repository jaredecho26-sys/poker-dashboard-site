// trainer.js — full game-board trainer with all drill modes

// ── Shared helpers ──────────────────────────────────────────────────────────
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
function cellLabel(row, col) {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (row < col) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[col]}${RANKS[row]}o`;
}
function combosForHand(h) {
  if (h.length === 2) return 6;
  if (h.endsWith('s')) return 4;
  if (h.endsWith('o')) return 12;
  return 0;
}

const CORRECT_MESSAGES = ['Correct!', 'Nailed it.', 'That\'s right.', 'Good read.', 'Exactly.', 'Locked in.'];
const WRONG_MESSAGES   = ['Not quite.', 'Missed that one.', 'Study this one.', 'Close, but no.', 'Wrong read.'];
function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Question pool builders ──────────────────────────────────────────────────
function buildRangeQuestionPools(pfrRanges, threeBetRanges) {
  const pfr = [], threebet = [], blinddefense = [];
  const allActions = ['open', 'value', 'bluff', 'call', 'mix', 'fold'];

  (pfrRanges.positions || []).forEach(pos => {
    const map = {};
    Object.entries(pos.actions).forEach(([act, hands]) => hands.forEach(h => { map[h] = act; }));
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const hand = cellLabel(r, c);
      const correct = map[hand] || 'fold';
      const wrongOpts = allActions.filter(a => a !== correct && ['open','mix','fold'].includes(a));
      pfr.push({ hand, position: pos.label, correct, wrongOpts,
        explanation: correct === 'open' ? `${hand} is a standard open from ${pos.label}.`
          : correct === 'mix' ? `${hand} is a mixed hand from ${pos.label} — sometimes open, sometimes fold.`
          : `${hand} is a fold from ${pos.label}. Too loose here.`,
        difficulty: ['AA','KK','QQ','JJ','AKs','AKo'].includes(hand) ? 'easy'
          : (r+c) < 8 ? 'medium' : 'hard'
      });
    }
  });

  (threeBetRanges.scenarios || []).forEach(scen => {
    const map = {};
    Object.entries(scen.actions).forEach(([act, hands]) => hands.forEach(h => { map[h] = act; }));
    for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
      const hand = cellLabel(r, c);
      const correct = map[hand] || 'fold';
      threebet.push({ hand, scenario: scen.label, correct,
        explanation: correct === 'value' ? `${hand} is value in ${scen.label}.`
          : correct === 'bluff' ? `${hand} is a 3-bet bluff in ${scen.label}.`
          : correct === 'call' ? `${hand} is a call in ${scen.label}.`
          : correct === 'mix' ? `${hand} is a mixed action in ${scen.label}.`
          : `${hand} folds in ${scen.label}.`,
        difficulty: (r+c) < 4 ? 'easy' : (r+c) < 10 ? 'medium' : 'hard'
      });
    }
  });

  // Blind defense questions from pfr-ranges — focusing on BB vs each position
  const bbVsPositions = [
    { pos: 'UTG', defFreq: '~30%', key: 'vs-utg' },
    { pos: 'CO',  defFreq: '~38%', key: 'vs-co'  },
    { pos: 'BTN', defFreq: '~48%', key: 'vs-btn' },
    { pos: 'SB',  defFreq: '~55%', key: 'vs-sb'  },
  ];
  // Simple BB defense sample questions (hand-level)
  const bbDefSamples = [
    { hand:'T8s', vs:'BTN', correct:'call', exp:'T8s vs BTN is a comfortable call — wide range needed.' },
    { hand:'K5s', vs:'BTN', correct:'call', exp:'K5s vs BTN: suited king, call.' },
    { hand:'Q2o', vs:'BTN', correct:'fold', exp:'Q2o vs BTN: even vs BTN this is too loose.' },
    { hand:'A5s', vs:'UTG', correct:'threebet', exp:'A5s vs UTG is a classic 3-bet bluff — nut blocker.' },
    { hand:'77',  vs:'CO',  correct:'call', exp:'77 vs CO is a solid call — set mine + can play postflop.' },
    { hand:'J4o', vs:'BTN', correct:'fold', exp:'J4o vs BTN: fold. Not quite wide enough.' },
    { hand:'98s', vs:'CO',  correct:'call', exp:'98s vs CO: nice suited connector, call.' },
    { hand:'K3o', vs:'BTN', correct:'fold', exp:'K3o vs BTN: still fold — offsuit weak kings are too loose.' },
    { hand:'A2s', vs:'UTG', correct:'mix', exp:'A2s vs UTG: mix 3-bet/call — has nut blocker but equity realization favors calling OOP.' },
    { hand:'QJo', vs:'BTN', correct:'call', exp:'QJo vs BTN: strong broadway, call.' },
    { hand:'T6s', vs:'SB',  correct:'call', exp:'T6s vs SB: SB opens wide, call with suited hands.' },
    { hand:'22',  vs:'UTG', correct:'call', exp:'22 vs UTG: set mine, call.' },
    { hand:'Q8o', vs:'CO',  correct:'fold', exp:'Q8o vs CO: too weak. Fold.' },
    { hand:'A9o', vs:'CO',  correct:'call', exp:'A9o vs CO: CO opens wide enough to call A9o.' },
    { hand:'KQs', vs:'UTG', correct:'call', exp:'KQs vs UTG: call — strong hand but UTG range is tight; 3-betting leaves you against only stronger holdings.' },
  ];
  bbDefSamples.forEach(s => {
    blinddefense.push({
      hand: s.hand,
      position: `BB vs ${s.vs}`,
      correct: s.correct,
      explanation: s.exp,
      difficulty: ['AA','KK','QQ','AKs','AKo'].includes(s.hand) ? 'easy' : 'medium',
    });
  });

  return { pfr, threebet, blinddefense };
}

function buildStructuredPools(trainerPack) {
  return {
    cbet: (trainerPack.cbet || []).map(q => ({
      ...q, answers: q.options.map(o => ({ key: o.key, label: o.label,
        cls: o.key === 'small' ? 'qa-call' : o.key === 'check' ? 'qa-fold' : 'qa-open' })),
      correctKey: q.correct,
    })),
    shovefold: (trainerPack.shoveFold || []).map(q => ({
      ...q, answers: q.options.map(o => ({ key: o.key, label: o.label,
        cls: o.key === 'jam' || o.key === 'call' ? 'qa-open' : o.key === 'fold' ? 'qa-fold' : 'qa-call' })),
      correctKey: q.correct,
    })),
    potodds: (trainerPack.potOdds || []).map(q => ({
      ...q, answers: q.options.map(o => ({
        key: o.key, label: o.label,
        cls: o.key === 'raise' || o.key === 'call' || ['33','36','20','25'].includes(o.key) ? 'qa-open'
          : o.key === 'fold' ? 'qa-fold' : 'qa-call',
      })),
      correctKey: q.correct,
    })),
    combo: (trainerPack.comboDrills || []).map(q => ({
      ...q, answers: q.options.map(o => ({
        key: o.key, label: o.label, cls: 'qa-call',
      })),
      correctKey: q.correct,
    })),
  };
}

function filterPoolByLevel(pool, level) {
  if (level === 'all') return pool;
  return pool.filter(q => (q.difficulty || 'medium') === level);
}

function sampleQuestion(pool) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── POSITION BADGE ──────────────────────────────────────────────────────────
const POS_COLORS = {
  BTN:'pos-btn', CO:'pos-co', HJ:'pos-hj', UTG:'pos-utg',
  SB:'pos-sb', BB:'pos-bb', MP:'pos-hj',
};
function posBadge(posStr) {
  const key = (posStr || '').trim().toUpperCase().split(/\s+/)[0];
  const cls = POS_COLORS[key] || '';
  return `<div class="pos-badge ${cls}">${key}</div>`;
}

// ── SCORE HUD ───────────────────────────────────────────────────────────────
function scoreHtml(state, pool) {
  const acc = state.total ? Math.round((state.score / state.total) * 100) : 0;
  const flame = state.streak >= 5 ? '🔥🔥' : state.streak >= 3 ? '🔥' : state.streak >= 1 ? '·' : '';
  const pct = state.total ? (state.score / state.total * 100) : 0;
  const barWidth = Math.round(pct);
  return `
  <div class="hud-scorebar">
    <div class="hud-stat"><span class="hud-label">Score</span><span class="hud-value">${state.score}/${state.total}</span></div>
    <div class="hud-bar-wrap"><div class="hud-bar" style="width:${barWidth}%"></div></div>
    <div class="hud-stat"><span class="hud-label">Accuracy</span><span class="hud-value ${acc >= 70 ? 'hud-green' : acc >= 50 ? 'hud-yellow' : 'hud-red'}">${acc}%</span></div>
    <div class="hud-stat"><span class="hud-label">Streak</span><span class="hud-value">${state.streak} ${flame}</span></div>
    <div class="hud-stat"><span class="hud-label">Pool</span><span class="hud-value hud-muted">${pool.length} spots</span></div>
  </div>`;
}

// ── GAME BOARD renderers ────────────────────────────────────────────────────

const MODE_LABELS = { pfr:'PFR', threebet:'3-Bet', blinddefense:'BB Defend', cbet:'C-Bet', shovefold:'Shove/Fold', potodds:'Pot Odds', combo:'Combo' };
const PREFLOP_SLOTS = Array(5).fill(null).map(() => '<div class="card-empty-slot"></div>').join('');

function buildRangeBoard(q, mode) {
  const posLabel = q.position || q.scenario || '';
  const modeLabel = MODE_LABELS[mode] || mode.toUpperCase();
  const prompt = posLabel.includes('vs')
    ? `BB defense vs <strong>${posLabel.replace(/^BB vs /i,'')}</strong> open — what do you do?`
    : `Action from <strong>${posLabel}</strong> — open, fold, or mix?`;
  return `
  <div class="game-board">
    <div class="board-meta-row">
      ${posBadge(posLabel)}
      <div class="board-mode-chip">${modeLabel}</div>
      <div class="board-pot-chip difficulty-${q.difficulty || 'medium'}">${q.difficulty || 'medium'}</div>
    </div>
    <div class="board-hero-zone">
      <span class="board-zone-label">YOUR HAND</span>
      <div class="hero-cards">${buildHandChips(q.hand)}</div>
    </div>
    <div class="board-community-zone board-community-preflop">
      <span class="board-zone-label">BOARD</span>
      <div class="community-cards">${PREFLOP_SLOTS}</div>
      <span class="preflop-label">Pre-flop</span>
    </div>
    <div class="board-prompt">${prompt}</div>
  </div>`;
}

function buildHandChips(handStr) {
  if (!handStr) return '';
  // handStr like "AKs", "QTo", "77"
  const rank1 = handStr[0], rank2 = handStr[1];
  const type = handStr[2] || '';
  if (type === 's') {
    return `${cardChip(rank1 + 'h')}${cardChip(rank2 + 'h')}`;
  } else if (type === 'o') {
    return `${cardChip(rank1 + 'h')}${cardChip(rank2 + 'c')}`;
  } else {
    // pair
    return `${cardChip(rank1 + 'h')}${cardChip(rank2 + 'd')}`;
  }
}

function buildCBetBoard(q) {
  const boardCards = (q.board || []).map(c => cardLarge(c)).join('');
  const heroCards = q.heroHand ? `
    <div class="board-hero-zone">
      <span class="board-zone-label">YOUR HAND</span>
      <div class="hero-cards">${buildHandChipsFromStr(q.heroHand)}</div>
    </div>` : '';
  return `
  <div class="game-board">
    <div class="board-meta-row">
      ${q.position ? posBadge(q.position) : ''}
      <div class="board-mode-chip">C-Bet</div>
      <div class="board-mode-chip" style="background:rgba(46,204,113,.12);border-color:rgba(46,204,113,.3);color:var(--green)">${q.potType || 'SRP'}</div>
      <div class="board-pot-chip difficulty-${q.difficulty}">${q.difficulty}</div>
    </div>
    ${heroCards}
    <div class="board-community-zone">
      <span class="board-zone-label">BOARD</span>
      <div class="community-cards">${boardCards}</div>
    </div>
    <div class="board-prompt">${q.line ? `<span style="color:var(--muted);font-size:12px">${q.line}</span><br>` : ''}${q.prompt}</div>
  </div>`;
}

function buildShoveBoard(q) {
  const stackBars = Math.min(Math.round(q.stackBb / 2), 10);
  const stackViz = Array.from({length:10}, (_,i) =>
    `<div class="stack-bar${i < stackBars ? ' filled' : ''}"></div>`).join('');
  return `
  <div class="game-board">
    <div class="board-meta-row">
      ${posBadge(q.position)}
      <div class="board-mode-chip">Shove/Fold</div>
      <div class="board-stack-info">
        <span class="stack-label">Stack</span>
        <span class="stack-value">${q.stackBb}bb</span>
      </div>
      <div class="stack-viz">${stackViz}</div>
      <div class="board-pot-chip difficulty-${q.difficulty}">${q.difficulty}</div>
    </div>
    <div class="board-hero-zone">
      <span class="board-zone-label">YOUR HAND</span>
      <div class="hero-cards">${buildHandChips(q.heroHand)}</div>
    </div>
    <div class="board-community-zone board-community-preflop">
      <span class="board-zone-label">BOARD</span>
      <div class="community-cards">${PREFLOP_SLOTS}</div>
      <span class="preflop-label">Pre-flop</span>
    </div>
    <div class="board-prompt"><span style="color:var(--muted);font-size:12px">${q.action}</span><br>${q.prompt}</div>
  </div>`;
}

function buildOddsBoard(q) {
  const potAfterCall = (q.potSize || 0) + (q.betSize || 0) * 2; // pot + bet + call (call = bet)
  const requiredEq = potAfterCall > 0 ? Math.round((q.betSize / potAfterCall) * 100) : 0;
  const boardCards = (q.board || []).map(c => cardLarge(c)).join('');
  const heroHand = q.heroHand ? buildHandChipsFromStr(q.heroHand) : '';

  let oddsPanel = '';
  if (q.type === 'calculate') {
    oddsPanel = `
    <div class="odds-equation">
      <div class="odds-eq-part">
        <span class="odds-eq-label">Call</span>
        <span class="odds-eq-val">$${q.betSize}</span>
      </div>
      <div class="odds-eq-div">÷</div>
      <div class="odds-eq-part">
        <span class="odds-eq-label">Total pot</span>
        <span class="odds-eq-val">$${potAfterCall}</span>
      </div>
      <div class="odds-eq-div">=</div>
      <div class="odds-eq-part">
        <span class="odds-eq-label">Required equity</span>
        <span class="odds-eq-val odds-eq-unknown">?%</span>
      </div>
    </div>`;
  } else if (q.type === 'outs') {
    oddsPanel = `
    <div class="odds-outs-panel">
      <div class="odds-rule"><span class="rule-label">Rule of 2</span><span class="rule-desc">Outs × 2 = equity % to next street</span></div>
      <div class="odds-rule"><span class="rule-label">Rule of 4</span><span class="rule-desc">Outs × 4 = equity % with two streets left</span></div>
    </div>`;
  } else if (q.type === 'decision') {
    const outs = q.outs || 0;
    const rof2 = outs * 2;
    const rof4 = outs * 4;
    oddsPanel = `
    <div class="odds-equation">
      <div class="odds-eq-part">
        <span class="odds-eq-label">Pot odds needed</span>
        <span class="odds-eq-val odds-eq-needed">${requiredEq}%</span>
      </div>
      <div class="odds-eq-div">vs</div>
      <div class="odds-eq-part">
        <span class="odds-eq-label">Your equity (${outs} outs)</span>
        <span class="odds-eq-val odds-eq-equity">~${rof4}% (R×4)</span>
      </div>
      <div class="odds-eq-div">=</div>
      <div class="odds-eq-part odds-${rof4 >= requiredEq ? 'good' : 'bad'}">
        <span class="odds-eq-label">${rof4 >= requiredEq ? '✓ Profitable' : '✗ Losing call'}</span>
        <span class="odds-eq-val">${rof4 >= requiredEq ? '+EV' : '-EV'}</span>
      </div>
    </div>`;
  }

  return `
  <div class="game-board game-board--odds">
    <div class="board-meta-row">
      <div class="board-mode-chip odds-mode-chip">POT ODDS</div>
      <div class="board-pot-chip difficulty-${q.difficulty}">${q.difficulty}</div>
      ${q.type ? `<div class="odds-type-badge">${q.type.toUpperCase()}</div>` : ''}
    </div>
    ${boardCards ? `<div class="board-community-zone"><span class="board-zone-label">BOARD</span><div class="community-cards">${boardCards}</div></div>` : ''}
    ${heroHand ? `<div class="board-hero-zone"><span class="board-zone-label">YOUR HAND</span><div class="hero-cards">${heroHand}</div></div>` : ''}
    <div class="odds-info-row">
      <div class="odds-chip odds-pot"><span class="oc-label">POT</span><span class="oc-val">$${q.potSize || 0}</span></div>
      ${q.betSize ? `<div class="odds-chip odds-bet"><span class="oc-label">VILLAIN BET</span><span class="oc-val">$${q.betSize}</span></div>` : ''}
      ${q.betSize ? `<div class="odds-chip odds-call"><span class="oc-label">TO CALL</span><span class="oc-val">$${q.betSize}</span></div>` : ''}
      ${q.outs ? `<div class="odds-chip odds-outs"><span class="oc-label">OUTS</span><span class="oc-val">${q.outs}</span></div>` : ''}
    </div>
    ${oddsPanel}
    <div class="board-prompt">${q.prompt}</div>
  </div>`;
}

function buildHandChipsFromStr(str) {
  if (!str || str.length < 4) return cardChip ? buildHandChips(str) : str;
  // str is like "Jh9h" — two specific cards each 2 chars
  const c1 = str.slice(0, 2), c2 = str.slice(2, 4);
  return (cardChip ? cardChip(c1) + cardChip(c2) : c1 + c2);
}

function buildComboBoard(q) {
  const boardCards = (q.board || []).map(c => cardLarge(c)).join('');
  const heroHand = q.heroHand ? buildHandChipsFromStr(q.heroHand) : '';
  const typeBadge = { suitedness:'♦ Suits', blocker:'🃏 Blocker', position:'📍 Position' }[q.type] || q.type;
  return `
  <div class="game-board game-board--combo">
    <div class="board-meta-row">
      <div class="board-mode-chip combo-mode-chip">COMBO DRILL</div>
      <div class="board-pot-chip difficulty-${q.difficulty}">${q.difficulty}</div>
      <div class="odds-type-badge">${typeBadge}</div>
    </div>
    ${boardCards ? `<div class="board-community-zone"><span class="board-zone-label">BOARD</span><div class="community-cards">${boardCards}</div></div>` : ''}
    <div class="board-hero-zone">
      <span class="board-zone-label">YOUR HAND</span>
      <div class="hero-cards">${heroHand}</div>
      ${q.context ? `<span class="board-context">${q.context}</span>` : ''}
    </div>
    <div class="board-prompt">${q.prompt}</div>
  </div>`;
}

// ── ANSWER BUTTONS ──────────────────────────────────────────────────────────
function renderAnswerButtons(answers) {
  return (answers || []).map(a =>
    `<button class="game-ans ${a.cls || 'qa-call'}" data-key="${a.key}">${a.label}</button>`
  ).join('');
}

// ── RANGE QUESTION (pfr / 3bet / blinddefense) ───────────────────────────────
function buildRangeQuestion(q, mode) {
  const posLabel = q.position || q.scenario || '';
  const answerOpts = buildRangeAnswers(q, mode);
  return {
    ...q,
    answers: answerOpts,
    correctKey: q.correct,
    _mode: mode,
    _boardHtml: buildRangeBoard(q, mode),
  };
}

function buildRangeAnswers(q, mode) {
  const base = {
    pfr: [
      { key:'open', label:'⬆ Open RFI',  cls:'qa-open' },
      { key:'mix',  label:'↕ Mix / Limp', cls:'qa-mix'  },
      { key:'fold', label:'✕ Fold',        cls:'qa-fold' },
    ],
    threebet: [
      { key:'value', label:'⬆ 3-Bet Value', cls:'qa-open' },
      { key:'bluff', label:'↑ 3-Bet Bluff', cls:'qa-mix'  },
      { key:'call',  label:'→ Call',         cls:'qa-call' },
      { key:'fold',  label:'✕ Fold',         cls:'qa-fold' },
    ],
    blinddefense: [
      { key:'call',     label:'→ Call (Defend)', cls:'qa-call' },
      { key:'threebet', label:'⬆ 3-Bet',         cls:'qa-open' },
      { key:'fold',     label:'✕ Fold',           cls:'qa-fold' },
    ],
  };
  return base[mode] || base.pfr;
}

// ── SHOVE/FOLD question ──────────────────────────────────────────────────────
function buildShoveQuestion(q) {
  return {
    ...q,
    _boardHtml: buildShoveBoard(q),
    correctKey: q.correct,
  };
}

// ── CBET question ────────────────────────────────────────────────────────────
function buildCBetQuestion(q) {
  return {
    ...q,
    _boardHtml: buildCBetBoard(q),
    correctKey: q.correct,
  };
}

// ── POT ODDS question ────────────────────────────────────────────────────────
function buildOddsQuestion(q) {
  return {
    ...q,
    _boardHtml: buildOddsBoard(q),
    correctKey: q.correct,
  };
}

// ── COMBO question ────────────────────────────────────────────────────────────
function buildComboQuestion(q) {
  return {
    ...q,
    _boardHtml: buildComboBoard(q),
    correctKey: q.correct,
  };
}

// ── POT ODDS REFERENCE PANEL ─────────────────────────────────────────────────
function renderOddsRef() {
  const el = document.getElementById('oddsRef');
  if (!el) return;
  el.innerHTML = `
    <div class="odds-ref-grid">
      <div class="odds-ref-card">
        <h4>The Formula</h4>
        <div class="odds-formula">Call ÷ (Pot + Bet + Call) = Required equity</div>
        <div class="odds-examples">
          <div class="oe-row"><span>$50 into $100</span><strong>25%</strong></div>
          <div class="oe-row"><span>$25 into $100</span><strong>~17%</strong></div>
          <div class="oe-row"><span>$75 into $100</span><strong>30%</strong></div>
          <div class="oe-row"><span>$100 into $100</span><strong>33%</strong></div>
          <div class="oe-row"><span>$200 into $100</span><strong>40%</strong></div>
        </div>
      </div>
      <div class="odds-ref-card">
        <h4>Rule of 2 &amp; 4</h4>
        <div class="odds-formula">Outs × 4 = equity% (2 streets)<br>Outs × 2 = equity% (1 street)</div>
        <div class="odds-examples">
          <div class="oe-row"><span>Flush draw (9 outs)</span><strong>~36% / 18%</strong></div>
          <div class="oe-row"><span>OESD (8 outs)</span><strong>~32% / 16%</strong></div>
          <div class="oe-row"><span>Gutshot (4 outs)</span><strong>~16% / 8%</strong></div>
          <div class="oe-row"><span>Flush + OESD (12–15)</span><strong>~48–60%</strong></div>
        </div>
      </div>
      <div class="odds-ref-card">
        <h4>Bet Size → Required Equity</h4>
        <div class="odds-examples">
          <div class="oe-row"><span>¼ pot ($25 into $100)</span><strong>~17%</strong></div>
          <div class="oe-row"><span>⅓ pot ($33 into $100)</span><strong>~20%</strong></div>
          <div class="oe-row"><span>½ pot ($50 into $100)</span><strong>25%</strong></div>
          <div class="oe-row"><span>⅔ pot ($67 into $100)</span><strong>~29%</strong></div>
          <div class="oe-row"><span>¾ pot ($75 into $100)</span><strong>30%</strong></div>
          <div class="oe-row"><span>Pot ($100 into $100)</span><strong>33%</strong></div>
          <div class="oe-row"><span>2× pot overbet</span><strong>40%</strong></div>
        </div>
      </div>
    </div>`;
}

// ── MAIN QUIZ BUILDER ────────────────────────────────────────────────────────
function buildFullQuestion(rawQ, mode) {
  if (mode === 'pfr' || mode === 'threebet' || mode === 'blinddefense') {
    return buildRangeQuestion(rawQ, mode);
  } else if (mode === 'cbet') {
    return buildCBetQuestion(rawQ);
  } else if (mode === 'shovefold') {
    return buildShoveQuestion(rawQ);
  } else if (mode === 'potodds') {
    return buildOddsQuestion(rawQ);
  } else if (mode === 'combo') {
    return buildComboQuestion(rawQ);
  }
  return rawQ;
}

function buildQuestionHtml(q, state, pool) {
  const boardHtml = q._boardHtml || `<div class="game-board"><div class="board-prompt">${q.prompt || ''}</div></div>`;
  const diffBadge = `<span class="diff-badge diff-${q.difficulty || 'medium'}">${q.difficulty || 'medium'}</span>`;
  const ans = q.answers || [];
  return `
    ${scoreHtml(state, pool)}
    <div class="game-board-wrap">
      ${boardHtml}
    </div>
    <div class="answer-zone">
      ${ans.map(a => `<button class="game-ans ${a.cls || ''}" data-key="${a.key}">${a.label}</button>`).join('')}
    </div>
    <div class="quiz-feedback" id="quizFeedback" hidden></div>
    <div class="quiz-next-wrap" id="quizNextWrap" hidden>
      <button class="quiz-next" id="quizNext">Next Spot →</button>
    </div>`;
}

// ── RANGE SAMPLE POOLS (for pfr/threebet/blinddefense) ──────────────────────
function sampleRangeQuestion(pool) {
  if (!pool.length) return null;
  const q = pool[Math.floor(Math.random() * pool.length)];
  return q;
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function initTrainer() {
  injectNav();
  renderOddsRef();

  const [pfrRanges, threeBetRanges, trainerPack] = await Promise.all([
    loadJson('data/pfr-ranges.json'),
    loadJson('data/3bet-ranges.json'),
    loadJson('data/trainer-pack.json'),
  ]);

  const rangePools = buildRangeQuestionPools(pfrRanges, threeBetRanges);
  const structuredPools = buildStructuredPools(trainerPack);

  const allPools = {
    pfr:          rangePools.pfr.map(q => buildFullQuestion(q, 'pfr')),
    threebet:     rangePools.threebet.map(q => buildFullQuestion(q, 'threebet')),
    blinddefense: rangePools.blinddefense.map(q => buildFullQuestion(q, 'blinddefense')),
    cbet:         structuredPools.cbet.map(q => buildFullQuestion(q, 'cbet')),
    shovefold:    structuredPools.shovefold.map(q => buildFullQuestion(q, 'shovefold')),
    potodds:      structuredPools.potodds.map(q => buildFullQuestion(q, 'potodds')),
    combo:        structuredPools.combo.map(q => buildFullQuestion(q, 'combo')),
  };

  const state = { mode:'pfr', level:'all', score:0, total:0, streak:0, bestStreak:0, answered:false };
  const quizBody = document.getElementById('quizBody');

  function activePool() {
    return filterPoolByLevel(allPools[state.mode] || [], state.level);
  }

  function nextQuestion() {
    state.answered = false;
    const pool = activePool();
    const raw = sampleQuestion(pool);
    if (!raw) {
      quizBody.innerHTML = `<div class="quiz-empty">No questions in this level yet.</div>`;
      return;
    }
    quizBody.innerHTML = buildQuestionHtml(raw, state, pool);
    attachHandlers(raw, pool);
  }

  function attachHandlers(q, pool) {
    quizBody.querySelectorAll('.game-ans').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.answered) return;
        state.answered = true;
        state.total++;
        const chosen = btn.dataset.key;
        const correct = q.correctKey;
        const isRight = chosen === correct;

        if (isRight) { state.score++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak); }
        else { state.streak = 0; }

        // reveal
        quizBody.querySelectorAll('.game-ans').forEach(b => {
          b.disabled = true;
          if (b.dataset.key === correct) b.classList.add('qa-correct-reveal');
          if (b === btn && !isRight) b.classList.add('qa-wrong-reveal');
        });

        const fbEl = document.getElementById('quizFeedback');
        const nextWrap = document.getElementById('quizNextWrap');
        fbEl.innerHTML = `<span class="${isRight ? 'fb-correct' : 'fb-wrong'}">${randOf(isRight ? CORRECT_MESSAGES : WRONG_MESSAGES)} ${q.explanation || ''}</span>`;
        fbEl.hidden = false;
        nextWrap.hidden = false;

        // update scorebar
        const hud = quizBody.querySelector('.hud-scorebar');
        if (hud) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = scoreHtml(state, pool);
          hud.replaceWith(wrapper.firstElementChild);
        }

        document.getElementById('quizNext').addEventListener('click', nextQuestion, { once: true });
      });
    });
  }

  // Mode tabs
  document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      state.answered = false;
      document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      // show/hide pot odds reference
      const oddsRef = document.getElementById('oddsRefSection');
      if (oddsRef) oddsRef.hidden = state.mode !== 'potodds';
      nextQuestion();
    });
  });

  // Level tabs
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

initTrainer();
