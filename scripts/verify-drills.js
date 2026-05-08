#!/usr/bin/env node
// verify-drills.js — sanity-check all drill scenario formulas
// Usage: node scripts/verify-drills.js

const DRILL_SCENARIOS = require('../data/drill-scenarios.js');

let pass = 0;
let fail = 0;
const errors = [];

function check(id, label, expected, actual, tolerance = 0.01) {
  if (Math.abs(expected - actual) <= tolerance) {
    pass++;
  } else {
    fail++;
    errors.push(`FAIL [${id}] ${label}: expected ${expected}, got ${actual}`);
  }
}

// ── Formula implementations (ground truth) ────────────────────────────────
function potOddsExact(call, pot) { return call / (pot + call); }
function equityFlop(outs)        { return 1 - ((47 - outs) / 47) * ((46 - outs) / 46); }
function equityTurn(outs)        { return outs / 46; }
function pct(v)                  { return Math.round(v * 1000) / 10; }

// ── Pot Odds ──────────────────────────────────────────────────────────────
console.log('Checking pot odds scenarios...');
DRILL_SCENARIOS.potOdds.forEach(sc => {
  const expected = pct(potOddsExact(sc.call, sc.pot));
  check(sc.id, sc.prompt.slice(0, 60), expected, sc.answer, 0.15);
});

// ── Equity ────────────────────────────────────────────────────────────────
console.log('Checking equity scenarios...');
DRILL_SCENARIOS.equity.forEach(sc => {
  const expected = pct(
    sc.street === 'flop' ? equityFlop(sc.outs) : equityTurn(sc.outs)
  );
  check(sc.id, `${sc.drawName} ${sc.street}`, expected, sc.answer, 0.15);
  // Also verify rule-of-2/4 approximation is stored
  const rule = sc.street === 'flop' ? sc.outs * 4 : sc.outs * 2;
  if (sc.ruleApprox !== rule) {
    errors.push(`FAIL [${sc.id}] ruleApprox mismatch: expected ${rule}, got ${sc.ruleApprox}`);
    fail++;
  } else {
    pass++;
  }
});

// ── Outs ──────────────────────────────────────────────────────────────────
console.log('Checking outs scenarios...');
DRILL_SCENARIOS.outs.forEach(sc => {
  // Just verify outs is a positive integer and answer matches
  if (typeof sc.outs !== 'number' || sc.outs < 1 || sc.outs > 20 || !Number.isInteger(sc.outs)) {
    errors.push(`FAIL [${sc.id}] invalid outs value: ${sc.outs}`);
    fail++;
  } else if (sc.answer !== sc.outs) {
    errors.push(`FAIL [${sc.id}] answer ${sc.answer} !== outs ${sc.outs}`);
    fail++;
  } else {
    pass++;
  }
});

// ── Hand Review ───────────────────────────────────────────────────────────
console.log('Checking hand review scenarios...');
DRILL_SCENARIOS.handReview.forEach(sc => {
  if (!sc.heroCards || !sc.board || !sc.actions) {
    errors.push(`FAIL [${sc.id}] missing heroCards/board/actions`);
    fail++;
  } else if (sc.actions.length < 1) {
    errors.push(`FAIL [${sc.id}] empty actions`);
    fail++;
  } else {
    pass++;
  }
});

// ── Spot checks ────────────────────────────────────────────────────────────
console.log('\nSpot checks (known values):');
const spotChecks = [
  { call: 10, pot: 20, expected: 33.3 },
  { call: 30, pot: 30, expected: 50.0 },
  { call: 5,  pot: 20, expected: 20.0 },
  { call: 60, pot: 40, expected: 60.0 },
];
spotChecks.forEach(({ call, pot, expected }) => {
  const got = pct(potOddsExact(call, pot));
  const ok = Math.abs(got - expected) < 0.15;
  console.log(`  Pot $${pot}, call $${call}: ${got}% ${ok ? '✅' : '❌ expected ' + expected + '%'}`);
  if (!ok) fail++; else pass++;
});

const equityChecks = [
  { outs: 9,  street: 'flop', expected: 35.0 },
  { outs: 8,  street: 'flop', expected: 31.5 },
  { outs: 4,  street: 'flop', expected: 16.5 },
  { outs: 9,  street: 'turn', expected: 19.6 },
  { outs: 4,  street: 'turn', expected:  8.7 },
];
equityChecks.forEach(({ outs, street, expected }) => {
  const got = pct(street === 'flop' ? equityFlop(outs) : equityTurn(outs));
  const ok = Math.abs(got - expected) < 0.15;
  console.log(`  ${outs} outs (${street}): ${got}% ${ok ? '✅' : '❌ expected ' + expected + '%'}`);
  if (!ok) fail++; else pass++;
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
const total = DRILL_SCENARIOS.potOdds.length + DRILL_SCENARIOS.outs.length +
              DRILL_SCENARIOS.equity.length + DRILL_SCENARIOS.handReview.length;
console.log(`Total scenarios: ${total}`);
console.log(`  Pot odds:    ${DRILL_SCENARIOS.potOdds.length}`);
console.log(`  Outs:        ${DRILL_SCENARIOS.outs.length}`);
console.log(`  Equity:      ${DRILL_SCENARIOS.equity.length}`);
console.log(`  Hand review: ${DRILL_SCENARIOS.handReview.length}`);
console.log('─'.repeat(50));
console.log(`Checks: ${pass + fail} total  |  ${pass} passed  |  ${fail} failed`);

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(' ', e));
  process.exit(1);
} else {
  console.log('\n✅ All checks passed. Formula integrity verified.');
  process.exit(0);
}
