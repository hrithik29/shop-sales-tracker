import { STAFF_NAMES } from '../config';
import { loadDay } from '../db';
import { fmt, todayKey, prettyDate } from '../utils';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export async function renderStaff(onBack: () => void) {
  const app = el('app');
  app.innerHTML = `
    <div class="header">
      <div>
        <div class="section-label" style="margin:0;">Today</div>
        <div style="font-size:14px;color:var(--text-muted);margin-top:2px;">${prettyDate(todayKey())}</div>
      </div>
    </div>
    <div class="view-header">
      <div class="view-title">Staff totals (today)</div>
      <button class="back-btn">← Back</button>
    </div>
    <div id="staff-list"></div>
  `;
  app.querySelector<HTMLButtonElement>('.back-btn')!.onclick = onBack;

  const sales = await loadDay(todayKey());
  const totals: Record<string, { total: number; count: number }> = {};
  STAFF_NAMES.forEach(s => (totals[s] = { total: 0, count: 0 }));
  sales.forEach(s => {
    if (!totals[s.staff]) totals[s.staff] = { total: 0, count: 0 };
    totals[s.staff].total += s.amount;
    totals[s.staff].count += 1;
  });

  const list = el('staff-list');
  Object.entries(totals)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([name, t]) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `
        <div>
          <div style="font-size:15px;font-weight:500;">${name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${t.count} sale${t.count === 1 ? '' : 's'}</div>
        </div>
        <div style="font-size:17px;font-weight:500;">${fmt(t.total)}</div>
      `;
      list.appendChild(row);
    });
}
