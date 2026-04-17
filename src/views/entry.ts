import { STAFF_NAMES, CATEGORIES } from '../config';
import { loadDay, saveDay } from '../db';
import { fmt, todayKey, prettyDate } from '../utils';
import type { Sale } from '../types';

let selectedStaff: string | null = null;
let selectedCategory: string | null = null;
let amountStr = '';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function renderStaffGrid() {
  const g = el('staff-grid');
  g.innerHTML = '';
  STAFF_NAMES.forEach(name => {
    const b = document.createElement('button');
    b.textContent = name;
    b.className = 'staff-btn' + (name === selectedStaff ? ' selected' : '');
    b.onclick = () => {
      selectedStaff = name;
      clearError();
      renderStaffGrid();
    };
    g.appendChild(b);
  });
}

function renderCategoryGrid() {
  const g = el('cat-grid');
  g.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat;
    b.className = 'cat-btn' + (cat === selectedCategory ? ' selected' : '');
    b.onclick = () => {
      selectedCategory = cat;
      clearError();
      renderCategoryGrid();
    };
    g.appendChild(b);
  });
}

function updateAmountDisplay() {
  el('amount-display').textContent = amountStr ? fmt(Number(amountStr)) : '₹0';
}

function showError(msg: string) {
  const e = el('entry-error');
  e.textContent = msg;
  e.classList.add('visible');
}

function clearError() {
  el('entry-error').classList.remove('visible');
}

async function handleSave() {
  if (!selectedStaff) { showError('Please tap a staff name first.'); return; }
  if (!amountStr || Number(amountStr) <= 0) { showError('Please enter an amount.'); return; }
  if (!selectedCategory) { showError('Please tap a category.'); return; }
  clearError();

  const key = todayKey();
  let sales: Sale[];
  try {
    sales = await loadDay(key);
  } catch {
    alert('Storage read failed. Could not save sale.');
    return;
  }

  const now = new Date();
  sales.push({
    id: Date.now(),
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    staff: selectedStaff,
    category: selectedCategory,
    amount: Number(amountStr),
  });

  try {
    await saveDay(key, sales);
  } catch {
    alert('Storage write failed. Sale not saved.');
    return;
  }

  const btn = el<HTMLButtonElement>('save-btn');
  btn.textContent = '✓ Saved';
  btn.classList.add('success');
  setTimeout(() => {
    btn.textContent = 'Save sale';
    btn.classList.remove('success');
  }, 900);

  amountStr = '';
  selectedCategory = null;
  updateAmountDisplay();
  renderCategoryGrid();
  refreshHeader();
}

export async function refreshHeader() {
  el('today-date').textContent = prettyDate(todayKey());
  const sales = await loadDay(todayKey());
  const total = sales.reduce((s, x) => s + x.amount, 0);
  el('today-total').textContent = fmt(total);
  renderLastSale(sales[sales.length - 1] ?? null);
}

function renderLastSale(sale: Sale | null) {
  const card = document.getElementById('last-sale-card');
  if (!card) return;
  if (!sale) { card.innerHTML = ''; return; }
  card.innerHTML = `
    <div class="last-sale-card">
      <span class="section-label" style="margin:0;margin-right:8px;">Last sale</span>
      <span style="font-weight:500;">${fmt(sale.amount)}</span>
      <span style="color:var(--text-muted);margin-left:6px;font-size:13px;">${sale.staff} · ${sale.category} · ${sale.time}</span>
    </div>
  `;
}

import type { View } from '../main';

export function renderEntry(onNavigate: (view: View) => void) {
  selectedStaff = null;
  selectedCategory = null;
  amountStr = '';

  const app = el('app');
  app.innerHTML = `
    <div class="header">
      <div>
        <div class="section-label" style="margin:0;">Today</div>
        <div id="today-date" style="font-size:14px;color:var(--text-muted);margin-top:2px;">—</div>
      </div>
      <div style="text-align:right;">
        <div class="section-label" style="margin:0;">Total</div>
        <div id="today-total" style="font-size:24px;font-weight:500;">₹0</div>
      </div>
    </div>

    <div class="section-label">Staff</div>
    <div id="staff-grid" class="grid-2"></div>

    <div class="section-label">Amount</div>
    <div id="amount-display" class="amount-display">₹0</div>
    <div id="keypad" class="grid-3" style="margin-bottom:16px;"></div>

    <div class="section-label">Category</div>
    <div id="cat-grid" class="grid-3"></div>

    <div id="entry-error" class="validation-error"></div>

    <button id="save-btn" class="save-btn">Save sale</button>

    <div id="last-sale-card"></div>

    <div class="nav-row">
      <button id="nav-today">Today</button>
      <button id="nav-staff">Staff</button>
      <button id="nav-history">History</button>
      <button id="nav-expenses">Expenses</button>
    </div>
  `;

  renderStaffGrid();
  renderCategoryGrid();

  // Keypad
  const keypad = el('keypad');
  ['1','2','3','4','5','6','7','8','9','C','0','⌫'].forEach(k => {
    const b = document.createElement('button');
    b.textContent = k;
    b.className = 'key-btn';
    b.onclick = () => {
      if (k === 'C') amountStr = '';
      else if (k === '⌫') amountStr = amountStr.slice(0, -1);
      else if (amountStr.length < 8) amountStr += k;
      clearError();
      updateAmountDisplay();
    };
    keypad.appendChild(b);
  });

  el('save-btn').onclick = handleSave;
  el('nav-today').onclick = () => onNavigate('today');
  el('nav-staff').onclick = () => onNavigate('staff');
  el('nav-history').onclick = () => onNavigate('history');
  el('nav-expenses').onclick = () => onNavigate('expenses');

  refreshHeader();
}
