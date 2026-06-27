import { create } from 'zustand';

interface HrmsState {
  sidebarOpen: boolean;
  loading: boolean;
  setSidebarOpen: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export const useHrmsStore = create<HrmsState>((set) => ({
  sidebarOpen: true,
  loading: false,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  setLoading: (value) => set({ loading: value })
}));
