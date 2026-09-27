import { create } from 'zustand';

interface AppState {
  activeMonth: { year: number; month: number };
  setActiveMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  activeBudgetRuleId: number | null;
  setActiveBudgetRuleId: (id: number | null) => void;
}

const now = new Date();

export const useAppStore = create<AppState>((set, get) => ({
  activeMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
  setActiveMonth: (year, month) => set({ activeMonth: { year, month } }),
  goToPreviousMonth: () => {
    const { year, month } = get().activeMonth;
    set({ activeMonth: month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 } });
  },
  goToNextMonth: () => {
    const { year, month } = get().activeMonth;
    set({ activeMonth: month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 } });
  },
  activeBudgetRuleId: null,
  setActiveBudgetRuleId: (id) => set({ activeBudgetRuleId: id }),
}));
