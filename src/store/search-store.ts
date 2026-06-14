'use client';

import { create } from "zustand";

type SearchStore = {
  recentQueries: string[];
  rememberQuery: (query: string) => void;
};

export const useSearchStore = create<SearchStore>((set) => ({
  recentQueries: [],
  rememberQuery: (query) =>
    set((state) => {
      const clean = query.trim();

      if (!clean) {
        return state;
      }

      const nextQueries = [clean, ...state.recentQueries.filter((item) => item !== clean)];

      return { recentQueries: nextQueries.slice(0, 5) };
    }),
}));
