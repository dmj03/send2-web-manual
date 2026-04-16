import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore, selectToasts, selectActiveModal } from '@/stores/uiStore';

beforeEach(() => {
  useUiStore.setState({
    isSidebarOpen: true,
    isMobileSidebarOpen: false,
    theme: 'system',
    toasts: [],
    activeModal: null,
    globalLoading: false,
    cmsLoading: false,
    locale: 'en',
    scrollY: 0,
    showBackButton: false,
    featureFlags: {},
    appSettings: {},
  });
});

describe('uiStore — toggleSidebar', () => {
  it('toggles sidebar from true to false (initial state is true)', () => {
    expect(useUiStore.getState().isSidebarOpen).toBe(true);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().isSidebarOpen).toBe(false);
  });

  it('toggles sidebar from false back to true', () => {
    useUiStore.getState().closeSidebar();
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().isSidebarOpen).toBe(true);
  });

  it('open/closeSidebar set the value directly', () => {
    useUiStore.getState().closeSidebar();
    expect(useUiStore.getState().isSidebarOpen).toBe(false);
    useUiStore.getState().openSidebar();
    expect(useUiStore.getState().isSidebarOpen).toBe(true);
  });
});

describe('uiStore — pushToast', () => {
  it('adds a toast to the list', () => {
    useUiStore.getState().pushToast({ message: 'Saved!', type: 'success' });
    expect(selectToasts(useUiStore.getState())).toHaveLength(1);
    expect(selectToasts(useUiStore.getState())[0].message).toBe('Saved!');
  });

  it('assigns a unique id to each toast', () => {
    useUiStore.getState().pushToast({ message: 'First', type: 'info' });
    useUiStore.getState().pushToast({ message: 'Second', type: 'error' });
    const toasts = selectToasts(useUiStore.getState());
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('each toast id is a non-empty string', () => {
    useUiStore.getState().pushToast({ message: 'Hello', type: 'warning' });
    const [toast] = selectToasts(useUiStore.getState());
    expect(typeof toast.id).toBe('string');
    expect(toast.id.length).toBeGreaterThan(0);
  });

  it('accumulates multiple toasts', () => {
    useUiStore.getState().pushToast({ message: 'A', type: 'success' });
    useUiStore.getState().pushToast({ message: 'B', type: 'error' });
    useUiStore.getState().pushToast({ message: 'C', type: 'info' });
    expect(selectToasts(useUiStore.getState())).toHaveLength(3);
  });
});

describe('uiStore — dismissToast', () => {
  it('removes the toast with the matching id', () => {
    useUiStore.getState().pushToast({ message: 'Hello', type: 'success' });
    useUiStore.getState().pushToast({ message: 'World', type: 'error' });

    const toasts = selectToasts(useUiStore.getState());
    const firstId = toasts[0].id;
    useUiStore.getState().dismissToast(firstId);

    const remaining = selectToasts(useUiStore.getState());
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('World');
  });

  it('is a no-op if the id does not match any toast', () => {
    useUiStore.getState().pushToast({ message: 'Hello', type: 'info' });
    useUiStore.getState().dismissToast('nonexistent-id');
    expect(selectToasts(useUiStore.getState())).toHaveLength(1);
  });
});

describe('uiStore — modal', () => {
  it('openModal sets activeModal to the given name', () => {
    useUiStore.getState().openModal('confirm-delete');
    expect(selectActiveModal(useUiStore.getState())).toBe('confirm-delete');
  });

  it('closeModal resets activeModal to null', () => {
    useUiStore.getState().openModal('some-modal');
    useUiStore.getState().closeModal();
    expect(selectActiveModal(useUiStore.getState())).toBeNull();
  });
});
