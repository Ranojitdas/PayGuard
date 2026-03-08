/* ============================================
   PAYGUARD — Fee Calculator JavaScript
   ============================================ */

// ── Country / Currency Data ──────────────────
const COUNTRIES = {
  US: { name: 'United States', currency: 'USD', symbol: '$',  flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  EU: { name: 'Eurozone',       currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  CA: { name: 'Canada',         currency: 'CAD', symbol: 'C$',flag: '🇨🇦' },
  AU: { name: 'Australia',      currency: 'AUD', symbol: 'A$',flag: '🇦🇺' },
  JP: { name: 'Japan',          currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
  IN: { name: 'India',          currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  SG: { name: 'Singapore',      currency: 'SGD', symbol: 'S$',flag: '🇸🇬' },
  AE: { name: 'UAE',            currency: 'AED', symbol: 'د.إ',flag:'🇦🇪' },
  CH: { name: 'Switzerland',    currency: 'CHF', symbol: 'Fr',flag: '🇨🇭' },
  NG: { name: 'Nigeria',        currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  BR: { name: 'Brazil',         currency: 'BRL', symbol: 'R$',flag: '🇧🇷' },
  MX: { name: 'Mexico',         currency: 'MXN', symbol: 'MX$',flag:'🇲🇽'},
  PH: { name: 'Philippines',    currency: 'PHP', symbol: '₱', flag: '🇵🇭' },
  PK: { name: 'Pakistan',       currency: 'PKR', symbol: '₨', flag: '🇵🇰' },
};

// Mid-market rates relative to USD (approximate)
const RATES_TO_USD = {
  USD: 1, GBP: 1.27, EUR: 1.09, CAD: 0.74, AUD: 0.65,
  JPY: 0.0067, INR: 0.012, SGD: 0.75, AED: 0.272,
  CHF: 1.13, NGN: 0.00065, BRL: 0.19, MXN: 0.058, PHP: 0.018, PKR: 0.0036,
};

// ── Provider Data ────────────────────────────
const PROVIDERS = [
  {
    id:       'wise',
    name:     'Wise',
    icon:     'fa-solid fa-bolt',
    iconBg:   '#1B4B82',
    iconColor:'#40C7AA',
    feeType:  'percent',
    feeRate:  0.0045,     // 0.45%
    fixedFee: 0,
    rateMarkup: 0.001,    // 0.1% above mid-market
    deliveryTime: 'Instant – 1 day',
    deliveryClass: 'delivery-fast',
    deliveryIcon: 'fa-solid fa-bolt',
    rating:   '★★★★★',
    speed:    'fast',
    features: ['Best exchange rate', 'Transparent fees', 'Regulated'],
  },
  {
    id:       'paypal',
    name:     'PayPal',
    icon:     'fa-brands fa-paypal',
    iconBg:   '#003087',
    iconColor:'#009cde',
    feeType:  'percent',
    feeRate:  0.035,      // 3.5%
    fixedFee: 0,
    rateMarkup: 0.04,     // 4% margin
    deliveryTime: 'Instant – 1 hr',
    deliveryClass: 'delivery-fast',
    deliveryIcon: 'fa-solid fa-bolt',
    rating:   '★★★☆☆',
    speed:    'fast',
    features: ['Instant transfer', 'Buyer protection', 'Widely accepted'],
  },
  {
    id:       'bank',
    name:     'Bank Transfer',
    icon:     'fa-solid fa-building-columns',
    iconBg:   '#1a2236',
    iconColor:'#94a3b8',
    feeType:  'fixed',
    feeRate:  0,
    fixedFee: 25,
    rateMarkup: 0.03,     // 3% margin
    deliveryTime: '2 – 5 business days',
    deliveryClass: 'delivery-slow',
    deliveryIcon: 'fa-solid fa-clock',
    rating:   '★★★☆☆',
    speed:    'economy',
    features: ['Traditional & trusted', 'Suitable for large amounts'],
  },
  {
    id:       'wu',
    name:     'Western Union',
    icon:     'fa-solid fa-globe',
    iconBg:   '#FFCC00',
    iconColor:'#333',
    feeType:  'percent',
    feeRate:  0.02,
    fixedFee: 5,
    rateMarkup: 0.025,
    deliveryTime: 'Instant – 2 days',
    deliveryClass: 'delivery-fast',
    deliveryIcon: 'fa-solid fa-bolt',
    rating:   '★★★★☆',
    speed:    'fast',
    features: ['Cash pickup available', '200+ countries', 'Trusted brand'],
  },
  {
    id:       'crypto',
    name:     'Crypto (USDT)',
    icon:     'fa-brands fa-bitcoin',
    iconBg:   '#F7931A22',
    iconColor:'#F7931A',
    feeType:  'percent',
    feeRate:  0.001,
    fixedFee: 1,
    rateMarkup: 0.005,
    deliveryTime: '5 – 30 minutes',
    deliveryClass: 'delivery-fast',
    deliveryIcon: 'fa-solid fa-bolt',
    rating:   '★★★★☆',
    speed:    'fast',
    features: ['Very low fees', 'No intermediary', 'Requires crypto wallet'],
  },
  {
    id:       'revolut',
    name:     'Revolut',
    icon:     'fa-solid fa-circle-nodes',
    iconBg:   '#1a1a2e',
    iconColor:'#a78bfa',
    feeType:  'percent',
    feeRate:  0.0099,
    fixedFee: 0,
    rateMarkup: 0.005,
    deliveryTime: 'Instant – 2 days',
    deliveryClass: 'delivery-fast',
    deliveryIcon: 'fa-solid fa-bolt',
    rating:   '★★★★★',
    speed:    'fast',
    features: ['Low fee on weekdays', 'Great rate', 'Requires app'],
  },
];

// ── DOM references ───────────────────────────
const amountInput     = document.getElementById('amount');
const fromSelect      = document.getElementById('fromCountry');
const toSelect        = document.getElementById('toCountry');
const calcBtn         = document.getElementById('calcBtn');
const resetBtn        = document.getElementById('resetBtn');
const swapBtn         = document.getElementById('swapBtn');
const emptyState      = document.getElementById('emptyState');
const resultsContent  = document.getElementById('resultsContent');
const compareBody     = document.getElementById('compareBody');
const providerCardsMobile = document.getElementById('providerCardsMobile');
const summaryCards    = document.getElementById('summaryCards');
const bestPickName    = document.getElementById('bestPickName');
const savingsAmount   = document.getElementById('savingsAmount');
const resultsSummaryText = document.getElementById('resultsSummaryText');
const rateInfoBox     = document.getElementById('rateInfoBox');
const midRateEl       = document.getElementById('midRate');
const currencyPrefix  = document.getElementById('currencyPrefix');
const fromCurrencyTag = document.getElementById('fromCurrencyTag');

// ── Helpers ──────────────────────────────────
function getRate(from, to) {
  return RATES_TO_USD[from] / RATES_TO_USD[to];
}

function formatMoney(amount, symbol, decimals = 2) {
  if (Math.abs(amount) >= 1000) {
    return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return symbol + amount.toFixed(decimals);
}

function calcProviderFee(provider, amount) {
  if (provider.feeType === 'percent') {
    return +(amount * provider.feeRate + provider.fixedFee).toFixed(2);
  }
  return +provider.fixedFee;
}

function starsHtml(rating) {
  return `<span class="stars">${rating}</span>`;
}

function speedClass(provider) {
  return provider.speed === 'fast' ? 'delivery-fast' : 'delivery-slow';
}

// ── Update currency symbols on from-select change ──
function updateCurrencyDisplay() {
  const from = COUNTRIES[fromSelect.value];
  currencyPrefix.textContent = from.symbol;
  fromCurrencyTag.textContent = from.currency;
}

fromSelect.addEventListener('change', updateCurrencyDisplay);

// ── Swap countries ───────────────────────────
swapBtn.addEventListener('click', () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  updateCurrencyDisplay();
});

// ── Reset ────────────────────────────────────
resetBtn.addEventListener('click', () => {
  emptyState.style.display = 'flex';
  resultsContent.style.display = 'none';
  rateInfoBox.style.display = 'none';
  amountInput.value = 1000;
  fromSelect.value = 'US';
  toSelect.value = 'GB';
  updateCurrencyDisplay();
  document.querySelector('input[name="speed"][value="any"]').checked = true;
});

// ── Main calculate ───────────────────────────
calcBtn.addEventListener('click', calculate);

// Allow pressing Enter in amount field
amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calculate();
});

function calculate() {
  const amount   = parseFloat(amountInput.value);
  const fromCode = fromSelect.value;
  const toCode   = toSelect.value;
  const speed    = document.querySelector('input[name="speed"]:checked').value;

  // Validation
  if (!amount || amount <= 0) {
    shakeInput(amountInput);
    return;
  }
  if (fromCode === toCode) {
    showToast('Please select different countries.');
    return;
  }

  const fromC = COUNTRIES[fromCode];
  const toC   = COUNTRIES[toCode];

  // Mid-market rate
  const midRate = getRate(fromC.currency, toC.currency);

  // Filter by speed
  let providers = PROVIDERS;
  if (speed === 'fast') {
    providers = PROVIDERS.filter(p => p.speed === 'fast');
  }

  // Calculate for each provider
  const results = providers.map(p => {
    const fee        = calcProviderFee(p, amount);
    const netAmount  = amount - fee;
    const rate       = midRate * (1 - p.rateMarkup);
    const received   = +(netAmount * rate).toFixed(2);
    return { ...p, fee, netAmount, rate, received };
  });

  // Sort: if cheapest preference, sort by fee; otherwise by received amount desc
  if (speed === 'economy') {
    results.sort((a, b) => a.fee - b.fee);
  } else {
    results.sort((a, b) => b.received - a.received);
  }

  const best  = results[0];
  const worst = results[results.length - 1];
  const savings = best.received - worst.received;

  // Show rate info box
  midRateEl.textContent = `1 ${fromC.currency} = ${midRate.toFixed(4)} ${toC.currency}`;
  rateInfoBox.style.display = 'block';

  // Update results header
  resultsSummaryText.textContent =
    `${fromC.flag} ${formatMoney(amount, fromC.symbol)} → ${toC.flag} ${toC.currency} · ${results.length} providers`;

  // Best pick banner
  bestPickName.textContent = best.name;
  savingsAmount.textContent = formatMoney(savings, toC.symbol) + ' more than worst';

  // Summary cards
  summaryCards.innerHTML = `
    <div class="summary-card">
      <div class="sc-label">You Send</div>
      <div class="sc-value">${formatMoney(amount, fromC.symbol)}</div>
      <div class="sc-sub">${fromC.currency}</div>
    </div>
    <div class="summary-card">
      <div class="sc-label">Best Rate</div>
      <div class="sc-value">${best.rate.toFixed(4)}</div>
      <div class="sc-sub">${fromC.currency} → ${toC.currency}</div>
    </div>
    <div class="summary-card">
      <div class="sc-label">Max Received</div>
      <div class="sc-value">${formatMoney(best.received, toC.symbol)}</div>
      <div class="sc-sub">via ${best.name}</div>
    </div>
  `;

  // Populate table
  compareBody.innerHTML = results.map((p, i) => {
    const isBest = i === 0;
    return `
      <tr class="${isBest ? 'best-row' : ''}">
        <td>
          <div class="provider-cell">
            <div class="provider-icon" style="background:${p.iconBg}20; color:${p.iconColor}; border:1px solid ${p.iconBg}40;">
              <i class="${p.icon}"></i>
            </div>
            <div>
              <div class="provider-name">${p.name}</div>
              ${isBest ? '<div class="best-badge">Best Pick</div>' : ''}
            </div>
          </div>
        </td>
        <td class="fee-cell ${isBest ? 'fee-best' : ''}">
          ${formatMoney(p.fee, fromC.symbol)}
          <div style="font-size:0.72rem;font-weight:500;color:var(--text-muted);">
            ${p.feeType === 'percent' && p.feeRate > 0 ? (p.feeRate * 100).toFixed(2) + '%' + (p.fixedFee > 0 ? ' + ' + fromC.symbol + p.fixedFee : '') : 'Flat ' + fromC.symbol + p.fixedFee}
          </div>
        </td>
        <td>
          <span style="font-weight:700;">${p.rate.toFixed(4)}</span>
          <div style="font-size:0.72rem;color:var(--text-muted);">
            Markup: ${(p.rateMarkup * 100).toFixed(2)}%
          </div>
        </td>
        <td style="font-weight:700;">${formatMoney(amount, fromC.symbol)}</td>
        <td style="font-weight:800; color:${isBest ? 'var(--success)' : 'var(--text-primary)'};">
          ${formatMoney(p.received, toC.symbol)}
        </td>
        <td>
          <div class="delivery-cell ${p.deliveryClass}">
            <i class="${p.deliveryIcon}"></i>
            ${p.deliveryTime}
          </div>
        </td>
        <td>${starsHtml(p.rating)}</td>
      </tr>
    `;
  }).join('');

  // Mobile cards
  providerCardsMobile.innerHTML = results.map((p, i) => {
    const isBest = i === 0;
    return `
      <div class="pcard ${isBest ? 'pcard-best' : ''}">
        <div class="pcard-header">
          <div class="pcard-provider">
            <div class="provider-icon" style="background:${p.iconBg}20; color:${p.iconColor}; border:1px solid ${p.iconBg}40; width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:1rem;">
              <i class="${p.icon}"></i>
            </div>
            <div>
              <div class="provider-name">${p.name}</div>
              ${isBest ? '<div class="best-badge">Best Pick</div>' : ''}
            </div>
          </div>
          ${starsHtml(p.rating)}
        </div>
        <div class="pcard-body">
          <div class="pcard-row">
            <span class="pcard-label">Fee</span>
            <span class="pcard-val ${isBest ? 'val-success' : 'val-danger'}">${formatMoney(p.fee, fromC.symbol)}</span>
          </div>
          <div class="pcard-row">
            <span class="pcard-label">They Receive</span>
            <span class="pcard-val ${isBest ? 'val-success' : ''}">${formatMoney(p.received, toC.symbol)}</span>
          </div>
          <div class="pcard-row">
            <span class="pcard-label">Rate</span>
            <span class="pcard-val">${p.rate.toFixed(4)}</span>
          </div>
          <div class="pcard-row">
            <span class="pcard-label">Delivery</span>
            <span class="pcard-val" style="font-size:0.8rem;">${p.deliveryTime}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Show results
  emptyState.style.display = 'none';
  resultsContent.style.display = 'block';

  // Animate in
  resultsContent.style.opacity = '0';
  resultsContent.style.transform = 'translateY(16px)';
  requestAnimationFrame(() => {
    resultsContent.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    resultsContent.style.opacity = '1';
    resultsContent.style.transform = 'translateY(0)';
  });

  // Scroll to results on mobile
  if (window.innerWidth < 900) {
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Utilities ────────────────────────────────
function shakeInput(el) {
  el.style.borderColor = 'var(--danger)';
  el.style.animation = 'shake 0.4s ease';
  el.focus();
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.animation = '';
  }, 600);
}

function showToast(msg) {
  let toast = document.getElementById('pgToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pgToast';
    toast.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(60px);
      background:#1e293b;border:1px solid #334155;color:#f1f5f9;
      padding:12px 24px;border-radius:10px;font-size:0.88rem;font-weight:500;
      box-shadow:0 8px 30px rgba(0,0,0,0.4);z-index:9999;
      transition:transform 0.3s ease, opacity 0.3s ease;opacity:0;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(60px)';
    toast.style.opacity = '0';
  }, 3000);
}

// Shake animation keyframes
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-5px)}
    80%{transform:translateX(5px)}
  }
`;
document.head.appendChild(styleEl);

// Init
updateCurrencyDisplay();
