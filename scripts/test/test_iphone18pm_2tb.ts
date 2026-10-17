import { calculateApplePrice } from '../../lib/pricingCalculator';

const testCases = [
  {
    id: 1,
    desc: 'TC 01: OOW, face + batt service, no box/charger',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 86260
  },
  {
    id: 2,
    desc: 'TC 02: In-warranty below 3m, face + batt service, no box/charger',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: [],
      mobileAge: 'below3' as any
    },
    expectedBase: 125550
  },
  {
    id: 3,
    desc: 'TC 03: In-warranty 3-6m, face + batt service, no box/charger',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: [],
      mobileAge: '3to6' as any
    },
    expectedBase: 107110
  },
  {
    id: 4,
    desc: 'TC 04: In-warranty 3-6m, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: ['box'],
      mobileAge: '3to6' as any
    },
    expectedBase: 109360
  },
  {
    id: 5,
    desc: 'TC 05: In-warranty 6-11m, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: ['box'],
      mobileAge: '6to11' as any
    },
    expectedBase: 104730
  },
  {
    id: 6,
    desc: 'TC 06: In-warranty above 11m, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 87760
  },
  {
    id: 7,
    desc: 'TC 07: OOW, face + batt 80-85%, no box/charger',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['face', 'battery_health'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 89200
  },
  {
    id: 8,
    desc: 'TC 08: OOW, face + batt 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['face', 'battery_health'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 90700
  },
  {
    id: 9,
    desc: 'TC 09: OOW, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['face', 'battery_service'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 87760
  },
  {
    id: 10,
    desc: 'TC 10: OOW, no valid bill, screen not original, face + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: false,
      warranty: false, validBill: false,
      hardware: ['face', 'battery_service'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 71260
  },
  {
    id: 11,
    desc: 'TC 11: OOW, >2 scratches on screen, face + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face', 'battery_service'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 77440
  },
  {
    id: 12,
    desc: 'TC 12: OOW, >2 scratches on screen, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face', 'battery_service'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 78940
  },
  {
    id: 13,
    desc: 'TC 13: OOW, no GST bill, batt 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: false,
      hardware: ['battery_health'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 123700
  },
  {
    id: 14,
    desc: 'TC 14: OOW, with GST bill, batt 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['battery_health'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 123700
  },
  {
    id: 15,
    desc: 'TC 15: OOW, flawless hardware, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: [],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 124960
  },
  {
    id: 16,
    desc: 'TC 16: OOW, flawless hardware, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: [],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 123460
  },
  {
    id: 17,
    desc: 'TC 17: OOW, face sensor only, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['face'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 91960
  },
  {
    id: 18,
    desc: 'TC 18: OOW, batt service only, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['battery_service'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 120760
  },
  {
    id: 19,
    desc: 'TC 19: OOW, >2 scratches on screen, flawless hardware, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: [],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 116140
  },
  {
    id: 20,
    desc: 'TC 20: OOW, 1-2 scratches, batt 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      defects: ['broken_scratch'],
      screenCondition: '1-2 scratches on screen',
      hardware: ['battery_health'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 119920
  },
  {
    id: 21,
    desc: 'TC 21: OOW, speaker + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['speaker', 'battery_service'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 116760
  },
  {
    id: 22,
    desc: 'TC 22: OOW, speaker + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['speaker', 'battery_service'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 118260
  },
  {
    id: 23,
    desc: 'TC 23: OOW, speaker + batt 80-85%, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['speaker', 'battery_health'],
      accessories: [],
      mobileAge: 'above11' as any
    },
    expectedBase: 119700
  },
  {
    id: 24,
    desc: 'TC 24: OOW, speaker + batt 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: false, validBill: true,
      hardware: ['speaker', 'battery_health'],
      accessories: ['box'],
      mobileAge: 'above11' as any
    },
    expectedBase: 121200
  },
  {
    id: 25,
    desc: 'TC 25: Flawless, in warranty below 3m, box + charger',
    diag: {
      calls: true, touch: true, originalScreen: true,
      warranty: true, validBill: true,
      hardware: [],
      accessories: ['box', 'charger'],
      mobileAge: 'below3' as any
    },
    expectedBase: 165000
  }
];

let allPassed = true;
const modelName = 'Apple iPhone 18 Pro Max';
const reference = 165000;
const storage = '12 GB/2 TB';

for (const tc of testCases) {
  const res = calculateApplePrice(modelName, reference, tc.diag, undefined as any, storage);
  const pass = res.cashifyConditionEquivalent === tc.expectedBase;
  if (!pass) {
    allPassed = false;
    console.error(`FAILED: ${tc.desc}`);
    console.error(`  Expected: ${tc.expectedBase}, Got: ${res.cashifyConditionEquivalent}, Diff: ${res.cashifyConditionEquivalent - tc.expectedBase}`);
  } else {
    console.log(`PASSED: ${tc.desc} -> ${res.cashifyConditionEquivalent}`);
  }
}

if (allPassed) {
  console.log('\nALL 25 TEST CASES PASSED PERFECTLY!');
} else {
  console.log('\nSOME TEST CASES FAILED');
  process.exit(1);
}
