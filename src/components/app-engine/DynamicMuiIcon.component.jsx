import React, { useMemo } from "react";
import * as MuiIcons from "@mui/icons-material";
import { Apps as DefaultFallbackIcon } from "@mui/icons-material";

/**
 * Resolves a MUI icon by name at render time.
 *
 * Reads the `@mui/icons-material` namespace the host already provides (the package is external to this
 * bundle) instead of `import(\`@mui/icons-material/${name}.js\`)`: a runtime bare specifier is never
 * resolved by host dependency optimizers such as Vite's, so every named icon silently fell back. The
 * contribution icon resolver reads the same namespace.
 */
function DynamicMuiIcon({ iconName, fallbackIcon: FallbackComponent = DefaultFallbackIcon, ...props }) {
  const Icon = useMemo(() => {
    if (!iconName) {
      return FallbackComponent;
    }

    return MuiIcons[iconName] || FallbackComponent;
  }, [iconName, FallbackComponent]);

  return <Icon {...props} />;
}

export default DynamicMuiIcon;
