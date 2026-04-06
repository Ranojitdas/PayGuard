/* ============================================
   PAYGUARD — Tax & Invoice Helper JavaScript
   ============================================ */

const invoiceDefaults = {
  businessName: 'PayGuard Studio',
  clientName: 'Acme Ventures',
  invoiceNumber: 'INV-2026-001',
  taxRate: 7.5,
  currency: 'USD',
  items: [
    { description: 'Financial literacy landing page', qty: 1, rate: 450 },
    { description: 'UI design and implementation', qty: 1, rate: 600 },
  ],
};

const currencySymbols = { USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', INR: '₹' };
const expenseRules = [
  { category: 'Software', keywords: ['software', 'subscription', 'saas', 'figma', 'notion', 'tool'] },
  { category: 'Travel', keywords: ['flight', 'hotel', 'taxi', 'train', 'transport', 'travel'] },
  { category: 'Marketing', keywords: ['ads', 'ad spend', 'marketing', 'campaign', 'promotion'] },
  { category: 'Office', keywords: ['office', 'stationery', 'printer', 'desk', 'equipment'] },
  { category: 'Fees', keywords: ['bank fee', 'processing fee', 'platform fee', 'gateway', 'transaction fee'] },
  { category: 'Taxes', keywords: ['vat', 'gst', 'tax', 'income tax'] },
];

const businessName = document.getElementById('businessName');
const clientName = document.getElementById('clientName');
const invoiceNumber = document.getElementById('invoiceNumber');
const invoiceDate = document.getElementById('invoiceDate');
const currencySelect = document.getElementById('currencySelect');
const taxRateInput = document.getElementById('taxRate');
const itemsTableBody = document.querySelector('#itemsTable tbody');
const previewBusiness = document.getElementById('previewBusiness');
const previewClient = document.getElementById('previewClient');
const previewNumber = document.getElementById('previewNumber');
const previewDate = document.getElementById('previewDate');
const previewCurrency = document.getElementById('previewCurrency');
const previewTaxRate = document.getElementById('previewTaxRate');
const previewItems = document.getElementById('previewItems');
const subtotalValue = document.getElementById('subtotalValue');
const taxValue = document.getElementById('taxValue');
const totalValue = document.getElementById('totalValue');
const addItemBtn = document.getElementById('addItemBtn');
const updateInvoiceBtn = document.getElementById('updateInvoiceBtn');
const resetInvoiceBtn = document.getElementById('resetInvoiceBtn');
const expenseInput = document.getElementById('expenseInput');
const categorizeBtn = document.getElementById('categorizeBtn');
const expenseResults = document.getElementById('expenseResults');
const docList = document.getElementById('docList');

function money(amount, currency) {
  const symbol = currencySymbols[currency] || '$';
  return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createItemRow(item = { description: '', qty: 1, rate: 0 }) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input class="items-row-input item-desc" type="text" value="${item.description}" /></td>
    <td><input class="items-row-input item-qty" type="number" min="1" step="1" value="${item.qty}" /></td>
    <td><input class="items-row-input item-rate" type="number" min="0" step="0.01" value="${item.rate}" /></td>
    <td class="item-amount">${money(item.qty * item.rate, currencySelect.value)}</td>
    <td><button class="row-remove-btn" type="button" title="Remove item"><i class="fa-solid fa-trash"></i></button></td>
  `;

  row.querySelectorAll('input').forEach(input => input.addEventListener('input', updateInvoice));
  row.querySelector('.row-remove-btn').addEventListener('click', () => {
    if (itemsTableBody.children.length > 1) {
      row.remove();
      updateInvoice();
    }
  });

  return row;
}

function renderInitialItems(items) {
  itemsTableBody.innerHTML = '';
  items.forEach(item => itemsTableBody.appendChild(createItemRow(item)));
}

function readItems() {
  return [...itemsTableBody.querySelectorAll('tr')].map(row => {
    const description = row.querySelector('.item-desc').value.trim() || 'Unnamed item';
    const qty = Math.max(1, parseFloat(row.querySelector('.item-qty').value) || 1);
    const rate = Math.max(0, parseFloat(row.querySelector('.item-rate').value) || 0);
    return { description, qty, rate };
  });
}

function updateInvoice() {
  const items = readItems();
  const currency = currencySelect.value;
  const taxRate = Math.max(0, parseFloat(taxRateInput.value) || 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  previewBusiness.textContent = businessName.value.trim() || invoiceDefaults.businessName;
  previewClient.textContent = clientName.value.trim() || invoiceDefaults.clientName;
  previewNumber.textContent = invoiceNumber.value.trim() || invoiceDefaults.invoiceNumber;
  previewDate.textContent = invoiceDate.value ? new Date(invoiceDate.value).toLocaleDateString() : new Date().toLocaleDateString();
  previewCurrency.textContent = currency;
  previewTaxRate.textContent = `${taxRate.toFixed(1)}%`;

  previewItems.innerHTML = items.map(item => `
    <div class="preview-item">
      <div>
        <strong>${item.description}</strong>
        <small>${item.qty} x ${money(item.rate, currency)}</small>
      </div>
      <strong>${money(item.qty * item.rate, currency)}</strong>
    </div>
  `).join('');

  subtotalValue.textContent = money(subtotal, currency);
  taxValue.textContent = money(tax, currency);
  totalValue.textContent = money(total, currency);

  itemsTableBody.querySelectorAll('tr').forEach((row, index) => {
    const item = items[index];
    row.querySelector('.item-amount').textContent = money(item.qty * item.rate, currency);
  });
}

function classifyExpenses() {
  const lines = expenseInput.value.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) {
    expenseResults.innerHTML = '<div class="expense-result"><span>Paste one expense per line to classify it.</span></div>';
    return;
  }

  expenseResults.innerHTML = lines.map(line => {
    const normalized = line.toLowerCase();
    const match = expenseRules.find(rule => rule.keywords.some(keyword => normalized.includes(keyword)));
    const category = match ? match.category : 'General';
    return `
      <div class="expense-result">
        <span>${line}</span>
        <strong>${category}</strong>
      </div>
    `;
  }).join('');
}

function renderChecklist() {
  const items = [
    'Invoice number and invoice date',
    'Business name, address, and tax ID',
    'Client details and payment terms',
    'Itemized services or products',
    'GST / VAT rate and total tax amount',
    'Receipt or bank transfer proof for expenses',
    'Contracts or scope notes for freelance work',
  ];

  docList.innerHTML = items.map(item => `
    <li><i class="fa-solid fa-circle-check"></i><span>${item}</span></li>
  `).join('');
}

function resetSample() {
  businessName.value = invoiceDefaults.businessName;
  clientName.value = invoiceDefaults.clientName;
  invoiceNumber.value = invoiceDefaults.invoiceNumber;
  taxRateInput.value = invoiceDefaults.taxRate;
  currencySelect.value = invoiceDefaults.currency;
  invoiceDate.valueAsDate = new Date();
  renderInitialItems(invoiceDefaults.items);
  expenseInput.value = 'hotel\nsoftware subscription\nad spend\nbank fee';
  updateInvoice();
  classifyExpenses();
}

addItemBtn.addEventListener('click', () => {
  itemsTableBody.appendChild(createItemRow());
  updateInvoice();
});

updateInvoiceBtn.addEventListener('click', updateInvoice);
resetInvoiceBtn.addEventListener('click', resetSample);
categorizeBtn.addEventListener('click', classifyExpenses);

[businessName, clientName, invoiceNumber, invoiceDate, currencySelect, taxRateInput, expenseInput].forEach(input => {
  input.addEventListener('input', () => {
    if (input === expenseInput) return;
    updateInvoice();
  });
});

invoiceDate.valueAsDate = new Date();
renderInitialItems(invoiceDefaults.items);
renderChecklist();
resetSample();
