import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import CatalogAppIconComponent, { hasSvgAppIcon } from "../../CatalogAppIcon.component";
import { getCategoryTint } from "../../categoryIcon.util";
import remarkGfm from "remark-gfm";
import { Chip, Divider, IconButton, Tooltip } from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  Terminal as EditIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Star as StarFilledIcon,
  StarBorder as StarBorderIcon,
  Mouse as MouseIcon,
  CheckCircle as CheckCircleIcon,
  Input as InputIcon,
  Output as OutputIcon,
  AltRoute as PortIcon,
  Route as RouteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import styled from "styled-components";

import { useLaunchpadConfig } from "@/features/app-engine/launchpad/LaunchpadConfig.context";
import { LAUNCHPAD_THEME as THEME, alpha } from "../../defaults/launchpad.theme";
import AppStorePremiumCardComponent from "./AppStorePremiumCard.component";

const DetailsContainer = styled.div`
  flex-shrink: 0;
  width: 380px;
  background-color: #ffffff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  overflow-y: auto;

  @media (max-width: 767px) {
    width: 100%;
  }
`;

const OpenButton = styled.button`
  background-color: ${THEME.brand};
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px;
  padding: 12px 16px;
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease;

  &:hover {
    background-color: ${THEME.brandHover};
  }
`;

const EditLink = styled.button`
  background: none;
  border: none;
  color: ${THEME.brand};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.5px;
`;

const PropertyRow = styled.div`
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
`;

