import { calculateApplePrice } from '../../lib/pricingCalculator';

const testCases = [
  {
    id: 1,
    desc: 'TC 01: face + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['face', 'battery_service'],
      accessories: []
    },
    expectedBase: 5990
  },
  {
    id: 2,
    desc: 'TC 02: face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['face', 'battery_service'],
      accessories: ['box']
    },
    expectedBase: 6090
  },
  {
    id: 3,
    desc: 'TC 03: face + batt health 80-85%, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['face', 'battery_health'],
      accessories: []
    },
    expectedBase: 6690
  },
  {
    id: 4,
    desc: 'TC 04: face + batt health 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['face', 'battery_health'],
      accessories: ['box']
    },
    expectedBase: 6790
  },
  {
    id: 5,
    desc: 'TC 05: screen not original, face + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: false,
      hardware: ['face', 'battery_service'],
      accessories: []
    },
    expectedBase: 2790
  },
  {
    id: 6,
    desc: 'TC 06: >2 scratches, face + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face', 'battery_service'],
      accessories: []
    },
    expectedBase: 4110
  },
  {
    id: 7,
    desc: 'TC 07: >2 scratches, face + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face', 'battery_service'],
      accessories: ['box']
    },
    expectedBase: 4210
  },
  {
    id: 8,
    desc: 'TC 08: batt health 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['battery_health'],
      accessories: ['box']
    },
    expectedBase: 9420
  },
  {
    id: 9,
    desc: 'TC 09: flawless hardware, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: [],
      accessories: ['box']
    },
    expectedBase: 9720
  },
  {
    id: 10,
    desc: 'TC 10: flawless hardware, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: [],
      accessories: []
    },
    expectedBase: 9620
  },
  {
    id: 11,
    desc: 'TC 11: face sensor only, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['face'],
      accessories: ['box']
    },
    expectedBase: 7090
  },
  {
    id: 12,
    desc: 'TC 12: batt service only, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['battery_service'],
      accessories: ['box']
    },
    expectedBase: 8720
  },
  {
    id: 13,
    desc: 'TC 13: >2 scratches, flawless hardware, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: [],
      accessories: ['box']
    },
    expectedBase: 7840
  },
  {
    id: 14,
    desc: 'TC 14: 1-2 scratches, batt health 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      defects: ['broken_scratch'],
      screenCondition: '1-2 scratches on screen',
      hardware: ['battery_health'],
      accessories: ['box']
    },
    expectedBase: 8620
  },
  {
    id: 15,
    desc: 'TC 15: speaker + batt service, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['speaker', 'battery_service'],
      accessories: []
    },
    expectedBase: 8420
  },
  {
    id: 16,
    desc: 'TC 16: speaker + batt service, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['speaker', 'battery_service'],
      accessories: ['box']
    },
    expectedBase: 8520
  },
  {
    id: 17,
    desc: 'TC 17: speaker + batt health 80-85%, no box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['speaker', 'battery_health'],
      accessories: []
    },
    expectedBase: 9120
  },
  {
    id: 18,
    desc: 'TC 18: speaker + batt health 80-85%, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['speaker', 'battery_health'],
      accessories: ['box']
    },
    expectedBase: 9220
  },
  {
    id: 19,
    desc: 'TC 19: front camera, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['front_camera'],
      accessories: ['box']
    },
    expectedBase: 8720
  },
  {
    id: 20,
    desc: 'TC 20: back camera, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['back_camera'],
      accessories: ['box']
    },
    expectedBase: 8120
  },
  {
    id: 21,
    desc: 'TC 21: charging port, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['charging'],
      accessories: ['box']
    },
    expectedBase: 8720
  },
  {
    id: 22,
    desc: 'TC 22: microphone, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['microphone'],
      accessories: ['box']
    },
    expectedBase: 9320
  },
  {
    id: 23,
    desc: 'TC 23: screen not original, flawless hardware, has box',
    diag: {
      calls: true, touch: true, originalScreen: false,
      hardware: [],
      accessories: ['box']
    },
    expectedBase: 6520
  },
  {
    id: 24,
    desc: 'TC 24: wifi + bluetooth, has box',
    diag: {
      calls: true, touch: true, originalScreen: true,
      hardware: ['wifi', 'bluetooth'],
      accessories: ['box']
    },
    expectedBase: 5780
  }
];

let allPassed = true;
const modelName = 'Apple iPhone X';
const reference = 10020;
const storage = '3 GB/256 GB';

for (const tc of testCases) {
  const res = calculateApplePrice(modelName, reference, tc.diag as any, undefined as any, storage);
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
  console.log('\nALL 24 TEST CASES PASSED PERFECTLY!');
} else {
  console.log('\nSOME TEST CASES FAILED');
  process.exit(1);
}
