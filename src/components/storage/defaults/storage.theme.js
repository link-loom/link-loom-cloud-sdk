// Visual language of the storage surfaces. Every value resolves a StoneOS kit token (`--stos-*`)
// with the token's own value as the literal fallback, so the component looks native inside a
// `.stos-app` host (Drive and the rest of the suite, light and dark) and keeps rendering the same
// way in hosts that do not ship the kit yet (the Link Loom Cloud admin console).
const token = (name, fallback) => `var(--${name}, ${fallback})`;

export const THEME_COLORS = {
  brandPrimary: token("stos-brand", "#3c4876"),
  brandPrimaryDark: token("stos-brand-hover", "#2f3a5f"),
  brandAccent: token("stos-accent", "#37b6e0"),
  success: token("stos-success", "#2fb673"),
  error: token("stos-danger", "#e5484d"),
  errorDark: token("stos-danger", "#e5484d"),
  errorDarker: token("stos-danger", "#e5484d"),
  warning: token("stos-warning", "#ffb020"),
  textSecondary: token("stos-text-secondary", "#515d72"),
  borderMuted: token("stos-border", "#e4e8ef"),
  textMuted: token("stos-text-tertiary", "#596378"),
  textBody: token("stos-text-primary", "#1b2233"),
  textBodyMuted: token("stos-text-secondary", "#515d72"),
  textStrong: token("stos-text-primary", "#1b2233"),
  white: token("stos-bg-surface", "#ffffff"),
  surfaceCard: token("stos-bg-surface", "#ffffff"),
  surfaceTrack: token("stos-bg-muted", "#f2f4f8"),
  borderDashed: token("stos-border-strong", "#d3d9e3"),
  borderStrong: token("stos-border-strong", "#d3d9e3"),
  hover: token("stos-bg-hover", "#f2f4f8"),
  selected: token("stos-bg-selected", "#eceff5"),
  page: token("stos-bg-page", "#eff3f9"),
  textInverse: token("stos-text-inverse", "#ffffff"),
  textDisabled: token("stos-text-disabled", "#b3bac7"),
};

// Type scale: Inter at the kit's sizes, weights 400/500/600 — never 700.
export const THEME_TYPE = {
  fontSize11: token("stos-fs-11", "11px"),
  fontSize12: token("stos-fs-12", "12px"),
  fontSize13: token("stos-fs-13", "13px"),
  fontSize14: token("stos-fs-14", "14px"),
  fontSize16: token("stos-fs-16", "16px"),
  weightRegular: 400,
  weightMedium: 500,
  weightStrong: 600,
  fontMono: token("stos-font-mono", "'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace"),
};

// Radii: 4 for chips and thumbnails, 6 for controls and rows, 8 for cards, panels and dialogs.
export const THEME_RADII = {
  xs: token("stos-radius-xs", "4px"),
  sm: token("stos-radius-sm", "6px"),
  md: token("stos-radius-md", "8px"),
  pill: token("stos-radius-pill", "999px"),
};

// Micro-interactions only: 120ms, and nothing that moves an element out of its slot.
export const THEME_MOTION = {
  fast: "120ms",
  easing: "ease",
};

// Soft tint: the color mixed into the surface, as a percentage. `color-mix` keeps this working with
// tokens, which an alpha-hex suffix could not.
export const tint = (color, percent = 12) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
