import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const BASKET_MAX = 3;

export interface CompareState {
  basket: string[];
  isCompareDrawerOpen: boolean;
}

export interface CompareActions {
  addToBasket: (id: string) => void;
  removeFromBasket: (id: string) => void;
  clearBasket: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

type CompareStore = CompareState & CompareActions;

const initialState: CompareState = {
  basket: [],
  isCompareDrawerOpen: false,
};

export const useCompareStore = create<CompareStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      addToBasket: (id) => {
        const { basket } = get();
        if (basket.includes(id)) return;
        if (basket.length >= BASKET_MAX) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[compareStore] Basket full — max ${BASKET_MAX} providers.`);
          }
          return;
        }
        set(
          { basket: [...basket, id] },
          false,
          'compare/addToBasket',
        );
      },

      removeFromBasket: (id) =>
        set(
          (state) => ({ basket: state.basket.filter((bid) => bid !== id) }),
          false,
          'compare/removeFromBasket',
        ),

      clearBasket: () =>
        set({ basket: [] }, false, 'compare/clearBasket'),

      toggleDrawer: () =>
        set(
          (state) => ({ isCompareDrawerOpen: !state.isCompareDrawerOpen }),
          false,
          'compare/toggleDrawer',
        ),

      openDrawer: () =>
        set({ isCompareDrawerOpen: true }, false, 'compare/openDrawer'),

      closeDrawer: () =>
        set({ isCompareDrawerOpen: false }, false, 'compare/closeDrawer'),
    }),
    { name: 'CompareStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectBasket = (state: CompareStore) => state.basket;
export const selectBasketCount = (state: CompareStore) => state.basket.length;
export const selectIsInBasket = (id: string) => (state: CompareStore) =>
  state.basket.includes(id);
export const selectIsDrawerOpen = (state: CompareStore) => state.isCompareDrawerOpen;
