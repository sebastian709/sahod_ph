const compareForm = document.querySelector('#compare-form');

function calculateComparison() {
  const currentSalary = toNumber(document.querySelector('#current-salary').value);
  const newSalary = toNumber(document.querySelector('#new-salary').value);
  const current = calculateSalaryFromInputs({ basicSalary: currentSalary });
  const next = calculateSalaryFromInputs({ basicSalary: newSalary });
  const grossDifference = roundCurrency(next.grossSalary - current.grossSalary);
  const takeHomeDifference = roundCurrency(next.takeHomePay - current.takeHomePay);
  const percentageIncrease = current.grossSalary > 0 ? (grossDifference / current.grossSalary) * 100 : 0;

  document.querySelector('#gross-difference').textContent = formatCurrency(grossDifference);
  document.querySelector('#take-home-difference').textContent = formatCurrency(takeHomeDifference);
  document.querySelector('#percentage-increase').textContent = `${percentageIncrease.toFixed(2)}%`;
  document.querySelector('#annual-gross-difference').textContent = formatCurrency(grossDifference * 12);
  document.querySelector('#annual-take-home-difference').textContent = formatCurrency(takeHomeDifference * 12);
  document.querySelector('#new-take-home').textContent = formatCurrency(next.takeHomePay);
}

compareForm.addEventListener('submit', (event) => {
  event.preventDefault();
  calculateComparison();
});

compareForm.querySelectorAll('input').forEach((input) => input.addEventListener('input', calculateComparison));
calculateComparison();
