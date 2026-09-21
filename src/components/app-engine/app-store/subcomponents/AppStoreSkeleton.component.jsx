import React from "react";
import { Box } from "@mui/material";

import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { surfaceSx } from "../app-store.styles";

/**
 * The store's loading shapes: while a screen waits for its data it draws the layout it is about to
 * show, in pulsing blocks (`loom-store-pulse`, still under reduced motion), never a progress bar.
 * Each shape sits where the real one will, with the same surface and size.
 */
export function SkeletonBlock({ width = "100%", height = 12, radius = "8px", index = 0, sx }) {
  return (
    <Box
      aria-hidden="true"
      className="loom-store-pulse"
      style={{ "--i": index }}
      sx={{ flex: "none", width, height, maxWidth: "100%", borderRadius: radius, backgroundColor: COLORS.skeleton, ...sx }}
    />
  );
}

// A glyph, then two lines beside it: the head of a card or a row.
function GlyphLines({ size = 44, index, widths = ["55%", "35%"] }) {
  return (
    <Box className="d-flex align-items-center gap-3" sx={{ minWidth: 0 }}>
      <SkeletonBlock width={size} height={size} radius="26%" index={index} />
      <Box className="d-flex flex-column flex-grow-1 gap-2" sx={{ minWidth: 0 }}>
        <SkeletonBlock width={widths[0]} height={13} index={index} />
        <SkeletonBlock width={widths[1]} height={10} index={index} />
      </Box>
    </Box>
  );
}

/** An app card while its grid loads: head, two lines of description, price and a pill. */
export function AppCardSkeleton({ index = 0 }) {
  return (
    <Box sx={{ ...surfaceSx, height: "100%", minHeight: 176, p: 2, display: "flex", flexDirection: "column", gap: 1.5, boxSizing: "border-box" }}>
      <GlyphLines index={index} widths={["60%", "45%"]} />
      <Box className="d-flex flex-column gap-2">
        <SkeletonBlock height={11} index={index} />
        <SkeletonBlock width="70%" height={11} index={index} />
      </Box>
      <Box className="d-flex align-items-center justify-content-between mt-auto">
        <SkeletonBlock width={48} height={12} index={index} />
        <SkeletonBlock width={64} height={28} radius="999px" index={index} />
      </Box>
    </Box>
  );
}

/** A search result while the results load. */
export function AppRowSkeleton({ index = 0, divided = false }) {
  return (
    <Box className="d-flex align-items-center gap-3" sx={{ py: 1.25, px: 2, borderTop: divided ? `1px solid ${COLORS.hairlineSoft}` : 0 }}>
      <Box className="flex-grow-1" sx={{ minWidth: 0 }}>
        <GlyphLines size={40} index={index} widths={["30%", "45%"]} />
      </Box>
      <SkeletonBlock width={40} height={12} index={index} />
      <SkeletonBlock width={64} height={28} radius="999px" index={index} />
    </Box>
  );
}

/** A suite tile while the suites load. */
export function SuiteTileSkeleton({ index = 0, withTagline = true }) {
  return (
    <Box sx={{ ...surfaceSx, height: "100%", minHeight: withTagline ? 150 : 110, p: 2, display: "flex", flexDirection: "column", gap: 1.5, boxSizing: "border-box" }}>
      <SkeletonBlock width={36} height={36} radius="26%" index={index} />
      <Box className="d-flex flex-column gap-2">
        <SkeletonBlock width="55%" height={13} index={index} />
        {withTagline && <SkeletonBlock width="85%" height={10} index={index} />}
      </Box>
      <SkeletonBlock width="35%" height={10} index={index} sx={{ mt: "auto" }} />
    </Box>
  );
}

/** A page's heading while its record loads: overline, title and a line of description. */
export function HeaderSkeleton({ glyph = 0, action = false, index = 0 }) {
  return (
    <Box className="d-flex align-items-start gap-4" sx={{ minWidth: 0 }}>
      {glyph > 0 && <SkeletonBlock width={glyph} height={glyph} radius="26%" index={index} />}
      <Box className="d-flex flex-column flex-grow-1" sx={{ minWidth: 0, gap: 1.25 }}>
        <SkeletonBlock width={90} height={10} index={index} />
        <SkeletonBlock width="45%" height={24} index={index} />
        <SkeletonBlock width="70%" height={12} index={index} />
        {action && (
          <Box className="d-flex align-items-center gap-3" sx={{ mt: 1 }}>
            <SkeletonBlock width={120} height={36} radius="999px" index={index} />
            <SkeletonBlock width={140} height={12} index={index} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
