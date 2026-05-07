// shared.js — utilities used across all pages

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

// ── Card rendering ──────────────────────────────────────────────────────────
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

// Large playing-card format (for game board)
function cardLarge(cardStr) {
  if (!cardStr || cardStr.length < 2) return '';
  const rank = cardStr.slice(0, -1).toUpperCase();
  const suit = cardStr.slice(-1).toLowerCase();
  const sym  = SUIT_SYMBOLS[suit] || suit;
  const cls  = SUIT_COLORS[suit]  || '';
  return `<div class="card-lg ${cls}"><span class="clg-rank">${rank}</span><span class="clg-suit">${sym}</span></div>`;
}

function cardsLargeHtml(arr) {
  if (!arr) return '';
  const cards = Array.isArray(arr) ? arr : arr.trim().split(/\s+/).filter(Boolean);
  return cards.map(cardLarge).join('');
}

// ── Nav injection ───────────────────────────────────────────────────────────
function injectNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',   label: '📊 Dashboard' },
    { href: 'trainer.html', label: '🎯 Trainer'   },
    { href: 'study.html',   label: '📚 Study'     },
  ];
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="nav-logo" href="index.html">♠ Poker Lab</a>
      <div class="nav-links">
        ${links.map(l => `<a href="${l.href}" class="nav-link${page === l.href ? ' active' : ''}">${l.label}</a>`).join('')}
      </div>
    </div>`;
  document.body.prepend(nav);
}

// ── Hand-card rendering helpers (shared by dashboard + trainer) ─────────────
const TAG_META = {
  good:   { icon: '✅', label: 'Good play' },
  bad:    { icon: '❌', label: 'Mistake'   },
  cooler: { icon: '🧊', label: 'Cooler'    },
  study:  { icon: '📚', label: 'Study'     },
};

const ACTION_BADGE = {
  bet:   { cls: 'ab-bet',   icon: '↑', label: 'Bet'   },
  raise: { cls: 'ab-raise', icon: '⬆', label: 'Raise' },
  call:  { cls: 'ab-call',  icon: '→', label: 'Call'  },
  check: { cls: 'ab-check', icon: '✓', label: 'Check' },
  fold:  { cls: 'ab-fold',  icon: '×', label: 'Fold'  },
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
