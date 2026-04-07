/* ============================================
   PAYGUARD — Exchange Tracker JavaScript
   ============================================ */

const TRACKER_COUNTRIES = {
  US: { name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  EU: { name: 'Eurozone', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  CA: { name: 'Canada', currency: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  AU: { name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  JP: { name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
  IN: { name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  SG: { name: 'Singapore', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  AE: { name: 'UAE', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
  CH: { name: 'Switzerland', currency: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
  NG: { name: 'Nigeria', currency: 'NGN', symbol: '₦', flag: '🇳🇬' },
  BR: { name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  MX: { name: 'Mexico', currency: 'MXN', symbol: 'MX$', flag: '🇲🇽' },
  PH: { name: 'Philippines', currency: 'PHP', symbol: '₱', flag: '🇵🇭' },
  PK: { name: 'Pakistan', currency: 'PKR', symbol: '₨', flag: '🇵🇰' },
};

const trackerFrom = document.getElementById('trackerFrom');
const trackerTo = document.getElementById('trackerTo');
const targetRateInput = document.getElementById('targetRate');
const sendAmountInput = document.getElementById('sendAmount');
const refreshBtn = document.getElementById('refreshBtn');
const setAlertBtn = document.getElementById('setAlertBtn');
const alertModal = document.getElementById('alertModal');
const alertModalBackdrop = document.getElementById('alertModalBackdrop');
const closeAlertModalBtn = document.getElementById('closeAlertModal');
const cancelAlertModalBtn = document.getElementById('cancelAlertModal');
const saveAlertModalBtn = document.getElementById('saveAlertModal');
const alertEmailInput = document.getElementById('alertEmail');
const alertLabelInput = document.getElementById('alertLabel');
const alertModalSummary = document.getElementById('alertModalSummary');
const targetMeaning = document.getElementById('targetMeaning');
const alertBox = document.getElementById('alertBox');
const pairTitle = document.getElementById('pairTitle');
const lastUpdated = document.getElementById('lastUpdated');
const currentRateEl = document.getElementById('currentRate');
const rateDirection = document.getElementById('rateDirection');
const targetStatus = document.getElementById('targetStatus');
const targetGap = document.getElementById('targetGap');
const bestTime = document.getElementById('bestTime');
const bestTimeNote = document.getElementById('bestTimeNote');
const receiveEstimate = document.getElementById('receiveEstimate');
const bestTransferCopy = document.getElementById('bestTransferCopy');
const alertCopy = document.getElementById('alertCopy');
const trendSvg = document.getElementById('trendSvg');
const chartFoot = document.getElementById('chartFoot');
const trendChip = document.getElementById('trendChip');
const nextRefresh = document.getElementById('nextRefresh');

let persistedAlert = false;
let refreshIntervalId = null;
let countdownIntervalId = null;
let latestRequestId = 0;
let nextRefreshAt = Date.now();
let savedAlertConfig = null;

const API_BASE = 'https://api.frankfurter.app';
const AUTO_REFRESH_MS = 2 * 60 * 1000;
const CURRENCY_API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
const CURRENCY_API_TAG_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api';
const LIVE_PROVIDER_NAME = 'Currency API (jsDelivr)';

const FALLBACK_RATES_TO_USD = {
  USD: 1, GBP: 1.27, EUR: 1.09, CAD: 0.74, AUD: 0.65,
  JPY: 0.0067, INR: 0.012, SGD: 0.75, AED: 0.272,
  CHF: 1.13, NGN: 0.00065, BRL: 0.19, MXN: 0.058, PHP: 0.018, PKR: 0.0036,
};

function getFallbackRate(from, to) {
  return FALLBACK_RATES_TO_USD[from] / FALLBACK_RATES_TO_USD[to];
}

function formatMoney(amount, symbol) {
  return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hashSeed(text) {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 100000;
  }
  return value;
}

function buildSimulatedTrend(baseRate, pairKey) {
  const seed = hashSeed(pairKey);
  const points = [];
  let current = baseRate * (0.985 + (seed % 7) * 0.003);

  for (let index = 0; index < 7; index += 1) {
    const wave = Math.sin((seed + index * 11) / 6) * baseRate * 0.01;
    const drift = ((seed % 13) - 6) * baseRate * 0.0012;
    current = Math.max(0.0001, current + wave + drift + (index - 3) * baseRate * 0.0008);
    points.push(+current.toFixed(4));
  }

  return points;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentPairLabel() {
  const from = TRACKER_COUNTRIES[trackerFrom.value];
  const to = TRACKER_COUNTRIES[trackerTo.value];
  return from && to ? `${from.currency} → ${to.currency}` : 'selected pair';
}

function renderAlertModalSummary() {
  const targetRate = parseFloat(targetRateInput.value) || 0;
  const amount = parseFloat(sendAmountInput.value) || 0;
  alertModalSummary.innerHTML = `
    <strong>Alert preview</strong><br />
    Pair: ${getCurrentPairLabel()}<br />
    Target rate: ${targetRate.toFixed(4)}<br />
    Amount: ${amount.toLocaleString('en-US')}<br />
    This will be saved locally only. No email API is attached yet.
  `;
}

function openAlertModal() {
  renderAlertModalSummary();
  alertModal.classList.add('open');
  alertModal.setAttribute('aria-hidden', 'false');
  const pairLabel = getCurrentPairLabel();
  alertLabelInput.value = alertLabelInput.value || `${pairLabel} watchlist`;
  setTimeout(() => alertEmailInput.focus(), 50);
}

function closeAlertModal() {
  alertModal.classList.remove('open');
  alertModal.setAttribute('aria-hidden', 'true');
}

function getSavedAlertMessage() {
  if (!savedAlertConfig) return 'Set a target rate and open the alert dialog to save your email for a local watchlist.';
  return `Alert saved for ${savedAlertConfig.email} on ${savedAlertConfig.pair} at ${savedAlertConfig.targetRate.toFixed(4)}. No email API is attached yet, so this is a local setup only.`;
}

function saveAlertConfig() {
  const email = alertEmailInput.value.trim();
  const label = alertLabelInput.value.trim() || `${getCurrentPairLabel()} watchlist`;
  const targetRate = parseFloat(targetRateInput.value) || 0;

  if (!email || !email.includes('@')) {
    alertModalSummary.innerHTML = 'Please enter a valid email address before saving.';
    alertEmailInput.focus();
    return;
  }

  savedAlertConfig = {
    email,
    label,
    pair: getCurrentPairLabel(),
    targetRate,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem('payguard.exchangeAlert', JSON.stringify(savedAlertConfig));
  } catch (error) {
    console.warn('Unable to persist alert settings locally.', error);
  }

  persistedAlert = true;
  alertCopy.textContent = getSavedAlertMessage();
  alertBox.style.display = 'block';
  alertBox.textContent = `Alert saved for ${email}. This is a local-only setup for now; email delivery is not connected yet.`;
  closeAlertModal();
}

async function fetchCurrentRate(fromCurrency, toCurrency) {
  const fromKey = fromCurrency.toLowerCase();
  const toKey = toCurrency.toLowerCase();
  const response = await fetch(`${CURRENCY_API_BASE}/${fromKey}.json`);
  if (!response.ok) {
    throw new Error('Current rate request failed');
  }

  const payload = await response.json();
  const rate = payload && payload[fromKey] ? payload[fromKey][toKey] : null;
  if (!rate) {
    throw new Error('Current rate missing in response');
  }

  return {
    rate,
    date: payload.date || null,
  };
}

async function fetchTrendRates(fromCurrency, toCurrency) {
  const fromKey = fromCurrency.toLowerCase();
  const toKey = toCurrency.toLowerCase();
  const dates = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dates.push(toIsoDate(date));
  }

  const settled = await Promise.allSettled(
    dates.map(async (dateTag) => {
      const response = await fetch(`${CURRENCY_API_TAG_BASE}@${dateTag}/v1/currencies/${fromKey}.json`);
      if (!response.ok) {
        throw new Error(`Trend point unavailable for ${dateTag}`);
      }
      const payload = await response.json();
      const value = payload && payload[fromKey] ? payload[fromKey][toKey] : null;
      if (typeof value !== 'number') {
        throw new Error(`Trend value missing for ${dateTag}`);
      }

      return {
        date: payload.date || dateTag,
        value,
      };
    })
  );

  return settled
    .filter(item => item.status === 'fulfilled')
    .map(item => item.value)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function setLoadingState(isLoading) {
  refreshBtn.disabled = isLoading;
  refreshBtn.innerHTML = isLoading
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...'
    : '<i class="fa-solid fa-rotate"></i> Refresh Snapshot';
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateCountdownText() {
  nextRefresh.textContent = formatDuration(nextRefreshAt - Date.now());
}

function setNextRefreshCountdown() {
  nextRefreshAt = Date.now() + AUTO_REFRESH_MS;
  updateCountdownText();
}

function renderTrend(points) {
  const width = 600;
  const height = 220;
  const padding = 24;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 0.0001);

  const coords = points.map((point, index) => {
    const x = padding + (usableWidth / (points.length - 1)) * index;
    const y = padding + usableHeight - ((point - min) / range) * usableHeight;
    return [x, y];
  });

  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M ${coords[0][0]} ${height - padding} L ${coords.map(([x, y]) => `${x} ${y}`).join(' L ')} L ${coords[coords.length - 1][0]} ${height - padding} Z`;

  trendSvg.innerHTML = `
    <defs>
      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(6,182,212,0.35)" />
        <stop offset="100%" stop-color="rgba(6,182,212,0.02)" />
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#trendFill)" />
    <polyline points="${line}" fill="none" stroke="#67e8f9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    ${coords.map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#e0f2fe" opacity="${index === coords.length - 1 ? 1 : 0.85}" />`).join('')}
  `;
}

async function updateTracker(options = {}) {
  const { isAuto = false } = options;
  const requestId = ++latestRequestId;

  const from = TRACKER_COUNTRIES[trackerFrom.value];
  const to = TRACKER_COUNTRIES[trackerTo.value];

  if (!from || !to || trackerFrom.value === trackerTo.value) {
    alertBox.style.display = 'block';
    alertBox.textContent = 'Choose two different countries to see a rate trend.';
    trendChip.textContent = 'Waiting for valid pair';
    return;
  }

  setLoadingState(true);

  const pairKey = `${from.currency}-${to.currency}`;
  let latest;
  let trend;
  let sourceLabel = LIVE_PROVIDER_NAME;
  let lastDataDate = null;
  let fetchStatus = 'success';
  let fetchError = null;

  try {
    const latestPayload = await fetchCurrentRate(from.currency, to.currency);
    const trendPoints = await fetchTrendRates(from.currency, to.currency);

    latest = latestPayload.rate;
    lastDataDate = latestPayload.date;

    if (trendPoints.length >= 2) {
      trend = trendPoints.map(point => +point.value.toFixed(4));
    } else {
      trend = buildSimulatedTrend(latest, pairKey);
      sourceLabel = `${LIVE_PROVIDER_NAME} + fill`;
    }
  } catch (error) {
    const fallbackRate = getFallbackRate(from.currency, to.currency);
    trend = buildSimulatedTrend(fallbackRate, pairKey);
    latest = trend[trend.length - 1];
    sourceLabel = 'Offline fallback';
    fetchStatus = 'fallback';
    fetchError = error;
  }

  if (requestId !== latestRequestId) {
    return;
  }

  const currentTime = new Date();
  const previous = trend[trend.length - 2];
  const changePct = ((latest - trend[0]) / trend[0]) * 100;
  const deltaPct = ((latest - previous) / previous) * 100;
  const target = parseFloat(targetRateInput.value) || latest;
  const amount = parseFloat(sendAmountInput.value) || 0;
  const received = amount > 0 ? amount * latest : 0;
  const targetReached = latest >= target;

  pairTitle.textContent = `${from.currency} to ${to.currency}`;
  currentRateEl.textContent = `1 ${from.currency} = ${latest.toFixed(4)} ${to.currency}`;
  rateDirection.textContent = `${deltaPct >= 0 ? 'Up' : 'Down'} ${Math.abs(deltaPct).toFixed(2)}% since the previous snapshot`;
  targetStatus.textContent = targetReached ? 'Target reached' : 'Below target';
  targetGap.textContent = targetReached
    ? `Current rate is above your target by ${(latest - target).toFixed(4)} ${to.currency}`
    : `You are ${(target - latest).toFixed(4)} ${to.currency} away from your target`;
  receiveEstimate.textContent = amount > 0 ? formatMoney(received, to.symbol) : '—';
  lastUpdated.textContent = `Updated ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · auto refresh 2 min`;

  const trendText = changePct > 0.15 ? 'strengthening' : changePct < -0.15 ? 'softening' : 'stable';
  const bestTiming = changePct > 0.15
    ? 'Transfer now if you are close to target.'
    : changePct < -0.15
      ? 'Wait and monitor. The rate is weakening.'
      : 'Monitor for one more snapshot before sending.';

  bestTime.textContent = trendText === 'strengthening' ? 'Now' : trendText === 'softening' ? 'Wait' : 'Monitor';
  bestTimeNote.textContent = bestTiming;
  bestTransferCopy.textContent = `${from.currency} → ${to.currency} has been ${trendText} by ${Math.abs(changePct).toFixed(2)}% across the latest 7 data points.`;
  if (targetMeaning) {
    targetMeaning.textContent = `Example: current rate is 1 ${from.currency} = ${latest.toFixed(4)} ${to.currency}. Set a target above this if you want to wait for a stronger rate.`;
  }

  if (targetReached) {
    alertBox.style.display = 'block';
    alertBox.textContent = `Target reached: current rate is at or above ${target.toFixed(4)}.`;
    alertCopy.textContent = 'Your target has been hit. Consider sending now before the rate moves against you.';
  } else {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
    alertCopy.textContent = savedAlertConfig
      ? getSavedAlertMessage()
      : `The current rate is still below ${target.toFixed(4)}. Keep watching for a better window.`;
  }

  renderTrend(trend);
  trendChip.textContent = sourceLabel;
  chartFoot.textContent = sourceLabel === 'Live API'
    ? `Live trend for ${from.currency}/${to.currency}${lastDataDate ? ` (provider date: ${lastDataDate})` : ''}. Auto refresh every 2 minutes.${isAuto ? ' Updated in background.' : ''}`
    : `Using ${sourceLabel.toLowerCase()} for ${from.currency}/${to.currency}. Check your internet and refresh again for live values.`;

  if (sourceLabel === LIVE_PROVIDER_NAME || sourceLabel === `${LIVE_PROVIDER_NAME} + fill`) {
    chartFoot.textContent = `Live trend for ${from.currency}/${to.currency}${lastDataDate ? ` (provider date: ${lastDataDate})` : ''}. Auto refresh every 2 minutes.${isAuto ? ' Updated in background.' : ''}`;
  }

  console.log('[ExchangeTracker]', {
    time: currentTime.toISOString(),
    pair: `${from.currency}-${to.currency}`,
    mode: sourceLabel,
    rate: latest,
    providerDate: lastDataDate,
    autoRefreshMs: AUTO_REFRESH_MS,
    isAuto,
    error: fetchError ? fetchError.message : null,
  });

  setLoadingState(false);
}

refreshBtn.addEventListener('click', updateTracker);
setAlertBtn.addEventListener('click', openAlertModal);
closeAlertModalBtn.addEventListener('click', closeAlertModal);
cancelAlertModalBtn.addEventListener('click', closeAlertModal);
saveAlertModalBtn.addEventListener('click', saveAlertConfig);
alertModalBackdrop.addEventListener('click', closeAlertModal);

alertModal.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAlertModal();
});

trackerFrom.addEventListener('change', updateTracker);
trackerTo.addEventListener('change', updateTracker);
targetRateInput.addEventListener('input', () => {
  if (persistedAlert) updateTracker();
});
sendAmountInput.addEventListener('input', updateTracker);
targetRateInput.addEventListener('input', renderAlertModalSummary);
trackerFrom.addEventListener('change', renderAlertModalSummary);
trackerTo.addEventListener('change', renderAlertModalSummary);
sendAmountInput.addEventListener('input', renderAlertModalSummary);

try {
  const storedAlert = localStorage.getItem('payguard.exchangeAlert');
  if (storedAlert) {
    savedAlertConfig = JSON.parse(storedAlert);
    persistedAlert = true;
    if (savedAlertConfig.email) alertEmailInput.value = savedAlertConfig.email;
    if (savedAlertConfig.label) alertLabelInput.value = savedAlertConfig.label;
    alertCopy.textContent = getSavedAlertMessage();
  }
} catch (error) {
  console.warn('Unable to load stored alert settings.', error);
}

if (refreshIntervalId) clearInterval(refreshIntervalId);
refreshIntervalId = setInterval(() => {
  updateTracker({ isAuto: true });
  setNextRefreshCountdown();
}, AUTO_REFRESH_MS);

if (countdownIntervalId) clearInterval(countdownIntervalId);
countdownIntervalId = setInterval(updateCountdownText, 1000);

setNextRefreshCountdown();

updateTracker();
