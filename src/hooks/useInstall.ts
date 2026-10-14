import { useSyncExternalStore } from 'react';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export type InstallState = 'installed' | 'ready' | 'ios' | 'unavailable';

const listeners = new Set<() => void>();
let deferred: InstallPrompt | null = null;
let installed =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  // Chrome / Edge fire this once the app can be installed; keep it for the button
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  }
}

function state(): InstallState {
  if (installed) return 'installed';
  if (deferred) return 'ready';
  // Safari has no install prompt: the user adds it from the Share menu
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'unavailable';
}

export async function installApp() {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  emit();
  return choice.outcome === 'accepted';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInstall() {
  return useSyncExternalStore(subscribe, state, state);
}
