import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";

import { AppEngineSDKProvider } from "@/features/app-engine/context/AppEngineSDK.context";
import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import useLaunchpadApps from "@/features/app-engine/launchpad/useLaunchpadApps.hook";
import useLaunchpadLayout from "@/features/app-engine/launchpad/useLaunchpadLayout.hook";
import useReorderFlip from "@/features/app-engine/launchpad/useReorderFlip.hook";
import {
  startTileDrag,
  endTileDrag,
  draggedTile,
  resolveDrop,
  sameContainer,
} from "@/features/app-engine/launchpad/launchpadDragAndDrop";
import CatalogAppIconComponent, { hasSvgAppIcon } from "../CatalogAppIcon.component";
import { getCategoryIcon, getCategoryTint } from "../categoryIcon.util";
import StoneOSMark from "./StoneOSMark.component";
import AppContextMenuComponent from "./AppContextMenu.component";
import { RailNav } from "./LaunchpadRail.styles";

/** How many pinned apps fit under the platforms before the group scrolls. */
const PINNED_MAX = 10;

/**
 * The two groups you can rearrange, and the list each one is stored in. The
 * front door and the all-apps button are not here on purpose: they are the
 * rail's two fixed ends, and a rail whose anchors move is not a rail.
 *
 * `axis: "y"` tells the drop logic this container runs downwards, so a tile
 * splits top/bottom instead of left/right.
 */
const RAIL_PLATFORMS = { zone: "rail-platforms", axis: "y", list: "platformOrder" };
const RAIL_PINNED = { zone: "rail-pinned", axis: "y", list: "pinnedOrder" };

/** Nine round dots — the launcher glyph, drawn here because MUI's grids are squares. */
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} />))}
  </svg>
);

/**
 * The middle of the rail scrolls when the window is short, and fades under the two fixed ends so
 * apps slide behind the StoneOS mark and the all-apps button instead of pushing them off screen.
 * The fade on each edge only appears while there is content hidden on that side.
 */
function useScrollFade() {
  const [node, setNode] = useState(null);
  const [fade, setFade] = useState({ top: false, bottom: false });

  const measure = useCallback(() => {
    if (!node) {
      return;
    }
    const top = node.scrollTop > 1;
    const bottom = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
    setFade((current) => (current.top === top && current.bottom === bottom ? current : { top, bottom }));
  }, [node]);

  useEffect(() => {
    if (!node) {
      return undefined;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    [...node.children].forEach((child) => observer.observe(child));
    node.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", measure);
    };
  }, [node, measure]);

  return { setNode, fade, measure };
}

/** One tile of the rail: an app of the organization, or a platform of the ecosystem. */
function RailTile({ entry, onOpen, onContextMenu, intent = null, drag }) {
  const isPlatform = entry.kind === "platform";
  const rawCategory = entry.category || entry.manifest?.kind || "workspace";
  const category = typeof rawCategory === "string" ? rawCategory : rawCategory?.name || "workspace";
  const tint = getCategoryTint(category);

  return (
    <Tooltip title={entry.name} placement="right" arrow>
      <button
        type="button"
        className={`loom-launchpad__app${intent ? ` is-${intent}` : ""}`}
        data-flip-key={entry.id}
        draggable
        onDragStart={(event) => drag.onDragStart(event, entry)}
        onDragEnd={drag.onDragEnd}
        onClick={() => onOpen(entry)}
        onContextMenu={(event) => onContextMenu(event, entry)}
        aria-label={entry.name}
        style={isPlatform ? { "--tile-bg": `${entry.color}33` } : { "--tile-bg": hasSvgAppIcon(entry) ? "#FFFFFF" : tint.bg }}
      >
        {isPlatform ? (
          <img src={entry.image} alt="" />
        ) : (
          <CatalogAppIconComponent app={entry} size={18} fallbackIcon={getCategoryIcon(category)} sx={{ color: tint.iconColor }} />
        )}
      </button>
    </Tooltip>
  );
}

