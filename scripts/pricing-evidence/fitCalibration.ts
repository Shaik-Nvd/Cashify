/**
 * Fits per-model calibration profiles for lib/pricing/appleCashifyModel from normalized Cashify quotes.
 *
 * Method: the engine's own deduct() is the model. Parameters (age laws, box, eSIM, one value per condition class)
 * are fitted by damped Gauss-Newton on rupee residuals, with a weak ridge towards a prior (sibling models in the
 * same family, else the shared template) so that parameters the model's own quotes do not constrain stay at the
 * prior and are labelled 'inferred'. Nothing here reads a database or a network.
 */
import {
  CLASS_ORDER, ageStateOf, deduct, interactionSignature, parseAnswers,
  type Calibration, type ClassCal, type ClassKey, type ModelProfile, type ValueKind, type Support,
} from '../../lib/pricing/appleCashifyModel/model';
import { toDiagnostics, modelSemantics, type Measurement } from './evidenceLib';

export const SIGMA = 100; // rupee residual scale used to weight equations
let MULTISTART = 8;
let COORD_SWEEPS = 200;
/** Fewer random starts for cross-validation refits (the committed calibration uses the defaults). */
export function setFitOptions(o: { multistart?: number; coordSweeps?: number }) { if (o.multistart) MULTISTART = o.multistart; if (o.coordSweeps) COORD_SWEEPS = o.coordSweeps; }

