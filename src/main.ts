// @ts-ignore
import './style.css';
import { renderEntry } from './views/entry';
import { renderToday } from './views/today';
import { renderStaff } from './views/staff';
import { renderHistory } from './views/history';
import { renderExpenses } from './views/expenses';

export type View = 'entry' | 'today' | 'staff' | 'history' | 'expenses';

function navigate(view: View) {
  switch (view) {
    case 'entry':
      renderEntry(navigate);
      break;
    case 'today':
      renderToday(() => navigate('entry'));
      break;
    case 'staff':
      renderStaff(() => navigate('entry'));
      break;
    case 'history':
      renderHistory(() => navigate('entry'));
      break;
    case 'expenses':
      renderExpenses(() => navigate('entry'));
      break;
  }
}

navigate('entry');
