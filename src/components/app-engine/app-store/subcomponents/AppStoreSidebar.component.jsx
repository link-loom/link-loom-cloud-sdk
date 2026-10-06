import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Tooltip, Typography, useMediaQuery } from "@mui/material";
import {
  ArrowBack as BackIcon,
  AddBoxOutlined as BuildIcon,
  KeyboardDoubleArrowLeft as CollapseIcon,
  KeyboardDoubleArrowRight as ExpandIcon,
} from "@mui/icons-material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_PILL_SIZES, STORE_PILL_TONES, enumName } from "@/features/app-engine/app-store/app-store.enums";
import { categoryMarkColor, categoryTitle, initialsOf, suiteMarkColor } from "@/features/app-engine/app-store/app-store.format";
import { STORE_VIEWS } from "@/features/app-engine/app-store/app-store.routes";
import { alpha } from "../../defaults/launchpad.theme";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_XL_MEDIA, STORE_XL_QUERY, focusRingSx } from "../app-store.styles";
import AppStorePillComponent from "./AppStorePill.component";
import AppStoreSidebarGlyphComponent from "./AppStoreSidebarGlyph.component";

const EXPANDED_WIDTH = 236;
const RAIL_WIDTH = 60;

const collapsedKeyFor = (namespace) => `${namespace}::app-store::sidebar-collapsed`;

const readCollapsed = (key) => {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};

const writeCollapsed = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // A private window can refuse storage; the sidebar just opens expanded next time.
  }
};

// Row label colours: ink by default, the accent for a link-like row, secondary for the way out.
const TONES = {
  default: { rest: COLORS.ink, hover: COLORS.ink },
  accent: { rest: COLORS.accent, hover: COLORS.accent },
  muted: { rest: COLORS.textSecondary, hover: COLORS.ink },
};

// The ground of a row: white when it is the screen on show, the sidebar's hover tone under the pointer.
const rowGroundSx = (active) => ({
  borderRadius: "8px",
  backgroundColor: active ? COLORS.surface : "transparent",
  transition: "background-color 120ms ease, color 120ms ease",
  "&:hover": { backgroundColor: active ? COLORS.surface : COLORS.hover },
});

const itemSx = ({ active, rail, dense, tone, grounded = true }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: rail ? "center" : "flex-start",
  gap: 1.25,
  flexShrink: 0,
  width: "100%",
  minWidth: 0,
  minHeight: rail ? 36 : undefined,
  px: rail ? 0 : 1.25,
  py: dense ? "7px" : "8px",
  border: 0,
  font: "inherit",
  fontSize: 13,
  lineHeight: 1.25,
  fontWeight: active ? 600 : 500,
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
  color: TONES[tone].rest,
  // Inside a strip the link takes what the trailing control leaves, and the strip draws the ground.
  ...(grounded ? rowGroundSx(active) : { flex: "1 1 auto", width: "auto", borderRadius: "8px", backgroundColor: "transparent" }),
  "&:hover": { ...(grounded ? rowGroundSx(active)["&:hover"] : {}), color: TONES[tone].hover, textDecoration: "none" },
  ...focusRingSx,
});

// The fold control's own ground: darker than whatever row it sits on, so its hover reads on its own.
const foldButtonSx = (rail) => ({
  flex: "none",
  display: "grid",
  placeItems: "center",
  width: rail ? "100%" : 26,
  height: rail ? 24 : 26,
  p: 0,
  mr: rail ? 0 : "5px",
  border: 0,
  borderRadius: "6px",
  background: "transparent",
  color: COLORS.textTertiary,
  cursor: "pointer",
  transition: "background-color 120ms ease, color 120ms ease",
  "&:hover": { backgroundColor: alpha(COLORS.ink, 9), color: COLORS.ink },
  "& .MuiSvgIcon-root": { fontSize: 16 },
  ...focusRingSx,
});

const tooltipSlotProps = {
  tooltip: { sx: { backgroundColor: COLORS.ink, color: COLORS.textOnAccent, fontSize: 12, fontWeight: 500, borderRadius: "8px", px: 1.25, py: 0.75 } },
};

/**
 * One row of the sidebar. In the rail it is only its mark, so the label moves into a tooltip; when the
 * column is expanded the label is on screen and a tooltip would only repeat it. A row with `trailing`
 * (Discover and its fold control) is a strip holding the link and that control side by side: the
 * strip owns the row's ground, each part keeps its own click, hover and focus.
 */
