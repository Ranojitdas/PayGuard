/* ============================================
   PAYGUARD — Scam Checker JavaScript
   ============================================ */

// ── Scam Signal Database ─────────────────────
const SCAM_SIGNALS = [
  // HIGH severity
  { keyword: 'send money',           category: 'financial',  severity: 'high',   desc: 'Direct request for money transfer — a primary scam indicator.' },
  { keyword: 'wire transfer',        category: 'financial',  severity: 'high',   desc: 'Scammers frequently request wire transfers which are irreversible.' },
  { keyword: 'gift card',            category: 'financial',  severity: 'high',   desc: 'Legitimate organisations never ask for payment via gift cards.' },
  { keyword: 'bitcoin',              category: 'financial',  severity: 'high',   desc: 'Crypto payment requests are a common scam payment method.' },
  { keyword: 'cryptocurrency',       category: 'financial',  severity: 'high',   desc: 'Crypto payment requests are a common scam payment method.' },
  { keyword: 'your account has been suspended', category: 'impersonation', severity: 'high', desc: 'Account suspension threats are used to trigger panic.' },
  { keyword: 'account locked',       category: 'impersonation', severity: 'high',desc: 'Fake account lock notifications are a classic phishing tactic.' },
  { keyword: 'unlock your account',  category: 'impersonation', severity: 'high',desc: 'Requesting payment to unlock accounts is always a scam.' },
  { keyword: 'verify your account',  category: 'impersonation', severity: 'high',desc: 'Fake verification requests aim to steal credentials or money.' },
  { keyword: 'you have won',         category: 'prize',      severity: 'high',   desc: 'Unsolicited prize notifications are almost always fraudulent.' },
  { keyword: 'you\'ve won',          category: 'prize',      severity: 'high',   desc: 'Unsolicited prize notifications are almost always fraudulent.' },
  { keyword: 'claim your prize',     category: 'prize',      severity: 'high',   desc: 'Prize claims requiring action or payment are scam tactics.' },
  { keyword: 'release your funds',   category: 'financial',  severity: 'high',   desc: 'Advance fee scam — pay a fee to release a larger sum that doesn\'t exist.' },
  { keyword: 'inheritance',          category: 'financial',  severity: 'high',   desc: 'Unexpected inheritance offers from strangers are a known scam.' },
  { keyword: 'confidential',         category: 'social',     severity: 'high',   desc: 'Requests for secrecy are a red flag — scammers hide from scrutiny.' },
  { keyword: 'do not tell',          category: 'social',     severity: 'high',   desc: 'Instructions to keep a transaction secret indicate fraud.' },

  // MEDIUM severity
  { keyword: 'urgent',               category: 'urgency',    severity: 'medium', desc: 'Urgency tactics are used to pressure victims into acting without thinking.' },
  { keyword: 'immediately',          category: 'urgency',    severity: 'medium', desc: 'Artificial time pressure is a hallmark of scam messages.' },
  { keyword: 'act now',              category: 'urgency',    severity: 'medium', desc: 'Scammers use urgency to prevent victims from seeking advice.' },
  { keyword: 'limited time',         category: 'urgency',    severity: 'medium', desc: 'False deadlines are used to rush victims into decisions.' },
  { keyword: '24 hours',             category: 'urgency',    severity: 'medium', desc: 'Short deadlines create artificial urgency — a common scam tactic.' },
  { keyword: 'click here',           category: 'phishing',   severity: 'medium', desc: 'Vague link instructions may lead to phishing or malware sites.' },
  { keyword: 'login to your account',category: 'phishing',   severity: 'medium', desc: 'Fake login prompts aim to steal your credentials.' },
  { keyword: 'confirm your details', category: 'phishing',   severity: 'medium', desc: 'Requests for personal information via email/text are suspicious.' },
  { keyword: 'account will be closed', category: 'urgency',  severity: 'medium', desc: 'Threats of account closure are used to create panic.' },
  { keyword: 'overpaid',             category: 'financial',  severity: 'medium', desc: 'Overpayment scams ask you to refund a false excess amount.' },
  { keyword: 'refund the difference', category: 'financial', severity: 'medium', desc: 'Refund requests tied to overpayments are a common scam.' },
  { keyword: 'advance fee',          category: 'financial',  severity: 'medium', desc: 'Requests to pay a small fee to receive a larger sum are scams.' },
  { keyword: 'processing fee',       category: 'financial',  severity: 'medium', desc: 'Legitimate transfers don\'t require you to pay upfront fees externally.' },
  { keyword: 'transfer fee',         category: 'financial',  severity: 'medium', desc: 'Fees required to release funds are a common advance fee scam signal.' },
  { keyword: 'special offer',        category: 'prize',      severity: 'medium', desc: 'Unsolicited special offers are often too good to be true.' },
  { keyword: 'guaranteed return',    category: 'financial',  severity: 'medium', desc: 'Guaranteed returns in investment contexts are a fraud indicator.' },

  // LOW severity
  { keyword: 'dear friend',          category: 'social',     severity: 'low',    desc: 'Impersonal openers like "Dear Friend" suggest bulk scam messages.' },
  { keyword: 'dear customer',        category: 'social',     severity: 'low',    desc: 'Legitimate organisations usually address you by name.' },
  { keyword: 'don\'t miss out',      category: 'urgency',    severity: 'low',    desc: 'FOMO language can indicate manipulative messaging.' },
  { keyword: 'risk-free',            category: 'financial',  severity: 'low',    desc: 'No financial investment is truly risk-free — a common misleading claim.' },
  { keyword: 'free money',           category: 'prize',      severity: 'low',    desc: 'Offers of free money with no context are suspicious.' },
  { keyword: 'congratulations',      category: 'prize',      severity: 'low',    desc: 'Unexpected congratulations in unsolicited messages can be a scam opener.' },
  { keyword: 'nigerian',             category: 'social',     severity: 'low',    desc: 'Associated with advance fee scam patterns.' },
  { keyword: 'western union',        category: 'financial',  severity: 'low',    desc: 'Scammers often specifically request Western Union transfers.' },
  { keyword: 'moneygram',            category: 'financial',  severity: 'low',    desc: 'Scammers often specifically request MoneyGram transfers.' },
];

