import React, { useState } from "react";
import { Box, Chip, Collapse, Typography } from "@mui/material";
import { ExpandMore as ExpandMoreIcon, Route as RouteIcon } from "@mui/icons-material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { APP_CONTRACT_KINDS, isEnumValue } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { focusRingSx, overlineSx } from "../app-store.styles";

const monoSx = { fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: COLORS.ink, backgroundColor: COLORS.chip, px: 1, py: "2px", borderRadius: "4px" };
const noteSx = { fontSize: 13, lineHeight: 1.45, color: COLORS.textSecondary };

const nameOf = (value) => (typeof value === "string" ? value : value?.name || value?.title || "");

function Block({ title, children }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography component="p" sx={{ ...overlineSx, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function SchemaProperties({ properties }) {
  return Object.entries(properties).map(([key, schema]) => (
    <Box key={key} className="d-flex align-items-start gap-3" sx={{ py: 0.5 }}>
      <Box component="span" sx={{ ...monoSx, flex: "none" }}>
        {key}
      </Box>
      <Typography component="p" sx={noteSx}>
        {schema?.description || ""}
        {schema?.type && (
          <Box component="span" sx={{ color: COLORS.textTertiary }}>
            {schema?.description ? " " : ""}({Array.isArray(schema.type) ? schema.type.filter((type) => type !== "null").join(" | ") : schema.type})
          </Box>
        )}
      </Typography>
    </Box>
  ));
}

/**
 * The technical side of an app for the people who wire it into workflows: its capabilities, routes,
 * input and output contracts and ports. Folded by default — the page is for deciding to get the app.
 * It sits inside the app page's card, so it is outlined rather than a second paper surface.
 */
function AppStoreDeveloperDetailsComponent({ app }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels } = useAppStore();

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [open, setOpen] = useState(false);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const manifest = app?.manifest || {};
  const capabilities = manifest.capabilities || [];
  const routes = app?.routes || manifest.routes || [];
  const contracts = Array.isArray(app?.contracts) ? app.contracts : [];
  const inputProps = manifest.input_contract?.properties || contracts.find((contract) => isEnumValue(contract.kind, APP_CONTRACT_KINDS.input))?.schema?.properties || {};
  const outputProps = manifest.output_contract?.properties || contracts.find((contract) => isEnumValue(contract.kind, APP_CONTRACT_KINDS.output))?.schema?.properties || {};
  const ports = app?.ports || manifest.ports || [];
  const hasContent = capabilities.length > 0 || routes.length > 0 || Object.keys(inputProps).length > 0 || Object.keys(outputProps).length > 0 || ports.length > 0;

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (!hasContent) {
    return null;
  }

  return (
    <Box component="section" sx={{ mt: 4, border: `1px solid ${COLORS.hairline}`, borderRadius: "12px" }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="d-flex align-items-center justify-content-between w-100"
        sx={{ border: 0, borderRadius: "12px", background: "transparent", font: "inherit", color: "inherit", cursor: "pointer", px: 2.5, py: 1.75, textAlign: "left", ...focusRingSx }}
      >
        <Typography component="h2" sx={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
          {labels.detail.forDevelopers}
        </Typography>
        <ExpandMoreIcon sx={{ color: COLORS.textTertiary, transition: "transform 160ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2.5, pb: 1 }}>
          {capabilities.length > 0 && (
            <Block title={labels.detail.capabilities}>
              <Box className="d-flex flex-wrap gap-1">
                {capabilities.map((capability) => (
                  <Chip key={nameOf(capability)} label={nameOf(capability)} size="small" sx={{ backgroundColor: COLORS.accentTint, color: COLORS.accent, fontWeight: 500 }} />
                ))}
              </Box>
            </Block>
          )}
          {routes.length > 0 && (
            <Block title={labels.detail.routes}>
              {routes.map((route, index) => (
                <Box key={route.path || index} className="d-flex align-items-center gap-2" sx={{ py: 0.5 }}>
                  <RouteIcon sx={{ fontSize: 14, color: COLORS.textTertiary }} />
                  <Box component="span" sx={monoSx}>
                    {route.path}
                  </Box>
                  {route.name && (
                    <Typography component="span" sx={noteSx}>
                      {route.name}
                    </Typography>
                  )}
                </Box>
              ))}
            </Block>
          )}
          {(Object.keys(inputProps).length > 0 || Object.keys(outputProps).length > 0) && (
            <Block title={labels.detail.interface}>
              {Object.keys(inputProps).length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, mb: 0.5 }}>
                    {labels.detail.inputs}
                  </Typography>
                  <SchemaProperties properties={inputProps} />
                </Box>
              )}
              {Object.keys(outputProps).length > 0 && (
                <Box>
                  <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, mb: 0.5 }}>
                    {labels.detail.outputs}
                  </Typography>
                  <SchemaProperties properties={outputProps} />
                </Box>
              )}
            </Block>
          )}
          {ports.length > 0 && (
            <Block title={labels.detail.ports}>
              {ports.map((port) => (
                <Box key={port.port_id || port.id} className="d-flex align-items-center gap-2" sx={{ py: 0.5 }}>
                  <Box component="span" sx={monoSx}>
                    {port.port_id || port.id}
                  </Box>
                  <Typography component="span" sx={noteSx}>
                    {port.label || port.name}
                  </Typography>
                  {port.is_default && (
                    <Typography component="span" sx={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>
                      {labels.detail.defaultPort}
                    </Typography>
                  )}
                </Box>
              ))}
            </Block>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default AppStoreDeveloperDetailsComponent;
