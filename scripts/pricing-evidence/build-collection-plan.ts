/**
 * Builds the next-quotes plan for the Cashify test team.
 *
 *   npx tsx scripts/pricing-evidence/build-collection-plan.ts
 *
 * Outputs (docs/next-quotes/):
 *   iphone12_13_plan.csv        exactly 400 quotes for the 26 iPhone 12/13 catalog variants
 *   existing_models_gaps.csv    additional quotes for the 19 iPhone models already collected, ranked by what the model cannot yet infer
 *
 * Every plan row names what the quote teaches the model, so no quote repeats existing coverage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SEED_DEVICES } from '../../lib/seed_devices';
import calibrationJson from '../../lib/pricing/appleCashifyModel/calibration.json';
import { CLASS_ORDER, classInfo, type Calibration } from '../../lib/pricing/appleCashifyModel/model';
import { EVIDENCE_DIR, loadMeasurements } from './evidenceLib';

const OUT = path.resolve(__dirname, '../../docs/next-quotes');
fs.mkdirSync(OUT, { recursive: true });
const CAL = calibrationJson as unknown as Calibration;
const csv = (rows: (string | number)[][]) => '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';

const CODE_NAMES: Record<string, string> = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, 'inventory.json'), 'utf8')).catalog;
const nameOf = (c: string) => CODE_NAMES[c as keyof typeof CODE_NAMES] ? (CODE_NAMES as any)[c].name : c;
const describe = (codes: string[], extra: string[] = []) => [...extra, ...codes.map(c => `${c} ${nameOf(c)}`)].join(' + ') || 'flawless (everything Yes / none selected, original box, age below 3 months)';

// ---------------------------------------------------------------- iPhone 12 / 13
const variants: { model: string; storage: string; gb: number }[] = [];
const seen = new Set<string>();
const gbOf = (s: string) => { const m = String(s).match(/(\d+)\s*(GB|TB)\s*$/i); return m ? Number(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1) : 0; };
for (const d of SEED_DEVICES as any[]) {
  if (String(d.brand).toLowerCase() !== 'apple' || !/^Apple iPhone 1[23] (Mini|Pro|Pro Max)?$|^Apple iPhone 1[23]$/i.test(d.model.trim())) continue;
  const key = `${d.model}|${gbOf(d.storage)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  variants.push({ model: d.model.replace(/^Apple /, ''), storage: d.storage, gb: gbOf(d.storage) });
}
variants.sort((a, b) => a.model.localeCompare(b.model) || a.gb - b.gb);
const models = [...new Set(variants.map(v => v.model))];
const anchorOf = (model: string) => { const vs = variants.filter(v => v.model === model); return vs[Math.floor((vs.length - 1) / 2)]; };

type Case = { id: string; codes: string[]; extra?: string[]; why: string; ifAsked?: string };
// 30 informative cases per anchor variant (+ the baseline from phase 0 and a closing baseline repeat = 32 incl.)
const ANCHOR: Case[] = [
  { id: 'A01', codes: [], extra: ['Mobile age 3-6 months'], why: 'age law, first step', ifAsked: 'only if the age question is shown' },
  { id: 'A02', codes: [], extra: ['Mobile age 6-11 months'], why: 'age law, second step', ifAsked: 'only if the age question is shown' },
  { id: 'A03', codes: [], extra: ['Mobile age over 11 months'], why: 'over-11-months state (also the floor basis)', ifAsked: 'only if the age question is shown' },
  { id: 'W00', codes: [], extra: ['Manufacturer warranty = No'], why: 'is warranty No the same as over 11 months?', ifAsked: 'only if the warranty question is shown' },
  { id: 'W02', codes: [], extra: ['GST bill = No'], why: 'is bill No the same as over 11 months?', ifAsked: 'only if the bill question is shown' },
  { id: 'S_D01', codes: ['D01'], why: 'display anchor: the screen group size (spots)' },
  { id: 'S_S01', codes: ['S01'], why: 'cracked glass: size plus whether Cashify skips the age question' },
  { id: 'S_Q02', codes: ['Q02'], extra: ['Touch screen = not working'], why: 'touch anchor and age skip' },
  { id: 'S_Q03', codes: ['Q03'], extra: ['Screen original = No'], why: 'non-original screen anchor and age skip' },
  { id: 'S_C04', codes: ['C04'], why: 'body anchor (fixed rupees or share of price?)' },
  { id: 'S_P01', codes: ['P01'], why: 'panel anchor and age skip' },
  { id: 'S_F05', codes: ['F05'], why: 'Wi-Fi anchor (share of price)' },
  { id: 'S_F08', codes: ['F08'], why: 'Face ID anchor (share of price)' },
  { id: 'S_F01', codes: ['F01'], why: 'front camera ALONE (the data only has it summed with the rear camera)' },
  { id: 'S_F02', codes: ['F02'], why: 'rear camera ALONE' },
  { id: 'S_F06', codes: ['F06'], why: 'speaker anchor' },
  { id: 'S_F03', codes: ['F03'], why: 'volume button anchor' },
  { id: 'S_F17', codes: ['F17'], why: 'battery in service ALONE (otherwise hidden by the floor)' },
  { id: 'S_F18', codes: ['F18'], why: 'battery health 80-85% ALONE' },
  { id: 'S_BOX', codes: [], extra: ['Original box = No'], why: 'box deduction (fixed rupees)' },
  { id: 'S_ESIM', codes: [], extra: ['eSIM = Dual eSIM'], why: 'dual-eSIM deduction', ifAsked: 'only if the eSIM question is shown' },
  { id: 'I_WIFIBT', codes: ['F05', 'F14'], why: 'Wi-Fi + Bluetooth overlap (same deduction as one?)' },
  { id: 'I_S01D01', codes: ['S01', 'D01'], why: 'cracked glass + spots: one age effect, largest screen deduction' },
  { id: 'I_S04D01', codes: ['S04', 'D01'], why: 'screen scratches + spots: largest only' },
  { id: 'I_C04P01', codes: ['C04', 'P01'], why: 'body + panel share one deduction?' },
  { id: 'I_P01S01', codes: ['P01', 'S01'], why: 'panel + cracked glass: age applied once' },
  { id: 'I_C01S01', codes: ['C01', 'S01'], why: 'body damage on top of cracked glass (absorbed?)' },
  { id: 'I_Q02F05', codes: ['Q02', 'F05'], why: 'touch + Wi-Fi: where is the floor?' },
  { id: 'I_F01F02', codes: ['F01', 'F02'], why: 'cameras add up?' },
  { id: 'I_MIX9', codes: ['C02', 'C04', 'D03', 'D05', 'D07', 'F01', 'F18', 'P04', 'S04'], why: 'nine-fault mixed case: tests every group rule at once' },
];
const SCALING: Case[] = [
  { id: 'A03', codes: [], extra: ['Mobile age over 11 months'], why: 'age effect at this storage (linear in price?)', ifAsked: 'if the age question is shown, otherwise warranty = No' },
  { id: 'S_F05', codes: ['F05'], why: 'share-of-price check at this storage' },
  { id: 'S_F08', codes: ['F08'], why: 'share-of-price check at this storage' },
  { id: 'S_D01', codes: ['D01'], why: 'fixed-rupee check at this storage' },
  { id: 'S_S01', codes: ['S01'], why: 'fixed-rupee + age check at this storage' },
  { id: 'S_C04', codes: ['C04'], why: 'fixed or share-of-price body deduction' },
  { id: 'I_F01F02', codes: ['F01', 'F02'], why: 'fixed-rupee camera check at this storage' },
];

const plan: (string | number)[][] = [['seq', 'phase', 'priority', 'model', 'storage (catalog)', 'case id', 'answers to select', 'only if', 'what this quote teaches the model']];
let seq = 0;
const add = (phase: string, priority: number, v: { model: string; storage: string }, c: Case) => plan.push([++seq, phase, priority, v.model, v.storage, c.id, describe(c.codes, c.extra), c.ifAsked ?? 'always', c.why]);
for (const v of variants) add('0 baseline + questionnaire probe', 1, v, { id: 'B00', codes: [], why: 'flawless reference (Get Upto) and a record of which questions the flow shows: warranty, bill, age, box, charger, eSIM, battery' });
for (const model of models) {
  const a = anchorOf(model);
  for (const c of ANCHOR) add('1 identification set (middle storage)', 2, a, c);
  add('1 identification set (middle storage)', 2, a, { id: 'B99', codes: [], why: 'closing baseline repeat: detects price drift during the session' });
}
for (const v of variants) {
  const a = anchorOf(v.model);
  if (v.gb === a.gb) continue;
  for (const c of SCALING) add('2 storage scaling', 3, v, c);
}
const total = plan.length - 1;
fs.writeFileSync(path.join(OUT, 'iphone12_13_plan.csv'), csv(plan));
console.log('iPhone 12/13 variants:', variants.length, 'models:', models.length, 'plan rows:', total);

// ---------------------------------------------------------------- existing models: what the model cannot yet infer
const ms = loadMeasurements().filter(m => m.outcome === 'NUMERIC_QUOTE');
const singles = new Map<string, Set<string>>();
for (const m of ms) if (m.class === 'single_defect') (singles.get(m.model_key) ?? singles.set(m.model_key, new Set()).get(m.model_key)!).add(m.deviations[0]);
const gaps: (string | number)[][] = [['priority', 'model', 'suggested storage', 'answers to select', 'why this quote adds information']];
const ANCHOR_CODE: Record<string, string> = { display: 'D01', cracked: 'S01', touch: 'Q02', orig: 'Q03', body: 'C04', panel: 'P01', cam: 'F02', fminA: 'F06', fminB: 'F03', prox: 'F16', wifi: 'F05', face: 'F08', batt: 'F17' };
const rank: Record<string, number> = { touch: 1, cracked: 1, orig: 2, panel: 2, body: 2, batt: 1, cam: 2, wifi: 3, face: 3, display: 3, fminA: 3, fminB: 3, prox: 4 };
let gapRows = 0;
for (const [model, p] of Object.entries(CAL.models)) {
  const storage = p.storagesGb.length ? p.storagesGb[Math.floor((p.storagesGb.length - 1) / 2)] : 0;
  const label = storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`;
  for (const cls of CLASS_ORDER) {
    if (cls === 'finger') continue;
    const cal = p.classes[cls];
    const code = ANCHOR_CODE[cls];
    if (!cal || !code || cal.support === 'measured' || singles.get(model)?.has(code)) continue;
    gaps.push([rank[cls] ?? 3, model, label, `${code} ${nameOf(code)} (alone)`, `the ${classInfo(cls).label.split(' (')[0]} deduction for this model is borrowed from sibling models (inferred), never measured on its own`]);
    gapRows++;
  }
  if (!p.floor && p.age) gaps.push([2, model, label, 'Touch screen not working + Wi-Fi not working + Face ID not working', 'no price floor was observed for this model; quotes for heavily damaged phones are unbounded in the model']);
  if (p.age && p.ageByStorage) {
    const missing = p.storagesGb.filter(gb => !p.ageByStorage![String(gb)]);
    for (const gb of missing) gaps.push([3, model, gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`, 'Mobile age over 11 months (only)', 'the age effect of this storage variant was never measured on its own']);
  }
}
gaps.push([2, 'all models', 'one storage each', 'GENERIC: Dual eSIM; Original charger = No; Battery health 80-85% + Face ID', 'eSIM and charger effects are known for few models; confirm they carry across']);
gaps.push([2, 'iPhone 18 Pro Max', '2TB (known) + 256GB', 'each of the 604 untested pairs that mix a FUNCTIONAL fault with a screen/body/panel fault (e.g. F05 + D01, F08 + C04, F17 + P01)', 'the 160 observed pairs never combine functional with physical faults, so additivity across those groups is unmeasured']);
gaps.push([3, 'iPhone 18 Pro Max', '2TB', 'pairs involving touch / non-original screen / calls (Q01, Q02, Q03) with any other group', 'the pair plan excludes the basic-condition answers entirely']);
gaps.push([3, 'any 3 models', 'middle storage', 'three-fault and five-fault combinations built from the confirmed rules (e.g. D01 + C04 + F05; S01 + C04 + F08 + F01 + box missing)', 'validates the model on larger combinations; only ~2 shapes exist at 5+ faults']);
gaps.push([3, 'iPhone 16 Pro Max + 17 Pro Max', 'one storage each', 'repeat of the flawless baseline and 5 anchors one week later', 'quantifies how fast Cashify\'s own tables move; the current calibration spans 16-24 Oct only']);
gaps.sort((a, b) => Number(a[0]) - Number(b[0]) || String(a[1]).localeCompare(String(b[1])));
fs.writeFileSync(path.join(OUT, 'existing_models_gaps.csv'), csv(gaps));
console.log('gap rows (existing models):', gaps.length - 1, '| per-model inferred anchors:', gapRows);
if (total !== 400) console.log('NOTE: plan has', total, 'rows (target 400)');
