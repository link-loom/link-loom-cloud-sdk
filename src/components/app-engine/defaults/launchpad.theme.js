// Visual language of the launchpad (rail + My apps) and the App Store. Every value resolves a StoneOS
// kit token (`--stos-*`) with the value Mi Retail renders today as the literal fallback, so a host
// without the kit looks exactly like Mi Retail and a host with the kit follows it.
const token = (name, fallback) => `var(--${name}, ${fallback})`;

export const LAUNCHPAD_THEME = {
  brand: token("stos-brand", "#3c4876"),
  brandHover: token("stos-brand-hover", "#2f3a5f"),
  success: token("stos-success", "#2fb673"),
  danger: token("stos-danger", "#e5484d"),
  dangerStrong: token("stos-danger-strong", "#b8383c"),
  purple: token("stos-purple", "#8b5cf6"),
  textPrimary: token("stos-text-primary", "#1b2233"),
  textSecondary: token("stos-text-secondary", "#515d72"),
  textTertiary: token("stos-text-tertiary", "#737f94"),
  bgPage: token("stos-bg-page", "#eff3f9"),
  bgMuted: token("stos-bg-muted", "#f2f4f8"),
  border: token("stos-border", "#e4e8ef"),
  borderStrong: token("stos-border-strong", "#d3d9e3"),
  // A launchpad tile under the pointer: halfway to paper, not paper.
  tileHover: token("stos-tile-hover", "color-mix(in srgb, #ffffff 55%, #eff3f9)"),
  shadowSm: token("stos-shadow-sm", "0 1px 2px rgba(19, 19, 22, 0.06)"),
  shadowMd: token("stos-shadow-md", "0 8px 24px -8px rgba(19, 19, 22, 0.16), 0 2px 6px -2px rgba(19, 19, 22, 0.06)"),
  menuText: token("stos-menu-text", "rgb(32, 32, 32)"),
  menuIcon: token("stos-menu-icon", "rgb(131, 131, 131)"),
  fontSize11: token("stos-fs-11", "11px"),
  fontSize13: token("stos-fs-13", "13px"),
  radiusSm: token("stos-radius-sm", "6px"),
  radiusMd: token("stos-radius-md", "8px"),
  // Height of the host's top bar; My apps fills the window below it.
  topbarHeight: token("stos-topbar-h", "70px"),
};

// The rail's own palette: StoneOS's sky wash, the StoneOS blue for the mark, ink for the glyphs.
export const LAUNCHPAD_RAIL_THEME = {
  background: token("stos-launchpad-bg", "linear-gradient(180deg, #dce7fa 0%, #eaf1fd 55%, #eaf1fd 100%)"),
  edge: token("stos-launchpad-edge", "rgba(31, 39, 64, 0.08)"),
  foreground: token("stos-launchpad-fg", "#3b4560"),
  foregroundStrong: token("stos-launchpad-fg-strong", "#1f2740"),
  mark: token("stos-launchpad-mark", "#2563eb"),
  ring: token("stos-launchpad-ring", "rgba(31, 39, 64, 0.22)"),
  tile: token("stos-launchpad-tile", "rgba(31, 39, 64, 0.08)"),
  width: token("stos-launchpad-w", "50px"),
};

// The StoneOS Launchpad sidebar's palette. Each value is overridable on its own through
// `--stos-sidebar-*`; without it, it follows the kit token, and without the kit it renders as Mi Retail.
const sidebarToken = (name, kitToken, fallback) => `var(--stos-sidebar-${name}, var(--${kitToken}, ${fallback}))`;

export const SIDEBAR_THEME = {
  text: sidebarToken("text", "stos-text-secondary", "#515d72"),
  textStrong: sidebarToken("text-strong", "stos-text-primary", "#1b2233"),
  textMuted: sidebarToken("text-muted", "stos-text-tertiary", "#737f94"),
  textDisabled: sidebarToken("text-disabled", "stos-text-disabled", "#b3bac7"),
  hover: sidebarToken("hover", "stos-bg-hover", "#f2f4f8"),
  selected: sidebarToken("selected", "stos-bg-selected", "#eceff5"),
  border: sidebarToken("border", "stos-border", "#e4e8ef"),
  borderStrong: sidebarToken("border-strong", "stos-border-strong", "#d3d9e3"),
  focus: sidebarToken("focus", "stos-brand", "#3c4876"),
  radius: sidebarToken("radius", "stos-radius-sm", "6px"),
};

// A color at a given opacity. `color-mix` works with tokens, which a hex alpha suffix cannot.
export const alpha = (color, percent) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;
