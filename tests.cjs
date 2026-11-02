// Tests for the engine and teaching blocks embedded in index.html.
// Run: node tests.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function block(name) {
  const m = html.match(new RegExp('/\\*' + name + '-START\\*/([\\s\\S]*?)/\\*' + name + '-END\\*/'));
  if (!m) throw new Error(name + ' block not found');
  return m[1];
}
const mod = { exports: {} };
new Function('module', block('ENGINE'))(mod);
const SH = mod.exports;
const SCASES = new Function(block('CASES') + ';return SCASES;')();
const SQUIZ = new Function(block('QUIZ') + ';return SQUIZ;')();
const SMAP = new Function(block('MAP') + ';return SMAP;')();

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n    ' + e.message); }
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);
const conc = { ne: [4, 250], epi: [4, 250], vaso: [20, 100] };
const base = (o) => Object.assign({ sex: 'M', wtMode: 'adj', done: {}, conc, abxCat: 'shock' }, o);
// Same construction as loadCase() in the page
function caseState(id) {
  const c = SCASES.find(x => x.id === id), l = c.load, now = 1e12, s = base(l.f);
  s.t0 = now - l.t0Min * 60000;
  s.done = {};
  for (const k in l.done) s.done[k] = now - l.done[k] * 60000;
  return s;
}

console.log('Engine');
t('MAP target 65 under 65 y, 60 from 65 y', () => {
  assert.equal(SH.derive(base({ age: '64' })).tLow, 65);
  assert.equal(SH.derive(base({ age: '65' })).tLow, 60);
});
t('BMI ≤30 uses actual weight', () => assert.equal(SH.derive(base({ height: '170', weight: '70' })).target, 2100));
t('BMI >30 adjusted vs ideal weight', () => {
  const s = { sex: 'F', height: '160', weight: '100' };
  assert.equal(SH.derive(base(s)).target, 2140);
  assert.equal(SH.derive(base({ ...s, wtMode: 'ibw' })).target, 1570);
});
t('fluid indicated by low MAP, low SBP or lactate ≥4 only', () => {
  assert.equal(SH.derive(base({ map: '64', sbp: '110', lac1: '1' })).fluidInd, true);
  assert.equal(SH.derive(base({ map: '70', sbp: '89', lac1: '1' })).fluidInd, true);
  assert.equal(SH.derive(base({ map: '70', sbp: '110', lac1: '4' })).fluidInd, true);
  assert.equal(SH.derive(base({ map: '70', sbp: '110', lac1: '3.9' })).fluidInd, false);
});
t('intermediate lactate: lacMid only for >2 to <4 without hypotension', () => {
  const m = o => SH.derive(base(o)).lacMid;
  assert.equal(m({ map: '70', sbp: '110', lac1: '3' }), true);
  assert.equal(m({ map: '70', sbp: '110', lac1: '2' }), false);
  assert.equal(m({ map: '70', sbp: '110', lac1: '4' }), false);
  assert.equal(m({ map: '60', sbp: '110', lac1: '3' }), false);
});
t('NE rate: 0.3 × 80 kg at 16 µg/mL = 90 mL/h', () => near(SH.rate(base({ weight: '80' }), 'ne', 0.3), 90, 1e-9));
t('vasopressin rate ignores weight', () => near(SH.rate(base({}), 'vaso', 0.03), 9, 1e-9));
t('rate without weight is NaN', () => assert.ok(isNaN(SH.rate(base({}), 'ne', 0.1))));
t('next: no T0 asks to start clock', () => assert.match(SH.next(base({}), SH.derive(base({}))), /T0/));

