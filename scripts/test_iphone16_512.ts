import { calculateApplePrice, UNKNOWN_QUESTIONNAIRE } from '../lib/pricingCalculator';

const testCases = [
  {
    id: "TC01",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill'] // No box
    },
    expected: 27770
  },
  {
    id: "TC02",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: "below 3 months",
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill'] // No box
    },
    expected: 37390
  },
  {
    id: "TC03",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: "3 months - 6 months",
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill'] // No box
    },
    expected: 35070
  },
  {
    id: "TC04",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: "3 months - 6 months",
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill', 'box']
    },
    expected: 37320
  },
  {
    id: "TC05",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: "6 months - 11 months",
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill', 'box']
    },
    expected: 35590
  },
  {
    id: "TC06",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: true,
      validBill: true,
      mobileAge: "Above 11 months",
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill', 'box']
    },
    expected: 29270
  },
  {
    id: "TC07",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      hardware: ['face', 'battery_health'],
      accessories: ['bill'] // No box
    },
    expected: 30570
  },
  {
    id: "TC08",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      hardware: ['face', 'battery_health'],
      accessories: ['bill', 'box']
    },
    expected: 32070
  },
  {
    id: "TC09",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: ['bill', 'box']
    },
    expected: 29270
  },
  {
    id: "TC11",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: false,
      warranty: false,
      validBill: false,
      defects: [],
      hardware: ['face', 'battery_service'],
      accessories: [] // No box, No bill
    },
    expected: 14770
  },
  {
    id: "TC14",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      screenCondition: "More than 2 scratches",
      defects: ['screen_scratch'],
      hardware: ['face', 'battery_service'],
      accessories: ['bill'] // No box
    },
    expected: 20130
  },
  {
    id: "TC15",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      screenCondition: "More than 2 scratches",
      defects: ['screen_scratch'],
      hardware: ['face', 'battery_service'],
      accessories: ['bill', 'box']
    },
    expected: 21630
  },
  {
    id: "TC16",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: false,
      defects: [],
      hardware: ['battery_health'],
      accessories: ['box']
    },
    expected: 43560
  },
  {
    id: "TC17",
    model: "Apple iPhone 16 (8 GB/512 GB)",
    storage: "512 GB",
    basePrice: 55150,
    diagnostics: {
      calls: true,
      touch: true,
      originalScreen: true,
      warranty: false,
      validBill: true,
      defects: [],
      hardware: ['battery_health'],
      accessories: ['bill', 'box']
    },
    expected: 43560
  }
];

let allPassed = true;

for (const tc of testCases) {
  const quote = calculateApplePrice(tc.model, tc.basePrice, tc.diagnostics, UNKNOWN_QUESTIONNAIRE, tc.storage);
  const result = quote.cashifyConditionEquivalent;
  const passed = result === tc.expected;
  if (!passed) allPassed = false;
  console.log(`[${tc.id}] Expected: ₹${tc.expected.toLocaleString()}, Got: ₹${result.toLocaleString()} - ${passed ? 'PASSED' : 'FAILED'}`);
}

if (allPassed) {
  console.log("\nALL TEST CASES PASSED PERFECTLY!");
  process.exit(0);
} else {
  console.log("\nSOME TEST CASES FAILED!");
  process.exit(1);
}
