/* ============================================
   PAYGUARD — Tax & Invoice Helper JavaScript
   ============================================ */

const invoiceDefaults = {
  businessName: 'PayGuard Studio',
  businessAddress: '48 Market Street, Singapore',
  taxId: 'GST-2026-8891',
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
const businessAddress = document.getElementById('businessAddress');
const taxId = document.getElementById('taxId');
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
const previewDueDate = document.getElementById('previewDueDate');
const previewCurrency = document.getElementById('previewCurrency');
const previewTaxRate = document.getElementById('previewTaxRate');
const previewAddress = document.getElementById('previewAddress');
const previewTaxId = document.getElementById('previewTaxId');
const previewItems = document.getElementById('previewItems');
const subtotalValue = document.getElementById('subtotalValue');
const taxValue = document.getElementById('taxValue');
const totalValue = document.getElementById('totalValue');
const addItemBtn = document.getElementById('addItemBtn');
const updateInvoiceBtn = document.getElementById('updateInvoiceBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const downloadWordBtn = document.getElementById('downloadWordBtn');
const resetInvoiceBtn = document.getElementById('resetInvoiceBtn');
const expenseInput = document.getElementById('expenseInput');
const categorizeBtn = document.getElementById('categorizeBtn');
const expenseResults = document.getElementById('expenseResults');
const docList = document.getElementById('docList');

function money(amount, currency) {
  const symbol = currencySymbols[currency] || '$';
  return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getDueDate(sourceDate) {
  const dueDate = new Date(sourceDate);
  dueDate.setDate(dueDate.getDate() + 14);
  return dueDate;
}

function getInvoiceData() {
  const items = readItems();
  const currency = currencySelect.value;
  const taxRate = Math.max(0, parseFloat(taxRateInput.value) || 0);
  const dateValue = invoiceDate.value ? new Date(invoiceDate.value) : new Date();
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  return {
    businessName: businessName.value.trim() || invoiceDefaults.businessName,
    businessAddress: businessAddress.value.trim() || invoiceDefaults.businessAddress,
    taxId: taxId.value.trim() || invoiceDefaults.taxId,
    clientName: clientName.value.trim() || invoiceDefaults.clientName,
    invoiceNumber: invoiceNumber.value.trim() || invoiceDefaults.invoiceNumber,
    invoiceDate: dateValue,
    dueDate: getDueDate(dateValue),
    currency,
    taxRate,
    items,
    subtotal,
    tax,
    total,
    currencySymbol: currencySymbols[currency] || '$',
  };
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slugifyFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInvoiceFileBase(data) {
  return `${slugifyFileName(data.invoiceNumber || 'invoice')}-${slugifyFileName(data.clientName || 'client')}`;
}

function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ''), maxWidth);
}

function getBusinessInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'PG';
}

function ensurePdfLibrary() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('PDF library is not loaded yet.');
  }
  return window.jspdf.jsPDF;
}

