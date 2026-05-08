import { create } from "zustand";

interface ChatStore {
  isOpen: boolean;
  selectedUserId: string | null;
  selectedUserName: string | null;
  initialMessage: string | null;
  openChat: (userId: string, userName: string, initialMessage?: string) => void;
  closeChat: () => void;
  clearInitialMessage: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  selectedUserId: null,
  selectedUserName: null,
  initialMessage: null,
  
  openChat: (userId, userName, initialMessage) => 
    set({ 
      isOpen: true, 
      selectedUserId: userId, 
      selectedUserName: userName,
      initialMessage: initialMessage || null 
    }),
    
  closeChat: () => 
    set({ 
      isOpen: false, 
      selectedUserId: null, 
      selectedUserName: null,
      initialMessage: null
    }),
    
  clearInitialMessage: () => set({ initialMessage: null }),
  
  setIsOpen: (isOpen: boolean) => set({ isOpen })
}));
