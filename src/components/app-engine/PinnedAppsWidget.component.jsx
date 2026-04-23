import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress } from "@mui/material";
import styled from "styled-components";
import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useAuth } from "@veripass/react-sdk";
import DynamicMuiIcon from "@/components/app-engine/DynamicMuiIcon.component";
import { getCategoryIcon, getCategoryTint } from "@/components/app-engine/categoryIcon.util";

const WidgetContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const AppTile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 72px;
  cursor: pointer;
  transition: transform 150ms ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const IconBox = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $bg }) => $bg || "#EDE9FE"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

function PinnedAppsWidget({ maxItems = 8, onNavigateToApp }) {
  const navigate = useNavigate();
  const { appPreferenceService, appDefinitionService } = useAppEngineSDK();
  const { user } = useAuth();

  const userIdentity = user?.identity;
  const organizationId = user?.payload?.organization_id;

  const [pinnedApps, setPinnedApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!appPreferenceService || !appDefinitionService || !userIdentity) {
      setIsLoading(false);
      return;
    }

    const fetchPinnedApps = async () => {
      try {
        const prefResponse = await appPreferenceService.getByParameters({ queryselector: "user", search: userIdentity });
        const prefs = prefResponse?.result?.items || [];
        const pinnedPrefs = prefs.filter((p) => p.is_pinned);

        if (pinnedPrefs.length === 0) {
          setPinnedApps([]);
          setIsLoading(false);
          return;
        }

        const defResponse = await appDefinitionService.getMarketplace({ organization_id: organizationId, pageSize: 200 });
        const allApps = defResponse?.result?.items || [];

        const pinnedAppIds = new Set(pinnedPrefs.map((p) => p.app_definition_id));
        const matched = allApps.filter((app) => pinnedAppIds.has(app.id)).slice(0, maxItems);
        setPinnedApps(matched);
      } catch (error) {
        console.error("Failed to load pinned apps:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPinnedApps();
  }, [maxItems, appPreferenceService, appDefinitionService, userIdentity, organizationId]);

  const handleOpenApp = (app) => {
    if (onNavigateToApp) {
      onNavigateToApp(app);
    } else {
      navigate(`/client/app-engine/runtime/${app.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "16px" }}>
        <CircularProgress size={20} sx={{ color: "#8B5CF6" }} />
      </div>
    );
  }

  if (pinnedApps.length === 0) {
    return null;
  }

  return (
    <div>
      <WidgetContainer>
        {pinnedApps.map((app) => {
          const rawCategory = app.category || app.manifest?.kind || "workspace";
          const category = typeof rawCategory === "string" ? rawCategory : rawCategory?.name || "workspace";
          const CategoryIcon = getCategoryIcon(category);
          const tint = getCategoryTint(category);

          const publisherLogoUrl = app.publisher?.logo_url || app.publisher?.profile?.logo_url || null;

          return (
            <AppTile key={app.id} onClick={() => handleOpenApp(app)}>
              <IconBox $bg={publisherLogoUrl ? "transparent" : tint.bg} style={publisherLogoUrl ? { overflow: "hidden" } : undefined}>
                {publisherLogoUrl ? (
                  <img
                    src={publisherLogoUrl}
                    alt={app.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <DynamicMuiIcon iconName={app.icon} fallbackIcon={CategoryIcon} sx={{ fontSize: 22, color: tint.iconColor }} />
                )}
              </IconBox>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: "#374151",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: "96px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "keep-all",
                  overflowWrap: "normal",
                  whiteSpace: "normal",
                  hyphens: "none",
                }}
              >
                {app.name}
              </Typography>
            </AppTile>
          );
        })}
      </WidgetContainer>
    </div>
  );
}

export default PinnedAppsWidget;
