import { create } from "zustand";

interface ChatState {
  openThreadId: string | null;
  showInfoSidebar: boolean;
  setOpenThread: (id: string | null) => void;
  setShowInfoSidebar: (show: boolean) => void;
  closeAll: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  openThreadId: null,
  showInfoSidebar: false,
  setOpenThread: (id) => set({ openThreadId: id, showInfoSidebar: false }),
  setShowInfoSidebar: (show) => set({ showInfoSidebar: show, openThreadId: null }),
  closeAll: () => set({ openThreadId: null, showInfoSidebar: false }),
}));
