import { loadAllSales, listDays, loadDay } from '../db';
import { fmt, prettyDate } from '../utils';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

async function exportCSV() {
  const all = await loadAllSales();
  const rows: string[] = ['date,time,staff,category,amount'];
  all.forEach(({ dateKey, sales }) => {
    sales.forEach(s => {
      rows.push(`${dateKey},${s.time},"${s.staff}","${s.category}",${s.amount}`);
    });
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function renderHistory(onBack: () => void) {
  const app = el('app');
  app.innerHTML = `
    <div class="view-header">
      <div class="view-title">History</div>
      <button class="back-btn">← Back</button>
    </div>
    <div id="history-list"></div>
    <button id="export-btn" class="export-btn">Export CSV</button>
  `;
  app.querySelector<HTMLButtonElement>('.back-btn')!.onclick = onBack;
  el('export-btn').onclick = exportCSV;

  const days = await listDays();
  const list = el('history-list');
  if (!days.length) {
    list.innerHTML = '<div class="row" style="color:var(--text-muted);">No history yet.</div>';
    return;
  }

  const recentDays = days.slice(0, 30);
  const dayData = await Promise.all(recentDays.map(d => loadDay(d)));

  recentDays.forEach((d, i) => {
    const sales = dayData[i];
    const total = sales.reduce((s, x) => s + x.amount, 0);
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>
        <div style="font-size:14px;font-weight:500;">${prettyDate(d)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${sales.length} sale${sales.length === 1 ? '' : 's'}</div>
      </div>
      <div style="font-size:16px;font-weight:500;">${fmt(total)}</div>
    `;
    list.appendChild(row);
  });
}
