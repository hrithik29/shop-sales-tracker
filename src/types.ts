export interface Sale {
  id: number;
  time: string;
  staff: string;
  category: string;
  amount: number;
}

export interface Expense {
  id: number;
  time: string;
  description: string;
  amount: number;
}
