const form = document.querySelector('#salary-form');
const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Keep policy assumptions together so official updates only touch this object.
const SALARY_RULES = {
  sss: { employeeRate: 0.05, minimumMSC: 4_000, maximumMSC: 35_000, mscStep: 500 },
  philHealth: { premiumRate: 0.05, employeeShare: 0.5, incomeFloor: 10_000, incomeCeiling: 100_000 },
  pagIBIG: { lowIncomeCeiling: 1_500, lowIncomeRate: 0.01, standardRate: 0.02, maximumCompensation: 10_000 },
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
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value) { return currencyFormatter.format(roundCurrency(Math.max(0, value))); }

function readAmount(id) {
  return toNumber(document.querySelector(`#${id}`).value);
}

function calculateSSS(monthlyGross) {
  const { employeeRate, minimumMSC, maximumMSC } = SALARY_RULES.sss;
  const gross = toNumber(monthlyGross);
  if (gross === 0) return 0;
  const mscStep = SALARY_RULES.sss.mscStep;
  const monthlyMSC = Math.min(Math.max(Math.round(gross / mscStep) * mscStep, minimumMSC), maximumMSC);
  return roundCurrency(monthlyMSC * employeeRate);
}

function calculatePhilHealth(monthlyGross) {
  const { premiumRate, employeeShare, incomeFloor, incomeCeiling } = SALARY_RULES.philHealth;
  const gross = toNumber(monthlyGross);
  if (gross === 0) return 0;
  const contributionBasis = Math.min(Math.max(gross, incomeFloor), incomeCeiling);
  return roundCurrency(contributionBasis * premiumRate * employeeShare);
}

function calculatePagIBIG(monthlyGross) {
  const { lowIncomeCeiling, lowIncomeRate, standardRate, maximumCompensation } = SALARY_RULES.pagIBIG;
  const compensationBasis = Math.min(toNumber(monthlyGross), maximumCompensation);
  const employeeRate = compensationBasis <= lowIncomeCeiling ? lowIncomeRate : standardRate;
  return roundCurrency(compensationBasis * employeeRate);
}

function calculateWithholdingTax(monthlyTaxableCompensation) {
  const taxableCompensation = toNumber(monthlyTaxableCompensation);
  const bracket = SALARY_RULES.withholdingTax.find(({ ceiling }) => taxableCompensation <= ceiling);
  return roundCurrency(bracket.baseTax + Math.max(0, taxableCompensation - bracket.base) * bracket.rate);
}

function calculateSalaryFromInputs({ basicSalary = 0, taxableAllowances = 0, nontaxableAllowances = 0, overtimePay = 0, nightDifferential = 0, bonuses = 0 } = {}) {
  basicSalary = toNumber(basicSalary);
  taxableAllowances = toNumber(taxableAllowances);
  nontaxableAllowances = toNumber(nontaxableAllowances);
  overtimePay = toNumber(overtimePay);
  nightDifferential = toNumber(nightDifferential);
  bonuses = toNumber(bonuses);
  const taxableCompensation = roundCurrency(basicSalary + taxableAllowances + overtimePay + nightDifferential + bonuses);
  const grossSalary = roundCurrency(taxableCompensation + nontaxableAllowances);
  const sss = calculateSSS(taxableCompensation);
  const philHealth = calculatePhilHealth(taxableCompensation);
  const pagIBIG = calculatePagIBIG(taxableCompensation);
  const contributions = roundCurrency(sss + philHealth + pagIBIG);
  const withholdingTax = calculateWithholdingTax(Math.max(0, taxableCompensation - contributions));
  const totalDeductions = roundCurrency(contributions + withholdingTax);
  const takeHomePay = roundCurrency(Math.max(0, grossSalary - totalDeductions));
  const effectiveDeduction = grossSalary > 0 ? (totalDeductions / grossSalary) * 100 : 0;

  return { grossSalary, taxableCompensation, nontaxableAllowances, sss, philHealth, pagIBIG, contributions, withholdingTax, totalDeductions, takeHomePay, effectiveDeduction };
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
