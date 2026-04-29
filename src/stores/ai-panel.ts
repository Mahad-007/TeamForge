import { create } from "zustand";

interface AIPanelState {
  isOpen: boolean;
  contextType: "global" | "project" | "task" | null;
  contextId: string | null;
  contextName: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setContext: (type: "global" | "project" | "task", id?: string, name?: string) => void;
  clearContext: () => void;
}

export const useAIPanelStore = create<AIPanelState>((set) => ({
  isOpen: false,
  contextType: null,
  contextId: null,
  contextName: null,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setContext: (type, id, name) =>
    set({ contextType: type, contextId: id ?? null, contextName: name ?? null }),
  clearContext: () =>
    set({ contextType: null, contextId: null, contextName: null }),
}));
