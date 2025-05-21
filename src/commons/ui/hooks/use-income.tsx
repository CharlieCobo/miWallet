import { create } from 'zustand';

interface Income {
  name: string;
  value: string;
  description?: string;
}

interface IncomeState {
  incomes: Income[];
  addIncome: (income: Income) => void;
  removeIncome: (index: number) => void;
  updateIncome: (index: number, income: Income) => void;
}

export const useIncome = create<IncomeState>(set => ({
  incomes: [],
  addIncome: (income: Income) => set(state => ({ incomes: [...state.incomes, income] })),
  removeIncome: (index: number) => set(state => ({ incomes: state.incomes.filter((_, i) => i !== index) })),
  updateIncome: (index: number, income: Income) =>
    set(state => ({
      incomes: state.incomes.map((item, i) => (i === index ? income : item)),
    })),
}));
