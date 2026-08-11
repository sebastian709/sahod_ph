const form = document.querySelector('#salary-form');
const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Keep policy assumptions together so official updates only touch this object.
const SALARY_RULES = {
  sss: { employeeRate: 0.05, minimumMSC: 4_000, maximumMSC: 35_000, mscStep: 500 },
  philHealth: { premiumRate: 0.05, employeeShare: 0.5, incomeFloor: 10_000, incomeCeiling: 100_000 },
  pagIBIG: { lowIncomeCeiling: 1_500, lowIncomeRate: 0.01, standardRate: 0.02, maximumFundSalary: 10_000 },
  withholdingTax: [
    { ceiling: 20_833.33, baseTax: 0, rate: 0, base: 0 },
    { ceiling: 33_333.33, baseTax: 0, rate: 0.15, base: 20_833.33 },
    { ceiling: 66_666.67, baseTax: 1_875, rate: 0.20, base: 33_333.33 },
    { ceiling: 166_666.67, baseTax: 8_541.67, rate: 0.25, base: 66_666.67 },
    { ceiling: 666_666.67, baseTax: 33_541.67, rate: 0.30, base: 166_666.67 },
    { ceiling: Infinity, baseTax: 183_541.67, rate: 0.35, base: 666_666.67 }
  ]
};

function toNumber(value) {
  let numericValue;
  try {
    numericValue = Number(value);
  } catch {
    return 0;
  }
  return Number.isFinite(numericValue) ? Math.min(Math.max(0, numericValue), Number.MAX_SAFE_INTEGER) : 0;
}

function addFinite(...values) {
  let total = 0;
  for (const value of values) {
    const numericValue = toNumber(value);
    if (total > Number.MAX_VALUE - numericValue) return Number.MAX_VALUE;
    total += numericValue;
  }
  return total;
}

function roundCurrency(value) {
  const numericValue = toNumber(value);
  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value) { return currencyFormatter.format(roundCurrency(Math.max(0, value))); }

function readAmount(id) {
  return toNumber(document.querySelector(`#${id}`).value);
}

function calculateSSS(monthlyRemuneration) {
  const { employeeRate, minimumMSC, maximumMSC } = SALARY_RULES.sss;
  const remuneration = toNumber(monthlyRemuneration);
  if (remuneration === 0) return 0;
  const mscStep = SALARY_RULES.sss.mscStep;
  // Estimate: regular employee remuneration maps to the SSS MSC schedule.
  // The 5% employee SS share is capped at the ₱35,000 MSC / ₱1,750.
  const monthlyMSC = Math.min(Math.max(Math.round(remuneration / mscStep) * mscStep, minimumMSC), maximumMSC);
  return monthlyMSC * employeeRate;
}

function calculatePhilHealth(monthlyBasicSalary) {
  const { premiumRate, employeeShare, incomeFloor, incomeCeiling } = SALARY_RULES.philHealth;
  const basicSalary = toNumber(monthlyBasicSalary);
  if (basicSalary === 0) return 0;
  // PhilHealth uses Monthly Basic Salary; overtime, bonuses, 13th-month pay,
  // and excluded allowances are outside this estimate's contribution basis.
  const contributionBasis = Math.min(Math.max(basicSalary, incomeFloor), incomeCeiling);
  // The total premium is 5%; the employee pays 50% and the employer pays 50%.
  return contributionBasis * premiumRate * employeeShare;
}

function calculatePagIBIG(monthlyCompensation) {
  const { lowIncomeCeiling, lowIncomeRate, standardRate, maximumFundSalary } = SALARY_RULES.pagIBIG;
  const compensationBasis = Math.min(toNumber(monthlyCompensation), maximumFundSalary);
  const employeeRate = compensationBasis <= lowIncomeCeiling ? lowIncomeRate : standardRate;
  // Employee rates are 1% up to ₱1,500 and 2% above it; employer share is
  // excluded, and the ₱10,000 fund-salary cap limits the employee to ₱200.
  return compensationBasis * employeeRate;
}

function calculateWithholdingTax(monthlyTaxableIncome) {
  const taxableIncome = toNumber(monthlyTaxableIncome);
  const bracket = SALARY_RULES.withholdingTax.find(({ ceiling }) => taxableIncome <= ceiling);
  // This is the regular monthly BIR estimate after allowable mandatory
  // employee contributions, not an annualized payroll calculation. 13th-month
  // pay and other benefits have separate tax treatment in the dedicated tool.
  return bracket.baseTax + Math.max(0, taxableIncome - bracket.base) * bracket.rate;
}

