import React from "react";
import { Box } from "@mui/material";

import CatalogAppIconComponent, { hasSvgAppIcon } from "../../CatalogAppIcon.component";
import { getCategoryIcon, getCategoryTint } from "../../categoryIcon.util";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { glyphShadow } from "../app-store.styles";

/** An app's icon on the launchpad's square: its published SVG on white, or its category glyph on the category tint. */
function AppStoreAppGlyphComponent({ app, size = 44 }) {
  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const tint = getCategoryTint(app?.category);
  const isSvg = hasSvgAppIcon(app);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "26%",
        display: "grid",
        placeItems: "center",
        backgroundColor: isSvg ? COLORS.surface : tint.bg,
        boxShadow: glyphShadow,
      }}
    >
      <CatalogAppIconComponent
        app={app}
        size={isSvg ? size * 0.6 : size * 0.45}
        fallbackIcon={getCategoryIcon(app?.category)}
        sx={{ color: tint.iconColor }}
      />
    </Box>
  );
}

export default AppStoreAppGlyphComponent;
