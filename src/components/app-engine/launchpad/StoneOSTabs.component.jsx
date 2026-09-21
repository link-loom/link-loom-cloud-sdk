import React from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME } from "../defaults/launchpad.theme";

const tabSx = (selected) => ({
  px: 1.75,
  py: "5px",
  borderRadius: "7px",
  border: 0,
  font: "inherit",
  fontSize: 13,
  fontWeight: selected ? 600 : 500,
  backgroundColor: selected ? "background.paper" : "transparent",
  boxShadow: selected ? "0 1px 2px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04)" : "none",
  color: selected ? "text.primary" : "text.secondary",
  cursor: selected ? "default" : "pointer",
  "&:hover": { color: "text.primary" },
});

/**
 * The one control that moves between the two halves of StoneOS: the
 * launchpad and the store. It is chrome, not content, so it sits in its own
 * bar above whatever each page puts at the top and stays in the same place on
 * both — a person should never have to find a different way back.
 */
function StoneOSTabsComponent({ value = "apps" }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const navigate = useNavigate();
  const { labels, paths } = useLaunchpadConfig();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const tabs = [
    { id: "apps", label: labels.myApps, to: paths.apps },
    { id: "store", label: labels.appStore, to: paths.store },
  ];

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Box
      sx={{
        height: 52,
        flex: "none",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        px: 2.25,
        borderBottom: `1px solid ${LAUNCHPAD_THEME.border}`,
        backgroundColor: "background.paper",
      }}
    >
      <Box />
      <Box role="tablist" sx={{ display: "flex", backgroundColor: LAUNCHPAD_THEME.bgMuted, borderRadius: "9px", p: "3px", gap: "2px" }}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={selected ? undefined : () => navigate(tab.to)}
              sx={tabSx(selected)}
            >
              {tab.label}
            </Box>
          );
        })}
      </Box>
      <Box />
    </Box>
  );
}

export default StoneOSTabsComponent;
