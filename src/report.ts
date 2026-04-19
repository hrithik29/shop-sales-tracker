import emailjs from '@emailjs/browser';
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, REPORT_TO_EMAIL, SHOP_NAME, STAFF_NAMES } from './config';
import { loadDay, loadExpenses } from './db';
import { fmt, prettyDate } from './utils';

function buildReport(dateKey: string, sales: Awaited<ReturnType<typeof loadDay>>, expenses: Awaited<ReturnType<typeof loadExpenses>>): string {
  const totalSales = sales.reduce((s, x) => s + x.amount, 0);
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
  const net = totalSales - totalExpenses;

  // Per-staff breakdown
  const staffTotals: Record<string, { total: number; count: number }> = {};
  STAFF_NAMES.forEach(n => (staffTotals[n] = { total: 0, count: 0 }));
  sales.forEach(s => {
    if (!staffTotals[s.staff]) staffTotals[s.staff] = { total: 0, count: 0 };
    staffTotals[s.staff].total += s.amount;
    staffTotals[s.staff].count += 1;
  });

  const staffLines = Object.entries(staffTotals)
    .filter(([, t]) => t.count > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, t]) => `  ${name}: ${fmt(t.total)} (${t.count} sale${t.count === 1 ? '' : 's'})`)
    .join('\n');

  const expenseLines = expenses.length
    ? expenses.map(e => `  ${e.time}  ${e.description}: ${fmt(e.amount)}`).join('\n')
    : '  None';

  return `${SHOP_NAME} — Daily Sales Report
${prettyDate(dateKey)}
${'─'.repeat(36)}

SALES SUMMARY
Total sales : ${fmt(totalSales)}
Total items : ${sales.length}

STAFF BREAKDOWN
${staffLines || '  No sales recorded'}

EXPENSES
${expenseLines}
Total expenses : ${fmt(totalExpenses)}

${'─'.repeat(36)}
NET (Sales − Expenses) : ${fmt(net)}
`;
}

export async function sendDailyReport(dateKey: string): Promise<void> {
  const [sales, expenses] = await Promise.all([loadDay(dateKey), loadExpenses(dateKey)]);
  const report = buildReport(dateKey, sales, expenses);

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    date: prettyDate(dateKey),
    report,
    to_email: REPORT_TO_EMAIL,
  });
}