function LaunchpadRailContent() {
  const { labels, paths } = useLaunchpadConfig();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { pinned, railPlatforms, launch, togglePin, hrefFor } = useLaunchpadApps();
  const layout = useLaunchpadLayout({ pinned, platforms: railPlatforms });
  const [menu, setMenu] = useState(null);
  const [dropHint, setDropHint] = useState(null);
  const [platformsNode, setPlatformsNode] = useState(null);
  const [pinnedNode, setPinnedNode] = useState(null);
  const scrollFade = useScrollFade();

  useReorderFlip(platformsNode, layout.platformItems.map((item) => item.id).join("|"));
  useReorderFlip(pinnedNode, layout.pinnedItems.map((item) => item.id).join("|"));

  const openMenu = (event, entry) => {
    event.preventDefault();
    setMenu({ entry, position: { x: event.clientX, y: event.clientY } });
  };

  /**
   * The same contract the launchpad page hands its tiles, restricted to one
   * group: a platform of the ecosystem and an app someone pinned are different
   * kinds of thing, so they reorder among their own and not across the rule
   * that separates them.
   */
  const dragFor = (container) => ({
    onDragStart: (event, entry) => {
      startTileDrag(entry, container, event);
      setDropHint(null);
    },
    onDragEnd: () => {
      setDropHint(null);
      endTileDrag();
    },
  });

  // The group resolves the landing, so the gaps between icons — and the strip
  // of rail either side of them — pull towards the nearest tile instead of
  // dropping the gesture.
  const groupFor = (container) => ({
    onDragOver: (event) => {
      const drag = draggedTile();
      if (!drag || !sameContainer(drag.from, container)) return;

      const landing = resolveDrop(event, container, event.currentTarget);
      if (!landing || !landing.targetId) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropHint((current) =>
        current?.target === landing.targetId && current.intent === landing.intent ? current : { target: landing.targetId, intent: landing.intent }
      );
    },
    onDragLeave: (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      setDropHint(null);
    },
    onDrop: (event) => {
      event.preventDefault();

      const drag = draggedTile();
      const landing = resolveDrop(event, container, event.currentTarget);
      setDropHint(null);
      endTileDrag();

      if (!drag || !landing?.targetId || !sameContainer(drag.from, container)) return;
      layout.reorderList(container.list, drag.entry.id, landing.targetId, landing.intent);
    },
  });

  // Like the dock: a fixed group that is always there — the platforms of the
  // ecosystem, pinned by default — and below a rule, what this person pinned.
  // Pinning something adds to the rail; it never replaces what was there.
  const tiles = layout.pinnedItems.slice(0, PINNED_MAX);
  const onAllApps = pathname.startsWith(paths.apps);

  return (
    <RailNav className="loom-launchpad" aria-label="Launchpad">
      {/* The mark opens StoneOS, which is what it is the mark of — it used to go
          to Today, so the one icon in the rail that names a place led somewhere
          else. Never "/": that route mounts the auth layout before redirecting,
          and the layout swap reads as a full reload. No tooltip and no hover
          state — the mark is the label, and it is the one thing in the rail
          that should sit perfectly still. */}
      <Link className="loom-launchpad__home" to={paths.apps} aria-label={labels.rail.home}>
        <span className="loom-launchpad__glow" aria-hidden="true" />
        <StoneOSMark size={22} className="loom-launchpad__mark" />
      </Link>

      <div
        ref={scrollFade.setNode}
        className="loom-launchpad__scroller"
        data-fade-top={scrollFade.fade.top ? "true" : undefined}
        data-fade-bottom={scrollFade.fade.bottom ? "true" : undefined}
      >
      {/* Taking every platform off is allowed: the group simply goes. */}
      <div ref={setPlatformsNode} className="loom-launchpad__group" aria-label={labels.rail.platforms} {...groupFor(RAIL_PLATFORMS)}>
        {layout.platformItems.map((entry) => (
          <RailTile
            key={entry.id}
            entry={entry}
            onOpen={launch}
            onContextMenu={openMenu}
            intent={dropHint?.target === entry.id ? dropHint.intent : null}
            drag={dragFor(RAIL_PLATFORMS)}
          />
        ))}
      </div>

      {tiles.length > 0 && (
        <>
          <span className="loom-launchpad__divider" role="separator" />
          <div ref={setPinnedNode} className="loom-launchpad__group" aria-label={labels.rail.pinned} {...groupFor(RAIL_PINNED)}>
            {tiles.map((entry) => (
              <RailTile
                key={entry.id}
                entry={entry}
                onOpen={launch}
                onContextMenu={openMenu}
                intent={dropHint?.target === entry.id ? dropHint.intent : null}
                drag={dragFor(RAIL_PINNED)}
              />
            ))}
          </div>
        </>
      )}

      </div>

      <Tooltip title={labels.rail.allApps} placement="right" arrow>
        <button
          type="button"
          className={`loom-launchpad__all${onAllApps ? " is-active" : ""}`}
          onClick={() => navigate(paths.apps)}
          aria-label={labels.rail.allApps}
          aria-current={onAllApps ? "page" : undefined}
        >
          <DotsIcon />
        </button>
      </Tooltip>

      <AppContextMenuComponent
        entry={menu?.entry}
        anchor={menu?.position}
        onClose={() => setMenu(null)}
        onOpen={launch}
        onTogglePin={togglePin}
        hrefFor={hrefFor}
      />
    </RailNav>
  );
}

/**
 * The launchpad rail — the vertical strip to the left of the host's navigation.
 *
 * Top: the StoneOS mark, which opens "My apps", with a soft glow behind it.
 * Then the dock's arrangement: the platforms of the ecosystem (from
 * `LaunchpadProvider`), and under a short rule whatever this person pinned in
 * the App Store (`is_pinned`, the preference every StoneOS host reads). Bottom:
 * the all-apps button. Tiles reorder by dragging within their own group.
 *
 * The host gives it a column to live in; see docs/11-launchpad-host-integration.md.
 */
function LaunchpadRailComponent({ baseUrl }) {
  return (
    <AppEngineSDKProvider baseUrl={baseUrl}>
      <LaunchpadRailContent />
    </AppEngineSDKProvider>
  );
}

export default LaunchpadRailComponent;
