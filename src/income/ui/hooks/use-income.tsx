import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface Income {
  id: string;
  name: string;
  value: string;
  isDeductible: boolean;
  description?: string;
}

interface IncomeState {
  incomes: Map<string, Income>;
  addIncome: (income: Omit<Income, 'id'>) => void;
  removeIncome: (id: string) => void;
  updateIncome: (id: string, income: Income) => void;
}

const initState = {
  incomes: new Map<string, Income>(),
};

export const useIncome = create<IncomeState>((set, get) => ({
  ...initState,
  addIncome: income =>{
    const uuid = uuidv4();

    const clonedIncome = new Map(get().incomes);

    clonedIncome.set(uuid, { ...income, id: uuid });

    return set({ incomes: clonedIncome })
  },
  removeIncome: id =>
    set(state => {
      const clonedIncome = new Map(state.incomes);

      clonedIncome.delete(id);
      return { incomes: clonedIncome };
    }),
  updateIncome: (id, income) => {
    return set(state => ({ incomes: state.incomes.set(id, income) }));
  },
}));