function calculateSalaryFromInputs({ basicSalary = 0, taxableAllowances = 0, nontaxableAllowances = 0, overtimePay = 0, nightDifferential = 0, bonuses = 0 } = {}) {
  basicSalary = toNumber(basicSalary);
  taxableAllowances = toNumber(taxableAllowances);
  nontaxableAllowances = toNumber(nontaxableAllowances);
  overtimePay = toNumber(overtimePay);
  nightDifferential = toNumber(nightDifferential);
  bonuses = toNumber(bonuses);
  // This estimate treats explicitly entered regular taxable fields as taxable;
  // the dedicated 13th-month calculator handles that benefit separately.
  const taxableCompensation = addFinite(basicSalary, taxableAllowances, overtimePay, nightDifferential, bonuses);
  const grossSalary = addFinite(taxableCompensation, nontaxableAllowances);
  const sss = calculateSSS(taxableCompensation);
  const philHealth = calculatePhilHealth(basicSalary);
  const pagIBIG = calculatePagIBIG(taxableCompensation);
  const contributions = addFinite(sss, philHealth, pagIBIG);
  const withholdingTax = calculateWithholdingTax(Math.max(0, taxableCompensation - contributions));
  const totalDeductions = addFinite(contributions, withholdingTax);
  const takeHomePay = Math.max(0, grossSalary - totalDeductions);
  const effectiveDeduction = grossSalary > 0 ? (totalDeductions / grossSalary) * 100 : 0;

  return {
    grossSalary: roundCurrency(grossSalary),
    taxableCompensation: roundCurrency(taxableCompensation),
    nontaxableAllowances: roundCurrency(nontaxableAllowances),
    sss: roundCurrency(sss),
    philHealth: roundCurrency(philHealth),
    pagIBIG: roundCurrency(pagIBIG),
    contributions: roundCurrency(contributions),
    withholdingTax: roundCurrency(withholdingTax),
    totalDeductions: roundCurrency(totalDeductions),
    takeHomePay: roundCurrency(takeHomePay),
    effectiveDeduction: grossSalary > 0 ? (totalDeductions / grossSalary) * 100 : 0
  };
}

function calculateSalary() {
  const result = calculateSalaryFromInputs({
    basicSalary: readAmount('basic-salary'),
    taxableAllowances: readAmount('taxable-allowances'),
    nontaxableAllowances: readAmount('nontaxable-allowances'),
    overtimePay: readAmount('overtime-pay'),
    nightDifferential: readAmount('night-differential'),
    bonuses: readAmount('bonuses')
  });

  document.querySelector('#gross-result').textContent = formatCurrency(result.grossSalary);
  document.querySelector('#taxable-result').textContent = formatCurrency(result.taxableCompensation);
  document.querySelector('#nontaxable-result').textContent = formatCurrency(result.nontaxableAllowances);
  document.querySelector('#sss-result').textContent = formatCurrency(result.sss);
  document.querySelector('#philhealth-result').textContent = formatCurrency(result.philHealth);
  document.querySelector('#pagibig-result').textContent = formatCurrency(result.pagIBIG);
  document.querySelector('#contributions-result').textContent = formatCurrency(result.contributions);
  document.querySelector('#tax-result').textContent = formatCurrency(result.withholdingTax);
  document.querySelector('#deductions-result').textContent = formatCurrency(result.totalDeductions);
  document.querySelector('#net-pay').textContent = formatCurrency(result.takeHomePay);
  document.querySelector('#effective-deduction').textContent = `${result.effectiveDeduction.toFixed(2)}%`;
}

function setCalculationMode(mode) {
  const isAdvanced = mode === 'advanced';
  const resultCard = document.querySelector('.result-card');
  const advancedInputs = document.querySelector('#advanced-inputs');
  if (!resultCard || !advancedInputs) return;
  resultCard.classList.toggle('advanced-mode', isAdvanced);
  advancedInputs.hidden = !isAdvanced;
  advancedInputs.open = isAdvanced;
}

if (form) {
  form.addEventListener('submit', (event) => { event.preventDefault(); calculateSalary(); });
  form.querySelectorAll('input').forEach((input) => input.addEventListener('input', calculateSalary));
  form.querySelectorAll('input[name="calculationMode"]').forEach((input) => {
    input.addEventListener('change', () => setCalculationMode(input.value));
  });
  setCalculationMode('basic');
  calculateSalary();
}
