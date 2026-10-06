import { SIDEBAR_THEME as THEME } from "../defaults/launchpad.theme";

// Adminto (the layout every StoneOS host runs on) switches to a drawer below this width.
const DESKTOP_MIN_WIDTH = "993px";

const sidebarWidth = "var(--stos-sidebar-w, 240px)";
const sidebarWidthCondensed = "var(--stos-sidebar-w-condensed, 70px)";
const railInset = "var(--stos-launchpad-inset, 8px)";
const railWidth = "var(--stos-launchpad-w, 50px)";
const railGap = "var(--stos-launchpad-gap, 0px)";

// The column is the navigation, the rail beside it, the air the rail floats in and the gap between.
const leftbarWidth = `calc(${sidebarWidth} + ${railInset} + ${railWidth} + ${railGap})`;
const leftbarWidthCondensed = `calc(${sidebarWidthCondensed} + ${railInset} + ${railWidth} + ${railGap})`;

// app.js sets both attributes when it condenses the sidebar. The `html` in front outranks Adminto's own
// rules, which have the same shape, whichever stylesheet the host loads last.
const inCondensed = (selector) =>
  `html body[data-sidebar-size="condensed"] ${selector}, html body[data-leftbar-size="condensed"] ${selector}`;

// What Adminto hardcodes at 240px moves to the column. Everything that tracks the column's width on
// desktop is scoped to desktop: below it the sidebar is a drawer, and the content never moves for it.
const layout = `
  body .left-side-menu {
    box-shadow: none;
    border-right: 1px solid ${THEME.border};
    padding: 0;
    width: ${leftbarWidth};
  }
  @media (min-width: ${DESKTOP_MIN_WIDTH}) {
    html body .logo-box {
      width: ${leftbarWidth};
    }
    html body .content-page {
      margin-left: ${leftbarWidth};
    }
    html body .footer {
      left: ${leftbarWidth};
    }
    ${inCondensed(".logo-box")}, ${inCondensed(".left-side-menu")} {
      width: ${leftbarWidthCondensed} !important;
    }
    ${inCondensed(".content-page")} {
      margin-left: ${leftbarWidthCondensed} !important;
    }
    ${inCondensed(".footer")} {
      left: ${leftbarWidthCondensed} !important;
    }
    /* Adminto condenses the menu as position: absolute, with a body that is at least 1750px tall, so
       the footer of the column (the organization switcher) and the rail's all-apps button land below
       the fold. The column is always the window's height. */
    html body[data-leftbar-size="condensed"] .left-side-menu {
      position: fixed;
    }
    html body[data-leftbar-size="condensed"]:not([data-layout="compact"]) {
      min-height: auto;
    }
  }
`;

// The rail runs the full height beside the navigation, so the organization switcher cannot span the
// sidebar: it sits at the foot of the navigation's own column, shoulder to shoulder with the rail's
// all-apps button.
const column = `
  .stos-leftbar {
    display: flex;
    height: 100%;
    min-height: 0;
    gap: ${railGap};
    padding-left: ${railInset};
  }
  .stos-leftbar__col {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  /* Native overflow, not SimpleBar: SimpleBar measures once at page load and this column gets its
     height from flex. The 6px plus the first item's own 2px margin put its top edge on the rail's. */
  .stos-leftbar__nav {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: ${THEME.borderStrong} transparent;
    padding: 6px 0 8px;
  }
  .stos-leftbar__nav::-webkit-scrollbar {
    width: 6px;
  }
  .stos-leftbar__nav::-webkit-scrollbar-thumb {
    background: ${THEME.borderStrong};
    border-radius: 999px;
  }
  .stos-leftbar__nav::-webkit-scrollbar-thumb:hover {
    background: ${THEME.textDisabled};
  }
  .stos-leftbar__nav::-webkit-scrollbar-track {
    background: transparent;
  }
  .stos-leftbar__nav #sidebar-menu {
    padding: 0 0 12px;
  }
  ${inCondensed(".stos-leftbar__nav")} {
    padding-top: 0;
  }
`;

// Rows of 32px, a 13px label, a 16px icon. The section variant (`ll-sidebar-section`) reads its first
// button as a small grey label; the link variant (`ll-sidebar-link`, SidebarLinkRow) makes the header
// the item itself. Scoped to the sidebar by `.stos-leftbar #sidebar-menu`, which also outranks the
// SDK's emotion classes.
const menu = ".stos-leftbar #sidebar-menu";
const section = `${menu} .ll-sidebar-section`;
const link = `${menu} .ll-sidebar-link`;

