import { create } from 'zustand';

interface PendingOS {
  category: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface OSState {
  pendingNewOS: PendingOS | null;
  setPendingNewOS: (os: PendingOS | null) => void;
  updatePendingNewOS: (data: Partial<PendingOS>) => void;
}

export const useOSStore = create<OSState>((set) => ({
  pendingNewOS: null,
  
  setPendingNewOS: (os) => set({ pendingNewOS: os }),
  
  updatePendingNewOS: (data) => set((state) => ({
    pendingNewOS: state.pendingNewOS ? { ...state.pendingNewOS, ...data } : null
  })),
}));
