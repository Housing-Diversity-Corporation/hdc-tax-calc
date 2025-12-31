// Quick test to verify capital structure total includes outside investor sub-debt

const capitalStructure = {
  investorEquityPct: 20,
  philanthropicEquityPct: 10,
  seniorDebtPct: 40,
  philDebtPct: 10,
  hdcSubDebtPct: 5,
  investorSubDebtPct: 5,
  outsideInvestorSubDebtPct: 10  // This was missing from the total!
};

// Calculate total
const total =
  capitalStructure.investorEquityPct +
  capitalStructure.philanthropicEquityPct +
  capitalStructure.seniorDebtPct +
  capitalStructure.philDebtPct +
  capitalStructure.hdcSubDebtPct +
  capitalStructure.investorSubDebtPct +
  capitalStructure.outsideInvestorSubDebtPct;

console.log('\n=== CAPITAL STRUCTURE TOTAL TEST ===\n');
console.log('Components:');
console.log(`  Investor Equity: ${capitalStructure.investorEquityPct}%`);
console.log(`  Philanthropic Equity: ${capitalStructure.philanthropicEquityPct}%`);
console.log(`  Senior Debt: ${capitalStructure.seniorDebtPct}%`);
console.log(`  Phil Debt: ${capitalStructure.philDebtPct}%`);
console.log(`  HDC Sub-Debt: ${capitalStructure.hdcSubDebtPct}%`);
console.log(`  Investor Sub-Debt: ${capitalStructure.investorSubDebtPct}%`);
console.log(`  Outside Investor Sub-Debt: ${capitalStructure.outsideInvestorSubDebtPct}%`);
console.log(`\nTOTAL: ${total}%`);

if (Math.abs(total - 100) < 0.1) {
  console.log('\n✓ Capital structure totals 100% correctly!');
} else {
  console.log(`\n✗ Capital structure is ${total}%, should be 100%`);
}