// Category config
const CATEGORIES = {
  urgency:       { label: 'Urgency Tactics',     icon: 'fa-bolt',         color: '#f97316' },
  financial:     { label: 'Financial Red Flags',  icon: 'fa-dollar-sign',  color: '#ef4444' },
  impersonation: { label: 'Impersonation',        icon: 'fa-user-secret',  color: '#8b5cf6' },
  phishing:      { label: 'Phishing Signals',     icon: 'fa-link',         color: '#3b82f6' },
  prize:         { label: 'Prize / Reward Scam',  icon: 'fa-gift',         color: '#f59e0b' },
  social:        { label: 'Social Engineering',   icon: 'fa-comments',     color: '#64748b' },
};

// Sensitivity multipliers
const SENSITIVITY = { low: 0.5, medium: 1, high: 1.4 };

// Score weights
const SEV_WEIGHT = { high: 25, medium: 12, low: 5 };

// Sample messages
const SAMPLES = {
  scam1: `Dear Customer,

Your account has been suspended due to suspicious activity. You must send $200 via gift card immediately to unlock your account. This is urgent — your account will be permanently closed within 24 hours if you do not act now. Do not tell your bank about this transaction. Click here to confirm your details and complete the payment.`,

  scam2: `Congratulations! You've won a $5,000 prize in our international lottery. To claim your prize, you must pay a processing fee of $150 via wire transfer or Bitcoin to release your funds. This is a limited time offer — act now before it expires. Contact us immediately. This is confidential, dear friend.`,

  safe1: `Hi Sarah,

Just a reminder that your invoice #1042 for $350 is due on 15th March 2026. You can pay by bank transfer using the account details on the invoice. If you have any questions, please reply to this email or call us on our usual number. Thanks for your business!

Best regards,
The Accounts Team`,
};

// DOM references
const messageInput   = document.getElementById('messageInput');
const charCount      = document.getElementById('charCount');
const clearBtn       = document.getElementById('clearBtn');
const checkBtn       = document.getElementById('checkBtn');
const scEmpty        = document.getElementById('scEmpty');
const scResultContent= document.getElementById('scResultContent');
const verdictBanner  = document.getElementById('verdictBanner');
const verdictLabel   = document.getElementById('verdictLabel');
const verdictTitle   = document.getElementById('verdictTitle');
const verdictSub     = document.getElementById('verdictSub');
const verdictIconI   = document.getElementById('verdictIconI');
const scoreNum       = document.getElementById('scoreNum');
const scoreCircle    = document.getElementById('scoreCircle');
const riskCategories = document.getElementById('riskCategories');
const highlightedMsg = document.getElementById('highlightedMsg');
const hsBadge        = document.getElementById('hsBadge');
const flagsSection   = document.getElementById('flagsSection');
const flagsList      = document.getElementById('flagsList');
const safeTips       = document.getElementById('safeTips');
const reCheckBtn     = document.getElementById('reCheckBtn');
const copyReportBtn  = document.getElementById('copyReportBtn');
const textareaWrap   = document.getElementById('textareaWrap');