function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(rng: () => number): number { const u = Math.max(1e-12, rng()); const v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

export function familyOf(modelKey: string): string {
  if (/iPhone 14/.test(modelKey)) return '14';
  if (/iPhone 15/.test(modelKey)) return '15';
  if (/iPhone 16/.test(modelKey)) return '16';
  if (/iPhone 17|iPhone 18|iPhone Air/.test(modelKey)) return '17plus';
  return 'other';
}

const FIXED_CLASSES: ClassKey[] = ['display', 'cracked', 'touch', 'orig', 'cam', 'fminA', 'fminB', 'prox', 'batt', 'finger'];
const PCT_CLASSES: ClassKey[] = ['wifi', 'face'];
export function defaultKind(cls: ClassKey, family: string): ValueKind {
  if (PCT_CLASSES.includes(cls)) return 'pct';
  if (FIXED_CLASSES.includes(cls)) return 'fixed';
  // body / panel: proportional on the 17 and 18 generations, fixed rupees before
  return family === '17plus' ? 'pct' : 'fixed';
}

// 18 Pro Max template anchors (rupees / fractions at reference 165,000), used as the last-resort prior.
const TEMPLATE_ANCHOR: Record<ClassKey, { fixed: number; pct: number }> = {
  display: { fixed: 25500, pct: 25500 / 165000 }, cracked: { fixed: 17850, pct: 0.108 }, touch: { fixed: 30000, pct: 0.182 }, orig: { fixed: 15000, pct: 0.091 }, body: { fixed: 3500, pct: 0.12 }, panel: { fixed: 4500, pct: 22050 / 165000 },
  cam: { fixed: 10000, pct: 0.06 }, fminA: { fixed: 6000, pct: 0.036 }, fminB: { fixed: 4500, pct: 0.027 }, prox: { fixed: 4950, pct: 0.03 },
  wifi: { fixed: 0, pct: 0.3 }, face: { fixed: 0, pct: 0.2 }, batt: { fixed: 4200, pct: 0.025 }, finger: { fixed: 0, pct: 0 },
};

interface Param { name: string; get: (p: ModelProfile) => number; set: (p: ModelProfile, v: number) => void; scale: number; lo: number; hi: number; prior: number }

function emptyProfile(modelKey: string, rows: Measurement[], sem: ReturnType<typeof modelSemantics>): ModelProfile {
  const family = familyOf(modelKey);
  const s = sem.get(modelKey)!;
  const asksWarranty = s.warrantyMode !== 'NOT_ASKED';
  const classes: Partial<Record<ClassKey, ClassCal>> = {};
  for (const cls of CLASS_ORDER) {
    const kind = defaultKind(cls, family);
    classes[cls] = { kind, value: TEMPLATE_ANCHOR[cls][kind], support: 'inferred', n: 0 };
  }
  const hasEsim = rows.some(r => r.inputs.esim.value === 'Single eSIM' || r.inputs.esim.value === 'Dual eSIM');
  const shapes = new Set(rows.map(r => r.deviations.join('|')));
  return {
    modelKey, family,
    storagesGb: [...new Set(rows.map(r => r.storage_gb))].sort((a, b) => a - b),
    asks: { warranty: asksWarranty, bill: s.billMode !== 'NOT_ASKED', age: s.ageMode !== 'NOT_ASKED', eSim: hasEsim },
    age: asksWarranty ? {
      '1': { a: 0, b: 0.11, support: 'inferred', n: 0 }, '2': { a: 0, b: 0.14, support: 'inferred', n: 0 }, '3': { a: 0, b: 0.2, support: 'inferred', n: 0 },
    } : null,
    boxNo: { base: 2250, aged: 2250, support: 'inferred' },
    eSimDualPct: hasEsim ? 0.05 : null,
    floor: null,
    classes,
    scrap: 1200,
    extremeFaultCount: 10,
    evidence: { shapes: shapes.size, measurements: rows.length, dates: [...new Set(rows.map(r => r.observed_date ?? 'unknown'))].sort() },
    notes: [],
  };
}

function paramList(profile: ModelProfile): Param[] {
  const ps: Param[] = [];
  if (profile.age) {
    for (const st of ['1', '2', '3'] as const) {
      ps.push({ name: `age${st}.a`, get: p => p.age![st].a, set: (p, v) => { p.age![st].a = v; }, scale: 2000, lo: -1000, hi: 4500, prior: 0 });
      ps.push({ name: `age${st}.b`, get: p => p.age![st].b, set: (p, v) => { p.age![st].b = v; }, scale: 0.2, lo: 0, hi: 0.6, prior: 0 });
    }
  }
  ps.push({ name: 'box.base', get: p => p.boxNo.base, set: (p, v) => { p.boxNo.base = v; }, scale: 2000, lo: 0, hi: 6000, prior: 2250 });
  if (profile.age) ps.push({ name: 'box.aged', get: p => p.boxNo.aged, set: (p, v) => { p.boxNo.aged = v; }, scale: 2000, lo: 0, hi: 6000, prior: 2250 });
  if (profile.eSimDualPct != null) ps.push({ name: 'esim', get: p => p.eSimDualPct!, set: (p, v) => { p.eSimDualPct = v; }, scale: 0.05, lo: 0, hi: 0.3, prior: 0.05 });
  for (const cls of CLASS_ORDER) {
    if (cls === 'finger') continue;
    const kind = profile.classes[cls]!.kind;
    ps.push({ name: `class.${cls}`, get: p => p.classes[cls]!.value, set: (p, v) => { p.classes[cls]!.value = v; },
      scale: kind === 'fixed' ? 8000 : 0.2, lo: 0, hi: kind === 'fixed' ? 90000 : 0.95, prior: 0 });
  }
  return ps;
}

/** Plateau detection among quotes whose answers force the over-11-months state. A plateau is a quote-to-base ratio
 * shared (within 0.12%) by >= 2 different condition shapes across >= 3 quotes. Tried against two bases (the reference
 * price and the aged price); the basis whose plateau value predicts the plateau quotes best is kept. */
export function detectFloor(profile: ModelProfile, rows: { m: Measurement; ans: ReturnType<typeof parseAnswers>; ref: number; storageGb: number }[]): ModelProfile['floor'] {
  const pts: { obs: number; ref: number; aged: number; shape: string }[] = [];
  for (const r of rows) {
    if (r.ans.codes.length === 0 || r.m.base == null) continue;
    const d = deduct(profile, r.ref, r.ans, r.storageGb);
    if (!('deduction' in d) || d.state !== 3 || d.agedPrice == null) continue;
    pts.push({ obs: r.m.base, ref: r.ref, aged: d.agedPrice, shape: r.m.deviations.join('|') });
  }
  const find = (basis: 'reference' | 'aged') => {
    const ratio = (q: typeof pts[number]) => q.obs / (basis === 'aged' ? q.aged : q.ref);
    const sorted = [...pts].sort((x, y) => ratio(x) - ratio(y));
    for (const p of sorted.filter(q => ratio(q) < 0.35)) {
      const cluster = sorted.filter(q => Math.abs(ratio(q) - ratio(p)) <= 0.0012);
      // A floor is the minimum price: no observed quote may sit below it. Coincidentally equal prices higher up are not a floor.
      const lowerExists = sorted.some(q => ratio(q) < ratio(p) - 0.0015);
      if (!lowerExists && cluster.length >= 3 && new Set(cluster.map(c => c.shape)).size >= 2) {
        return { basis, value: Math.round((cluster.reduce((t, c) => t + ratio(c), 0) / cluster.length) * 100000) / 100000, cluster };
      }
    }
    return null;
  };
  const cands = (['reference', 'aged'] as const).map(find).filter((c): c is NonNullable<ReturnType<typeof find>> => c != null);
  if (!cands.length) return null;
  const union = new Set(cands.flatMap(c => c.cluster));
  const score = (c: typeof cands[number]) => Math.max(...[...union].map(q => Math.abs(c.value * (c.basis === 'aged' ? q.aged : q.ref) - q.obs)));
  const best = cands.sort((x, y) => score(x) - score(y))[0];
  return { basis: best.basis, value: best.value };
}

function solveSymmetric(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}
function invertDiag(A: number[][]): number[] {
  const n = A.length; const out: number[] = [];
  for (let j = 0; j < n; j++) { const e = Array(n).fill(0); e[j] = 1; out.push(solveSymmetric(A, e)[j]); }
  return out;
}

interface Row { m: Measurement; ans: ReturnType<typeof parseAnswers>; target: number; ref: number; shape: string; storageGb: number; atFloor?: boolean }
/** Residual in rupees. A floor-limited quote only says the true deduction is AT LEAST this large, so only an under-estimate is penalised. */
const residual = (r: Row, f: number) => (r.atFloor ? Math.max(0, r.target - f) : r.target - f);

function deductionFor(profile: ModelProfile, row: Row): number | null {
  const d = deduct(profile, row.ref, row.ans, row.storageGb);
  return 'deduction' in d ? d.deduction : null;
}

export interface FitReport { modelKey: string; rows: number; used: number; rmse: number; maxAbs: number; floor: ModelProfile['floor']; params: Record<string, { value: number; support: Support; shapes: number }> }

export function fitModel(modelKey: string, all: Measurement[], sem: ReturnType<typeof modelSemantics>, prior?: ModelProfile): { profile: ModelProfile; report: FitReport } {
  const rows = all.filter(m => m.model_key === modelKey && m.outcome === 'NUMERIC_QUOTE' && m.base != null);
  const profile = emptyProfile(modelKey, all.filter(m => m.model_key === modelKey), sem);
  // priors: sibling profile values replace template defaults; kind follows the sibling when it was decided from data
  const ps = paramList(profile);
  if (prior) {
    for (const cls of CLASS_ORDER) if (prior.classes[cls]) profile.classes[cls] = { ...prior.classes[cls]!, support: 'inferred', n: 0 };
    if (profile.age && prior.age) for (const st of ['1', '2', '3'] as const) profile.age[st] = { ...prior.age[st], support: 'inferred', n: 0 };
    profile.boxNo = { ...prior.boxNo, support: 'inferred' };
    if (profile.eSimDualPct != null && prior.eSimDualPct != null) profile.eSimDualPct = prior.eSimDualPct;
  }
  const params = paramList(profile);
  const prior0 = params.map(p => p.get(profile));
  const fitRows: Row[] = [];
  for (const m of rows) {
    const ans = parseAnswers(toDiagnostics(m, 'none'));
    if (ans.unsupported.length || ans.callsFailed) continue;
    if (ans.codes.filter(c => c.startsWith('F')).length >= profile.extremeFaultCount) continue;
    fitRows.push({ m, ans, target: m.variant_get_upto - m.base!, ref: m.variant_get_upto, shape: m.deviations.join('|'), storageGb: m.storage_gb });
  }
  const lambda = 0.01;
  /** Damped Gauss-Newton over the `active` parameters on `useRows`, ridge towards `anchor`. Returns the Jacobian. */
  let lastSse = 0;
  const gaussNewton = (useRows: Row[], active: boolean[], anchor: number[], lam0: number, maxIter = 60): number[][] => {
    const sse = () => useRows.reduce((s, r) => { const f = deductionFor(profile, r); return s + (f == null ? 0 : (residual(r, f) / SIGMA) ** 2); }, 0);
    let cur = sse();
    let J: number[][] = [];
    for (let iter = 0; iter < maxIter; iter++) {
      const f0 = useRows.map(r => deductionFor(profile, r) ?? 0);
      J = useRows.map(() => Array(params.length).fill(0));
      params.forEach((p, j) => {
        if (!active[j]) return;
        const base = p.get(profile);
        const h = Math.max(1e-4 * Math.abs(base), 1e-3 * p.scale);
        p.set(profile, base + h);
        useRows.forEach((r, i) => { J[i][j] = ((deductionFor(profile, r) ?? 0) - f0[i]) / h; });
        p.set(profile, base);
      });
      const n = params.length;
      const A = Array.from({ length: n }, () => Array(n).fill(0));
      const g = Array(n).fill(0);
      useRows.forEach((r, i) => {
        const res = residual(r, f0[i]) / SIGMA;
        if (r.atFloor && res === 0) return;
        for (let a = 0; a < n; a++) { if (!J[i][a]) continue; g[a] += J[i][a] / SIGMA * res; for (let b = a; b < n; b++) A[a][b] += J[i][a] * J[i][b] / (SIGMA * SIGMA); }
      });
      for (let a = 0; a < n; a++) for (let b = 0; b < a; b++) A[a][b] = A[b][a];
      for (let a = 0; a < n; a++) {
        const lam = lam0 / (params[a].scale ** 2);
        A[a][a] += active[a] ? lam : 1e12; // frozen parameters cannot move
        g[a] -= active[a] ? lam * (params[a].get(profile) - anchor[a]) : 0;
      }
      const delta = solveSymmetric(A, g);
      let step = 1; let improved = false;
      const snapshot = params.map(p => p.get(profile));
      for (let tries = 0; tries < 10; tries++) {
        params.forEach((p, j) => p.set(profile, Math.min(p.hi, Math.max(p.lo, snapshot[j] + step * delta[j]))));
        const nxt = sse();
        if (nxt < cur - 1e-9) { cur = nxt; improved = true; break; }
        step /= 2;
      }
      if (!improved) { params.forEach((p, j) => p.set(profile, snapshot[j])); break; }
      if (Math.max(...delta.map((d, j) => Math.abs(step * d) / params[j].scale)) < 1e-6) break;
    }
    lastSse = cur;
    return J;
  };
  /** Derivative-free polish: coordinate search with shrinking steps. Gauss-Newton can stall at the kinks where a
   * largest-wins group switches its winner; a 1-D search per parameter walks across them. */
  const coordinateSearch = (useRows: Row[], active: boolean[], anchor: number[], lam0: number) => {
    const objective = () => {
      let t = 0;
      for (const r of useRows) { const f = deductionFor(profile, r); if (f != null) t += (residual(r, f) / SIGMA) ** 2; }
      params.forEach((p, j) => { if (active[j]) t += (lam0 / (p.scale ** 2)) * (p.get(profile) - anchor[j]) ** 2 / 2; });
      return t;
    };
    let cur = objective();
    const step = params.map(p => 0.1 * p.scale);
    for (let sweep = 0; sweep < COORD_SWEEPS; sweep++) {
      let moved = false;
      params.forEach((p, j) => {
        if (!active[j]) return;
        const base = p.get(profile);
        for (const dir of [1, -1]) {
          const v = Math.min(p.hi, Math.max(p.lo, base + dir * step[j]));
          if (v === base) continue;
          p.set(profile, v);
          const o = objective();
          if (o < cur - 1e-9) { cur = o; moved = true; return; }
          p.set(profile, base);
        }
        step[j] *= 0.6;
      });
      if (!moved && step.every((st, j) => !active[j] || st < 1e-5 * params[j].scale)) break;
    }
    lastSse = cur;
  };
  const isAgeOrBox = (name: string) => /^(age|box)/.test(name);
  // Stage 1: age law and box deduction from quotes that differ from the flawless baseline ONLY in age/warranty/bill/box.
  const pure = fitRows.filter(r => r.m.deviations.every(d => d.startsWith('AGE:') || d === 'WARRANTY_NO' || d === 'BILL_NO' || d === 'BOX_NO'));
  if (pure.length) gaussNewton(pure, params.map(p => isAgeOrBox(p.name)), prior0, lambda);
  // Measured per-variant age percentages (rows without a box deduction), preferred by the engine for those variants
  if (profile.age) {
    const by = new Map<string, number[]>();
    for (const r of pure) {
      if (r.m.deviations.includes('BOX_NO')) continue;
      const st = ageStateOf(r.ans, profile).state;
      if (st < 1) continue;
      const k = r.storageGb + ':' + st;
      (by.get(k) ?? by.set(k, []).get(k)!).push(r.target / r.ref);
    }
    const table: NonNullable<ModelProfile['ageByStorage']> = {};
    for (const [k, v] of by) {
      const [gb, st] = k.split(':');
      table[gb] ??= { '1': null, '2': null, '3': null };
      table[gb][st as '1' | '2' | '3'] = Math.round(median(v) * 100000) / 100000;
    }
    profile.ageByStorage = table;
  }
  // The floor is read off the aged price once the age law is known; floor-limited quotes carry no information about
  // the individual deductions, so they are excluded from the fit (and checked afterwards).
  profile.floor = profile.age ? detectFloor(profile, fitRows) : null;
  if (profile.floor) {
    for (const r of fitRows) {
      const d = deduct(profile, r.ref, r.ans, r.storageGb);
      if ('deduction' in d && d.state === 3 && d.agedPrice != null && r.ans.codes.length > 0 && r.m.base! <= profile.floor.value * (profile.floor.basis === 'aged' ? d.agedPrice : r.ref) * 1.003 + 10) r.atFloor = true;
    }
  }
  // Stage 2: condition classes with age/box frozen at stage-1 values
  const afterStage1 = params.map(p => p.get(profile));
  const classActive = params.map(p => !isAgeOrBox(p.name));
  // The largest-wins groups make the objective piecewise linear with many local minima, so start from the prior and from
  // several seeded perturbations of the class values and keep the best (ridge-penalised) fit.
  const rng = seededRng(modelKey);
  let best: { sse: number; values: number[] } | null = null;
  for (let k = 0; k < MULTISTART; k++) {
    params.forEach((p, j) => p.set(profile, classActive[j] && k > 0 ? Math.min(p.hi, Math.max(p.lo, afterStage1[j] * Math.exp(0.45 * gauss(rng)))) : afterStage1[j]));
    gaussNewton(fitRows, classActive, afterStage1, lambda, 30);
    coordinateSearch(fitRows, classActive, afterStage1, lambda);
    if (!best || lastSse < best.sse) best = { sse: lastSse, values: params.map(p => p.get(profile)) };
  }
  params.forEach((p, j) => p.set(profile, best!.values[j]));
  // Stage 3: polish everything together, ridge towards the staged values
  const afterStage2 = params.map(p => p.get(profile));
  const J = gaussNewton(fitRows, params.map(() => true), afterStage2, lambda);
  // which group combinations the model's own quotes cover (used to label quotes outside them 'inferred')
  {
    const seen = new Set<string>();
    for (const m of rows) {
      const ans = parseAnswers(toDiagnostics(m, 'none'));
      if (ans.unsupported.length || ans.callsFailed || !ans.codes.length) continue;
      const state = ageStateOf(ans, profile).state;
      seen.add(interactionSignature(ans.codes, state === 3, { box: ans.boxMissing, esim: ans.dualEsim && profile.asks.eSim }));
      seen.add(interactionSignature(ans.codes, state === 3));
    }
    profile.observedInteractions = [...seen].sort();
  }
  // support: parameters pinned down by the model's own quotes
  const n = params.length;
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  fitRows.forEach((r, i) => { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) A[a][b] += (J[i]?.[a] ?? 0) * (J[i]?.[b] ?? 0) / (SIGMA * SIGMA); });
  for (let a = 0; a < n; a++) A[a][a] += lambda / (params[a].scale ** 2);
  const variance = invertDiag(A);
  const shapesFor = (j: number) => new Set(fitRows.filter((r, i) => Math.abs(J[i]?.[j] ?? 0) > 1e-9).map(r => r.shape)).size;
  const report: FitReport = { modelKey, rows: rows.length, used: fitRows.length, rmse: 0, maxAbs: 0, floor: profile.floor, params: {} };
  params.forEach((p, j) => {
    const std = Math.sqrt(Math.max(variance[j], 0)) / p.scale;
    const nShapes = shapesFor(j);
    const support: Support = nShapes >= 1 && std < 0.25 ? 'measured' : 'inferred';
    report.params[p.name] = { value: p.get(profile), support, shapes: nShapes };
    const m = p.name.match(/^class\.(.+)$/);
    if (m) Object.assign(profile.classes[m[1] as ClassKey]!, { support, n: nShapes });
    const am = p.name.match(/^age(\d)\.(a|b)$/);
    if (am && profile.age) { const c = profile.age[am[1] as '1' | '2' | '3']; if (am[2] === 'b') { c.support = support; c.n = nShapes; } else if (support === 'inferred' && c.support !== 'measured') c.support = 'inferred'; }
    if (p.name === 'box.base') profile.boxNo.support = support;
  });
  const errs = fitRows.map(r => -residual(r, deductionFor(profile, r) ?? 0));
  report.rmse = Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / Math.max(1, errs.length));
  report.maxAbs = Math.max(0, ...errs.map(Math.abs));
  return { profile, report };
}

