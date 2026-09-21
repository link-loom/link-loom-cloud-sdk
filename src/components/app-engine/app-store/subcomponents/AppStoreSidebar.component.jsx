import React, { useMemo } from "react";
import { Divider, Tooltip } from "@mui/material";
import {
  AppsOutlined,
  PushPin as PushPinIcon,
  StarBorder as StarIcon,
  Verified as VerifiedIcon,
  AutoAwesome as AIIcon,
  BuildOutlined as UtilityIcon,
  PersonOutline as HitlIcon,
  ShowChart as AnalyticsIcon,
  Cable as IntegrationIcon,
  Widgets as WorkspaceIcon,
  Code as FallbackIcon,
  CheckCircle as CheckCircleIcon,
  DynamicForm as FormsIcon,
  Storage as DataIcon,
} from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME, alpha } from "../../defaults/launchpad.theme";

const SidebarContainer = styled.div`
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  overflow-x: hidden;
  width: 56px;
  transition: width 200ms ease;

  @media (min-width: 1200px) {
    width: ${({ $collapsed }) => ($collapsed ? "56px" : "220px")};

    /* When collapsed at xl, override Bootstrap xl alignment to match small-screen style */
    ${({ $collapsed }) =>
      $collapsed &&
      `
      & .justify-content-xl-start {
        justify-content: center !important;
      }
      & .px-xl-3 {
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }
    `}
  }
`;

const SidebarRow = styled.div`
  cursor: pointer;
  border-radius: 12px;
  background-color: ${({ $isActive, $isFocused }) => ($isActive ? THEME.brand : $isFocused ? "#F3F4F6" : "transparent")};
  color: ${({ $isActive }) => ($isActive ? "#FFFFFF" : "#374151")};
  outline: ${({ $isFocused }) => ($isFocused ? `2px solid ${alpha(THEME.brand, 25.1)}` : "none")};
  outline-offset: -2px;
  transition: background-color 120ms ease;
  margin: 0 8px 2px 8px;

  &:hover {
    background-color: ${({ $isActive }) => ($isActive ? THEME.brand : "#F3F4F6")};
  }
`;

const CountPill = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ $isActive }) => ($isActive ? "rgba(255,255,255,0.8)" : "#9CA3AF")};
  background-color: ${({ $isActive }) => ($isActive ? "rgba(255,255,255,0.15)" : "#F3F4F6")};
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 16px;
`;

const SectionLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.5px;
`;

const ExpandedContent = styled.span`
  display: none;

  @media (min-width: 1200px) {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "contents")};
  }
`;

// Labels come from `storeLabels.categoryTitles`; a category without an entry here keeps the fallback icon.
const CATEGORY_CONFIG = {
  workspace: { icon: WorkspaceIcon, order: 0 },
  utility: { icon: UtilityIcon, order: 1 },
  hitl: { icon: HitlIcon, order: 2 },
  ai: { icon: AIIcon, order: 3 },
  analytics: { icon: AnalyticsIcon, order: 4 },
  integration: { icon: IntegrationIcon, order: 5 },
  forms: { icon: FormsIcon, order: 6 },
  form: { icon: FormsIcon, order: 6 },
  data: { icon: DataIcon, order: 7 },
};