// ── Character counter ────────────────────────
messageInput.addEventListener('input', () => {
  const len = messageInput.value.length;
  charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
});

// ── Clear ────────────────────────────────────
clearBtn.addEventListener('click', () => {
  messageInput.value = '';
  charCount.textContent = '0 characters';
  messageInput.focus();
});

// ── Sample messages ──────────────────────────
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sample;
    messageInput.value = SAMPLES[key] || '';
    const len = messageInput.value.length;
    charCount.textContent = `${len.toLocaleString()} characters`;
  });
});

// ── Reset / re-check ─────────────────────────
reCheckBtn.addEventListener('click', () => {
  scEmpty.style.display = 'flex';
  scResultContent.style.display = 'none';
  messageInput.focus();
});

// ── Copy report ──────────────────────────────
copyReportBtn.addEventListener('click', () => {
  const score  = scoreNum.textContent;
  const title  = verdictTitle.textContent;
  const flags  = [...document.querySelectorAll('.flag-keyword')].map(el => '• ' + el.textContent).join('\n');
  const report = `PayGuard Scam Analysis Report\n==============================\nVerdict: ${title}\nRisk Score: ${score}/100\n\nDetected Signals:\n${flags || 'None'}\n\n⚠️ For informational purposes only.`;
  navigator.clipboard.writeText(report).then(() => {
    showToast('Report copied to clipboard!');
  });
});

// ── Main check ───────────────────────────────
checkBtn.addEventListener('click', runCheck);
messageInput.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') runCheck();
});

