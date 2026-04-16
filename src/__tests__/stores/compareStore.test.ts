import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCompareStore,
  selectBasket,
  selectBasketCount,
  selectIsInBasket,
} from '@/stores/compareStore';

beforeEach(() => {
  useCompareStore.setState({ basket: [], isCompareDrawerOpen: false });
});

describe('compareStore — addToBasket', () => {
  it('adds a provider id to the basket', () => {
    useCompareStore.getState().addToBasket('prov_wise');
    expect(selectBasket(useCompareStore.getState())).toContain('prov_wise');
  });

  it('does not add the same id twice', () => {
    useCompareStore.getState().addToBasket('prov_wise');
    useCompareStore.getState().addToBasket('prov_wise');
    expect(selectBasketCount(useCompareStore.getState())).toBe(1);
  });

  it('allows up to 3 items', () => {
    useCompareStore.getState().addToBasket('p1');
    useCompareStore.getState().addToBasket('p2');
    useCompareStore.getState().addToBasket('p3');
    expect(selectBasketCount(useCompareStore.getState())).toBe(3);
  });

  it('rejects a 4th item (max 3)', () => {
    useCompareStore.getState().addToBasket('p1');
    useCompareStore.getState().addToBasket('p2');
    useCompareStore.getState().addToBasket('p3');
    useCompareStore.getState().addToBasket('p4');

    expect(selectBasketCount(useCompareStore.getState())).toBe(3);
    expect(selectBasket(useCompareStore.getState())).not.toContain('p4');
  });
});

describe('compareStore — removeFromBasket', () => {
  it('removes a provider by id', () => {
    useCompareStore.getState().addToBasket('p1');
    useCompareStore.getState().addToBasket('p2');
    useCompareStore.getState().removeFromBasket('p1');

    const basket = selectBasket(useCompareStore.getState());
    expect(basket).not.toContain('p1');
    expect(basket).toContain('p2');
  });

  it('is a no-op when id is not in basket', () => {
    useCompareStore.getState().addToBasket('p1');
    useCompareStore.getState().removeFromBasket('nonexistent');
    expect(selectBasketCount(useCompareStore.getState())).toBe(1);
  });
});

describe('compareStore — selectIsInBasket', () => {
  it('returns true for an id that is in the basket', () => {
    useCompareStore.getState().addToBasket('prov_wise');
    const isIn = selectIsInBasket('prov_wise')(useCompareStore.getState());
    expect(isIn).toBe(true);
  });

  it('returns false for an id not in the basket', () => {
    const isIn = selectIsInBasket('prov_none')(useCompareStore.getState());
    expect(isIn).toBe(false);
  });

  it('returns false after removing the item', () => {
    useCompareStore.getState().addToBasket('prov_wise');
    useCompareStore.getState().removeFromBasket('prov_wise');
    expect(selectIsInBasket('prov_wise')(useCompareStore.getState())).toBe(false);
  });
});

describe('compareStore — clearBasket', () => {
  it('empties the basket', () => {
    useCompareStore.getState().addToBasket('p1');
    useCompareStore.getState().addToBasket('p2');
    useCompareStore.getState().clearBasket();
    expect(selectBasketCount(useCompareStore.getState())).toBe(0);
  });
});

describe('compareStore — drawer', () => {
  it('toggleDrawer flips the open state', () => {
    expect(useCompareStore.getState().isCompareDrawerOpen).toBe(false);
    useCompareStore.getState().toggleDrawer();
    expect(useCompareStore.getState().isCompareDrawerOpen).toBe(true);
    useCompareStore.getState().toggleDrawer();
    expect(useCompareStore.getState().isCompareDrawerOpen).toBe(false);
  });

  it('openDrawer sets open to true', () => {
    useCompareStore.getState().openDrawer();
    expect(useCompareStore.getState().isCompareDrawerOpen).toBe(true);
  });

  it('closeDrawer sets open to false', () => {
    useCompareStore.getState().openDrawer();
    useCompareStore.getState().closeDrawer();
    expect(useCompareStore.getState().isCompareDrawerOpen).toBe(false);
  });
});
