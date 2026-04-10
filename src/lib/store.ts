import { create } from "zustand"

interface AppStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  currentView: string
  setCurrentView: (view: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),
}))
