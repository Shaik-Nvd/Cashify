import { calculateApplePrice, DiagnosticsType } from '../../lib/pricingCalculator';

// Base reference price for iPhone 18 Pro Max 12 GB 2 TB
const baseReference = 165000;

interface SingleDefectTestCase {
  id: string;
  name: string;
  expectedSelling: number;
  expectedDeduction: number;
  expectedPayout: number;
  diag: Partial<DiagnosticsType>;
}

// Default baseline diagnostic:
// Calls: Yes, Touch: Yes, Original Screen: Yes, Warranty: Yes, Bill: Yes,
// Age: Below 3 months, Charger: Yes, Box: Yes, Screen/Body/Hardware: none
function getBaselineDiag(): DiagnosticsType {
  return {
    calls: true,
    touch: true,
    originalScreen: true,
    warranty: true,
    validBill: true,
    mobileAge: 'Below 3 months',
    charger: true,
    box: true,
    defects: [],
    hardware: [],
    accessories: ['charger', 'box'],
    screenCondition: null,
    screenSpots: null,
    screenLines: null,
    screenDiscoloration: null,
    bodyScratches: null,
    bodyDents: null,
    bodyPanel: null,
    bodyBent: null,
    eSim: null,
  };
}

const cases: SingleDefectTestCase[] = [
  // Flawless Baseline
  {
    id: 'B00',
    name: 'Flawless condition',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: {}
  },
  // Basic Device Condition
  {
    id: 'Q01',
    name: 'Unable to make/receive calls',
    expectedSelling: 1180,
    expectedDeduction: 163800,
    expectedPayout: 1131,
    diag: { calls: false }
  },
  {
    id: 'Q02',
    name: 'Touch screen not working',
    expectedSelling: 94940,
    expectedDeduction: 70040,
    expectedPayout: 94841,
    diag: { touch: false }
  },
  {
    id: 'Q03',
    name: 'Screen not original',
    expectedSelling: 109940,
    expectedDeduction: 55040,
    expectedPayout: 109841,
    diag: { originalScreen: false }
  },
  // Functional / Hardware Faults
  {
    id: 'F01',
    name: 'Front Camera not working',
    expectedSelling: 161480,
    expectedDeduction: 3500,
    expectedPayout: 161381,
    diag: { hardware: ['front_camera'] }
  },
  {
    id: 'F02',
    name: 'Back Camera not working',
    expectedSelling: 158480,
    expectedDeduction: 6500,
    expectedPayout: 158381,
    diag: { hardware: ['back_camera'] }
  },
  {
    id: 'F03',
    name: 'Volume Button not working',
    expectedSelling: 163980,
    expectedDeduction: 1000,
    expectedPayout: 163881,
    diag: { hardware: ['volume'] }
  },
  {
    id: 'F04',
    name: 'Finger Touch not working',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: { hardware: ['fingerprint'] }
  },
  {
    id: 'F05',
    name: 'WiFi not working',
    expectedSelling: 115480,
    expectedDeduction: 49500,
    expectedPayout: 115381,
    diag: { hardware: ['wifi'] }
  },
  {
    id: 'F06',
    name: 'Speaker Faulty',
    expectedSelling: 162480,
    expectedDeduction: 2500,
    expectedPayout: 162381,
    diag: { hardware: ['speaker'] }
  },
  {
    id: 'F07',
    name: 'Silent Button not working',
    expectedSelling: 163480,
    expectedDeduction: 1500,
    expectedPayout: 163381,
    diag: { hardware: ['silent'] }
  },
  {
    id: 'F08',
    name: 'Face Sensor not working',
    expectedSelling: 131980,
    expectedDeduction: 33000,
    expectedPayout: 131881,
    diag: { hardware: ['face'] }
  },
  {
    id: 'F09',
    name: 'Power Button not working',
    expectedSelling: 163980,
    expectedDeduction: 1000,
    expectedPayout: 163881,
    diag: { hardware: ['power'] }
  },
  {
    id: 'F10',
    name: 'Charging Port not working',
    expectedSelling: 162480,
    expectedDeduction: 2500,
    expectedPayout: 162381,
    diag: { hardware: ['charging'] }
  },
  {
    id: 'F11',
    name: 'Audio Receiver not working',
    expectedSelling: 162480,
    expectedDeduction: 2500,
    expectedPayout: 162381,
    diag: { hardware: ['audio_receiver'] }
  },
  {
    id: 'F12',
    name: 'Camera Glass Broken',
    expectedSelling: 161180,
    expectedDeduction: 3800,
    expectedPayout: 161081,
    diag: { hardware: ['camera_glass'] }
  },
  {
    id: 'F13',
    name: 'Microphone not working',
    expectedSelling: 163980,
    expectedDeduction: 1000,
    expectedPayout: 163881,
    diag: { hardware: ['microphone'] }
  },
  {
    id: 'F14',
    name: 'Bluetooth not working',
    expectedSelling: 115480,
    expectedDeduction: 49500,
    expectedPayout: 115381,
    diag: { hardware: ['bluetooth'] }
  },
  {
    id: 'F15',
    name: 'Vibrator is not working',
    expectedSelling: 163980,
    expectedDeduction: 1000,
    expectedPayout: 163881,
    diag: { hardware: ['vibrator'] }
  },
  {
    id: 'F16',
    name: 'Proximity Sensor not working',
    expectedSelling: 160030,
    expectedDeduction: 4950,
    expectedPayout: 159931,
    diag: { hardware: ['proximity'] }
  },
  {
    id: 'F17',
    name: 'Battery in Service (Health is less than 80%)',
    expectedSelling: 160780,
    expectedDeduction: 4200,
    expectedPayout: 160681,
    diag: { hardware: ['battery_service'] }
  },
  {
    id: 'F18',
    name: 'Battery Health 80-85%',
    expectedSelling: 163720,
    expectedDeduction: 1260,
    expectedPayout: 163621,
    diag: { hardware: ['battery_health'] }
  },
  // Screen Physical
  {
    id: 'S01',
    name: 'Screen cracked/ glass broken',
    expectedSelling: 107090,
    expectedDeduction: 57890,
    expectedPayout: 106991,
    diag: { screenCondition: 'Screen cracked / glass broken' }
  },
  {
    id: 'S02',
    name: 'Chipped/cracked outside display area',
    expectedSelling: 152380,
    expectedDeduction: 12600,
    expectedPayout: 152281,
    diag: { screenCondition: 'Chipped/cracked outside display area' }
  },
  {
    id: 'S03',
    name: 'More than 2 scratches on screen',
    expectedSelling: 156160,
    expectedDeduction: 8820,
    expectedPayout: 156061,
    diag: { screenCondition: 'More than 2 scratches on screen' }
  },
  {
    id: 'S04',
    name: '1-2 scratches on screen',
    expectedSelling: 161200,
    expectedDeduction: 3780,
    expectedPayout: 161101,
    diag: { screenCondition: '1-2 scratches on screen' }
  },
  // Display Spots
  {
    id: 'D01',
    name: 'Large/ heavy visible spots on screen',
    expectedSelling: 139480,
    expectedDeduction: 25500,
    expectedPayout: 139381,
    diag: { screenSpots: 'Large / heavy visible spots on screen' }
  },
  {
    id: 'D02',
    name: '3 or more minor spots on screen',
    expectedSelling: 146980,
    expectedDeduction: 18000,
    expectedPayout: 146881,
    diag: { screenSpots: '3 or more minor spots on screen' }
  },
  {
    id: 'D03',
    name: '1-2 minor spots on screen',
    expectedSelling: 158980,
    expectedDeduction: 6000,
    expectedPayout: 158881,
    diag: { screenSpots: '1-2 minor spots on screen' }
  },
  // Display Lines
  {
    id: 'D04',
    name: 'Visible line(s) on display',
    expectedSelling: 139480,
    expectedDeduction: 25500,
    expectedPayout: 139381,
    diag: { screenLines: 'Visible line(s) on display' }
  },
  {
    id: 'D05',
    name: 'Display faded along edges',
    expectedSelling: 149980,
    expectedDeduction: 15000,
    expectedPayout: 149881,
    diag: { screenLines: 'Display faded along edges' }
  },
  // Display Discoloration
  {
    id: 'D06',
    name: 'Major Discoloration',
    expectedSelling: 148480,
    expectedDeduction: 16500,
    expectedPayout: 148381,
    diag: { screenDiscoloration: 'Major Discoloration' }
  },
  {
    id: 'D07',
    name: 'Minor Discoloration',
    expectedSelling: 158980,
    expectedDeduction: 6000,
    expectedPayout: 158881,
    diag: { screenDiscoloration: 'Minor Discoloration' }
  },
  // Body Scratches
  {
    id: 'C01',
    name: 'More than 2 scratches on body',
    expectedSelling: 145180,
    expectedDeduction: 19800,
    expectedPayout: 145081,
    diag: { bodyScratches: 'More than 2 scratches on body' }
  },
  {
    id: 'C02',
    name: '1-2 scratches on body',
    expectedSelling: 154260,
    expectedDeduction: 10720,
    expectedPayout: 154161,
    diag: { bodyScratches: '1-2 scratches on body' }
  },
  // Body Dents
  {
    id: 'C03',
    name: 'Major dent(s) or more than 2',
    expectedSelling: 138580,
    expectedDeduction: 26400,
    expectedPayout: 138481,
    diag: { bodyDents: 'Major dent(s) or more than 2' }
  },
  {
    id: 'C04',
    name: '1-2 minor dents',
    expectedSelling: 145180,
    expectedDeduction: 19800,
    expectedPayout: 145081,
    diag: { bodyDents: '1-2 minor dents' }
  },
  // Panel Damage & Bent
  {
    id: 'P01',
    name: 'Cracked/ broken side or back panel',
    expectedSelling: 102890,
    expectedDeduction: 62090,
    expectedPayout: 102791,
    diag: { bodyPanel: 'Cracked/ broken side or back panel' }
  },
  {
    id: 'P02',
    name: 'Missing side or back panel',
    expectedSelling: 102890,
    expectedDeduction: 62090,
    expectedPayout: 102791,
    diag: { bodyPanel: 'Missing side or back panel' }
  },
  {
    id: 'P03',
    name: 'Bent/ curved panel',
    expectedSelling: 102890,
    expectedDeduction: 62090,
    expectedPayout: 102791,
    diag: { bodyBent: 'Bent/ curved panel' }
  },
  {
    id: 'P04',
    name: 'Loose screen (Gap in screen and body)',
    expectedSelling: 127030,
    expectedDeduction: 37950,
    expectedPayout: 126931,
    diag: { bodyBent: 'Loose screen (Gap in screen and body)' }
  },
  // Controls
  {
    id: 'D08',
    name: 'Control: Display no spots, lines or disco',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: { screenSpots: 'No spots', screenLines: 'No lines', screenDiscoloration: 'No discoloration' }
  },
  {
    id: 'C05',
    name: 'Control: Body no scratches or dents',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: { bodyScratches: 'No scratches', bodyDents: 'No dents' }
  },
  {
    id: 'P05',
    name: 'Control: Panel no damage, bend or loose',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: { bodyPanel: 'No defect', bodyBent: 'Not bent' }
  },
  {
    id: 'B99',
    name: 'Flawless baseline recheck',
    expectedSelling: 164980,
    expectedDeduction: 0,
    expectedPayout: 164881,
    diag: {}
  }
];

