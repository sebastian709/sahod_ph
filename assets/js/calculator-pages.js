const pageCurrencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 13th month pay and other benefits are tax-exempt up to this amount per year (RA 10963).
const THIRTEENTH_MONTH_TAX_EXEMPT_CEILING = 90_000;
// Night shift differential under Article 86 of the Labor Code: 10% on top of the applicable hourly rate.
const NIGHT_DIFFERENTIAL_RATE = 0.10;

function pageNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function pageRound(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function pageCurrency(value) {
  return pageCurrencyFormatter.format(pageRound(Math.max(0, value)));
}

function calculateThirteenthMonthPay(monthlyBasicSalary, monthsWorked) {
  return pageRound(pageNumber(monthlyBasicSalary) * Math.min(pageNumber(monthsWorked), 12) / 12);
}

function calculateOvertimePay(hourlyRate, overtimeHours, overtimeMultiplier, isNightShift = false) {
  // Night overtime adds 10% of the overtime hourly rate (e.g. 125% × 110% = 137.5%).
  const nightFactor = isNightShift ? 1 + NIGHT_DIFFERENTIAL_RATE : 1;
  return pageRound(pageNumber(hourlyRate) * pageNumber(overtimeHours) * pageNumber(overtimeMultiplier) * nightFactor);
}

function calculateDailyRate(monthlySalary, annualWorkingDays) {
  // DOLE factor method: monthly rate × 12 ÷ number of paid days in a year (261, 313, 365, ...).
  const days = pageNumber(annualWorkingDays);
  return days > 0 ? pageRound(pageNumber(monthlySalary) * 12 / days) : 0;
}

function calculateHourlyRate(dailyRate, hoursPerDay) {
  const hours = pageNumber(hoursPerDay);
  return hours > 0 ? pageRound(pageNumber(dailyRate) / hours) : 0;
}

function calculateNightDifferential(hourlyRate, nightHours, nightRatePercent, dayMultiplier = 1) {
  // The differential is a percentage of the hourly rate for that day, so rest days and holidays raise it.
  return pageRound(pageNumber(hourlyRate) * pageNumber(dayMultiplier) * pageNumber(nightHours) * pageNumber(nightRatePercent) / 100);
}

function calculateHolidayPay(dailyRate, holidayMultiplier) {
  return pageRound(pageNumber(dailyRate) * pageNumber(holidayMultiplier));
}

function inputValue(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  return field.type === 'checkbox' ? field.checked : field.value;
}

function renderPageResult(form, value, note) {
  const page = form.closest('.calculator-page');
  page.querySelector('[data-result]').textContent = pageCurrency(value);
  const noteElement = page.querySelector('[data-result-note]');
  if (noteElement) noteElement.textContent = note;
}

function calculatePage() {
  const form = document.querySelector('[data-calculator-form]');
  if (!form) return;
  const type = form.dataset.calculator;
  let value;
  let note = '';

  if (type === '13th-month') {
    value = calculateThirteenthMonthPay(inputValue(form, 'monthlyBasicSalary'), inputValue(form, 'monthsWorked'));
    const taxablePortion = value - THIRTEENTH_MONTH_TAX_EXEMPT_CEILING;
    note = taxablePortion > 0
      ? `${pageCurrency(taxablePortion)} is above the ₱90,000 tax-exempt ceiling and may be subject to withholding tax.`
      : 'This amount is within the ₱90,000 tax-exempt ceiling for 13th month pay and other benefits.';
  }
  if (type === 'overtime') {
    value = calculateOvertimePay(inputValue(form, 'hourlyRate'), inputValue(form, 'overtimeHours'), inputValue(form, 'overtimeMultiplier'), inputValue(form, 'nightShift'));
    const hours = pageNumber(inputValue(form, 'overtimeHours'));
    note = hours > 0 ? `That is ${pageCurrency(value / hours)} for each overtime hour.` : '';
  }
  if (type === 'daily-rate') {
    value = calculateDailyRate(inputValue(form, 'monthlySalary'), inputValue(form, 'annualWorkingDays'));
    note = `Hourly equivalent at 8 hours a day: ${pageCurrency(value / 8)}.`;
  }
  if (type === 'hourly-rate') {
    value = calculateHourlyRate(inputValue(form, 'dailyRate'), inputValue(form, 'hoursPerDay'));
    note = `Ordinary-day overtime at 125% would be ${pageCurrency(value * 1.25)} per hour.`;
  }
  if (type === 'night-differential') {
    const hourlyRate = inputValue(form, 'hourlyRate');
    const nightHours = inputValue(form, 'nightHours');
    const dayMultiplier = inputValue(form, 'dayMultiplier');
    value = calculateNightDifferential(hourlyRate, nightHours, inputValue(form, 'nightRate'), dayMultiplier);
    const basePay = pageRound(pageNumber(hourlyRate) * pageNumber(dayMultiplier) * pageNumber(nightHours));
    note = `Total pay for these hours including the differential: ${pageCurrency(basePay + value)}.`;
  }
  if (type === 'holiday-pay') {
    value = calculateHolidayPay(inputValue(form, 'dailyRate'), inputValue(form, 'holidayMultiplier'));
    const select = form.querySelector('[name="holidayMultiplier"]');
    note = select.options[select.selectedIndex].dataset.note || '';
  }

  renderPageResult(form, value, note);
}

document.querySelectorAll('[data-calculator-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculatePage();
  });
  form.querySelectorAll('input, select').forEach((field) => field.addEventListener('input', calculatePage));
  form.querySelectorAll('select, input[type="checkbox"]').forEach((field) => field.addEventListener('change', calculatePage));
});

calculatePage();
