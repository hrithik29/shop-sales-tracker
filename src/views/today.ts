import { loadDay, saveDay } from '../db';
import { fmt, todayKey, prettyDate } from '../utils';
import { STAFF_NAMES, CATEGORIES } from '../config';
import type { Sale } from '../types';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function buildEditForm(sale: Sale, onDone: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'edit-form';
  wrap.innerHTML = `
    <input class="edit-input" id="ef-amount" type="number" value="${sale.amount}" min="1" placeholder="Amount" />
    <select class="edit-select" id="ef-staff">
      ${STAFF_NAMES.map(s => `<option value="${s}"${s === sale.staff ? ' selected' : ''}>${s}</option>`).join('')}
    </select>
    <select class="edit-select" id="ef-cat">
      ${CATEGORIES.map(c => `<option value="${c}"${c === sale.category ? ' selected' : ''}>${c}</option>`).join('')}
    </select>
    <div style="display:flex;gap:8px;">
      <button class="ef-cancel" style="flex:1;">Cancel</button>
      <button class="ef-save" style="flex:2;background:var(--accent);color:var(--surface);border-color:var(--accent);">Save changes</button>
    </div>
  `;

  wrap.querySelector<HTMLButtonElement>('.ef-cancel')!.onclick = onDone;
  wrap.querySelector<HTMLButtonElement>('.ef-save')!.onclick = async () => {
    const amount = Number((wrap.querySelector('#ef-amount') as HTMLInputElement).value);
    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
    const staff = (wrap.querySelector('#ef-staff') as HTMLSelectElement).value;
    const category = (wrap.querySelector('#ef-cat') as HTMLSelectElement).value;
    const cur = await loadDay(todayKey());
    await saveDay(todayKey(), cur.map(x => x.id === sale.id ? { ...x, amount: Math.round(amount), staff, category } : x));
    onDone();
  };

  return wrap;
}

async function renderList() {
  const sales = await loadDay(todayKey());
  const list = el('day-list');
  if (!sales.length) {
    list.innerHTML = '<div class="row" style="color:var(--text-muted);">No sales logged yet today.</div>';
    return;
  }
  list.innerHTML = '';
  [...sales].reverse().forEach(s => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>
        <div style="font-size:16px;font-weight:500;">${fmt(s.amount)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${s.staff} · ${s.category} · ${s.time}</div>
      </div>
      <div class="row-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    row.querySelector<HTMLButtonElement>('.edit-btn')!.onclick = () => {
      row.innerHTML = '';
      row.classList.add('editing');
      row.appendChild(buildEditForm(s, () => { row.classList.remove('editing'); renderList(); }));
    };
    row.querySelector<HTMLButtonElement>('.delete-btn')!.onclick = async () => {
      if (!confirm('Delete this sale?')) return;
      const cur = await loadDay(todayKey());
      await saveDay(todayKey(), cur.filter(x => x.id !== s.id));
      renderList();
    };
    list.appendChild(row);
  });
}

export async function renderToday(onBack: () => void) {
  const app = el('app');
  app.innerHTML = `
    <div class="header">
      <div>
        <div class="section-label" style="margin:0;">Today</div>
        <div style="font-size:14px;color:var(--text-muted);margin-top:2px;">${prettyDate(todayKey())}</div>
      </div>
    </div>
    <div class="view-header">
      <div class="view-title">Today's sales</div>
      <button class="back-btn">← Back</button>
    </div>
    <div id="day-list"></div>
  `;
  app.querySelector<HTMLButtonElement>('.back-btn')!.onclick = onBack;
  await renderList();
}
