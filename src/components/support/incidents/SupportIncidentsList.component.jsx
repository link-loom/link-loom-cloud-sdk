import React from "react";
import styled from "styled-components";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { SUPPORT_THEME } from "../defaults/support.theme";
import {
  SUPPORT_INCIDENT_BANNER_DEFAULTS,
  SEVERITY_CONFIG,
  mergeDefaults,
} from "../defaults/support.defaults";
import BackButton from "../../shared/BackButton.component";

const EmptyCard = styled.div.attrs({ className: "card border text-center" })`
  padding: 3rem 2rem;
  background: ${SUPPORT_THEME.surfaceContainerLowest};
  border-color: ${SUPPORT_THEME.surfaceContainer} !important;
`;

const IncidentCard = styled.div.attrs({ className: "card border" })`
  padding: 1rem 1.25rem;
  border-left-width: 3px !important;
  border-left-color: ${(props) => props.$accentColor} !important;
  cursor: pointer;
  transition: background-color 150ms ease;
  &:hover {
    background-color: ${SUPPORT_THEME.surfaceContainerLow};
  }
`;

const IconCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(40, 52, 57, 0.08);
`;

const SeverityChip = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${(props) => props.$bg || SUPPORT_THEME.surfaceContainer};
  color: ${(props) => props.$color || SUPPORT_THEME.onSurfaceVariant};
`;

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

const SupportIncidentsList = ({
  ui,
  incidents,
  namespace,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_INCIDENT_BANNER_DEFAULTS, ui);
  const productName =
    namespace?.presentation?.hero_title || namespace?.title || "this product";
  const subtitle =
    namespace?.presentation?.subtitle ||
    "Current service incidents and operational status updates.";

  const allIncidents = incidents || [];

  const emit = (action, payload = {}) => {
    if (!itemOnAction) return;
    itemOnAction({
      action: `link-loom-support::${action}`,
      namespace: "link-loom-support",
      payload,
    });
  };

  return (
    <article className="card shadow" {...props}>
      <section className="card-body">
        <BackButton onClick={() => emit("back-to-hub")}>
          Back to Support Hub
        </BackButton>

        <header className="d-flex flex-row justify-content-between mb-3">
          <section>
            <h4 className="mt-0 mb-1">Incidents &amp; Status</h4>
            <p className="text-muted font-14 mb-3">{subtitle}</p>
          </section>
        </header>

        {allIncidents.length === 0 ? (
          <EmptyCard>
            <div className="mx-auto mb-1">
              <CheckCircleOutlinedIcon
                sx={{ fontSize: 40, color: SUPPORT_THEME.success }}
              />
            </div>
            <h5
              className="fw-semibold mt-2 mb-1"
              style={{ color: SUPPORT_THEME.onSurface }}
            >
              All systems operational
            </h5>
            <p
              className="mb-0"
              style={{ fontSize: "0.875rem", color: SUPPORT_THEME.textMuted }}
            >
              No active or recent incidents for {productName}
            </p>
          </EmptyCard>
        ) : (
          <div className="d-flex flex-column gap-3">
            {allIncidents.map((incident, index) => {
              const isCritical =
                incident.severity === "critical" ||
                incident.severity === "high";
              const accentColor = isCritical
                ? SUPPORT_THEME.error
                : SUPPORT_THEME.warning;
              const Icon = isCritical
                ? ErrorOutlineIcon
                : WarningAmberOutlinedIcon;
              const severityCfg = SEVERITY_CONFIG[incident.severity] || {};

              return (
                <IncidentCard
                  key={incident.id || index}
                  $accentColor={accentColor}
                  onClick={() => emit("incident-view", { incident })}
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <IconCircle>
                        <Icon sx={{ fontSize: 18, color: accentColor }} />
                      </IconCircle>

                      <div className="flex-grow-1">
                        <p
                          className="fw-semibold mb-1"
                          style={{
                            fontSize: "0.875rem",
                            color: SUPPORT_THEME.onSurface,
                          }}
                        >
                          {incident.title}
                        </p>
                        {incident.summary && (
                          <p
                            className="mb-2"
                            style={{
                              fontSize: "0.78rem",
                              color: SUPPORT_THEME.textMuted,
                            }}
                          >
                            {incident.summary}
                          </p>
                        )}

                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {incident.severity && (
                            <SeverityChip
                              $color={severityCfg.color}
                              $bg={severityCfg.bg}
                            >
                              {incident.severity}
                            </SeverityChip>
                          )}
                          {incident.status && (
                            <SeverityChip
                              $color={SUPPORT_THEME.onSurfaceVariant}
                              $bg={SUPPORT_THEME.surfaceContainer}
                            >
                              {typeof incident.status === "object"
                                ? incident.status.name
                                : incident.status}
                            </SeverityChip>
                          )}
                          {Array.isArray(incident.affected_modules) &&
                            incident.affected_modules.map(
                              (module, moduleIndex) => (
                                <SeverityChip
                                  key={moduleIndex}
                                  $color={SUPPORT_THEME.outline}
                                  $bg={SUPPORT_THEME.surfaceContainerLow}
                                >
                                  {module}
                                </SeverityChip>
                              ),
                            )}
                        </div>
                      </div>
                    </div>

                    <span
                      className="flex-shrink-0"
                      style={{
                        fontSize: "0.78rem",
                        color: SUPPORT_THEME.textMuted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(incident.started_at)}
                    </span>
                  </div>
                </IncidentCard>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
};

export default SupportIncidentsList;
