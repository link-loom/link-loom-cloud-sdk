import React from "react";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME, alpha } from "../../defaults/launchpad.theme";
import AppStorePublisherPillComponent from "./AppStorePublisherPill.component";
import CatalogAppIconComponent, { hasSvgAppIcon } from "../../CatalogAppIcon.component";
import { getCategoryTint } from "../../categoryIcon.util";

const FeaturedTile = styled.div`
  height: 130px;
  border-radius: 16px;
  background-color: ${({ $isSelected }) => ($isSelected ? "#F8F6FB" : "#FFFFFF")};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? alpha(THEME.brand, 18.82) : "#E5E7EB")};
  box-shadow: ${({ $isSelected }) => ($isSelected ? `0 0 0 2px ${alpha(THEME.brand, 12.55)}` : "0 1px 3px rgba(0, 0, 0, 0.04)")};
  cursor: pointer;
  transition: all 120ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const IconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

function getShortDescription(description) {
  if (!description) return "";
  const firstLine = description.split("\n").find((line) => line.trim() !== "");
  return firstLine?.trim() || "";
}

function AppStoreFeaturedComponent({ apps, onSelect, onOpenApp, selectedAppId, focusedIndex = -1, indexOffset = 0, getCategoryIcon }) {
  const { storeLabels: labels } = useLaunchpadConfig();

  if (!apps || apps.length === 0) return null;

  return (
    <div style={{ padding: "16px 20px 0 20px" }}>
      <div className="mb-2">
        <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#9CA3AF", letterSpacing: "0.5px" }}>
          {labels.featured}
        </span>
      </div>

      <div className="row g-3">
        {apps.map((app, index) => {
          const rawCategory = app.category || app.manifest?.kind || "utility";
          const category = typeof rawCategory === "string" ? rawCategory : rawCategory?.name || rawCategory?.title || "utility";
          const CategoryIcon = getCategoryIcon(category);
          const tint = getCategoryTint(category);
          const isSelected = selectedAppId === app.id || focusedIndex === (indexOffset + index);

          return (
            <div key={app.id} className="col-6 col-lg-6 col-xl-3">
              <FeaturedTile
                $isSelected={isSelected}
                className="d-flex flex-column p-3"
                data-app-id={app.id}
                onClick={() => onSelect(app)}
                onDoubleClick={() => onOpenApp(app)}
              >
              <div className="d-flex align-items-center gap-2 mb-2" style={{ minWidth: 0 }}>
                <IconBox style={{ backgroundColor: hasSvgAppIcon(app) ? "#FFFFFF" : tint.bg }}>
                  <CatalogAppIconComponent app={app} size={18} fallbackIcon={CategoryIcon} sx={{ color: tint.iconColor }} />
                </IconBox>
                <span className="text-truncate" style={{ fontWeight: 700, fontSize: "14px", color: "#111827", minWidth: 0 }}>
                  {app.name}
                </span>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: "1.4",
                  marginBottom: "auto",
                }}
              >
                {getShortDescription(app.description)}
              </div>

              <div className="mt-auto pt-2">
                <AppStorePublisherPillComponent publisher={app.publisher} />
              </div>
            </FeaturedTile>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AppStoreFeaturedComponent;
