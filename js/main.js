/* ============================================
   PAYGUARD — Main JavaScript (Navbar & shared)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile hamburger toggle ──
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      // Animate hamburger to X
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.style.background = 'rgba(10,14,26,0.97)';
        navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
      } else {
        navbar.style.background = 'rgba(10,14,26,0.85)';
        navbar.style.boxShadow = 'none';
      }
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu
        if (navLinks) navLinks.classList.remove('open');
      }
    });
  });

  // ── Scroll reveal animation ──
  const revealEls = document.querySelectorAll(
    '.feature-card, .step-card, .why-stat-card, .why-point'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // ── Global finance chatbot widget ──
  initPayGuardChatbot();

});

function initPayGuardChatbot() {
  if (document.getElementById('pgChatbotWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'pgChatbotWidget';
  widget.className = 'pg-chatbot';
  widget.innerHTML = `
    <button class="pg-chatbot-fab" id="pgChatbotToggle" aria-label="Open AI assistant" title="AI Finance Assistant">
      <i class="fa-solid fa-robot"></i>
    </button>

    <section class="pg-chatbot-panel" id="pgChatbotPanel" aria-live="polite" aria-label="PayGuard AI assistant">
      <header class="pg-chatbot-head">
        <div class="pg-chatbot-title-wrap">
          <div class="pg-chatbot-icon"><i class="fa-solid fa-robot"></i></div>
          <div>
            <h4>PayGuard AI Assistant</h4>
            <p>Ask about fees, scams, and smart transfers</p>
          </div>
        </div>
        <button class="pg-chatbot-close" id="pgChatbotClose" aria-label="Close assistant">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="pg-chatbot-messages" id="pgChatbotMessages"></div>

      <div class="pg-chatbot-quick" id="pgChatbotQuick">
        <button type="button" class="pg-quick-btn" data-q="How to reduce transfer fees?">Reduce fees</button>
        <button type="button" class="pg-quick-btn" data-q="How do I detect payment scams?">Detect scams</button>
        <button type="button" class="pg-quick-btn" data-q="What is target exchange rate?">Target rate?</button>
      </div>

      <form class="pg-chatbot-input-wrap" id="pgChatbotForm">
        <input id="pgChatbotInput" type="text" placeholder="Type your question..." autocomplete="off" />
        <button type="submit" class="pg-chatbot-send" aria-label="Send">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </section>
  `;

  document.body.appendChild(widget);

  const toggleBtn = document.getElementById('pgChatbotToggle');
  const closeBtn = document.getElementById('pgChatbotClose');
  const panel = document.getElementById('pgChatbotPanel');
  const messages = document.getElementById('pgChatbotMessages');
  const input = document.getElementById('pgChatbotInput');
  const form = document.getElementById('pgChatbotForm');
  const quick = document.getElementById('pgChatbotQuick');

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `pg-msg pg-msg-${role}`;
    row.innerHTML = `<p>${escapeHtml(text)}</p>`;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function openPanel() {
    widget.classList.add('open');
    setTimeout(() => input.focus(), 80);
  }

  function closePanel() {
    widget.classList.remove('open');
  }

  function answerFor(question) {
    const q = question.toLowerCase();

    if (q.includes('fee') || q.includes('cheap') || q.includes('cost')) {
      return 'Use Fee Calculator first, compare both fee and received amount, and avoid providers with large exchange-rate markup.';
    }
    if (q.includes('scam') || q.includes('fraud') || q.includes('phishing')) {
      return 'Paste the message in Scam Checker. Never share OTP or passwords, and verify payment requests on an official channel before sending money.';
    }
    if (q.includes('target') || q.includes('exchange rate') || q.includes('rate')) {
      return 'Target exchange rate means the minimum rate you want before sending. Example: if 1 USD = 0.84 GBP now, set 0.86 to wait for a better rate.';
    }
    if (q.includes('tax') || q.includes('invoice') || q.includes('gst') || q.includes('vat')) {
      return 'Open Tax & Invoice Helper to generate invoices, estimate GST/VAT, categorize expenses, and review required business documents.';
    }
    if (q.includes('hello') || q.includes('hi')) {
      return 'Hi! I can help with transfer fees, exchange rates, scam safety, and tax/invoice basics.';
    }
    return 'Try asking: "How to reduce transfer fees?", "How to detect scams?", or "What is target exchange rate?"';
  }

  function handleAsk(question) {
    const message = question.trim();
    if (!message) return;
    addMessage('user', message);
    input.value = '';

    setTimeout(() => {
      addMessage('bot', answerFor(message));
    }, 220);
  }

  toggleBtn.addEventListener('click', () => {
    if (widget.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener('click', closePanel);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAsk(input.value);
  });

  quick.addEventListener('click', (e) => {
    const btn = e.target.closest('.pg-quick-btn');
    if (!btn) return;
    handleAsk(btn.dataset.q || '');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  addMessage('bot', 'Hello! I am your PayGuard assistant. Ask me anything about safer and cheaper money transfers.');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