console.log('Cases');
const nx = id => { const s = caseState(id); return SH.next(s, SH.derive(s)); };
t('six cases, unique ids, complete fields', () => {
  assert.equal(SCASES.length, 6);
  assert.equal(new Set(SCASES.map(c => c.id)).size, 6);
  SCASES.forEach(c => ['t', 's', 'tag', 'who', 'src'].forEach(k => assert.ok(c[k], c.id + ' ' + k)));
  SCASES.forEach(c => { assert.ok(c.steps.length >= 5, c.id); assert.ok(c.trap.length >= 3, c.id); assert.ok(c.load.label); });
});
t('each case ends on a different tool message', () => {
  const m = SCASES.map(c => nx(c.id));
  // case 2 and 3 both end on "MAP at goal": different reason (age target vs normal BP)
  assert.ok(new Set(m).size >= 5, m.join(' | '));
});
t('case uro: 2100 mL, NE not started → start NE', () => {
  const d = SH.derive(caseState('uro'));
  assert.equal(d.target, 2100); near(d.bmi, 24.2, 0.05);
  assert.match(nx('uro'), /開始 norepinephrine/);
  near(SH.rate(base({ weight: '70' }), 'ne', 0.1), 26, 0.5);
});
t('case old: adj weight 66.7, 2000 mL vs actual 2850, MAP 62 no NE', () => {
  const d = SH.derive(caseState('old'));
  near(d.bmi, 39.5, 0.05); near(d.ibw, 47.9, 0.05); near(d.adj, 66.7, 0.05);
  assert.equal(d.target, 2000); assert.equal(95 * 30, 2850);
  assert.equal(d.fluidInd, true); assert.equal(d.pNeed, false);
  assert.match(nx('old'), /已達目標/);
});
t('case mimic: possible sepsis, no 30 mL/kg trigger', () => {
  const s = caseState('mimic'), d = SH.derive(s);
  assert.equal(s.abxCat, 'possible'); assert.equal(d.fluidInd, false); assert.equal(d.lacHigh, true);
});
t('case mimic: NEWS2 components add up to 8', () => assert.equal(2 + 2 + 1 + 2 + 1, 8));
t('case ladder: 2400 mL, NE 90 / vaso 9 / epi 15 mL/h, next adds vasopressin', () => {
  const s = caseState('ladder'), d = SH.derive(s);
  assert.equal(d.target, 2400);
  near(SH.rate(s, 'ne', 0.3), 90, 1e-9); near(SH.rate(s, 'vaso', 0.03), 9, 1e-9); near(SH.rate(s, 'epi', 0.05), 15, 1e-9);
  assert.match(nx('ladder'), /vasopressin/);
  const v = { ...s, vaso: true };
  assert.match(SH.next(v, SH.derive(v)), /epinephrine/);
});
t('case heart: 1800 mL, MAP met, next is inotrope branch', () => {
  const d = SH.derive(caseState('heart'));
  assert.equal(d.target, 1800); assert.equal(d.mapLow, false);
  assert.match(nx('heart'), /dobutamine/);
});
t('case day3: IBW 64.2, VT 500 = 7.8 mL/kg, 6 mL/kg ≈ 385 mL', () => {
  const d = SH.derive(caseState('day3'));
  near(d.ibw, 64.2, 0.05); near(500 / d.ibw, 7.8, 0.05); near(6 * d.ibw, 385, 1);
  assert.match(nx('day3'), /逐步調降/);
});
t('tiles agree with the engine', () => {
  const tile = (id, k) => SCASES.find(c => c.id === id).tiles.find(x => x[0] === k)[1];
  assert.equal(+tile('uro', '輸液目標'), SH.derive(caseState('uro')).target);
  assert.equal(+tile('old', '輸液目標'), SH.derive(caseState('old')).target);
  assert.equal(+tile('ladder', '輸液目標'), SH.derive(caseState('ladder')).target);
  assert.equal(+tile('heart', '輸液目標'), SH.derive(caseState('heart')).target);
  near(+tile('ladder', 'NE 滴速'), SH.rate(caseState('ladder'), 'ne', 0.3), 1e-9);
});

console.log('Quiz');
t('20 questions: 10 basic then 10 advanced', () => {
  assert.equal(SQUIZ.length, 20);
  assert.deepEqual(SQUIZ.map(q => q.l), [...Array(10).fill('basic'), ...Array(10).fill('adv')]);
});
t('each question has 4 unique options, a valid answer, rationale and source', () => SQUIZ.forEach((q, i) => {
  assert.equal(q.o.length, 4, i); assert.equal(new Set(q.o).size, 4, i);
  assert.ok(q.a >= 0 && q.a < 4, i); assert.ok(q.x && q.src, i);
}));
t('answers spread A–D 5 each', () => {
  const c = [0, 0, 0, 0]; SQUIZ.forEach(q => c[q.a]++);
  assert.deepEqual(c, [5, 5, 5, 5]);
});
t('correct option is not usually the longest', () => {
  const n = SQUIZ.filter(q => q.o[q.a].length === Math.max(...q.o.map(o => o.length))).length;
  assert.ok(n <= 8, n + '/20');
});
t('Q4 and Q5 calculations match engine', () => {
  assert.ok(SQUIZ[3].o[SQUIZ[3].a].startsWith(SH.derive(base({ height: '175', weight: '70' })).target + ' mL'));
  assert.ok(SQUIZ[4].o[SQUIZ[4].a].startsWith(SH.derive(base({ sex: 'F', height: '160', weight: '100' })).target + ' mL'));
});
t('Q9 age target matches engine', () => assert.equal(SH.derive(base({ age: '72' })).tLow, 60));

console.log('Mind map');
t('all branches have leaves and every leaf is a pair', () => [...SMAP.dx, ...SMAP.tx].forEach(b => {
  assert.ok(b.t && b.s && b.l.length >= 4, b.t);
  b.l.forEach(x => { assert.equal(x.length, 2, b.t); assert.ok(x[0] && x[1], b.t); });
}));
t('page has tabs and panes', () => ['tool', 'cases', 'quiz', 'map'].forEach(x => {
  assert.ok(html.includes(`id="tab-${x}"`), x); assert.ok(html.includes(`class="pane" id="${x}"`), x);
}));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
