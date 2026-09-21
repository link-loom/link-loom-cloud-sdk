import React from "react";
import { Box, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_MEDIA_TYPES, isEnumValue } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";

/**
 * The media of an app's page — images and videos kept in Link Loom Cloud Storage — in a row that
 * scrolls sideways. Each resource carries a view link (`view.path`, token included when the object
 * is private); one without it is left out rather than drawn as a broken frame.
 */
function AppStoreMediaGalleryComponent({ resources }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, mediaBaseUrl } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const media = (Array.isArray(resources) ? resources : [])
    .filter((resource) => resource?.view?.path)
    .sort((left, right) => (Number(left.display_order) || 0) - (Number(right.display_order) || 0));

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (media.length === 0) {
    return null;
  }

  return (
    <Box component="section" aria-label={labels.detail.media} className="d-flex gap-3" sx={{ overflowX: "auto", pb: 1, mb: 3.5 }}>
      {media.map((resource) => {
        const src = `${mediaBaseUrl}${resource.view.path}`;
        const frameSx = { display: "block", width: "100%", height: "100%", objectFit: "cover", backgroundColor: COLORS.surfaceMuted };

        return (
          <Box component="figure" key={resource.storage_object_id} sx={{ flex: "none", width: { xs: 280, md: 360 }, m: 0 }}>
            <Box sx={{ height: { xs: 175, md: 225 }, borderRadius: "12px", overflow: "hidden", border: `1px solid ${COLORS.hairline}` }}>
              {isEnumValue(resource.media_type, STORE_MEDIA_TYPES.video) ? (
                <Box component="video" src={src} controls preload="metadata" aria-label={resource.caption || undefined} sx={frameSx} />
              ) : (
                <Box component="img" src={src} alt={resource.caption || ""} loading="lazy" sx={frameSx} />
              )}
            </Box>
            {resource.caption && (
              <Typography component="figcaption" sx={{ fontSize: 12, color: COLORS.textTertiary, mt: 0.75 }}>
                {resource.caption}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default AppStoreMediaGalleryComponent;
