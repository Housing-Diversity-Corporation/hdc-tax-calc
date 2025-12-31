// Test what happens with different values
function testCalc(hdcSubDebtPct) {
  const seniorDebtPct = 66;
  const philDebtPct = 20;
  const investorSubDebtPct = 0;
  const investorEquityRatio = 100;
  
  const totalDebt = seniorDebtPct + philDebtPct + hdcSubDebtPct + investorSubDebtPct;
  const remainingForEquity = Math.max(0, 100 - totalDebt);
  
  const newInvestorEquity = remainingForEquity * (investorEquityRatio / 100);
  const newPhilanthropicEquity = remainingForEquity - newInvestorEquity;
  
  // Simulate toFixed(2) and Number conversion
  const finalInvestor = Number(newInvestorEquity.toFixed(2));
  const finalPhil = Number(newPhilanthropicEquity.toFixed(2));
  
  console.log(`HDC Sub-debt: ${hdcSubDebtPct}%`);
  console.log(`  Total Debt: ${totalDebt}%`);
  console.log(`  Remaining: ${remainingForEquity}%`);
  console.log(`  New Investor: ${newInvestorEquity} -> ${finalInvestor}`);
  console.log(`  New Phil: ${newPhilanthropicEquity} -> ${finalPhil}`);
  console.log(`  Sum: ${finalInvestor + finalPhil}`);
  console.log('');
}

console.log('Testing different values:');
testCalc(0);
testCalc(0.5);
testCalc(1);
testCalc(1.5);
testCalc(2);