function AppStoreDetailsComponent({
  app,
  onOpenApp,
  onEditApp,
  onPinApp,
  onFavoriteApp,
  onClose,
  onRequestPremium,
  getCategoryIcon,
  userOrganizationId,
}) {
  const { storeLabels } = useLaunchpadConfig();
  const labels = storeLabels.details;
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const isOwnedByUser = app?.organization_id === userOrganizationId;

  useEffect(() => {
    setShowPremiumCard(false);
  }, [app?.id]);

  if (!app) {
    return (
      <DetailsContainer className="d-flex flex-column align-items-center justify-content-center h-100">
        <MouseIcon sx={{ fontSize: 40, color: "#D1D5DB", mb: 1 }} />
        <span style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF" }}>{labels.selectApp}</span>
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{labels.selectAppHint}</span>
      </DetailsContainer>
    );
  }

  const rawCategory = app.category || app.manifest?.kind || "utility";
  const category = typeof rawCategory === "string" ? rawCategory : rawCategory?.name || rawCategory?.title || "utility";
  const CategoryIcon = getCategoryIcon(category);
  const tint = getCategoryTint(category);
  const premiumState = app?.marketplace_details?.premium_state;
  const isPremium = premiumState && premiumState !== "entitled";

  const inputProps = app.manifest?.input_contract?.properties || app.input_contract_schema?.properties || {};
  const outputProps = app.manifest?.output_contract?.properties || app.output_contract_schema?.properties || {};
  const routes = app.routes || app.manifest?.routes || [];
  const capabilities = app.manifest?.capabilities || app.capabilities || [];
  const tags = app.tags || [];
  const ports = app.ports || app.manifest?.ports || [];

  const publisherName = app.publisher?.name || app.publisher?.profile?.name || labels.defaultPublisher;
  const publisherVerified = app.publisher?.verified ?? app.publisher?.profile?.verified ?? true;
  const publisherUrl = app.publisher?.url || app.publisher?.profile?.url || null;
  const publisherLogoUrl = app.publisher?.logo_url || app.publisher?.profile?.logo_url || null;

  const hasInterface = Object.keys(inputProps).length > 0 || Object.keys(outputProps).length > 0 || ports.length > 0;
  const hasMetadata = capabilities.length > 0 || category || app.manifest?.kind;

  return (
    <DetailsContainer className="d-flex flex-column h-100">
      {/* Scrollable content */}
      <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
        <div className="p-3">
          {/* Close button */}
          <div className="d-flex justify-content-end mb-1">
            <IconButton size="small" onClick={onClose} sx={{ color: "#9CA3AF", padding: "4px" }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Header */}
          <div className="d-flex align-items-start gap-3 mb-2">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: publisherLogoUrl ? "transparent" : hasSvgAppIcon(app) ? "#FFFFFF" : tint.bg,
                border: "1px solid #E5E7EB",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {publisherLogoUrl ? (
                <img
                  src={publisherLogoUrl}
                  alt={publisherName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <CatalogAppIconComponent app={app} size={24} fallbackIcon={CategoryIcon} sx={{ color: tint.iconColor }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#111827", lineHeight: 1.3 }}>{app.name}</div>
              {app.slug && (
                <div style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500, marginTop: "2px" }}>{app.slug}</div>
              )}
              <div className="d-flex align-items-center gap-1 mt-1">
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>
                  {labels.by}{" "}
                  {publisherUrl ? (
                    <a
                      href={publisherUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-marketplace-publisher-link"
                      style={{ color: "#6B7280", fontWeight: 500, textDecoration: "none" }}
                    >
                      {publisherName}
                    </a>
                  ) : (
                    publisherName
                  )}
                </span>
                {publisherVerified && <CheckCircleIcon sx={{ fontSize: 13, color: THEME.success }} />}
              </div>

              {tags.length > 0 && (
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => {
                    const tagLabel = typeof tag === "string" ? tag : tag?.name || tag?.title || "";
                    const tagKey = typeof tag === "string" ? tag : tag?.id || tag?.name || tagLabel;
                    return (
                      <Chip
                        key={tagKey}
                        label={tagLabel}
                        size="small"
                        className="text-uppercase"
                        sx={{ fontSize: "11px", height: "22px", backgroundColor: "#F3F4F6", color: "#6B7280" }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* About — markdown description */}
          {app.description && (
            <div className="mb-3">
              <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }} className="app-marketplace-description">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.description}</ReactMarkdown>
              </div>
              <style>{`
                .app-marketplace-description p { margin: 0 0 8px 0; }
                .app-marketplace-description p:last-child { margin-bottom: 0; }
                .app-marketplace-description ul, .app-marketplace-description ol { margin: 4px 0; padding-left: 20px; }
                .app-marketplace-description li { margin-bottom: 2px; }
                .app-marketplace-description code { background-color: #F3F4F6; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
                .app-marketplace-description a { color: ${THEME.brand}; text-decoration: none; }
                .app-marketplace-description a:hover { text-decoration: underline; }
                .app-marketplace-description strong { font-weight: 600; }
                .app-marketplace-publisher-link:hover { text-decoration: underline !important; }
              `}</style>
            </div>
          )}

          {/* Details (metadata) */}
          {hasMetadata && (
            <>
              <Divider sx={{ my: 1 }} />
              <SectionLabel className="mb-2 mt-1">{labels.details}</SectionLabel>

              <div className="d-flex align-items-start gap-4 mb-3">
                {category && (
                  <div>
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.3px" }}
                    >
                      {labels.category}
                    </div>
                    <span
                      className="text-capitalize"
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6D28D9",
                        backgroundColor: "#EDE9FE",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        display: "inline-block",
                      }}
                    >
                      {category}
                    </span>
                  </div>
                )}
                {app.manifest?.kind && (
                  <div>
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.3px" }}
                    >
                      {labels.kind}
                    </div>
                    <span
                      className="text-capitalize"
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#374151",
                        backgroundColor: "#F3F4F6",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        display: "inline-block",
                      }}
                    >
                      {typeof app.manifest.kind === "string"
                        ? app.manifest.kind
                        : app.manifest.kind?.name || app.manifest.kind?.title || ""}
                    </span>
                  </div>
                )}
                {app.status && (
                  <div>
                    <div
                      className="text-uppercase mb-1"
                      style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.3px" }}
                    >
                      {labels.status}
                    </div>
                    <span
                      className="d-inline-flex align-items-center gap-1 text-capitalize"
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: (app.status?.name || app.status) === "active" ? THEME.success : "#6B7280",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "999px",
                          backgroundColor: (app.status?.name || app.status) === "active" ? THEME.success : "#9CA3AF",
                        }}
                      />
                      {app.status?.title || app.status?.name || (typeof app.status === "string" ? app.status : "")}
                    </span>
                  </div>
                )}
              </div>

              {capabilities.length > 0 && (
                <div className="mb-3">
                  <div
                    className="text-uppercase mb-1"
                    style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.3px" }}
                  >
                    {labels.capabilities}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {capabilities.map((cap) => {
                      const capLabel = typeof cap === "string" ? cap : cap?.name || cap?.title || "";
                      const capKey = typeof cap === "string" ? cap : cap?.id || capLabel;
                      return (
                        <Chip
                          key={capKey}
                          label={capLabel}
                          size="small"
                          className="text-uppercase"
                          sx={{ fontSize: "11px", height: "22px", backgroundColor: "#EDE9FE", color: "#6D28D9" }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Routes */}
          {routes.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <SectionLabel className="mb-2 mt-1">{labels.routes}</SectionLabel>

              <div className="d-flex flex-column gap-1 mb-3">
                {routes.map((route, idx) => (
                  <PropertyRow key={route.path || idx} className="d-flex align-items-center gap-2 p-2">
                    <RouteIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>
                      {route.path}
                    </span>
                    {route.name && <span style={{ fontSize: "12px", color: "#6B7280" }}>— {route.name}</span>}
                    {route.layout && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#9CA3AF",
                          marginLeft: "auto",
                          textTransform: "uppercase",
                        }}
                      >
                        {route.layout}
                      </span>
                    )}
                  </PropertyRow>
                ))}
              </div>
            </>
          )}

          {/* Interface (contracts) */}
          {hasInterface && (
            <>
              <Divider sx={{ my: 1 }} />
              <SectionLabel className="mb-2 mt-1">{labels.interface}</SectionLabel>

              {Object.keys(inputProps).length > 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <InputIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
                      {labels.inputs}
                    </span>
                  </div>
                  {renderSchemaProperties(inputProps)}
                </div>
              )}

              {Object.keys(outputProps).length > 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <OutputIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>
                      {labels.outputs}
                    </span>
                  </div>
                  {renderSchemaProperties(outputProps)}
                </div>
              )}

              {ports.length > 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <PortIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" }}>{labels.ports}</span>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    {ports.map((port) => (
                      <PropertyRow key={port.port_id || port.id} className="d-flex align-items-center gap-2 p-2">
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#374151",
                            fontFamily: "monospace",
                            backgroundColor: port.is_default ? alpha(THEME.success, 12.55) : "#E5E7EB",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {port.port_id || port.id}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{port.label || port.name}</span>
                        {port.is_default && (
                          <span style={{ fontSize: "10px", color: THEME.success, fontWeight: 600, marginLeft: "auto" }}>
                            {labels.defaultPort}
                          </span>
                        )}
                      </PropertyRow>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="py-3 ps-4 pe-5" style={{ flexShrink: 0, borderTop: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}>
        {isPremium && showPremiumCard && <AppStorePremiumCardComponent app={app} onRequestPremium={onRequestPremium} />}

        <div className="d-flex align-items-center justify-content-between my-2">
          {isOwnedByUser && (
            <EditLink className="d-flex align-items-center gap-1" onClick={() => onEditApp(app)}>
              <EditIcon sx={{ fontSize: 14 }} />
              {labels.editInStudio}
            </EditLink>
          )}

          <div className="d-flex align-items-center gap-1">
            <Tooltip title={app.is_pinned ? labels.unpin : labels.pin} arrow>
              <IconButton
                size="small"
                onClick={() => onPinApp(app)}
                sx={{ padding: "4px", color: app.is_pinned ? THEME.brand : "#9CA3AF" }}
              >
                {app.is_pinned ? <PushPinIcon sx={{ fontSize: 18 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title={app.is_favorite ? labels.unfavorite : labels.favorite} arrow>
              <IconButton
                size="small"
                onClick={() => onFavoriteApp(app)}
                sx={{ padding: "4px", color: app.is_favorite ? "#F59E0B" : "#9CA3AF" }}
              >
                {app.is_favorite ? <StarFilledIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <OpenButton
          className="btn w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={() => {
            if (isPremium) {
              setShowPremiumCard(true);
            } else {
              onOpenApp(app);
            }
          }}
        >
          <OpenInNewIcon sx={{ fontSize: 18 }} />
          {labels.openApp}
        </OpenButton>
      </div>
    </DetailsContainer>
  );
}

function formatSchemaType(type) {
  if (Array.isArray(type)) return type.filter((t) => t !== "null").join(" | ");
  if (typeof type === "string") return type.charAt(0).toUpperCase() + type.slice(1);
  return String(type);
}

function renderSchemaProperties(props) {
  return Object.entries(props).map(([key, schema]) => (
    <div key={key} className="d-flex align-items-start gap-3 py-1 px-2">
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#374151",
          fontFamily: "monospace",
          backgroundColor: "#F3F4F6",
          padding: "2px 8px",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      >
        {key}
      </span>
      <span style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.4 }}>
        {schema.description || ""}
        {schema.type && (
          <span style={{ color: "#9CA3AF" }}>
            {schema.description ? " " : ""}({formatSchemaType(schema.type)})
          </span>
        )}
      </span>
    </div>
  ));
}

export default AppStoreDetailsComponent;
