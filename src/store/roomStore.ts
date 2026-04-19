import { create } from "zustand";

interface Category {
  _id: string;
  name: string;
  icon?: string;
}

interface Room {
  _id: string;
  title: string;
  price: number;
  superficies: number;
  address: string;
  city: string;
  district: string;
  category: string | { _id: string; name?: string };
  images?: string[];
  isSaved?: boolean;
  isVip?: boolean;
  priority?: string | number;
  description: string;
}

interface RoomStore {
  categories: Category[];
  roomsByCategory: { [key: string]: Room[] };
  recommendedRooms: Room[];
  hasFetched: boolean;
  setData: (data: Partial<RoomStore>) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  categories: [],
  roomsByCategory: {},
  recommendedRooms: [],
  hasFetched: false,
  setData: (data) => set((state) => ({ ...state, ...data })),
}));