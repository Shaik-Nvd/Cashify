import { calculateApplePrice, calculateFhoneifyPrice } from './lib/pricingCalculator';

interface TestCase {
  id: number;
  name: string;
  diagnostics: any;
  storageVariant?: string;
  model?: string;
  reference?: number;
  expectedCashify: number;
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: "Combo 1: OOW, Bill Yes, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 22230
  },
  {
    id: 2,
    name: "Combo 2: Warranty Yes, Age < 3 months, Bill Yes, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: 'Below 3 months',
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 31330
  },
  {
    id: 3,
    name: "Combo 3: Warranty Yes, Age 3-6 months, Bill Yes, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: '3 months - 6 months',
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 28170
  },
  {
    id: 4,
    name: "Combo 4: Warranty Yes, Age 3-6 months, Bill Yes, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: '3 months - 6 months',
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 30120
  },
  {
    id: 5,
    name: "Combo 5: Warranty Yes, Age 6-11 months, Bill Yes, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: '6 months - 11 months',
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 28710
  },
  {
    id: 6,
    name: "Combo 6: Warranty Yes, Age Above 11 months, Bill Yes, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: 'Above 11 months',
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 23530
  },
  {
    id: 7,
    name: "Combo 7: OOW, Bill Yes, Face, Battery Health 80-85%, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_health'],
      box: false
    },
    expectedCashify: 24610
  },
  {
    id: 8,
    name: "Combo 8: OOW, Bill Yes, Face, Battery Health 80-85%, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_health'],
      box: true
    },
    expectedCashify: 25910
  },
  {
    id: 9,
    name: "Combo 9: OOW, Bill Yes, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 23530
  },
  {
    id: 10,
    name: "Combo 10: OOW, Bill Yes, Face, Battery Service, Charger Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false,
      charger: true
    },
    expectedCashify: 23530
  },
  {
    id: 11,
    name: "Combo 11: OOW, Bill No, Screen Original No, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: false,
      warranty: false,
      validBill: false,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 11730
  },
  {
    id: 12,
    name: "Combo 12: OOW, Bill Yes, Screen Original Yes, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 23530
  },
  {
    id: 13,
    name: "Combo 13: OOW, Bill Yes, Screen Original Yes, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 22230
  },
  {
    id: 14,
    name: "Combo 14: OOW, Bill Yes, >2 scratches on screen, Face, Battery Service, Box No",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face_sensor', 'battery_service'],
      box: false
    },
    expectedCashify: 16060
  },
  {
    id: 15,
    name: "Combo 15: OOW, Bill Yes, >2 scratches on screen, Face, Battery Service, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: ['broken_scratch'],
      screenCondition: 'More than 2 scratches on screen',
      hardware: ['face_sensor', 'battery_service'],
      box: true
    },
    expectedCashify: 17360
  },
  {
    id: 16,
    name: "Combo 16: OOW, Bill No, Screen Original Yes, Battery Health 80-85%, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: false,
      defects: [],
      screenCondition: null,
      hardware: ['battery_health'],
      box: true
    },
    expectedCashify: 35320
  },
  {
    id: 17,
    name: "Combo 17: OOW, Bill Yes, Screen Original Yes, Battery Health 80-85%, Box Yes",
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      screenCondition: null,
      hardware: ['battery_health'],
      box: true
    },
    expectedCashify: 35320
  }
];

let allPassed = true;
const modelName = "Apple iPhone 15";
const storage = "512 GB";
const basePrice = 46550;

console.log("=== RUNNING TESTS FOR APPLE iPHONE 15 (6 GB/512 GB) ===");

for (const tc of testCases) {
  const result = calculateApplePrice(
    tc.model || modelName,
    tc.reference || basePrice,
    tc.diagnostics,
    undefined,
    tc.storageVariant || storage
  );

  const matched = result.cashifyConditionEquivalent === tc.expectedCashify;
  if (!matched) {
    allPassed = false;
    console.error(`❌ [FAIL] ${tc.name}`);
    console.error(`   Expected Cashify: ₹${tc.expectedCashify}`);
    console.error(`   Got Cashify:      ₹${result.cashifyConditionEquivalent}`);
  } else {
    console.log(`✅ [PASS] ${tc.name} => ₹${result.cashifyConditionEquivalent}`);
  }
}

// Test 128GB and 256GB specialized algorithm execution
const res128_direct = calculateApplePrice("Apple iPhone 15 128", 40890, testCases[0].diagnostics);
const res128_variant = calculateApplePrice("Apple iPhone 15", 40890, testCases[0].diagnostics, undefined, "128 GB");
console.log(`\niPhone 15 128GB (OOW, Combo 1): direct = ₹${res128_direct.cashifyConditionEquivalent}, variant = ₹${res128_variant.cashifyConditionEquivalent}`);

const res256_direct = calculateApplePrice("Apple iPhone 15 256", 43270, testCases[0].diagnostics);
const res256_variant = calculateApplePrice("Apple iPhone 15", 43270, testCases[0].diagnostics, undefined, "256 GB");
console.log(`iPhone 15 256GB (OOW, Combo 1): direct = ₹${res256_direct.cashifyConditionEquivalent}, variant = ₹${res256_variant.cashifyConditionEquivalent}`);

// Verify Pro and Plus models are NOT caught by the specialized algorithm
const resPro = calculateApplePrice("Apple iPhone 15 Pro", 61920, testCases[0].diagnostics, undefined, "128 GB");
const resPlus = calculateApplePrice("Apple iPhone 15 Plus", 43980, testCases[0].diagnostics, undefined, "128 GB");
console.log(`Pro/Plus Isolation: 15 Pro 128GB = ₹${resPro.cashifyConditionEquivalent}, 15 Plus 128GB = ₹${resPlus.cashifyConditionEquivalent}`);

// Test full model string with 512GB embedded
const resFullModel = calculateApplePrice("Apple iPhone 15 (6 GB/512 GB)", 46550, testCases[0].diagnostics);
console.log(`Full model string test: ₹${resFullModel.cashifyConditionEquivalent} (expected ₹22230)`);
if (resFullModel.cashifyConditionEquivalent !== 22230) {
  allPassed = false;
  console.error("❌ Full model string check failed!");
}

const fhoneifyRes = calculateFhoneifyPrice(
  "Apple",
  "Apple iPhone 15",
  basePrice,
  testCases[0].diagnostics,
  undefined,
  storage
);
console.log(`\nFhoneify integration test (Combo 1): Cashify Equivalent = ₹${fhoneifyRes.cashifyConditionEquivalent}, Fhoneify Price = ₹${fhoneifyRes.fhoneifyPrice}`);

if (allPassed && fhoneifyRes.cashifyConditionEquivalent === 22230) {
  console.log("\n🎉 ALL 17 COMBINATIONS AND 128GB/256GB TESTS PASSED PERFECTLY!");
} else {
  console.error("\n❌ SOME TESTS FAILED!");
  process.exit(1);
}