async function exportPdf() {
  const data = getInvoiceData();
  const jsPDF = ensurePdfLibrary();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const accent = [245, 158, 11];
  const dark = [15, 23, 42];
  const slate = [71, 85, 105];

  const drawInfoCard = (x, y, width, title, value) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, width, 56, 8, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), x + 12, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    splitText(doc, value, width - 24).forEach((line, index) => {
      doc.text(line, x + 12, y + 35 + (index * 13));
    });
  };

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 122, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(29);
  doc.text(data.businessName, margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(226, 232, 240);
  splitText(doc, data.businessAddress, 250).forEach((line, index) => {
    doc.text(line, margin, 58 + (index * 12));
  });
  doc.text(`Tax ID: ${data.taxId}`, margin, 96);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TAX INVOICE', pageWidth - margin, 36, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice No. ${data.invoiceNumber}`, pageWidth - margin, 56, { align: 'right' });
  doc.text(formatDate(data.invoiceDate), pageWidth - margin, 72, { align: 'right' });
  doc.text(`Due ${formatDate(data.dueDate)}`, pageWidth - margin, 88, { align: 'right' });
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text(`${data.currency} | ${data.taxRate.toFixed(1)}% tax`, pageWidth - margin, 104, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 136, pageWidth - margin, 136);

  drawInfoCard(margin, 154, 168, 'Bill To', data.clientName);
  drawInfoCard(margin + 182, 154, 130, 'Currency', data.currency);
  drawInfoCard(margin + 326, 154, 130, 'Tax Rate', `${data.taxRate.toFixed(1)}%`);
  drawInfoCard(pageWidth - margin - 168, 154, 168, 'Contact / Tax ID', data.taxId);

  doc.autoTable({
    startY: 228,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: data.items.map(item => [
      item.description,
      String(item.qty),
      money(item.rate, data.currency),
      money(item.qty * item.rate, data.currency),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10.5,
      cellPadding: 8,
      lineColor: [226, 232, 240],
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'center', cellWidth: 52 },
      2: { halign: 'right', cellWidth: 96 },
      3: { halign: 'right', cellWidth: 108 },
    },
    margin: { left: margin, right: margin },
  });

  const tableY = doc.lastAutoTable.finalY + 18;
  const summaryWidth = 232;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, tableY, summaryWidth, 104, 10, 10, 'FD');
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(summaryX, tableY, summaryWidth, 24, 10, 10, 'F');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', summaryX + 14, tableY + 16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal', summaryX + 14, tableY + 44);
  doc.text(money(data.subtotal, data.currency), summaryX + summaryWidth - 14, tableY + 44, { align: 'right' });
  doc.text(`Tax (${data.taxRate.toFixed(1)}%)`, summaryX + 14, tableY + 66);
  doc.text(money(data.tax, data.currency), summaryX + summaryWidth - 14, tableY + 66, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Due', summaryX + 14, tableY + 94);
  doc.text(money(data.total, data.currency), summaryX + summaryWidth - 14, tableY + 94, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('Payment Terms: Due within 14 days. Thank you for your business.', margin, 782);
  doc.text('Generated by PayGuard Tax & Invoice Helper', margin, 796);

  doc.save(`${getInvoiceFileBase(data)}.pdf`);
}

async function exportWord() {
  const data = getInvoiceData();
  const docxLib = window.docx;
  if (!docxLib) {
    throw new Error('Word library is not loaded yet.');
  }

  const {
    AlignmentType,
    BorderStyle,
    Document,
    Paragraph,
    Packer,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docxLib;

  const baseCellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D8DEE9' };
  const headerCell = (text) => new TableCell({
    shading: { fill: 'F5A20A' },
    borders: { top: baseCellBorder, bottom: baseCellBorder, left: baseCellBorder, right: baseCellBorder },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: '111827' })] })],
  });
  const bodyCell = (text, align = AlignmentType.LEFT) => new TableCell({
    borders: { top: baseCellBorder, bottom: baseCellBorder, left: baseCellBorder, right: baseCellBorder },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text })] })],
  });

  const lineItemRows = [
    new TableRow({ children: [headerCell('Description'), headerCell('Qty'), headerCell('Rate'), headerCell('Amount')] }),
    ...data.items.map(item => new TableRow({
      children: [
        bodyCell(item.description),
        bodyCell(String(item.qty), AlignmentType.CENTER),
        bodyCell(money(item.rate, data.currency), AlignmentType.RIGHT),
        bodyCell(money(item.qty * item.rate, data.currency), AlignmentType.RIGHT),
      ],
    })),
  ];

  const totalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [bodyCell('Subtotal'), bodyCell(money(data.subtotal, data.currency), AlignmentType.RIGHT)] }),
      new TableRow({ children: [bodyCell(`Tax (${data.taxRate.toFixed(1)}%)`), bodyCell(money(data.tax, data.currency), AlignmentType.RIGHT)] }),
      new TableRow({ children: [bodyCell('Total Due'), bodyCell(money(data.total, data.currency), AlignmentType.RIGHT)] }),
    ],
  });

  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
            rows: [
              new TableRow({ children: [
                new TableCell({
                  width: { size: 62, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: data.businessName, bold: true, size: 36, color: '0F172A' })], spacing: { after: 25 } }),
                    new Paragraph({ children: [new TextRun({ text: data.businessAddress, size: 19, color: '475569' })], spacing: { after: 20 } }),
                    new Paragraph({ children: [new TextRun({ text: `Tax ID: ${data.taxId}`, size: 18, color: '475569' })] }),
                  ],
                }),
                new TableCell({
                  width: { size: 38, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                  children: [
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'TAX INVOICE', bold: true, size: 22, color: '0F172A' })], spacing: { after: 18 } }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Invoice No. ${data.invoiceNumber}`, size: 19, color: '0F172A' })], spacing: { after: 8 } }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Date: ${formatDate(data.invoiceDate)}`, size: 18, color: '475569' })], spacing: { after: 8 } }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Due: ${formatDate(data.dueDate)}`, size: 18, color: '475569' })], spacing: { after: 8 } }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.currency} | Tax ${data.taxRate.toFixed(1)}%`, size: 17, color: 'B45309' })] }),
                  ],
                }),
              ] }),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 80 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [bodyCell(`Bill To: ${data.clientName}`), bodyCell(`Currency: ${data.currency}`)] }),
              new TableRow({ children: [bodyCell(`Business Address: ${data.businessAddress}`), bodyCell(`Tax ID: ${data.taxId}`)] }),
              new TableRow({ children: [bodyCell(`Invoice No: ${data.invoiceNumber}`), bodyCell(`Due Date: ${formatDate(data.dueDate)}`)] }),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: lineItemRows }),
          new Paragraph({ text: '', spacing: { after: 60 } }),
          totalTable,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: 'Payment Terms: Due within 14 days. Thank you for your business.', size: 16, color: '475569' })], spacing: { after: 12 } }),
          new Paragraph({ children: [new TextRun({ text: 'Generated by PayGuard Tax & Invoice Helper', size: 16, color: '64748B' })] }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${getInvoiceFileBase(data)}.docx`);
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
  const data = getInvoiceData();

  previewBusiness.textContent = data.businessName;
  previewClient.textContent = data.clientName;
  previewNumber.textContent = data.invoiceNumber;
  previewDate.textContent = formatDate(data.invoiceDate);
  previewDueDate.textContent = formatDate(data.dueDate);
  previewCurrency.textContent = data.currency;
  previewTaxRate.textContent = `${data.taxRate.toFixed(1)}%`;
  previewAddress.textContent = data.businessAddress;
  previewTaxId.textContent = data.taxId;

  previewItems.innerHTML = data.items.map(item => `
    <div class="preview-item">
      <div>
        <strong>${item.description}</strong>
        <small>${item.qty} x ${money(item.rate, data.currency)}</small>
      </div>
      <strong>${money(item.qty * item.rate, data.currency)}</strong>
    </div>
  `).join('');

  subtotalValue.textContent = money(data.subtotal, data.currency);
  taxValue.textContent = money(data.tax, data.currency);
  totalValue.textContent = money(data.total, data.currency);

  itemsTableBody.querySelectorAll('tr').forEach((row, index) => {
    const item = data.items[index];
    row.querySelector('.item-amount').textContent = money(item.qty * item.rate, data.currency);
  });
}

function classifyExpenses() {
  const lines = expenseInput.value.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) {
    expenseResults.innerHTML = `
      <div class="expense-empty">
        <strong>How it works:</strong> paste one expense per line, then PayGuard scans each line for keywords and suggests a likely category.
        Try items like hotel, software subscription, ad spend, or bank fee.
      </div>
    `;
    return;
  }

  const matches = lines.map(line => {
    const normalized = line.toLowerCase();
    const match = expenseRules.find(rule => rule.keywords.some(keyword => normalized.includes(keyword)));
    const category = match ? match.category : 'General';
    const keyword = match ? match.keywords.find(item => normalized.includes(item)) : null;
    return { line, category, keyword };
  });

  const categoryCounts = matches.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});

  const summaryChips = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `<span class="summary-chip">${escapeHtml(category)}: ${count}</span>`)
    .join('');

  expenseResults.innerHTML = `
    <div class="expense-summary">
      <strong>${matches.length} items scanned</strong>
      <span>Keyword-based suggestions, not a tax filing rule engine.</span>
      ${summaryChips}
    </div>
    ${matches.map(item => `
      <div class="expense-result">
        <div class="expense-result-main">
          <span class="expense-result-label">${escapeHtml(item.line)}</span>
          <span class="expense-result-note">${item.keyword ? `Matched keyword: ${escapeHtml(item.keyword)}` : 'No keyword matched, so this was labeled General.'}</span>
        </div>
        <strong class="expense-result-badge">${escapeHtml(item.category)}</strong>
      </div>
    `).join('')}
  `;
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
  businessAddress.value = invoiceDefaults.businessAddress;
  taxId.value = invoiceDefaults.taxId;
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
downloadPdfBtn.addEventListener('click', () => {
  exportPdf().catch(error => alert(error.message));
});
downloadWordBtn.addEventListener('click', () => {
  exportWord().catch(error => alert(error.message));
});
resetInvoiceBtn.addEventListener('click', resetSample);
categorizeBtn.addEventListener('click', classifyExpenses);

[businessName, businessAddress, taxId, clientName, invoiceNumber, invoiceDate, currencySelect, taxRateInput, expenseInput].forEach(input => {
  input.addEventListener('input', () => {
    if (input === expenseInput) return;
    updateInvoice();
  });
});

invoiceDate.valueAsDate = new Date();
renderInitialItems(invoiceDefaults.items);
renderChecklist();
resetSample();
