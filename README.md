# SahodPH

*Your Simple Philippine Salary Calculator*

Mobile-first browser-based Philippine salary calculator. SahodPH estimates take-home pay from basic salary, taxable and non-taxable allowances, overtime, night differential, and bonuses or incentives.

## Run locally

Open `index.html` in a browser. There is no PHP, database, build step, or package installation required. Bootstrap is loaded from its jsDelivr CDN stylesheet.

## Calculation engine

The calculation functions live in `assets/js/salary.js`:

- `calculateSSS()`
- `calculatePhilHealth()`
- `calculatePagIBIG()`
- `calculateWithholdingTax()`
- `calculateSalary()`

Contribution assumptions and monthly withholding-tax brackets are centralized in `SALARY_RULES` so they can be updated when official guidance changes. Basic salary, taxable allowances, overtime, night differential, and bonuses are treated as taxable compensation; non-taxable allowances are included in gross and take-home pay but excluded from taxable compensation. Government contributions use the taxable compensation basis in this estimate.

The results include gross monthly income, taxable compensation, non-taxable allowances, individual government contributions, total government contributions, withholding tax, total deductions, estimated take-home pay, and effective deduction percentage. Results are estimates for planning only and are not tax or legal advice.

## Compare two salaries

Open [`compare.html`](compare.html) to compare a current monthly salary with a new monthly salary. The page reuses `calculateSalaryFromInputs()` from `assets/js/salary.js` and reports gross and take-home differences, percentage increase, and annualized differences.

## Additional calculators

- [`thirteenth-month-pay.html`](thirteenth-month-pay.html)
- [`overtime-pay.html`](overtime-pay.html)
- [`daily-rate.html`](daily-rate.html)
- [`hourly-rate.html`](hourly-rate.html)
- [`night-differential.html`](night-differential.html)
- [`holiday-pay.html`](holiday-pay.html)

These pages share the formulas and rendering utilities in `assets/js/calculator-pages.js` and run as static files on GitHub Pages.

## Informational pages

- [`about.html`](about.html)
- [`privacy-policy.html`](privacy-policy.html)
- [`terms-of-use.html`](terms-of-use.html)
- [`disclaimer.html`](disclaimer.html)
- [`contact.html`](contact.html)

The informational pages use the same responsive Bootstrap design and clearly state that SahodPH is independent and not affiliated with SSS, PhilHealth, Pag-IBIG, BIR, or any Philippine government agency.

## Advertisement placeholders

`assets/js/ad-placeholders.js` adds stable, muted `Advertisement` placeholders below the header and near the bottom of every page. Calculator pages also retain one mid-content placeholder between the calculator and explanation sections. Replace those `.ad-slot` elements with approved Google AdSense units when the site is ready; the placeholders are intentionally outside forms and calculator controls.

## SEO deployment note

The canonical URLs, Open Graph URLs, `sitemap.xml`, and `robots.txt` currently use `https://sahodph.github.io/ph-salary-calculator/` as the expected GitHub Pages base URL. Update that base URL in those files when the repository is connected to a different GitHub account, project path, or custom domain.
