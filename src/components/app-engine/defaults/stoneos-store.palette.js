// The App Store's own colours: StoneOS's, taken from the StoneOS App Hub mockup, never the host's. The
// App Store root declares each one as a scoped custom property (`--stos-store-*`, `STORE_PALETTE_VARS`),
// so neither a host's `--stos-*` kit tokens nor its MUI theme reach the store; components read them
// through `STORE_COLORS`, whose literal fallback also covers what renders in a portal (dialogs, menus).
// My apps and the launchpad rail keep `LAUNCHPAD_THEME`.
export const STONEOS_STORE_PALETTE = {
  accent: "#3060c8",
  accentHover: "#1f4aa8",
  accentTint: "#eef2fb",
  // The tint a step toward the accent, for a light pill under the pointer.
  accentTintHover: "#e1e8f7",
  // The hairline of a surface filled with the tint: the same blue, one step darker than its fill.
  accentTintBorder: "#d5dff4",
  // The Featured banner: the accent a step stronger than the pills' tint, so it stands out from the page
  // ground (a pale blue-grey) without leaving the blue family.
  featuredTint: "color-mix(in srgb, #3060c8 16%, white)",
  featuredTintBorder: "color-mix(in srgb, #3060c8 26%, white)",
  textOnAccent: "#ffffff",
  ink: "#1c1c1a",
  inkHover: "#3a3936",
  textBody: "#3a3936",
  textSecondary: "#6f6e69",
  textTertiary: "#8a8983",
  // The store's ground is the page colour of the launchpad (`--stos-bg-page`, the blue-grey My apps paints),
  // so the two halves of StoneOS read as one place; its sidebar is that ground one step darker
  // (`--stos-board-column`). White cards separate from them by their hairline, not by contrast.
  canvas: "var(--stos-bg-page, #eff3f9)",
  sidebar: "var(--stos-board-column, color-mix(in srgb, #8b95a7 7%, #eff3f9))",
  surface: "#ffffff",
  // A panel nested in a card (an app's facts) and the greys under the pointer, in a chip, in a track or in a
  // skeleton. They are the page's blue-grey family: a cream-leaning neutral reads as beige next to it.
  surfaceMuted: "var(--stos-bg-muted, #f2f4f8)",
  tabTrack: "var(--stos-bg-page, #eff3f9)",
  hover: "color-mix(in srgb, #8b95a7 16%, var(--stos-bg-page, #eff3f9))",
  chip: "var(--stos-bg-selected, #eceff5)",
  track: "color-mix(in srgb, #8b95a7 22%, var(--stos-bg-page, #eff3f9))",
  skeleton: "color-mix(in srgb, #8b95a7 14%, var(--stos-bg-page, #eff3f9))",
  hairline: "rgba(0, 0, 0, 0.08)",
  hairlineSoft: "rgba(0, 0, 0, 0.06)",
  hairlineStrong: "rgba(0, 0, 0, 0.18)",
  fieldBorder: "rgba(0, 0, 0, 0.1)",
  pillBorder: "rgba(0, 0, 0, 0.14)",
  pillBorderHover: "rgba(0, 0, 0, 0.28)",
  success: "#1f6b3a",
  successTint: "#eaf6ee",
  successIcon: "#2e9a5b",
  danger: "#b42318",
  dangerHover: "#912018",
  dangerTint: "#fdecea",
  focusRing: "rgba(48, 96, 200, 0.15)",
  scrim: "rgba(20, 20, 18, 0.28)",
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  shadowHover: "0 2px 8px rgba(0, 0, 0, 0.05)",
  shadowDialog: "0 20px 60px rgba(0, 0, 0, 0.25)",
  glyphShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 2px rgba(0, 0, 0, 0.15)",
};

const propertyOf = (key) => `--stos-store-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

// The declarations the App Store root (and each of its portals) sets: `{ "--stos-store-accent": "#3060c8", … }`.
export const STORE_PALETTE_VARS = Object.fromEntries(Object.entries(STONEOS_STORE_PALETTE).map(([key, value]) => [propertyOf(key), value]));

// What components use: `var(--stos-store-accent, #3060c8)`.
export const STORE_COLORS = Object.fromEntries(
  Object.entries(STONEOS_STORE_PALETTE).map(([key, value]) => [key, `var(${propertyOf(key)}, ${value})`]),
);

// The marks of the sidebar rows in the folded rail: a rounded square with the initials of a category or a
// suite. Each hue is a muted mid-tone; the mark paints it as a light tint with the hue, darkened, for the
// letters, so nine of them side by side stay calm and every one holds its letters at 4.5:1 or better. A
// category has its own hue here, so the nine of the catalog never read as one; anything the catalog adds
// later, and a suite that came without a colour, takes one of `STORE_MARK_COLORS` by the same name every time.
export const STORE_MARK_COLORS = [
  "#7a5fc0",
  "#3f6fd0",
  "#2f8a80",
  "#c26a3d",
  "#4a9a5a",
  "#c2528a",
  "#b08a2a",
  "#c4524f",
  "#7a9a3a",
  "#5f6b7c",
];

export const STORE_CATEGORY_MARK_COLORS = {
  ai: "#7a5fc0",
  productivity: "#3f6fd0",
  operations: "#2f8a80",
  sales: "#c26a3d",
  finance: "#4a9a5a",
  communication: "#c2528a",
  analytics: "#b08a2a",
  support: "#c4524f",
  people: "#7a9a3a",
};