function median(xs: number[]): number { const v = [...xs].sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; }

/** Sibling prior: for each class/age parameter, the median of the other models in the same family. */
function siblingPrior(models: ModelProfile[], family: string, selfKey: string, template: ModelProfile): ModelProfile | undefined {
  const sibs = models.filter(m => m.family === family && m.modelKey !== selfKey);
  if (!sibs.length) return undefined;
  const out: ModelProfile = JSON.parse(JSON.stringify(template));
  // The cracked / touch / non-original screen anchors are priced relative to the display anchor; when this model's own
  // display anchor is pinned down by its quotes, scale the siblings' ratio to it.
  const ownDisplay = template.classes.display?.support === 'measured' ? template.classes.display.value : null;
  for (const cls of CLASS_ORDER) {
    const measured = sibs.filter(s => s.classes[cls]?.support === 'measured');
    const use = measured.length ? measured : sibs;
    let value = median(use.map(s => s.classes[cls]!.value));
    if ((cls === 'cracked' || cls === 'touch' || cls === 'orig') && ownDisplay != null && use[0].classes[cls]!.kind === 'fixed') {
      value = median(use.map(s => s.classes[cls]!.value / s.classes.display!.value)) * ownDisplay;
    }
    out.classes[cls] = { ...out.classes[cls]!, kind: use[0].classes[cls]!.kind, value };
  }
  if (out.age) {
    for (const st of ['1', '2', '3'] as const) {
      const have = sibs.filter(s => s.age).map(s => s.age![st]);
      if (have.length) out.age[st] = { ...out.age[st], a: median(have.map(h => h.a)), b: median(have.map(h => h.b)) };
    }
  }
  const boxes = sibs.map(s => s.boxNo);
  out.boxNo = { base: median(boxes.map(b => b.base)), aged: median(boxes.map(b => b.aged)), support: 'inferred' };
  const es = sibs.map(s => s.eSimDualPct).filter((x): x is number => x != null);
  if (es.length) out.eSimDualPct = median(es);
  return out;
}

