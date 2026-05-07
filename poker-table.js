/**
 * poker-table.js — SVG poker table visualization
 * Takes a hand object and renders a professional SVG table.
 *
 * API:
 *   pokerTableHtml(hand)        → HTML string
 *   renderPokerTable(hand, el)  → writes into containerEl
 *
 * Hand shape expected:
 *   { handId, heroCards, board[], net, actions[], villainCards? }
 */

(function (global) {
  'use strict';

  // ── Suit constants ──────────────────────────────────────────────────────────
  const SUIT_SYM   = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const SUIT_COLOR = { s: '#7eb3ff', h: '#ff7b7b', d: '#ffaa5c', c: '#6bcf7f' };
  const SUIT_BG    = { s: '#1e2a45', h: '#3d1a1a', d: '#3d2010', c: '#1a2e1a' };

  // Angles (degrees from top, clockwise) for 6 seats.
  // Seat 0 = hero, always at the bottom.
  const SEAT_ANGLES = [90, 30, 330, 270, 210, 150];
  //   0=bottom, 1=bottom-right, 2=top-right, 3=top, 4=top-left, 5=bottom-left

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function parseCards(str) {
    if (!str) return [];
    return str.trim().split(/\s+/).filter(Boolean).map(c => ({
      rank: c.slice(0, -1).toUpperCase(),
      suit: c.slice(-1).toLowerCase(),
    }));
  }

  function posBadgeColor(lbl) {
    if (lbl === 'D')  return '#f6c445';
    if (lbl === 'SB') return '#3498db';
    if (lbl === 'BB') return '#e74c3c';
    return '#888';
  }

  /**
   * Infer dealer/SB/BB seat indices from hand actions.
   * Hero is always seat 0.
   */
  function inferPositions(hand) {
    const actions = hand.actions || [];
    let heroPos = 'BTN'; // default

    for (const a of actions) {
      const lc = (a.line || '').toLowerCase();
      if (lc.includes('popemycherry')) {
        if (lc.includes('small blind')) { heroPos = 'SB'; break; }
        if (lc.includes('big blind'))   { heroPos = 'BB'; break; }
      }
    }

    // offset: how many seats after hero is BTN
    const posOffset = { BTN: 0, CO: 1, HJ: 2, UTG: 3, BB: 4, SB: 5 };
    const off = posOffset[heroPos] !== undefined ? posOffset[heroPos] : 0;

    const dealerSeat = (0 + off) % 6;
    return {
      heroPos,
      heroSeat:   0,
      dealerSeat,
      sbSeat:     (dealerSeat + 1) % 6,
      bbSeat:     (dealerSeat + 2) % 6,
    };
  }

  // ── SVG card ─────────────────────────────────────────────────────────────────
  function svgCard(x, y, card, opts) {
    const w  = opts.w  || 28;
    const h  = opts.h  || 40;
    const rx = opts.rx || 4;
    const fs = opts.fs || 11;
    const ss = opts.ss || 9;

    if (!card) {
      return [
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`,
        `      fill="#141d2e" stroke="#2d3a55" stroke-width="1.2"/>`,
        `<text x="${x + w/2}" y="${y + h*0.65}" text-anchor="middle"`,
        `      fill="#2d3a55" font-size="${fs + 5}" font-weight="900">?</text>`,
      ].join('\n');
    }

    const bg    = SUIT_BG[card.suit]    || '#1e2a45';
    const color = SUIT_COLOR[card.suit] || '#c8d6f5';
    const sym   = SUIT_SYM[card.suit]   || card.suit;

    return [
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`,
      `      fill="${bg}" stroke="${color}" stroke-width="1.4"/>`,
      `<text x="${x + 3}" y="${y + fs + 2}" fill="${color}"`,
      `      font-size="${fs}" font-weight="700" font-family="monospace">${card.rank}</text>`,
      `<text x="${x + w/2}" y="${y + h - 4}" text-anchor="middle" fill="${color}"`,
      `      font-size="${ss}" font-family="serif">${sym}</text>`,
    ].join('\n');
  }

  // ── Board cards (centered on table) ──────────────────────────────────────────
  function renderBoard(board, cx, cy) {
    const cards = board.map(c => parseCards(c)[0]).filter(Boolean);
    if (!cards.length) return '';
    const cw = 34, ch = 50, gap = 7;
    const total = cards.length * (cw + gap) - gap;
    const sx = cx - total / 2;
    const sy = cy - ch / 2;
    return cards.map((card, i) =>
      svgCard(sx + i * (cw + gap), sy, card, { w: cw, h: ch, rx: 5, fs: 14, ss: 12 })
    ).join('\n');
  }

  // ── Single seat ───────────────────────────────────────────────────────────────
  function renderSeat(idx, hand, positions, cx, cy, srx, sry) {
    const angleDeg = SEAT_ANGLES[idx];
    const rad = (angleDeg - 90) * Math.PI / 180;
    const x = cx + srx * Math.cos(rad);
    const y = cy + sry * Math.sin(rad);

    const isHero = idx === positions.heroSeat;
    const posLbl = idx === positions.dealerSeat ? 'D'
                 : idx === positions.sbSeat     ? 'SB'
                 : idx === positions.bbSeat     ? 'BB'
                 : '';

    // Cards to show
    const heroCards    = parseCards(hand.heroCards);
    const villainCards = hand.villainCards ? parseCards(hand.villainCards) : null;
    let cards = null;
    if (isHero) {
      cards = heroCards.length >= 2 ? heroCards : null;
    } else if (villainCards && idx === 1) {
      cards = villainCards.length >= 2 ? villainCards : null;
    }

    const cw  = isHero ? 32 : 26;
    const ch  = isHero ? 46 : 38;
    const gap = 5;
    const totalW = 2 * cw + gap;

    const sx = x - totalW / 2;
    const sy = y - ch / 2 - (isHero ? 5 : 0);

    const c0 = cards ? cards[0] : null;
    const c1 = cards ? cards[1] : null;
    const cardOpts = { w: cw, h: ch, rx: 5, fs: isHero ? 14 : 11, ss: isHero ? 12 : 9 };

    const seatBg     = isHero ? '#0d3d1f' : '#111827';
    const seatBorder = isHero ? '#2ecc71' : '#2d3a55';
    const nameColor  = isHero ? '#2ecc71' : '#6b7fa8';
    const nameText   = isHero ? '▶ You'   : `Seat ${idx + 1}`;
    const labelY     = sy + ch + 15;

    const badgeX = x + totalW / 2 + 12;
    const badgeY = sy + 11;

    return `<g class="pt-seat">
  ${svgCard(sx, sy, c0, cardOpts)}
  ${svgCard(sx + cw + gap, sy, c1, cardOpts)}
  <rect x="${x - 30}" y="${labelY - 12}" width="60" height="16" rx="8"
        fill="${seatBg}" stroke="${seatBorder}" stroke-width="1"/>
  <text x="${x}" y="${labelY - 2}" text-anchor="middle" fill="${nameColor}"
        font-size="9" font-family="system-ui,sans-serif"
        font-weight="${isHero ? '700' : '500'}">${nameText}</text>
  ${posLbl ? `
  <circle cx="${badgeX}" cy="${badgeY}" r="10"
          fill="${posBadgeColor(posLbl)}" stroke="#0a0e1a" stroke-width="1.5"/>
  <text x="${badgeX}" y="${badgeY + 4}" text-anchor="middle"
        fill="#0a0e1a" font-size="${posLbl.length > 1 ? '7' : '9'}"
        font-weight="800" font-family="monospace">${posLbl}</text>` : ''}
</g>`;
  }

  // ── Main function ─────────────────────────────────────────────────────────────
  function pokerTableHtml(hand) {
    const W = 600, H = 460;
    const cx = W / 2, cy = H / 2;
    const tableRx = 218, tableRy = 152;
    const seatRx  = tableRx + 54, seatRy = tableRy + 56;

    const positions = inferPositions(hand);
    const board     = hand.board || [];

    // Seats
    const seatsSvg = Array.from({ length: 6 }, (_, i) =>
      renderSeat(i, hand, positions, cx, cy, seatRx, seatRy)
    ).join('\n');

    // Board
    const boardSvg = renderBoard(board, cx, cy);

    // Pot estimate
    const pot = Math.abs(hand.net || 0);
    const potSvg = pot > 0
      ? `<text x="${cx}" y="${cy - 30}" text-anchor="middle" fill="#f6c445"
               font-size="12" font-family="system-ui,sans-serif" font-weight="600">
           💰 Pot ~$${pot.toFixed(2)}
         </text>`
      : '';

    // Hero position tag at bottom
    const heroPosSvg = `<text x="${cx}" y="${H - 8}" text-anchor="middle"
         fill="#3a4a6a" font-size="10" font-family="system-ui,sans-serif">
  Hero: ${positions.heroPos} · 6-max
</text>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${W} ${H}"
     class="pt-svg"
     role="img" aria-label="Poker table for hand #${hand.handId}">
  <defs>
    <radialGradient id="pt-felt-${hand.handId}" cx="50%" cy="50%" r="60%">
      <stop offset="0%"   stop-color="#0e6632"/>
      <stop offset="100%" stop-color="#074020"/>
    </radialGradient>
    <radialGradient id="pt-rail-${hand.handId}" cx="50%" cy="30%" r="70%">
      <stop offset="0%"   stop-color="#5a3a12"/>
      <stop offset="100%" stop-color="#2e1c07"/>
    </radialGradient>
    <filter id="pt-shadow-${hand.handId}" x="-10%" y="-10%" width="120%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10"
                    flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>

  <!-- Drop shadow -->
  <ellipse cx="${cx}" cy="${cy + 8}" rx="${tableRx + 2}" ry="${tableRy + 2}"
           fill="rgba(0,0,0,0.4)" filter="url(#pt-shadow-${hand.handId})"/>

  <!-- Rail -->
  <ellipse cx="${cx}" cy="${cy}" rx="${tableRx}" ry="${tableRy}"
           fill="url(#pt-rail-${hand.handId})" stroke="#1a0e04" stroke-width="3"/>

  <!-- Felt -->
  <ellipse cx="${cx}" cy="${cy}" rx="${tableRx - 14}" ry="${tableRy - 14}"
           fill="url(#pt-felt-${hand.handId})" stroke="#0a5228" stroke-width="2"/>

  <!-- Inner ring accent -->
  <ellipse cx="${cx}" cy="${cy}" rx="${tableRx - 30}" ry="${tableRy - 30}"
           fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>

  <!-- Board cards -->
  ${boardSvg}

  <!-- Pot -->
  ${potSvg}

  <!-- Seats -->
  ${seatsSvg}

  ${heroPosSvg}
</svg>`;

    const texture = hand.boardTexture && hand.boardTexture !== 'unknown'
      ? `<span class="pt-texture-badge">${hand.boardTexture}</span>` : '';

    return `<div class="poker-table-wrap">
  <div class="pt-header">
    <span class="pt-hand-id">🃏 Hand #${hand.handId}</span>
    ${texture}
  </div>
  ${svg}
</div>`;
  }

  function renderPokerTable(hand, containerEl) {
    containerEl.innerHTML = pokerTableHtml(hand);
  }

  // Exports
  global.pokerTableHtml   = pokerTableHtml;
  global.renderPokerTable = renderPokerTable;

})(typeof window !== 'undefined' ? window : global);
