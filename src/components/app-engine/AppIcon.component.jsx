import React, { useState, useEffect } from "react";
import DynamicMuiIcon from "./DynamicMuiIcon.component";
import { getRuntimeConfig } from "../../features/app-engine/runtime/shared/runtime-config";

const buildIconUrl = ({ baseUrl, slug, versionId }) => {
  const url = `${baseUrl || ""}/app-engine/definition/icon/${encodeURIComponent(slug)}`;
  return versionId ? `${url}?v=${encodeURIComponent(versionId)}` : url;
};

function AppIcon({ appDefinition, slug, icon, size = 24, baseUrl, fallbackIcon, sx, alt }) {
  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const resolvedSlug = slug || appDefinition?.slug;
  const resolvedIcon = icon ?? appDefinition?.icon;
  const isSvgIcon = resolvedIcon && typeof resolvedIcon === "object" && resolvedIcon.type === "svg";

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [imageFailed, setImageFailed] = useState(false);

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSlug, appDefinition?.active_version_id]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (isSvgIcon && resolvedSlug && !imageFailed) {
    return (
      <img
        src={buildIconUrl({
          baseUrl: baseUrl ?? getRuntimeConfig().loomCloudBaseUrl,
          slug: resolvedSlug,
          versionId: appDefinition?.active_version_id,
        })}
        alt={alt || appDefinition?.name || resolvedSlug}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <DynamicMuiIcon
      iconName={typeof resolvedIcon === "string" ? resolvedIcon : undefined}
      fallbackIcon={fallbackIcon}
      sx={{ fontSize: size, ...(sx || {}) }}
    />
  );
}

export default AppIcon;
