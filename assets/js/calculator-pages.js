const pageCurrencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function calculateOvertimePay(hourlyRate, overtimeHours, overtimeMultiplier) {
  return pageRound(pageNumber(hourlyRate) * pageNumber(overtimeHours) * pageNumber(overtimeMultiplier));
}

function calculateDailyRate(monthlySalary, workingDays) {
  const days = pageNumber(workingDays);
  return days > 0 ? pageRound(pageNumber(monthlySalary) / days) : 0;
}

function calculateHourlyRate(dailyRate, hoursPerDay) {
  const hours = pageNumber(hoursPerDay);
  return hours > 0 ? pageRound(pageNumber(dailyRate) / hours) : 0;
}

function calculateNightDifferential(hourlyRate, nightHours, nightRate) {
  return pageRound(pageNumber(hourlyRate) * pageNumber(nightHours) * pageNumber(nightRate));
}

function calculateHolidayPay(dailyRate, holidayMultiplier) {
  return pageRound(pageNumber(dailyRate) * pageNumber(holidayMultiplier));
}

function inputValue(form, name) {
  return form.querySelector(`[name="${name}"]`).value;
}

function renderPageResult(form, value, label) {
  form.closest('.calculator-page').querySelector('[data-result]').textContent = label ? `${pageCurrency(value)} ${label}` : pageCurrency(value);
}

function calculatePage() {
  const form = document.querySelector('[data-calculator-form]');
  if (!form) return;
  const type = form.dataset.calculator;
  let value;
  let label = '';

  if (type === '13th-month') {
    value = calculateThirteenthMonthPay(inputValue(form, 'monthlyBasicSalary'), inputValue(form, 'monthsWorked'));
  }
  if (type === 'overtime') {
    value = calculateOvertimePay(inputValue(form, 'hourlyRate'), inputValue(form, 'overtimeHours'), inputValue(form, 'overtimeMultiplier'));
  }
  if (type === 'daily-rate') {
    value = calculateDailyRate(inputValue(form, 'monthlySalary'), inputValue(form, 'workingDays'));
  }
  if (type === 'hourly-rate') {
    value = calculateHourlyRate(inputValue(form, 'dailyRate'), inputValue(form, 'hoursPerDay'));
  }
  if (type === 'night-differential') {
    value = calculateNightDifferential(inputValue(form, 'hourlyRate'), inputValue(form, 'nightHours'), inputValue(form, 'nightRate'));
  }
  if (type === 'holiday-pay') {
    value = calculateHolidayPay(inputValue(form, 'dailyRate'), inputValue(form, 'holidayMultiplier'));
  }

  renderPageResult(form, value, label);
}

document.querySelectorAll('[data-calculator-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculatePage();
  });
  form.querySelectorAll('input, select').forEach((field) => field.addEventListener('input', calculatePage));
  form.querySelectorAll('select').forEach((field) => field.addEventListener('change', calculatePage));
});

calculatePage();