function runCheck() {
  const msg = messageInput.value.trim();
  if (!msg) {
    textareaWrap.classList.add('textarea-shake');
    setTimeout(() => textareaWrap.classList.remove('textarea-shake'), 500);
    messageInput.focus();
    return;
  }

  const sensitivity = document.querySelector('input[name="sensitivity"]:checked').value;
  const multiplier  = SENSITIVITY[sensitivity];
  const msgLower    = msg.toLowerCase();

  // ── Find matches ──────────────────────────
  const matches = [];
  SCAM_SIGNALS.forEach(signal => {
    if (msgLower.includes(signal.keyword.toLowerCase())) {
      matches.push({ ...signal });
    }
  });

  // ── Score calculation ─────────────────────
  let rawScore = 0;
  matches.forEach(m => {
    rawScore += SEV_WEIGHT[m.severity] * multiplier;
  });
  const score = Math.min(100, Math.round(rawScore));

  // ── Verdict ───────────────────────────────
  let verdict;
  if (score === 0) {
    verdict = { level: 'safe',   label: 'No Risk Detected',   title: 'Message Appears Safe ✓',    sub: 'No known scam patterns were found in this message. However, always stay cautious.',       icon: 'fa-shield-halved', color: 'var(--success)', dashColor: '#10b981' };
  } else if (score <= 25) {
    verdict = { level: 'low',    label: 'Low Risk',           title: 'Minor Concerns Found',       sub: 'A few low-risk signals detected. The message may be legitimate but warrants caution.',   icon: 'fa-circle-info',  color: 'var(--warning)', dashColor: '#f59e0b' };
  } else if (score <= 60) {
    verdict = { level: 'medium', label: 'Medium Risk ⚠',     title: 'Suspicious Patterns Detected', sub: 'Multiple scam indicators found. Do not send money or provide personal information.',   icon: 'fa-triangle-exclamation', color: '#f97316', dashColor: '#f97316' };
  } else {
    verdict = { level: 'high',   label: 'HIGH RISK — SCAM LIKELY 🚨', title: 'Possible Scam Detected!', sub: 'This message contains multiple serious scam indicators. Do NOT follow its instructions.', icon: 'fa-shield-virus', color: 'var(--danger)', dashColor: '#ef4444' };
  }

  // ── Category breakdown ────────────────────
  const catCounts = {};
  matches.forEach(m => {
    catCounts[m.category] = (catCounts[m.category] || 0) + 1;
  });

  // ── Highlight message text ────────────────
  let highlighted = escapeHtml(msg);
  // Sort by keyword length desc to avoid partial overlaps
  const sortedMatches = [...matches].sort((a, b) => b.keyword.length - a.keyword.length);
  const usedRanges = [];

  sortedMatches.forEach(m => {
    const kw    = m.keyword;
    const regex = new RegExp(`(${escapeRegex(kw)})`, 'gi');
    const markClass = m.severity === 'high' ? 'mark' : m.severity === 'medium' ? 'mark mark-warning' : 'mark mark-info';
    highlighted = highlighted.replace(regex, (match) => `<mark class="${markClass}">${match}</mark>`);
  });

  // ── Update DOM ────────────────────────────
  // Verdict banner
  verdictBanner.className = `verdict-banner verdict-${verdict.level}`;
  verdictLabel.textContent  = verdict.label;
  verdictTitle.textContent  = verdict.title;
  verdictSub.textContent    = verdict.sub;
  verdictIconI.className    = `fa-solid ${verdict.icon}`;

  // Score ring
  animateScore(score, verdict.dashColor);

  // Risk categories
  const topCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0, 3);
  riskCategories.innerHTML = topCats.length > 0
    ? topCats.map(([cat, count]) => {
        const cfg = CATEGORIES[cat] || { label: cat, icon: 'fa-flag', color: '#94a3b8' };
        const maxCount = Math.max(...Object.values(catCounts));
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div class="risk-cat">
            <div class="rc-label" style="color:${cfg.color};">
              <i class="fa-solid ${cfg.icon}"></i> ${cfg.label}
            </div>
            <div class="rc-bar-wrap">
              <div class="rc-bar" style="width:0%;background:${cfg.color};" data-width="${pct}"></div>
            </div>
            <span class="rc-count">${count} signal${count !== 1 ? 's' : ''}</span>
          </div>`;
      }).join('')
    : `<div class="risk-cat" style="grid-column:1/-1;text-align:center;">
         <span class="rc-count" style="color:var(--success);">✓ No category signals detected</span>
       </div>`;

  // Highlighted message
  highlightedMsg.innerHTML = highlighted || escapeHtml(msg);
  hsBadge.textContent = `${matches.length} flag${matches.length !== 1 ? 's' : ''}`;
  hsBadge.style.background = matches.length > 0 ? '' : 'rgba(16,185,129,0.12)';
  hsBadge.style.borderColor = matches.length > 0 ? '' : 'rgba(16,185,129,0.3)';
  hsBadge.style.color = matches.length > 0 ? '' : 'var(--success)';

  // Flags list
  if (matches.length > 0) {
    flagsSection.style.display = 'block';
    flagsList.innerHTML = matches.sort((a,b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    }).map(m => `
      <div class="flag-item flag-${m.severity}">
        <span class="flag-sev">${m.severity}</span>
        <div class="flag-body">
          <div class="flag-keyword">"${m.keyword}"</div>
          <div class="flag-desc">${m.desc}</div>
        </div>
      </div>
    `).join('');
  } else {
    flagsSection.style.display = 'none';
  }

  // Safe tips
  if (score === 0) {
    safeTips.style.display = 'block';
    document.getElementById('safeTipsList').innerHTML = [
      'Even safe-looking messages can be scams. Verify the sender through official channels.',
      'Never share your passwords, PINs, or OTP codes in response to any message.',
      'If you are asked to send money, always call the recipient directly to confirm.',
      'Check email addresses carefully — scammers use addresses that look almost identical to legitimate ones.',
      'Trust your instincts. If something feels off, seek a second opinion before acting.',
    ].map(t => `<li>${t}</li>`).join('');
  } else {
    safeTips.style.display = 'none';
  }

  // Show results
  scEmpty.style.display = 'none';
  scResultContent.style.display = 'block';

  // Animate in
  scResultContent.style.opacity = '0';
  scResultContent.style.transform = 'translateY(16px)';
  requestAnimationFrame(() => {
    scResultContent.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    scResultContent.style.opacity = '1';
    scResultContent.style.transform = 'translateY(0)';
  });

  // Animate bar widths after render
  setTimeout(() => {
    document.querySelectorAll('.rc-bar[data-width]').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
      bar.style.transition = 'width 0.8s ease';
    });
  }, 100);

  // Scroll to results on mobile
  if (window.innerWidth < 900) {
    document.getElementById('scamResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Score ring animation ──────────────────────
function animateScore(targetScore, color) {
  const circumference = 213.6;
  scoreCircle.style.stroke = color;
  scoreNum.style.color = color;

  let current = 0;
  const step = targetScore / 40;
  const interval = setInterval(() => {
    current = Math.min(current + step, targetScore);
    scoreNum.textContent = Math.round(current);
    const offset = circumference - (current / 100) * circumference;
    scoreCircle.style.strokeDashoffset = offset;
    if (current >= targetScore) clearInterval(interval);
  }, 25);
}

// ── Utilities ─────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