export function fitCalibration(train: Measurement[], generatedFrom: string, onlyModels?: string[], semOverride?: ReturnType<typeof modelSemantics>): { calibration: Calibration; reports: FitReport[] } {
  const sem = semOverride ?? modelSemantics(train);
  const modelKeys = [...new Set(train.filter(m => m.outcome === 'NUMERIC_QUOTE').map(m => m.model_key))]
    .filter(k => !onlyModels || onlyModels.includes(k)).sort();
  // pass 1: template priors; pass 2: sibling priors
  let fits = modelKeys.map(k => fitModel(k, train, sem));
  for (let pass = 0; pass < 2; pass++) {
    const profiles = fits.map(f => f.profile);
    fits = modelKeys.map((k, i) => {
      const p = siblingPrior(profiles, familyOf(k), k, profiles[i]);
      return fitModel(k, train, sem, p);
    });
  }
  const models: Record<string, ModelProfile> = {};
  for (const f of fits) models[f.profile.modelKey] = f.profile;
  return { calibration: { version: 'apple-cashify-calibration/1', generatedFrom, models }, reports: fits.map(f => f.report) };
}

/**
 * Zero-shot profile for a model that has NO quotes in the training data: every number is borrowed from the
 * sibling models of its family (same generation), so every parameter is 'inferred'. Used only to measure how far
 * calibration transfers between models (it is not a supported production path).
 */
export function zeroShotProfile(cal: Calibration, modelKey: string, modelRows: Measurement[]): ModelProfile {
  const sem = modelSemantics(modelRows);
  const base = emptyProfile(modelKey, modelRows, sem);
  const sibs = Object.values(cal.models).filter(m => m.family === base.family && m.modelKey !== modelKey);
  const prior = siblingPrior(Object.values(cal.models), base.family, modelKey, base);
  if (!prior) return base;
  for (const cls of CLASS_ORDER) base.classes[cls] = { ...prior.classes[cls]!, support: 'inferred', n: 0 };
  if (base.age && prior.age) for (const st of ['1', '2', '3'] as const) base.age[st] = { ...prior.age[st], support: 'inferred', n: 0 };
  base.boxNo = { ...prior.boxNo, support: 'inferred' };
  if (base.eSimDualPct != null && prior.eSimDualPct != null) base.eSimDualPct = prior.eSimDualPct;
  const floors = sibs.map(s => s.floor).filter((f): f is NonNullable<typeof f> => f != null);
  if (base.age && floors.length) base.floor = { basis: floors[0].basis, value: median(floors.filter(f => f.basis === floors[0].basis).map(f => f.value)) };
  return base;
}
