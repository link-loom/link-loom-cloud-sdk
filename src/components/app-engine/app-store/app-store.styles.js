import { STORE_COLORS as COLORS, STORE_PALETTE_VARS } from "../defaults/stoneos-store.palette";

// Bootstrap's xl: the store sidebar is a full column from here up and an icon rail below it.
export const STORE_XL_QUERY = "(min-width:1200px)";
export const STORE_XL_MEDIA = "@media (min-width:1200px)";
// Below Bootstrap's sm the way back in the tabs bar keeps only its arrow.
export const STORE_BELOW_SM_MEDIA = "@media (max-width:575.98px)";

/**
 * The store's motion, scoped to its root — the same two entrances My apps plays, plus the skeletons'
 * pulse. Cards pop in from 86% a beat after each other (`--i`), headers settle with a short fade;
 * nothing moves on hover.
 */
const MOTION_SX = {
  "@keyframes loomAppPop": { from: { opacity: 0, transform: "scale(0.86)" }, to: { opacity: 1, transform: "none" } },
  "@keyframes loomAppFade": { from: { opacity: 0, transform: "translateY(-4px)" }, to: { opacity: 1, transform: "none" } },
  "@keyframes loomStorePulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.45 } },
  "& .loom-store-enter": { animation: "loomAppPop 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both", animationDelay: "calc(var(--i, 0) * 24ms)" },
  "& .loom-store-fade": { animation: "loomAppFade 420ms ease both" },
  "& .loom-store-pulse": { animation: "loomStorePulse 1.4s ease-in-out infinite", animationDelay: "calc(var(--i, 0) * 80ms)" },
  "@media (prefers-reduced-motion: reduce)": {
    "& .loom-store-enter, & .loom-store-fade, & .loom-store-pulse": { animation: "none" },
  },
};

/**
 * The App Store root: its palette as scoped custom properties, its ink and its motion. Anything the
 * store renders in a portal (the acquisition dialog, the owner's menu, pickers) spreads it too.
 */
export const STORE_ROOT_SX = {
  ...STORE_PALETTE_VARS,
  color: COLORS.ink,
  ...MOTION_SX,
};

// A dialog of the store (its root, in a portal): the store's palette, and its own scrim over the page.
// The selector outranks a host's global backdrop rule (Mi Retail: `.MuiModal-root .MuiBackdrop-root:not(…)`).
export const STORE_DIALOG_SX = {
  ...STORE_ROOT_SX,
  "&.MuiModal-root .MuiBackdrop-root:not(.MuiBackdrop-invisible)": { background: COLORS.scrim },
};

// The paper of a dialog or menu the store opens in a portal: white, ink, the mockup's radius and lift.
export const storePaperSx = (radius = "18px") => ({
  color: COLORS.ink,
  backgroundColor: COLORS.surface,
  backgroundImage: "none",
  borderRadius: radius,
  boxShadow: COLORS.shadowDialog,
});

// A surface on the store's ground: white, a hairline and the launchpad's radius.
export const surfaceSx = {
  backgroundColor: COLORS.surface,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: "16px",
};

// A surface that opens something: the border firms up and it gains a soft lift, without moving.
export const interactiveSurfaceSx = {
  ...surfaceSx,
  transition: "border-color 140ms ease, box-shadow 140ms ease",
  "&:hover, &:focus-within": { borderColor: COLORS.hairlineStrong, boxShadow: COLORS.shadowHover },
};

// The launchpad's icon square: a hairline of light on top and a short drop.
export const glyphShadow = COLORS.glyphShadow;

// A link that reads as text, in the accent, with an underline on hover.
export const textLinkSx = {
  border: 0,
  p: 0,
  background: "transparent",
  font: "inherit",
  color: COLORS.accent,
  cursor: "pointer",
  textDecoration: "none",
  "&:hover, &:focus-visible": { color: COLORS.accentHover, textDecoration: "underline", outline: "none" },
};

// The keyboard ring of every control of the store.
export const focusRingSx = {
  "&:focus-visible": { outline: `2px solid color-mix(in srgb, ${COLORS.accent} 45%, transparent)`, outlineOffset: 2 },
};

// A small rounded chip: suite and category filters, apps a suite already has, apps an app works with.
export const chipSx = (selected = false) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  px: 1.5,
  py: "5px",
  borderRadius: "999px",
  border: `1px solid ${selected ? COLORS.ink : COLORS.hairline}`,
  backgroundColor: selected ? COLORS.ink : COLORS.surface,
  color: selected ? COLORS.textOnAccent : COLORS.textBody,
  font: "inherit",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "border-color 120ms ease, background-color 120ms ease",
  "&:hover": { borderColor: COLORS.ink, color: selected ? COLORS.textOnAccent : COLORS.ink, textDecoration: "none" },
  ...focusRingSx,
});

// An app as a chip: its glyph on the left, its name (apps already in the hub, "Works with").
export const appChipSx = {
  ...chipSx(false),
  gap: 1,
  pl: "6px",
  pr: 1.5,
  fontSize: 13,
  color: COLORS.ink,
  "&:hover": { borderColor: COLORS.hairlineStrong, backgroundColor: COLORS.surfaceMuted, color: COLORS.ink, textDecoration: "none" },
};

// The quiet overline of a section: 11px, spaced capitals, tertiary.
export const overlineSx = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  lineHeight: 1.4,
  textTransform: "uppercase",
  color: COLORS.textTertiary,
};

// Text for screen readers only (the label of a loading region).
export const visuallyHiddenSx = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };
