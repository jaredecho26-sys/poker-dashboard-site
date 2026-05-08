// drills.js — Poker drill system UI
// Relies on DRILL_SCENARIOS from data/drill-scenarios.js

(function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────
  let queue = [];        // shuffled array of scenarios
  let queueIdx = 0;
  let correct = 0;
  let wrong = 0;
  let wrongItems = [];
  let currentCat = 'all';
  let answered = false;  // has current card been answered/revealed?

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const cardArea       = document.getElementById('drillCardArea');
  const resultScreen   = document.getElementById('drillResultScreen');
  const statCurrent    = document.getElementById('statCurrent');
  const statTotal      = document.getElementById('statTotal');
  const statCorrect    = document.getElementById('statCorrect');
  const statWrong      = document.getElementById('statWrong');
  const statRemaining  = document.getElementById('statRemaining');
  const progressFill   = document.getElementById('drillProgressFill');
  const resultEmoji    = document.getElementById('resultEmoji');
  const resultScore    = document.getElementById('resultScore');
  const resultSub      = document.getElementById('resultSub');
  const wrongListEl    = document.getElementById('wrongList');
  const btnRetryAll    = document.getElementById('btnRetryAll');
  const btnRetryWrong  = document.getElementById('btnRetryWrong');
  const btnShuffle     = document.getElementById('btnShuffle');

  // ── Helpers ───────────────────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildQueue(cat, scenarios) {
    const pool = cat === 'all'
      ? [
          ...scenarios.potOdds,
          ...scenarios.outs,
          ...scenarios.equity,
          ...scenarios.handReview,
        ]
      : scenarios[cat] || [];
    return shuffle(pool);
  }

  function updateStats() {
    const total = queue.length;
    const done  = queueIdx;
    statCurrent.textContent  = Math.min(done + 1, total);
    statTotal.textContent    = total;
    statCorrect.textContent  = correct;
    statWrong.textContent    = wrong;
    statRemaining.textContent = Math.max(total - done, 0);
    const pct = total > 0 ? (done / total) * 100 : 0;
    progressFill.style.width = pct + '%';
  }

  // ── Multiple-choice generation ────────────────────────────────────────────
  function makePotOddsChoices(scenario) {
    const correct = scenario.answer; // e.g. 33.3
    const opts = new Set([correct]);
    const deltas = [5, 8, 12, 15, 18, 22, 25, 30];
    let tries = 0;
    while (opts.size < 4 && tries < 40) {
      const delta = deltas[Math.floor(Math.random() * deltas.length)] * (Math.random() > 0.5 ? 1 : -1);
      const candidate = Math.round((correct + delta) * 10) / 10;
      if (candidate > 0 && candidate < 100 && !opts.has(candidate)) opts.add(candidate);
      tries++;
    }
    return shuffle([...opts]).map(v => ({ label: v + '%', value: v }));
  }

  function makeEquityChoices(scenario) {
    const correct = scenario.answer;
    const opts = new Set([correct]);
    const deltas = [4, 7, 10, 14, 18, 22];
    let tries = 0;
    while (opts.size < 4 && tries < 40) {
      const delta = deltas[Math.floor(Math.random() * deltas.length)] * (Math.random() > 0.5 ? 1 : -1);
      const candidate = Math.round((correct + delta) * 10) / 10;
      if (candidate > 0 && candidate < 100 && !opts.has(candidate)) opts.add(candidate);
      tries++;
    }
    return shuffle([...opts]).map(v => ({ label: v + '%', value: v }));
  }

  function makeOutsChoices(scenario) {
    const correct = scenario.outs;
    const opts = new Set([correct]);
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    let tries = 0;
    while (opts.size < 4 && tries < 40) {
      const v = pool[Math.floor(Math.random() * pool.length)];
      if (!opts.has(v)) opts.add(v);
      tries++;
    }
    return shuffle([...opts]).map(v => ({ label: v + ' outs', value: v }));
  }

  // ── Card renderers ─────────────────────────────────────────────────────────
  function renderPotOddsCard(sc) {
    const choices = makePotOddsChoices(sc);
    const correctVal = sc.answer;

    return buildChoiceCard({
      label: '💰 Pot Odds',
      prompt: sc.prompt,
      choices,
      correctVal,
      answerLabel: sc.answerLabel,
      formula: sc.formula,
      detail: sc.detail,
      matchFn: (chosen) => Math.abs(chosen - correctVal) < 0.05,
    });
  }

  function renderEquityCard(sc) {
    const choices = makeEquityChoices(sc);
    const correctVal = sc.answer;

    return buildChoiceCard({
      label: '📐 Equity',
      prompt: sc.prompt,
      choices,
      correctVal,
      answerLabel: sc.answerLabel,
      formula: sc.formula,
      detail: sc.detail,
      matchFn: (chosen) => Math.abs(chosen - correctVal) < 0.05,
    });
  }

  function renderOutsCard(sc) {
    const choices = makeOutsChoices(sc);
    const correctVal = sc.outs;

    return buildChoiceCard({
      label: '🃏 Outs Counting',
      prompt: sc.prompt,
      choices,
      correctVal,
      answerLabel: sc.answerLabel,
      formula: null,
      detail: sc.detail,
      matchFn: (chosen) => chosen === correctVal,
    });
  }

  function renderHandReviewCard(sc) {
    const div = document.createElement('div');
    div.className = 'drill-card';

    div.innerHTML = `
      <div class="drill-label">📋 Hand Review</div>
      <div class="drill-prompt">${escHtml(sc.prompt)}</div>
      <div class="drill-hand-actions" id="handActions">${escHtml(sc.actions.join('\n'))}</div>
      <button class="drill-reveal-btn" id="revealBtn">👁 Show Analysis</button>
      <div class="drill-answer-zone" id="answerZone">
        <div class="drill-answer-box">
          <div class="drill-answer-value">📋 Hand Details</div>
          <div class="drill-answer-detail">${escHtml(sc.detail)}</div>
        </div>
        <div class="drill-btn-row" id="feedbackRow">
          <button class="drill-btn drill-btn-primary" style="background:var(--green)" id="btnGood">✅ Got it</button>
          <button class="drill-btn drill-btn-danger" id="btnMissed">❌ Need Review</button>
        </div>
      </div>
    `;

    const revealBtn = div.querySelector('#revealBtn');
    const answerZone = div.querySelector('#answerZone');
    const btnGood = div.querySelector('#btnGood');
    const btnMissed = div.querySelector('#btnMissed');

    revealBtn.addEventListener('click', () => {
      answerZone.classList.add('visible');
      revealBtn.style.display = 'none';
    });

    btnGood.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      correct++;
      updateStats();
      btnGood.textContent = '✅ Marked Good';
      btnGood.disabled = true;
      btnMissed.disabled = true;
      setTimeout(nextCard, 600);
    });

    btnMissed.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      wrong++;
      wrongItems.push(sc);
      updateStats();
      btnMissed.textContent = '❌ Marked for Review';
      btnGood.disabled = true;
      btnMissed.disabled = true;
      setTimeout(nextCard, 600);
    });

    return div;
  }

  function buildChoiceCard({ label, prompt, choices, correctVal, answerLabel, formula, detail, matchFn }) {
    const div = document.createElement('div');
    div.className = 'drill-card';

    const choiceHTML = choices.map(c =>
      `<button class="drill-choice" data-val="${escHtml(String(c.value))}">${escHtml(c.label)}</button>`
    ).join('');

    div.innerHTML = `
      <div class="drill-label">${label}</div>
      <div class="drill-prompt">${escHtml(prompt)}</div>
      <div class="drill-choices" id="choicesRow">${choiceHTML}</div>
      <div class="drill-answer-zone" id="answerZone">
        <div class="drill-answer-box" id="answerBox">
          <div class="drill-answer-value" id="answerValue">${escHtml(answerLabel)}</div>
          ${formula ? `<div class="drill-answer-formula">${escHtml(formula)}</div>` : ''}
          <div class="drill-answer-detail">${escHtml(detail)}</div>
        </div>
        <div class="drill-btn-row">
          <button class="drill-btn drill-btn-primary" id="nextBtn">Next →</button>
        </div>
      </div>
    `;

    const choicesRow = div.querySelector('#choicesRow');
    const answerZone = div.querySelector('#answerZone');
    const answerBox  = div.querySelector('#answerBox');
    const nextBtn    = div.querySelector('#nextBtn');

    choicesRow.querySelectorAll('.drill-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const chosen = parseFloat(btn.dataset.val);
        const isCorrect = matchFn(chosen);

        // Highlight all buttons
        choicesRow.querySelectorAll('.drill-choice').forEach(b => {
          const bVal = parseFloat(b.dataset.val);
          if (matchFn(bVal)) b.classList.add('correct');
          else if (b === btn && !isCorrect) b.classList.add('wrong');
          b.disabled = true;
        });

        if (isCorrect) {
          correct++;
          answerBox.classList.add('drill-answer-correct');
        } else {
          wrong++;
          wrongItems.push({ prompt, answerLabel, detail });
          answerBox.classList.add('drill-answer-wrong');
        }

        answerZone.classList.add('visible');
        updateStats();
      });
    });

    nextBtn.addEventListener('click', nextCard);

    return div;
  }

  // ── Render current card ────────────────────────────────────────────────────
  function renderCard(sc) {
    answered = false;
    cardArea.innerHTML = '';
    resultScreen.classList.remove('visible');

    let card;
    switch (sc.category) {
      case 'potOdds':    card = renderPotOddsCard(sc); break;
      case 'equity':     card = renderEquityCard(sc);  break;
      case 'outs':       card = renderOutsCard(sc);    break;
      case 'handReview': card = renderHandReviewCard(sc); break;
      default:
        card = document.createElement('div');
        card.className = 'drill-card';
        card.textContent = 'Unknown category: ' + sc.category;
    }

    cardArea.appendChild(card);
    updateStats();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function nextCard() {
    queueIdx++;
    if (queueIdx >= queue.length) {
      showResults();
    } else {
      renderCard(queue[queueIdx]);
    }
  }

  function showResults() {
    cardArea.innerHTML = '';
    resultScreen.classList.add('visible');

    const total  = queue.length;
    const pctVal = total > 0 ? Math.round((correct / total) * 100) : 0;
    const emoji  = pctVal >= 80 ? '🎉' : pctVal >= 60 ? '👍' : '📚';

    resultEmoji.textContent = emoji;
    resultScore.textContent = `${correct} / ${total} (${pctVal}%)`;
    resultSub.textContent   = pctVal >= 80
      ? 'Strong session. Keep it up!'
      : pctVal >= 60
      ? 'Decent run — review the misses below.'
      : 'Lots to work on — drill the formulas until they\'re automatic.';

    progressFill.style.width = '100%';

    if (wrongItems.length > 0) {
      let html = `<h3>⚠️ Missed Questions (${wrongItems.length})</h3>`;
      wrongItems.forEach(w => {
        html += `<div class="wrong-item">
          <strong>${escHtml(w.prompt ? w.prompt.slice(0, 120) : '—')}</strong>
          ${escHtml(w.answerLabel || '')}${w.detail ? ' — ' + escHtml(w.detail.slice(0, 120)) : ''}
        </div>`;
      });
      wrongListEl.innerHTML = html;
    } else {
      wrongListEl.innerHTML = '';
    }
  }

  function startDrill(cat, scenarioPool) {
    currentCat = cat;
    queue      = buildQueue(cat, scenarioPool);
    queueIdx   = 0;
    correct    = 0;
    wrong      = 0;
    wrongItems = [];
    answered   = false;
    resultScreen.classList.remove('visible');
    updateStats();
    renderCard(queue[0]);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  document.getElementById('drillTabs').addEventListener('click', e => {
    const btn = e.target.closest('.drill-tab');
    if (!btn) return;
    document.querySelectorAll('.drill-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    startDrill(btn.dataset.cat, DRILL_SCENARIOS);
  });

  // ── Result buttons ─────────────────────────────────────────────────────────
  btnRetryAll.addEventListener('click', () => startDrill(currentCat, DRILL_SCENARIOS));
  btnRetryWrong.addEventListener('click', () => {
    if (wrongItems.length === 0) return;
    queue      = shuffle(wrongItems);
    queueIdx   = 0;
    correct    = 0;
    wrong      = 0;
    wrongItems = [];
    resultScreen.classList.remove('visible');
    updateStats();
    renderCard(queue[0]);
  });
  btnShuffle.addEventListener('click', () => startDrill(currentCat, DRILL_SCENARIOS));

  // ── Escape helper ──────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  if (typeof DRILL_SCENARIOS === 'undefined') {
    cardArea.innerHTML = '<div class="drill-card"><p style="color:var(--red)">Error: drill-scenarios.js not loaded.</p></div>';
    return;
  }

  startDrill('all', DRILL_SCENARIOS);

})();
