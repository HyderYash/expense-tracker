import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Entry {
  id: string;
  name: string;
  quantity: number;
  invested: number;
}

export interface Category {
  name: string;
  expectedPercent: number;
  currentValue: number;
  entries: Entry[];
}

interface InvestmentStore {
  categories: Category[];
  _hasHydrated: boolean;
  
  // Actions
  updateCategory: (categoryName: string, updates: Partial<Category>) => void;
  addEntry: (categoryName: string, entry: Entry) => void;
  updateEntry: (categoryName: string, entryId: string, updates: Partial<Entry>) => void;
  deleteEntry: (categoryName: string, entryId: string) => void;
  resetStore: () => void;
  setHasHydrated: (state: boolean) => void;
  
  // Computed values
  getCategoryValue: (categoryName: string) => number;
  getTotalInvestment: () => number;
  getAvgExpectedPercent: () => number;
  getTotalExpected: () => number;
  getTotalProfitLoss: () => number;
  getTotalCurrent: () => number;
}

const initialCategories: Category[] = [
  {
    name: "Stocks",
    expectedPercent: 15,
    currentValue: 45000,
    entries: [
      { id: "1", name: "Adani Power", quantity: 150, invested: 16000 },
      { id: "2", name: "Tata Steel", quantity: 150, invested: 15000 },
    ],
  },
  {
    name: "Mutual Fund",
    expectedPercent: 30,
    currentValue: 28000,
    entries: [
      { id: "3", name: "SBI Bluechip", quantity: 100, invested: 12000 },
      { id: "4", name: "HDFC Equity", quantity: 80, invested: 10000 },
    ],
  },
  {
    name: "Recurring",
    expectedPercent: 40,
    currentValue: 17000,
    entries: [
      { id: "5", name: "RD Account 1", quantity: 1, invested: 10000 },
      { id: "6", name: "RD Account 2", quantity: 1, invested: 7000 },
    ],
  },
  {
    name: "Gold",
    expectedPercent: 20,
    currentValue: 55000,
    entries: [
      { id: "7", name: "Gold ETF", quantity: 50, invested: 30000 },
      { id: "8", name: "Physical Gold", quantity: 100, invested: 20000 },
    ],
  },
];

export const useInvestmentStore = create<InvestmentStore>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      _hasHydrated: false,

      updateCategory: (categoryName, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.name === categoryName ? { ...cat, ...updates } : cat
          ),
        })),

      addEntry: (categoryName, entry) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.name === categoryName
              ? { ...cat, entries: [...cat.entries, entry] }
              : cat
          ),
        })),

      updateEntry: (categoryName, entryId, updates) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.name === categoryName
              ? {
                  ...cat,
                  entries: cat.entries.map((entry) =>
                    entry.id === entryId ? { ...entry, ...updates } : entry
                  ),
                }
              : cat
          ),
        })),

      deleteEntry: (categoryName, entryId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.name === categoryName
              ? {
                  ...cat,
                  entries: cat.entries.filter((entry) => entry.id !== entryId),
                }
              : cat
          ),
        })),

      resetStore: () => set({ categories: initialCategories }),

      setHasHydrated: (state: boolean) => {
        set({
          _hasHydrated: state,
        });
      },

      // Computed values
      getCategoryValue: (categoryName) => {
        const category = get().categories.find((cat) => cat.name === categoryName);
        if (!category) return 0;
        return category.entries.reduce((sum, entry) => sum + entry.invested, 0);
      },

      getTotalInvestment: () => {
        return get().categories.reduce(
          (sum, cat) => sum + cat.entries.reduce((s, e) => s + e.invested, 0),
          0
        );
      },

      getAvgExpectedPercent: () => {
        const categories = get().categories;
        if (categories.length === 0) return 0;
        const sum = categories.reduce((s, cat) => s + cat.expectedPercent, 0);
        return sum / categories.length;
      },

      getTotalExpected: () => {
        return get().categories.reduce((sum, cat) => {
          const valueFromC20 = cat.entries.reduce((s, e) => s + e.invested, 0);
          const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
          return sum + expectedAmt;
        }, 0);
      },

      getTotalProfitLoss: () => {
        return get().categories.reduce((sum, cat) => {
          const valueFromC20 = cat.entries.reduce((s, e) => s + e.invested, 0);
          const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
          return sum + (cat.currentValue - expectedAmt);
        }, 0);
      },

      getTotalCurrent: () => {
        return get().categories.reduce((sum, cat) => sum + cat.currentValue, 0);
      },
    }),
    {
      name: "investment-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

