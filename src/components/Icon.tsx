import type { ReactNode } from 'react';

const icons = {
  back: <path d="M15 5 8 12l7 7" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="10" width="12" height="9" rx="2" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 5 20 19" />
      <path d="M9.5 6.4A9 9 0 0 1 12 6.2C18 6.2 21.5 12 21.5 12a16 16 0 0 1-3.1 3.6" />
      <path d="M6.1 8.2C3.8 9.8 2.5 12 2.5 12S6 17.8 12 17.8c1.1 0 2.1-.2 3-.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 16V10a5.5 5.5 0 0 1 11 0v6l1.3 2H5.2l1.3-2Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.4-2h7.2L17 8.5h3v10H4v-10Z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6 18 18M18 6 6 18" />,
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10.5V20h11V10.5" />
    </>
  ),
  list: (
    <>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M4.5 7h.1M4.5 12h.1M4.5 17h.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 16v-4M12 16V8M17 16v-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.6l1.6 1.6M17.6 15.8l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.4l1.6-1.6M17.6 8.2l1.6-1.6" />
    </>
  ),
  car: (
    <>
      <path d="M4 15.5h16" />
      <path d="M6 15.5 7.8 11a2 2 0 0 1 1.8-1.1h4.8A2 2 0 0 1 16.2 11L18 15.5" />
      <path d="M5 15.5v2.2h1.4a1.6 1.6 0 0 0 3.2 0h4.8a1.6 1.6 0 0 0 3.2 0H19V15.5" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="2.6" />
      <path d="M4.5 18.2a4.6 4.6 0 0 1 9 0" />
      <circle cx="16.2" cy="9.2" r="2.1" />
      <path d="M15 14.2a4.2 4.2 0 0 1 4.5 3.8" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 8 4.2v9.2L12 21l-8-4.6V7.2L12 3Z" />
      <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.1" />
    </>
  ),
  transfer: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10 18h4" />
    </>
  ),
  qr: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2.2v2.2H14zM17.8 14H20v2.2h-2.2zM14 17.8h2.2V20H14zM17.8 17.8H20V20h-2.2z" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V4h10v4" />
      <path d="M6 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  phone: (
    <>
      <path d="M8 4h2l1.2 3-1.6 1a12 12 0 0 0 6.4 6.4l1-1.6 3 1.2v2A2 2 0 0 1 18 18 14 14 0 0 1 6 6a2 2 0 0 1 2-2Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M4 10h16" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
    </>
  ),
  tool: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 0 0-4.8 4.6L4 16.8 7.2 20l5.7-5.7a3.5 3.5 0 0 0 4.6-4.8L15 12l-3-3 2.5-2.5Z" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  wallet: (
    <>
      <path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z" />
      <path d="M4 7.5 15 4.5v3" />
      <path d="M16 13.5h.1" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5h16a2.6 2.6 0 0 1-5.3 0 2.6 2.6 0 0 1-5.4 0A2.6 2.6 0 0 1 4 9.5Z" />
      <path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.5V4h8.5l7.5 7.5-8.5 8.5L4 12.5Z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" />
    </>
  ),
  edit: <path d="M5 19h3.5L19 8.5 15.5 5 5 15.5V19Z" />,
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" />
      <path d="M4.5 4.5V9H9M12 8v4.5l3 2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}
