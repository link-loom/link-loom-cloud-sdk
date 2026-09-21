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
  textOnAccent: "#ffffff",
  ink: "#1c1c1a",
  inkHover: "#3a3936",
  textBody: "#3a3936",
  textSecondary: "#6f6e69",
  textTertiary: "#8a8983",
  // The store's ground: an off-white with no warm cast. White cards separate from it by their hairline,
  // not by contrast. Every grey below is neutral too — the mockup's cream family read as beige here.
  canvas: "#f9f9f8",
  sidebar: "#f4f4f3",
  surface: "#ffffff",
  // A panel nested in a card (an app's facts) and a neutral pill under the pointer.
  surfaceMuted: "#f5f5f4",
  tabTrack: "#efefee",
  hover: "#ebebea",
  chip: "#f0f0ef",
  track: "#e3e3e2",
  skeleton: "#ebebea",
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
