/* Icon library — inline SVG. Usage: icon('users', 16) */
const ICONS = {
  pool: '<circle cx="12" cy="12" r="9" opacity="0.4"/><circle cx="12" cy="12" r="6" opacity="0.7"/><circle cx="12" cy="12" r="3"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  users: '<path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z"/>',
  nurse: '<path d="M12 3l4 2v3c0 3-2 5-4 6-2-1-4-3-4-6V5l4-2z"/><path d="M6 21c0-3 3-5 6-5s6 2 6 5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  home: '<path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-9z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  message: '<path d="M21 12a8 8 0 1 1-3.6-6.6L21 4l-1.4 3.6A8 8 0 0 1 21 12z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
  bell: '<path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2zM10 20a2 2 0 0 0 4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M6 18L18 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  filter: '<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.6-3A19.8 19.8 0 0 1 5 12.8a20 20 0 0 1-3.1-8.7A2 2 0 0 1 3.9 2h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.1a2 2 0 0 1 2.1-.5 13 13 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 2l3 7 7 .8-5 5 1.5 7L12 18l-6.5 3.8L7 15 2 10l7-.8 3-7z"/>',
  alert: '<path d="M12 2L2 20h20L12 2z"/><path d="M12 9v5M12 17v.5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12l2-1-2-3-2 .5L15 7 14 5h-4L9 7 7 8l-2-.5-2 3 2 1-2 1 2 3 2-.5 2 1 1 2h4l1-2 2-1 2 .5 2-3-2-1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  ripple: '<circle cx="12" cy="12" r="8" opacity="0.3"/><circle cx="12" cy="12" r="5" opacity="0.6"/><circle cx="12" cy="12" r="2"/>',
  handshake: '<path d="M11 17l2 2 3-3m-9-3l4-4 3 3 3-3 3 3"/><path d="M3 14l4 4 2-2M21 14l-4 4-2-2"/>',
  trendingUp: '<path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  paperclip: '<path d="M21 11l-9 9a6 6 0 1 1-8-8l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l9-9"/>'
};

function icon(name, size = 18, stroke = 2) {
  const body = ICONS[name] || ICONS.pool;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

window.icon = icon;