function SidebarRow({ rail, label, mark, count, active = false, dense = false, tone = "default", to, onClick, trailing = null }) {
  const linkProps = to ? { component: RouterLink, to } : { component: "button", type: "button", onClick };
  const link = (
    <Tooltip title={rail ? label : ""} placement="right" disableInteractive slotProps={tooltipSlotProps}>
      <Box
        {...linkProps}
        aria-label={rail ? label : undefined}
        aria-current={active ? "page" : undefined}
        sx={itemSx({ active, rail, dense, tone, grounded: !trailing })}
      >
        {mark}
        {!rail && (
          <>
            <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </Box>
            {count !== undefined && count !== null && (
              <Box component="span" sx={{ fontSize: 11, color: COLORS.textTertiary }}>
                {count}
              </Box>
            )}
          </>
        )}
      </Box>
    </Tooltip>
  );

  if (!trailing) {
    return link;
  }

  return (
    <Box className="d-flex align-items-center" sx={{ flexShrink: 0, ...rowGroundSx(active) }}>
      {link}
      {trailing}
    </Box>
  );
}

// A hairline between groups of rows (a plain rule: a host's global `hr` styles never reach it).
function Rule({ inset }) {
  return <Box role="separator" sx={{ flex: "none", height: "1px", my: 1.5, mx: inset, backgroundColor: COLORS.hairline }} />;
}

