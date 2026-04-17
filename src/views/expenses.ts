import { loadExpenses, saveExpenses } from '../db';
import { fmt, todayKey, prettyDate } from '../utils';
import type { Expense } from '../types';

let amountStr = '';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function updateAmountDisplay() {
  el('exp-amount-display').textContent = amountStr ? fmt(Number(amountStr)) : '₹0';
}

function showError(msg: string) {
  const e = el('exp-error');
  e.textContent = msg;
  e.classList.add('visible');
}

function clearError() {
  el('exp-error').classList.remove('visible');
}

async function refreshExpenseHeader() {
  const expenses = await loadExpenses(todayKey());
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  el('exp-today-total').textContent = fmt(total);
}

function buildEditForm(exp: Expense, onDone: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'edit-form';
  wrap.innerHTML = `
    <input class="edit-input" id="ef-desc" type="text" value="${exp.description}" placeholder="Description" />
    <input class="edit-input" id="ef-amount" type="number" value="${exp.amount}" min="1" placeholder="Amount" />
    <div style="display:flex;gap:8px;">
      <button class="ef-cancel" style="flex:1;">Cancel</button>
      <button class="ef-save" style="flex:2;background:var(--accent);color:var(--surface);border-color:var(--accent);">Save changes</button>
    </div>
  `;

  wrap.querySelector<HTMLButtonElement>('.ef-cancel')!.onclick = onDone;
  wrap.querySelector<HTMLButtonElement>('.ef-save')!.onclick = async () => {
    const desc = (wrap.querySelector('#ef-desc') as HTMLInputElement).value.trim();
    const amount = Number((wrap.querySelector('#ef-amount') as HTMLInputElement).value);
    if (!desc) { alert('Please enter a description.'); return; }
    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
    const cur = await loadExpenses(todayKey());
    await saveExpenses(todayKey(), cur.map(x => x.id === exp.id ? { ...x, description: desc, amount: Math.round(amount) } : x));
    onDone();
    refreshExpenseHeader();
  };

  return wrap;
}

async function renderExpenseList() {
  const expenses = await loadExpenses(todayKey());
  const list = el('exp-list');
  if (!expenses.length) {
    list.innerHTML = '<div class="row" style="color:var(--text-muted);">No expenses logged today.</div>';
    return;
  }
  list.innerHTML = '';
  [...expenses].reverse().forEach(exp => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>
        <div style="font-size:16px;font-weight:500;">${fmt(exp.amount)}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:3px;">${exp.description} · ${exp.time}</div>
      </div>
      <div class="row-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    row.querySelector<HTMLButtonElement>('.edit-btn')!.onclick = () => {
      row.innerHTML = '';
      row.classList.add('editing');
      row.appendChild(buildEditForm(exp, () => { row.classList.remove('editing'); renderExpenseList(); }));
    };
    row.querySelector<HTMLButtonElement>('.delete-btn')!.onclick = async () => {
      if (!confirm('Delete this expense?')) return;
      const cur = await loadExpenses(todayKey());
      await saveExpenses(todayKey(), cur.filter(x => x.id !== exp.id));
      renderExpenseList();
      refreshExpenseHeader();
    };
    list.appendChild(row);
  });
}

async function handleSave() {
  const desc = (el<HTMLInputElement>('exp-desc')).value.trim();
  if (!desc) { showError('Please enter a description.'); return; }
  if (!amountStr || Number(amountStr) <= 0) { showError('Please enter an amount.'); return; }
  clearError();

  const key = todayKey();
  let expenses: Expense[];
  try {
    expenses = await loadExpenses(key);
  } catch {
    alert('Storage read failed. Could not save expense.');
    return;
  }

  const now = new Date();
  expenses.push({
    id: Date.now(),
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    description: desc,
    amount: Number(amountStr),
  });

  try {
    await saveExpenses(key, expenses);
  } catch {
    alert('Storage write failed. Expense not saved.');
    return;
  }

  const btn = el<HTMLButtonElement>('exp-save-btn');
  btn.textContent = '✓ Saved';
  btn.classList.add('success');
  setTimeout(() => {
    btn.textContent = 'Save expense';
    btn.classList.remove('success');
  }, 900);

  amountStr = '';
  (el<HTMLInputElement>('exp-desc')).value = '';
  updateAmountDisplay();
  refreshExpenseHeader();
  renderExpenseList();
}

export function renderExpenses(onBack: () => void) {
  amountStr = '';

  const app = el('app');
  app.innerHTML = `
    <div class="header">
      <div>
        <div class="section-label" style="margin:0;">Today</div>
        <div style="font-size:14px;color:var(--text-muted);margin-top:2px;">${prettyDate(todayKey())}</div>
      </div>
      <div style="text-align:right;">
        <div class="section-label" style="margin:0;">Expenses</div>
        <div id="exp-today-total" style="font-size:24px;font-weight:500;">₹0</div>
      </div>
    </div>

    <div class="view-header">
      <div class="view-title">Expenses</div>
      <button class="back-btn">← Back</button>
    </div>

    <div class="section-label">Description</div>
    <input
      id="exp-desc"
      type="text"
      placeholder="e.g. Electricity bill, Rent…"
      class="edit-input"
      style="margin-bottom:16px;"
    />

    <div class="section-label">Amount</div>
    <div id="exp-amount-display" class="amount-display">₹0</div>
    <div id="exp-keypad" class="grid-3" style="margin-bottom:16px;"></div>

    <div id="exp-error" class="validation-error"></div>

    <button id="exp-save-btn" class="save-btn">Save expense</button>

    <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
      <div class="section-label">Today's expenses</div>
      <div id="exp-list"></div>
    </div>
  `;

  app.querySelector<HTMLButtonElement>('.back-btn')!.onclick = onBack;

  const keypad = el('exp-keypad');
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

  el('exp-save-btn').onclick = handleSave;

  refreshExpenseHeader();
  renderExpenseList();
}