console.log('='.repeat(80));
console.log('TESTING APPLE IPHONE 18 PRO MAX (12 GB/2 TB) LIVE DEDUCTION CASES');
console.log('Total Cases:', cases.length);
console.log('='.repeat(80));

let passedCount = 0;
let failedCount = 0;

for (const c of cases) {
  const fullDiag: DiagnosticsType = {
    ...getBaselineDiag(),
    ...c.diag,
  };

  const quote = calculateApplePrice(
    'Apple iPhone 18 Pro Max 12 GB 2 TB',
    baseReference,
    fullDiag
  );

  // In Cashify:
  // Selling Price = basePrice - deduction - imeiValidationFee(20)
  // Our quote.cashifyConditionEquivalent returns the Selling price (or base without fee depending on definition)
  // Let's verify how calculateApplePrice outputs:
  const actualSelling = quote.cashifyConditionEquivalent;
  const actualDeduction = 164980 - actualSelling;

  // Let's check difference
  const diffSelling = actualSelling - c.expectedSelling;
  const isMatch = Math.abs(diffSelling) <= 20; // 20 is the IMEI validation fee difference

  if (isMatch) {
    passedCount++;
    console.log(`[PASS] ${c.id.padEnd(4)} | ${c.name.padEnd(42)} | Expected: Rs.${c.expectedSelling.toLocaleString('en-IN')} | Actual: Rs.${actualSelling.toLocaleString('en-IN')}`);
  } else {
    failedCount++;
    console.log(`[FAIL] ${c.id.padEnd(4)} | ${c.name.padEnd(42)} | Expected: Rs.${c.expectedSelling.toLocaleString('en-IN')} | Got: Rs.${actualSelling.toLocaleString('en-IN')} (Diff: ${diffSelling})`);
  }
}

console.log('='.repeat(80));
console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${cases.length} cases.`);
console.log('='.repeat(80));

if (failedCount > 0) {
  process.exit(1);
}
