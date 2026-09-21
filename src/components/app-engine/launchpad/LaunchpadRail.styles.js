import styled from "styled-components";

import { LAUNCHPAD_RAIL_THEME as RAIL } from "../defaults/launchpad.theme";

const FADE = "18px";

// The launchpad rail: a light strip that floats inside the host's left column — inset from the
// window's edge by the host, rounded, a hair from the navigation. Its two ends (the StoneOS mark and
// the all-apps button) never move; everything between them scrolls and fades out behind them.
export const RailNav = styled.nav`
  flex: 0 0 ${RAIL.width};
  width: ${RAIL.width};
  align-self: stretch;
  min-height: 0;
  overflow: hidden;
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  /* No top padding: the rail's edge and the navigation's first item share a line. The 3px at the
     bottom lines the all-apps button up with an avatar centred in a 58px footer band. */
  padding: 0 0 3px;
  border-radius: 14px;
  background: ${RAIL.background};
  color: ${RAIL.foreground};
  /* The wash ends near white, on a white sidebar: the hairline keeps the rail a shape. */
  box-shadow: inset 0 0 0 1px ${RAIL.edge};

  /* The front door: the same footprint as a tile, set apart by its glow. */
  .loom-launchpad__home {
    flex: none;
    position: relative;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    margin-bottom: 8px;
    border-radius: 8px;
    isolation: isolate;
  }

  /* A logo, not a link: hosts that paint every a:hover (Adminto does) must not recolour the stone. */
  .loom-launchpad__home,
  .loom-launchpad__home:hover,
  .loom-launchpad__home:focus,
  .loom-launchpad__home:active,
  .loom-launchpad__home:visited {
    color: ${RAIL.mark};
    background: none;
    text-decoration: none;
  }

  .loom-launchpad__home:focus-visible {
    outline: 2px solid ${RAIL.ring};
    outline-offset: 2px;
  }

  .loom-launchpad__mark {
    position: relative;
    z-index: 1;
    display: block;
    filter: drop-shadow(0 1px 1px rgba(31, 39, 64, 0.22));
  }

  .loom-launchpad__glow {
    position: absolute;
    inset: -6px;
    z-index: 0;
    border-radius: 50%;
    background: conic-gradient(from 220deg, #f8c2c2, #fdefff, #aaf1e6, #9db7d2, #b7a5e9);
    -webkit-mask-image: radial-gradient(circle, #fff 20%, transparent 70%);
    mask-image: radial-gradient(circle, #fff 20%, transparent 70%);
    filter: blur(3px);
    opacity: 0.55;
  }

  /* Two groups, the dock's way: what is always there, then what was added. */
  .loom-launchpad__group {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  /* The padding keeps hover rings and drop rules from being clipped by the scroll box. */
  .loom-launchpad__scroller {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    padding-block: 5px;
    margin-block: -5px;
  }

  .loom-launchpad__scroller::-webkit-scrollbar {
    display: none;
  }

  .loom-launchpad__scroller[data-fade-top="true"] {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 ${FADE}, #000 100%);
    mask-image: linear-gradient(to bottom, transparent 0, #000 ${FADE}, #000 100%);
  }

  .loom-launchpad__scroller[data-fade-bottom="true"] {
    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - ${FADE}), transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - ${FADE}), transparent 100%);
  }

  .loom-launchpad__scroller[data-fade-top="true"][data-fade-bottom="true"] {
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 ${FADE},
      #000 calc(100% - ${FADE}),
      transparent 100%
    );
    mask-image: linear-gradient(to bottom, transparent 0, #000 ${FADE}, #000 calc(100% - ${FADE}), transparent 100%);
  }

  /* Inset on purpose: a rule that stops short reads as a seam between groups. */
  .loom-launchpad__divider {
    flex: none;
    width: 22px;
    height: 1px;
    margin: 3px 0;
    background: currentColor;
    opacity: 0.22;
  }

  .loom-launchpad__app,
  .loom-launchpad__all {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    cursor: pointer;
    color: inherit;
    transition:
      background-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  /* A tile: the app's category tint, or the platform's own colour at a fifth. */
  .loom-launchpad__app {
    position: relative;
    background: var(--tile-bg, ${RAIL.tile});
  }

  .loom-launchpad__app img {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    object-fit: cover;
  }

  .loom-launchpad__app:hover,
  .loom-launchpad__app:focus-visible {
    box-shadow: 0 0 0 2px ${RAIL.ring};
    outline: none;
  }

  /* The rail runs downwards, so its drop hint is a rule above or below the tile. */
  .loom-launchpad__app.is-before::before,
  .loom-launchpad__app.is-after::before {
    content: "";
    position: absolute;
    left: 2px;
    right: 2px;
    height: 2px;
    border-radius: 2px;
    background: ${RAIL.mark};
    pointer-events: none;
  }

  .loom-launchpad__app.is-before::before {
    top: -4px;
  }

  .loom-launchpad__app.is-after::before {
    bottom: -4px;
  }

  /* All apps: the glyph alone — nine round dots — no plate behind it, pushed to the foot. */
  .loom-launchpad__all {
    flex: none;
    margin-top: auto;
    background: transparent;
    color: ${RAIL.foreground};
  }

  .loom-launchpad__all svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .loom-launchpad__all:hover,
  .loom-launchpad__all:focus-visible,
  .loom-launchpad__all.is-active {
    color: ${RAIL.foregroundStrong};
    outline: none;
  }
`;