const look = `
  ${menu} .MuiListItemButton-root {
    min-height: 32px;
    padding: 4px 10px 4px 12px;
    margin: 0 8px;
    border-radius: ${THEME.radius};
  }
  ${menu} .MuiListItemButton-root:hover {
    background: ${THEME.hover};
  }
  ${menu} .MuiListItemButton-root.is-active {
    background: ${THEME.selected};
  }
  ${menu} .MuiListItemButton-root.is-active .MuiListItemText-primary {
    color: ${THEME.textStrong};
    font-weight: 500;
  }
  ${menu} .MuiListItemText-primary {
    font-size: 13px;
    color: ${THEME.text};
    font-weight: 400;
    line-height: 1.4;
  }
  ${menu} .MuiListItemIcon-root {
    min-width: 24px;
    color: ${THEME.textMuted};
  }
  ${menu} .MuiListItemIcon-root svg {
    font-size: 16px;
  }
  ${menu} .MuiCollapse-root .MuiListItemButton-root {
    padding-left: 24px;
  }
  ${menu} .MuiCollapse-root .MuiCollapse-root .MuiListItemButton-root {
    padding-left: 36px;
  }
  ${menu} .MuiSvgIcon-root[data-testid="ExpandMoreIcon"],
  ${menu} .MuiSvgIcon-root[data-testid="ExpandLessIcon"] {
    font-size: 16px;
    color: ${THEME.textMuted};
  }

  ${section} > .MuiListItemButton-root:first-of-type,
  ${section} > nav > .MuiListItemButton-root:first-of-type {
    min-height: 28px;
    margin-top: 8px;
  }
  ${section} > .MuiListItemButton-root:first-of-type .MuiListItemText-primary,
  ${section} > nav > .MuiListItemButton-root:first-of-type .MuiListItemText-primary {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${THEME.textMuted};
  }
  ${section} > nav > .MuiListItemButton-root:first-of-type .MuiListItemIcon-root,
  ${section} > nav > .MuiListItemButton-root:first-of-type svg {
    min-width: 24px;
    font-size: 16px;
    color: ${THEME.textMuted};
  }

  ${link} > nav > .MuiListItemButton-root {
    min-height: 32px;
    margin: 2px 8px;
    padding: 4px 10px 4px 12px;
    border-radius: ${THEME.radius};
  }
  ${link} > nav > .MuiListItemButton-root .MuiListItemText-primary {
    font-size: 13px;
    font-weight: 400;
    color: ${THEME.text};
    text-transform: none;
    letter-spacing: 0;
  }
  ${link}.ll-sidebar-link--with-toggle > nav > .MuiListItemButton-root {
    padding-right: 40px;
  }
  ${link}.is-active > nav > .MuiListItemButton-root {
    background: ${THEME.selected};
  }
  ${link}.is-active > nav > .MuiListItemButton-root .MuiListItemText-primary {
    color: ${THEME.textStrong};
    font-weight: 500;
  }
  ${link} > nav > .MuiListItemButton-root .MuiListItemIcon-root {
    min-width: 24px;
    color: ${THEME.textMuted};
  }
  ${link} > nav > .MuiListItemButton-root svg {
    font-size: 16px;
    color: ${THEME.textMuted};
  }

  ${menu} .menu-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${THEME.textMuted};
    padding: 12px 20px 4px;
  }

  /* The collapse control, in the row it lives in: its own hover and click. Condensed it stands alone
     above the row's icon, the size of the rows below it, its centre on the StoneOS mark of the rail. */
  .stos-leftbar .ll-sidebar-toggle {
    color: ${THEME.textMuted};
    border-radius: ${THEME.radius};
    transition: background-color 120ms ease, color 120ms ease;
  }
  .stos-leftbar .ll-sidebar-toggle:hover {
    background: color-mix(in srgb, ${THEME.textStrong} 8%, transparent);
    color: ${THEME.textStrong};
  }
  .stos-leftbar .ll-sidebar-toggle:focus-visible {
    outline: 2px solid ${THEME.focus};
    outline-offset: 1px;
  }
  .stos-leftbar .ll-sidebar-toggle--rail {
    width: calc(100% - 24px);
    height: 32px;
    margin: 10px 12px 4px;
  }

  ${inCondensed(`${menu} .MuiListItemButton-root`)} {
    justify-content: center !important;
    padding: 6px 0 !important;
    margin: 0 12px;
  }
  ${inCondensed(`${menu} .MuiListItemIcon-root`)} {
    justify-content: center !important;
    min-width: unset !important;
    width: auto !important;
    margin: 0 !important;
  }
`;

export const STONEOS_LAUNCHPAD_SIDEBAR_STYLES = `${layout}${column}${look}`;