function SectionLabel({ rail, children }) {
  if (rail) {
    return <Rule inset={1} />;
  }

  return (
    <>
      <Rule inset={0.5} />
      <Typography
        component="p"
        sx={{ px: 1.25, mb: "6px", fontSize: 11, fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.05em", textTransform: "uppercase", color: COLORS.textTertiary }}
      >
        {children}
      </Typography>
    </>
  );
}

/**
 * The store's navigation: Discover, every suite and the organization's own apps; the suites the
 * organization already uses; the categories with their counts; the way to build an app; and the way
 * back to My apps.
 *
 * From Bootstrap's xl up it is a column the person can fold into a rail of icons (remembered in
 * `<namespace>::app-store::sidebar-collapsed`): the fold control («) sits at the right end of the
 * Discover row, and in the rail the unfold control (») sits on top, right above the Discover glyph.
 * Below xl it is always the rail, without either control.
 */
function AppStoreSidebarComponent() {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths, storageNamespace, current, catalogs, facets, suites, organizationName, createApp, backToMyApps } = useAppStore();
  // Read on the first render, so a wide window does not paint the rail and then unfold it.
  const isXl = useMediaQuery(STORE_XL_QUERY, { noSsr: true });

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const collapsedKey = collapsedKeyFor(storageNamespace);
  const [collapsed, setCollapsed] = useState(() => readCollapsed(collapsedKey));
  // The fold control moves between the Discover row and the top of the rail, so it is a new element
  // after each fold; focus follows it there instead of falling to the page.
  const foldRef = useRef(null);
  const keepFoldFocus = useRef(false);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const rail = collapsed || !isXl;
  const countsByName = new Map((facets?.categories || []).map((entry) => [enumName(entry.category) || entry.key, entry.count]));
  const yourSuites = suites.filter((suite) => Number(suite.apps_in_use) > 0);
  const initial = (organizationName || "").trim().charAt(0).toUpperCase();
  const foldLabel = collapsed ? labels.nav.expand : labels.nav.collapse;

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const toggle = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      keepFoldFocus.current = document.activeElement === event.currentTarget;
      setCollapsed((value) => {
        writeCollapsed(collapsedKey, !value);
        return !value;
      });
    },
    [collapsedKey],
  );

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    if (!keepFoldFocus.current) return;
    keepFoldFocus.current = false;
    foldRef.current?.focus();
  }, [collapsed]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  const foldControl = isXl ? (
    <Tooltip title={foldLabel} placement="right" disableInteractive slotProps={tooltipSlotProps}>
      <Box ref={foldRef} component="button" type="button" onClick={toggle} aria-label={foldLabel} aria-expanded={!collapsed} sx={foldButtonSx(rail)}>
        {collapsed ? <ExpandIcon /> : <CollapseIcon />}
      </Box>
    </Tooltip>
  ) : null;

  return (
    <Box
      component="nav"
      aria-label={labels.nav.label}
      className="d-flex flex-column h-100"
      sx={{
        flex: "none",
        width: RAIL_WIDTH,
        [STORE_XL_MEDIA]: { width: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH },
        transition: "width 200ms ease",
        borderRight: `1px solid ${COLORS.hairlineSoft}`,
        backgroundColor: COLORS.sidebar,
        overflowX: "hidden",
        overflowY: "auto",
        rowGap: "1px",
        px: rail ? 1 : 1.5,
        py: 2,
        boxSizing: "border-box",
      }}
    >
      {rail && foldControl && <Box sx={{ mb: 0.5 }}>{foldControl}</Box>}

      <SidebarRow
        rail={rail}
        label={labels.nav.discover}
        mark={<AppStoreSidebarGlyphComponent variant="discover" />}
        active={current.view === STORE_VIEWS.discover || current.view === STORE_VIEWS.search}
        to={storePaths.discover()}
        trailing={rail ? null : foldControl}
      />
      <SidebarRow
        rail={rail}
        label={labels.nav.allSuites}
        mark={<AppStoreSidebarGlyphComponent variant="suites" />}
        count={facets?.suites_total}
        active={current.view === STORE_VIEWS.suites}
        to={storePaths.suites()}
      />
      <SidebarRow
        rail={rail}
        label={labels.nav.organizationApps(organizationName)}
        mark={<AppStoreSidebarGlyphComponent variant="organization" initial={initial} />}
        count={facets?.organization_apps_total}
        active={current.view === STORE_VIEWS.organization}
        to={storePaths.organization()}
      />

      <SectionLabel rail={rail}>{labels.nav.yourSuites}</SectionLabel>
      {yourSuites.map((suite) => (
        <SidebarRow
          key={suite.slug}
          rail={rail}
          dense
          label={suite.name}
          mark={<AppStoreSidebarGlyphComponent variant="suite" rail={rail} initials={initialsOf(suite.name)} color={suiteMarkColor(suite)} />}
          active={current.view === STORE_VIEWS.suite && current.suite === suite.slug}
          to={storePaths.suite(suite.slug)}
        />
      ))}
      <SidebarRow
        rail={rail}
        dense
        tone="accent"
        label={labels.nav.seeAllSuites}
        mark={<AppStoreSidebarGlyphComponent variant="see-all" />}
        to={storePaths.suites()}
      />

      <SectionLabel rail={rail}>{labels.nav.categories}</SectionLabel>
      {catalogs.categories.map((category) => {
        const active = current.view === STORE_VIEWS.category && current.category === category.name;
        const title = categoryTitle(labels, category);
        return (
          <SidebarRow
            key={category.key}
            rail={rail}
            dense
            label={title}
            mark={<AppStoreSidebarGlyphComponent variant="category" rail={rail} active={active} initials={initialsOf(title)} color={categoryMarkColor(category)} />}
            count={countsByName.get(category.name) ?? 0}
            active={active}
            to={storePaths.category(category.name)}
          />
        );
      })}

      <Box sx={{ flex: 1, minHeight: 16 }} />

      {createApp && !rail && (
        <Box sx={{ p: "14px", mt: 1.5, mb: 1, borderRadius: "12px", border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.surface }}>
          <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: COLORS.ink, mb: 0.5 }}>
            {labels.build.title}
          </Typography>
          <Typography component="p" sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textSecondary, mb: 1.25 }}>
            {labels.build.hint}
          </Typography>
          <AppStorePillComponent tone={STORE_PILL_TONES.dark} size={STORE_PILL_SIZES.small} fullWidth onClick={createApp}>
            {labels.build.action}
          </AppStorePillComponent>
        </Box>
      )}
      {createApp && rail && <SidebarRow rail={rail} label={labels.build.title} mark={<BuildIcon sx={{ fontSize: 19, color: COLORS.ink }} />} onClick={createApp} />}

      <SidebarRow rail={rail} tone="muted" label={labels.nav.backToMyApps} mark={<BackIcon sx={{ fontSize: 16 }} />} onClick={backToMyApps} />
    </Box>
  );
}

export default AppStoreSidebarComponent;