function AppStoreSidebarComponent({ apps, selectedCategory, onSelectCategory, selectedPublisher, onSelectPublisher, collapsed, sidebarItems = [], sidebarFocusedIndex = -1 }) {
  const { storeLabels: labels } = useLaunchpadConfig();
  const { categories, publishers, pinnedCount, favoritesCount, officialCount, totalCount } = useMemo(() => {
    const catMap = new Map();
    const pubMap = new Map();
    let pinned = 0;
    let favorites = 0;
    let official = 0;

    for (const app of apps) {
      const rawCat = app.category || app.manifest?.kind || "uncategorized";
      const cat = typeof rawCat === "string" ? rawCat : rawCat?.name || rawCat?.title || "uncategorized";
      catMap.set(cat, (catMap.get(cat) || 0) + 1);

      if (app.is_pinned) pinned++;
      if (app.is_favorite) favorites++;
      if (app.is_official) official++;

      const pubName = app.publisher?.name || app.publisher?.profile?.name;
      const pubVerified = app.publisher?.verified ?? app.publisher?.profile?.verified;
      if (pubName) {
        if (!pubMap.has(pubName)) {
          pubMap.set(pubName, { name: pubName, verified: pubVerified, count: 0 });
        }
        pubMap.get(pubName).count++;
      }
    }

    const sortedCategories = Array.from(catMap.entries())
      .map(([key, count]) => {
        const config = CATEGORY_CONFIG[key] || { icon: FallbackIcon, order: 99 };
        const label = labels.categoryTitles[key] || key.charAt(0).toUpperCase() + key.slice(1);
        return { key, count, icon: config.icon, label, order: config.order };
      })
      .sort((a, b) => a.order - b.order);

    const pubList = Array.from(pubMap.values()).sort((a, b) => b.count - a.count);

    return {
      categories: sortedCategories,
      publishers: pubList,
      pinnedCount: pinned,
      favoritesCount: favorites,
      officialCount: official,
      totalCount: apps.length,
    };
  }, [apps, labels]);

  const renderRow = (key, label, Icon, count, isActive, onClickHandler) => {
    const sidebarIdx = sidebarItems.findIndex((item) => item.key === key);
    const isFocused = sidebarIdx >= 0 && sidebarIdx === sidebarFocusedIndex;
    return (
    <Tooltip key={key || "all"} title={label} placement="right" enterDelay={300} slotProps={{ popper: { className: "d-xl-none" } }}>
      <SidebarRow
        $isActive={isActive}
        $isFocused={isFocused}
        className="d-flex align-items-center justify-content-center justify-content-xl-start gap-2 px-2 px-xl-3 py-2"
        role="button"
        tabIndex={0}
        onClick={() => onClickHandler(isActive ? null : key)}
        onKeyDown={(e) => e.key === "Enter" && onClickHandler(isActive ? null : key)}
      >
        <Icon sx={{ fontSize: 18, color: isActive ? "#FFFFFF" : "#6B7280", flexShrink: 0 }} />
        <ExpandedContent $collapsed={collapsed}>
          <span className="flex-grow-1" style={{ fontSize: "13px", fontWeight: 500 }}>
            {label}
          </span>
          <CountPill $isActive={isActive}>{count}</CountPill>
        </ExpandedContent>
      </SidebarRow>
    </Tooltip>
  );
  };

  const handleSelectCategory = (cat) => {
    onSelectCategory(cat);
    if (cat !== null) onSelectPublisher(null);
  };

  const handleSelectPublisher = (pub) => {
    onSelectPublisher(pub);
    if (pub !== null) onSelectCategory(null);
  };

  return (
    <SidebarContainer $collapsed={collapsed} className="d-flex flex-column h-100">
      <div className="py-2">
        {renderRow(null, labels.allApps, AppsOutlined, totalCount, selectedCategory === null && !selectedPublisher, handleSelectCategory)}

        {pinnedCount > 0 &&
          renderRow("pinned", labels.pinned, PushPinIcon, pinnedCount, selectedCategory === "pinned", handleSelectCategory)}

        {favoritesCount > 0 &&
          renderRow("favorites", labels.favorites, StarIcon, favoritesCount, selectedCategory === "favorites", handleSelectCategory)}

        {officialCount > 0 &&
          renderRow("official", labels.official, VerifiedIcon, officialCount, selectedCategory === "official", handleSelectCategory)}
      </div>

      {categories.length > 0 && (
        <>
          <Divider sx={{ mx: 1, my: 1 }} />
          <ExpandedContent $collapsed={collapsed}>
            <div className="px-3 py-1">
              <SectionLabel>{labels.categories}</SectionLabel>
            </div>
          </ExpandedContent>
          <div className="d-flex flex-column pb-2">
            {categories.map(({ key, label, icon, count }) =>
              renderRow(key, label, icon, count, selectedCategory === key, handleSelectCategory)
            )}
          </div>
        </>
      )}

      {publishers.length > 0 && (
        <>
          <Divider sx={{ mx: 1, my: 1 }} />
          <ExpandedContent $collapsed={collapsed}>
            <div className="px-3 py-1">
              <SectionLabel>{labels.publishers}</SectionLabel>
            </div>
          </ExpandedContent>
          <div className="d-flex flex-column pb-2">
            {publishers.map(({ name, verified, count }) => {
              const isActive = selectedPublisher === name;
              const PublisherIcon = verified ? CheckCircleIcon : FallbackIcon;
              return (
                <Tooltip key={name} title={name} placement="right" enterDelay={300} slotProps={{ popper: { className: "d-xl-none" } }}>
                  <SidebarRow
                    $isActive={isActive}
                    className="d-flex align-items-center justify-content-center justify-content-xl-start gap-2 px-2 px-xl-3 py-2"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPublisher(isActive ? null : name)}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectPublisher(isActive ? null : name)}
                  >
                    <PublisherIcon
                      sx={{ fontSize: 14, color: isActive ? "#FFFFFF" : verified ? THEME.success : "#9CA3AF", flexShrink: 0 }}
                    />
                    <ExpandedContent $collapsed={collapsed}>
                      <span className="flex-grow-1" style={{ fontSize: "13px", fontWeight: 500 }}>
                        {name}
                      </span>
                      <CountPill $isActive={isActive}>{count}</CountPill>
                    </ExpandedContent>
                  </SidebarRow>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </SidebarContainer>
  );
}

export default AppStoreSidebarComponent;
