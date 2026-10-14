import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'vcl-carcare-theme';
const listeners = new Set<() => void>();

function read(): Theme {
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
}

let theme: Theme = read();

function apply() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c0d12' : '#f2f3f6');
}

apply();

export function setTheme(next: Theme) {
  theme = next;
  localStorage.setItem(KEY, next);
  apply();
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(theme === 'dark' ? 'light' : 'dark');
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme() {
  return useSyncExternalStore(subscribe, () => theme, () => theme);
}
